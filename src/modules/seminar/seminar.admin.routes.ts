import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { nanoid } from "nanoid";
import { requireRole } from "../../auth/middleware/require-role";
import { prisma } from "../../lib/prisma";
import { SEMINAR_STATUS } from "./seminar";
import {
  SEMINAR_PARTICIPANT_PAYMENT_STATUS,
  SEMINAR_PARTICIPANT_STATUS,
} from "./seminar-participant";
import { createRoom, deleteRoom } from "../livekit/livekit.admin.routes";

export const seminarAdminRoutes = new Hono();

seminarAdminRoutes.get("/", requireRole("admin"), async (c) => {
  const seminars = await prisma.seminar.findMany({
    orderBy: { createdAt: "desc" },
  });
  return c.json({ data: seminars });
});

seminarAdminRoutes.get("/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const seminar = await prisma.seminar.findUnique({ where: { id } });
  if (!seminar) {
    return c.json({ message: "Seminar not found" }, 404);
  }
  if (seminar.eventId) {
    const event = await prisma.event.findUnique({
      where: { id: seminar.eventId },
    });
    return c.json({ data: { ...seminar, event } });
  } else {
    return c.json({ data: seminar, event: null });
  }
});

const createSeminarSchema = z.object({
  title: z.string().nonempty(),
  eventId: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  location: z.string().optional(),
  format: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
  price: z.coerce.number().min(0),
});

seminarAdminRoutes.post(
  "/",
  zValidator("json", createSeminarSchema),
  requireRole("admin"),
  async (c) => {
    const data = c.req.valid("json");
    const seminar = await prisma.seminar.create({ data });
    return c.json({ data: seminar }, 201);
  }
);

const editSeminarSchema = z.object({
  title: z.string().nonempty(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  location: z.string().optional(),
  format: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
  price: z.coerce.number().min(0),
});

seminarAdminRoutes.put(
  "/:id",
  zValidator("json", editSeminarSchema),
  requireRole("admin"),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const seminar = await prisma.seminar.update({ where: { id }, data });
    return c.json({ data: seminar }, 200);
  }
);

seminarAdminRoutes.post("/:id/start", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const roomName = nanoid(10);
  const seminar = await prisma.seminar.update({
    where: { id },
    data: { status: "ONGOING", onlineRoomId: roomName, isRoomOpen: true },
  });
  await createRoom({ roomName });
  return c.json({ data: seminar }, 200);
});

seminarAdminRoutes.post("/:id/cancel", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const seminar = await prisma.seminar.findUnique({ where: { id } });
  if (!seminar) {
    return c.json({ message: "Seminar not found" }, 404);
  }
  await prisma.seminar.update({
    where: { id },
    data: {
      status: "CANCELED",
      isRoomOpen: false,
      onlineRoomId: null,
      isRegistrationOpen: false,
    },
  });
  if (seminar.onlineRoomId) {
    await deleteRoom({ roomName: seminar.onlineRoomId });
  }
  return c.json({ data: seminar }, 200);
});

seminarAdminRoutes.post("/:id/end", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const seminar = await prisma.seminar.findUnique({ where: { id } });
  if (!seminar) {
    return c.json({ message: "Seminar not found" }, 404);
  }
  await prisma.seminar.update({
    where: { id },
    data: {
      status: "DONE",
      isRoomOpen: false,
      onlineRoomId: null,
      isRegistrationOpen: false,
    },
  });
  if (seminar.onlineRoomId) {
    await deleteRoom({ roomName: seminar.onlineRoomId });
  }
  return c.json({ data: seminar }, 200);
});

seminarAdminRoutes.delete("/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const seminar = await prisma.seminar.delete({
    where: { id },
  });
  if (seminar.onlineRoomId) {
    await deleteRoom({ roomName: seminar.onlineRoomId });
  }
  return c.json({ data: seminar }, 200);
});

const registerSeminarParticipantSchema = z.object({
  userId: z.string(),
});

seminarAdminRoutes.post(
  "/:id/participants",
  zValidator("json", registerSeminarParticipantSchema),
  requireRole("admin"),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const [seminar, user] = await Promise.all([
      prisma.seminar.findUnique({ where: { id } }),
      prisma.user.findUnique({ where: { id: data.userId } }),
    ]);

    if (!seminar) {
      throw new Error("Seminar not found");
    }
    if (
      seminar.status === SEMINAR_STATUS.DONE ||
      seminar.status === SEMINAR_STATUS.CANCELED
    ) {
      throw new Error("The seminar has finished or been cancelled");
    }

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.emailVerified) {
      throw new Error(
        "User email is not verified. Verify user email first before registering"
      );
    }

    const seminarParticipant = await prisma.seminarParticipant.create({
      data: {
        userId: user.id,
        userName: user.name,
        userAvatar: user.image,
        seminarId: seminar.id,
        status:
          seminar.price === 0
            ? SEMINAR_PARTICIPANT_STATUS.BOOKED
            : SEMINAR_PARTICIPANT_STATUS.REGISTERED,
        paymentStatus:
          seminar.price === 0
            ? SEMINAR_PARTICIPANT_PAYMENT_STATUS.FREE
            : SEMINAR_PARTICIPANT_PAYMENT_STATUS.UNPAID,
      },
    });

    return c.json({ data: seminarParticipant }, 201);
  }
);

seminarAdminRoutes.get("/:id/participants", requireRole("admin"), async (c) => {
  const id = c.req.param("id");

  const seminarParticipants = await prisma.seminarParticipant.findMany({
    where: { seminarId: id },
  });

  return c.json({ data: seminarParticipants }, 200);
});
