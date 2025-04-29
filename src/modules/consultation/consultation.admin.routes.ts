import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { requireRole } from "../../auth/middleware/require-role";
import { prisma } from "../../lib/prisma";
import { CONSULTATION_SLOT_STATUS } from "./consultation";
import { createRoom, deleteRoom } from "../livekit/livekit.admin.routes";

export const consultationAdminRoutes = new Hono();

const getConsultationsQuerySchema = z.object({
  eventId: z.string(),
});

consultationAdminRoutes.get(
  "/",
  zValidator("query", getConsultationsQuerySchema),
  requireRole("admin"),
  async (c) => {
    const data = c.req.valid("query");
    const consultations = await prisma.consultation.findMany({
      where: { eventId: data.eventId },
    });
    return c.json({ data: consultations });
  }
);

consultationAdminRoutes.get("/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const consultation = await prisma.consultation.findUnique({
    where: { id },
    include: { slots: { orderBy: { startTime: "asc" } }, exhibitor: true },
  });
  if (!consultation) {
    return c.json({ message: "Consultation not found" }, 404);
  }
  const event = await prisma.event.findUnique({
    where: { id: consultation.eventId },
  });
  return c.json({ data: { ...consultation, event } });
});

const createConsultationSchema = z.object({
  eventId: z.string(),
  exhibitorId: z.string(),
  maxSlot: z.coerce.number().int().positive().optional(),
});

consultationAdminRoutes.post(
  "/",
  zValidator("json", createConsultationSchema),
  requireRole("admin"),
  async (c) => {
    const data = c.req.valid("json");
    const consultation = await prisma.consultation.create({ data });
    return c.json({ data: consultation });
  }
);

const createConsultationSlotSchema = z.object({
  slots: z.array(
    z.object({ startTime: z.coerce.date(), endTime: z.coerce.date() })
  ),
});

consultationAdminRoutes.post(
  "/:id/slots",
  zValidator("json", createConsultationSlotSchema),
  requireRole("admin"),
  async (c) => {
    const id = c.req.param("id");
    const { slots } = c.req.valid("json");
    const consultation = await prisma.consultation.findUnique({
      where: { id },
    });
    if (!consultation) {
      return c.json({ message: "Consultation not found" }, 404);
    }
    const data = slots.map((slot) => ({
      consultationId: consultation.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: CONSULTATION_SLOT_STATUS.AVAILABLE,
    }));
    const createdSlots = await prisma.consultationSlot.createMany({ data });
    return c.json({
      data: {
        consultation,
        totalSlotCreated: createdSlots.count,
      },
    });
  }
);

const bookConsultationSchema = z.object({
  participantId: z.string(),
  slotId: z.string(),
});

consultationAdminRoutes.post(
  "/:id/slots/book",
  zValidator("json", bookConsultationSchema),
  requireRole("admin"),
  async (c) => {
    const consultationId = c.req.param("id");
    const { slotId, participantId } = c.req.valid("json");

    const participant = await prisma.user.findUnique({
      where: { id: participantId },
    });
    if (!participant) {
      return c.json({ message: "Participant not found" }, 404);
    }

    const slot = await prisma.$transaction(async (tx) => {
      const slot = await tx.consultationSlot.findUnique({
        where: { id: slotId, consultationId },
      });
      if (!slot || slot.status !== CONSULTATION_SLOT_STATUS.AVAILABLE) {
        throw new Error("Consultation slot is not available");
      }
      await tx.consultationSlot.update({
        where: { id: slotId, consultationId },
        data: {
          participantId,
          participantName: participant.name,
          status: CONSULTATION_SLOT_STATUS.BOOKED,
        },
      });
      return slot;
    });

    return c.json({ data: slot });
  }
);

consultationAdminRoutes.post(
  "/:id/slots/:slotId/cancel",
  requireRole("admin"),
  async (c) => {
    const params = c.req.param();
    const slot = await prisma.consultationSlot.update({
      where: { id: params.slotId, consultationId: params.id },
      data: { status: CONSULTATION_SLOT_STATUS.CANCELED },
    });
    return c.json({ data: slot });
  }
);

consultationAdminRoutes.post(
  "/:id/slots/:slotId/start",
  requireRole("admin"),
  async (c) => {
    const params = c.req.param();
    const slot = await prisma.consultationSlot.findUnique({
      where: { id: params.slotId, consultationId: params.id },
    });
    if (!slot) {
      return c.json({ message: "Not found" }, 404);
    }
    if (!slot.participantId) {
      return c.json({
        message: "Can't start consultation if no participant booked",
      });
    }
    await prisma.consultationSlot.update({
      where: { id: params.slotId, consultationId: params.id },
      data: { status: CONSULTATION_SLOT_STATUS.ONGOING },
    });
    await createRoom({ roomName: slot.id });
    return c.json({ data: slot });
  }
);

