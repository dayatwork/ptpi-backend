import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { requireRole } from "../../auth/middleware/require-role";
import { prisma } from "../../lib/prisma";
import { SEMINAR_PRICING_TYPE, SEMINAR_STATUS } from "./seminar";
import {
  SEMINAR_PARTICIPANT_PAYMENT_STATUS,
  SEMINAR_PARTICIPANT_STATUS,
} from "./seminar-participant";

export const seminarRoutes = new Hono();

seminarRoutes.get("/", requireRole("admin"), async (c) => {
  const seminars = await prisma.seminar.findMany();
  return c.json({ data: seminars });
});

seminarRoutes.get("/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const seminar = await prisma.seminar.findUnique({ where: { id } });
  if (!seminar) {
    return c.json({ message: "Seminar not found" }, 404);
  }
  return c.json({ data: seminar });
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
  pricingType: z.enum(["PAID", "FREE"]),
});

seminarRoutes.post(
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
});

seminarRoutes.put(
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

seminarRoutes.post("/:id/start", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const seminar = await prisma.seminar.update({
    where: { id },
    data: { status: "ONGOING" },
  });
  return c.json({ data: seminar }, 200);
});

seminarRoutes.post("/:id/cancel", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const seminar = await prisma.seminar.update({
    where: { id },
    data: { status: "CANCELED" },
  });
  return c.json({ data: seminar }, 200);
});

seminarRoutes.post("/:id/complete", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const seminar = await prisma.seminar.update({
    where: { id },
    data: { status: "DONE" },
  });
  return c.json({ data: seminar }, 200);
});

seminarRoutes.delete("/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const seminar = await prisma.seminar.delete({
    where: { id },
  });
  return c.json({ data: seminar }, 200);
});

const registerSeminarParticipantSchema = z.object({
  userId: z.string(),
});

seminarRoutes.post(
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
          seminar.pricingType === SEMINAR_PRICING_TYPE.FREE
            ? SEMINAR_PARTICIPANT_STATUS.REGISTERED
            : SEMINAR_PARTICIPANT_STATUS.BOOKED,
        paymentStatus:
          seminar.pricingType === SEMINAR_PRICING_TYPE.FREE
            ? SEMINAR_PARTICIPANT_PAYMENT_STATUS.FREE
            : SEMINAR_PARTICIPANT_PAYMENT_STATUS.UNPAID,
      },
    });

    return c.json({ data: seminarParticipant }, 201);
  }
);

seminarRoutes.get("/:id/participants", requireRole("admin"), async (c) => {
  const id = c.req.param("id");

  const seminarParticipants = await prisma.seminarParticipant.findMany({
    where: { seminarId: id },
  });

  return c.json({ data: seminarParticipants }, 200);
});
