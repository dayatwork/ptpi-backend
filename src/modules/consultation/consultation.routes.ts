import { Hono } from "hono";
import { requireAuth } from "../../auth/middleware/require-auth";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { CONSULTATION_SLOT_STATUS } from "./consultation";
import { EVENT_STATUS } from "../event/event";

export const consultationRoutes = new Hono();

consultationRoutes.get("/schedules", requireAuth, async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const slots = await prisma.consultationSlot.findMany({
    where: {
      participantId: user.id,
      status: {
        in: [CONSULTATION_SLOT_STATUS.BOOKED, CONSULTATION_SLOT_STATUS.ONGOING],
      },
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      consultation: {
        select: {
          id: true,
          exhibitor: { select: { id: true, name: true, logo: true } },
        },
      },
    },
    // include: { consultation: { include: { exhibitor: true } } },
  });

  return c.json({ data: slots });
});

const bookConsultationSchema = z.object({
  slotId: z.string(),
});

consultationRoutes.post(
  "/book",
  zValidator("json", bookConsultationSchema),
  requireAuth,
  async (c) => {
    const user = c.var.user;
    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    try {
      const slot = await prisma.$transaction(async (tx) => {
        const { slotId } = c.req.valid("json");

        const slot = await tx.consultationSlot.findUnique({
          where: { id: slotId },
          include: { consultation: true },
        });

        if (!slot || slot.status !== CONSULTATION_SLOT_STATUS.AVAILABLE) {
          throw new Error("Consultation slot is not available");
        }

        const event = await tx.event.findUnique({
          where: { id: slot.consultation.eventId },
        });

        if (event) {
          if (
            event.status !== EVENT_STATUS.SCHEDULED &&
            event.status !== EVENT_STATUS.ONGOING
          ) {
            throw new Error(
              "Can't book consultation slot. The event has finished"
            );
          }
        }

        const bookedSlot = await tx.consultationSlot.update({
          where: { id: slotId },
          data: {
            status: CONSULTATION_SLOT_STATUS.BOOKED,
            participantId: user.id,
            participantName: user.name,
          },
        });

        return bookedSlot;
      });

      return c.json({ data: slot });
    } catch (error) {
      let errorMessage = "Something went wrong";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return c.json({ message: errorMessage });
    }
  }
);

const cancelConsultationSchema = z.object({
  slotId: z.string(),
});

consultationRoutes.post(
  "/cancel",
  zValidator("json", cancelConsultationSchema),
  requireAuth,
  async (c) => {
    const user = c.var.user;
    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const { slotId } = c.req.valid("json");
    const slot = await prisma.consultationSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      return c.json({ message: "Slot not found" });
    }

    if (slot.participantId !== user.id) {
      return c.json({ message: "Forbidden" }, 403);
    }

    if (slot.status !== CONSULTATION_SLOT_STATUS.BOOKED) {
      const errorMessage =
        "You can only cancel consultation with status 'booked'";
      return c.json({ message: errorMessage }, 403);
    }

    const canceledSlot = await prisma.consultationSlot.update({
      where: { id: slotId },
      data: { status: CONSULTATION_SLOT_STATUS.CANCELED },
    });

    return c.json({ data: canceledSlot });
  }
);