consultationAdminRoutes.post(
  "/:id/slots/:slotId/end",
  requireRole("admin"),
  async (c) => {
    const params = c.req.param();
    const slot = await prisma.consultationSlot.findUnique({
      where: { id: params.slotId, consultationId: params.id },
    });
    if (!slot) {
      return c.json({ message: "Not found" }, 404);
    }
    if (slot.status !== CONSULTATION_SLOT_STATUS.ONGOING) {
      return c.json({
        message: "Consultations have not yet started",
      });
    }
    await prisma.consultationSlot.update({
      where: { id: params.slotId, consultationId: params.id },
      data: { status: CONSULTATION_SLOT_STATUS.DONE },
    });
    await deleteRoom({ roomName: slot.id });
    return c.json({ data: slot });
  }
);

consultationAdminRoutes.post(
  "/:id/slots/:slotId/done",
  requireRole("admin"),
  async (c) => {
    const params = c.req.param();
    const slot = await prisma.consultationSlot.findUnique({
      where: { id: params.slotId, consultationId: params.id },
    });
    if (!slot) {
      return c.json({ message: "Not found" }, 404);
    }
    if (!slot.participantId) {
      return c.json({
        message: "Can't mark slot with no participant as 'done'",
      });
    }
    await prisma.consultationSlot.update({
      where: { id: params.slotId, consultationId: params.id },
      data: { status: CONSULTATION_SLOT_STATUS.DONE },
    });
    return c.json({ data: slot });
  }
);

consultationAdminRoutes.post(
  "/:id/slots/:slotId/not-present",
  requireRole("admin"),
  async (c) => {
    const params = c.req.param();
    const slot = await prisma.consultationSlot.findUnique({
      where: { id: params.slotId, consultationId: params.id },
    });
    if (!slot) {
      return c.json({ message: "Not found" }, 404);
    }
    if (!slot.participantId) {
      return c.json({
        message: "Can't mark slot with no participant as 'not-present'",
      });
    }
    await prisma.consultationSlot.update({
      where: { id: params.slotId, consultationId: params.id },
      data: { status: CONSULTATION_SLOT_STATUS.NOT_PRESENT },
    });
    return c.json({ data: slot });
  }
);

consultationAdminRoutes.post(
  "/:id/slots/:slotId/available",
  requireRole("admin"),
  async (c) => {
    const params = c.req.param();
    const slot = await prisma.consultationSlot.findUnique({
      where: { id: params.slotId, consultationId: params.id },
    });
    if (!slot) {
      return c.json({ message: "Not found" }, 404);
    }
    if (slot.status !== CONSULTATION_SLOT_STATUS.NOT_AVAILABLE) {
      const errorMessage =
        "Forbidden. You can only mark 'not-available' slot as 'available'";
      return c.json({
        message: errorMessage,
      });
    }
    await prisma.consultationSlot.update({
      where: { id: params.slotId, consultationId: params.id },
      data: { status: CONSULTATION_SLOT_STATUS.AVAILABLE },
    });
    return c.json({ data: slot });
  }
);

consultationAdminRoutes.post(
  "/:id/slots/:slotId/not-available",
  requireRole("admin"),
  async (c) => {
    const params = c.req.param();
    const slot = await prisma.consultationSlot.findUnique({
      where: { id: params.slotId, consultationId: params.id },
    });
    if (!slot) {
      return c.json({ message: "Not found" }, 404);
    }
    if (slot.status !== CONSULTATION_SLOT_STATUS.AVAILABLE) {
      const errorMessage =
        "Forbidden. You can only mark 'available' slot as 'not-available'";
      return c.json({
        message: errorMessage,
      });
    }
    await prisma.consultationSlot.update({
      where: { id: params.slotId, consultationId: params.id },
      data: { status: CONSULTATION_SLOT_STATUS.NOT_AVAILABLE },
    });
    return c.json({ data: slot });
  }
);

consultationAdminRoutes.post(
  "/:id/slots/:slotId/remove-participant",
  requireRole("admin"),
  async (c) => {
    const params = c.req.param();
    const slot = await prisma.consultationSlot.update({
      where: { id: params.slotId, consultationId: params.id },
      data: {
        status: CONSULTATION_SLOT_STATUS.AVAILABLE,
        participantId: null,
        participantName: null,
      },
    });
    return c.json({ data: slot });
  }
);

consultationAdminRoutes.delete(
  "/:id/slots/:slotId",
  requireRole("admin"),
  async (c) => {
    const params = c.req.param();
    const slot = await prisma.consultationSlot.delete({
      where: { id: params.slotId, consultationId: params.id },
    });
    return c.json({ data: slot });
  }
);
