import { Hono } from "hono";
import { requireAuth } from "../../auth/middleware/require-auth";
import { prisma } from "../../lib/prisma";
import { SEMINAR_STATUS } from "./seminar";
import {
  SEMINAR_PARTICIPANT_PAYMENT_STATUS,
  SEMINAR_PARTICIPANT_STATUS,
} from "./seminar-participant";

export const seminarRoutes = new Hono();

seminarRoutes.get("/upcoming", requireAuth, async (c) => {
  const seminars = await prisma.seminar.findMany({
    where: { status: SEMINAR_STATUS.ONGOING },
  });
  return c.json({ data: seminars });
});

seminarRoutes.get("/previous", requireAuth, async (c) => {
  const seminars = await prisma.seminar.findMany({
    where: { status: SEMINAR_STATUS.DONE },
  });
  return c.json({ data: seminars });
});

seminarRoutes.get("/ongoing", requireAuth, async (c) => {
  const seminars = await prisma.seminar.findMany({
    where: { status: SEMINAR_STATUS.DONE },
  });
  return c.json({ data: seminars });
});

seminarRoutes.get("/:id", requireAuth, async (c) => {
  const seminarId = c.req.param("id");
  const user = c.var.user;
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const [seminar, participant] = await Promise.all([
    prisma.seminar.findUnique({
      where: { id: seminarId, status: { notIn: [SEMINAR_STATUS.DRAFT] } },
      include: { participants: true },
    }),
    prisma.seminarParticipant.findUnique({
      where: { seminarId_userId: { seminarId, userId: user.id } },
    }),
  ]);

  if (!seminar) {
    return c.json({ message: "Seminar not found" }, 404);
  }
  return c.json({ data: { ...seminar, participant } });
});

seminarRoutes.post("/:id/register", requireAuth, async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const seminar = await prisma.seminar.findUnique({
    where: { id: c.req.param("id"), status: { notIn: [SEMINAR_STATUS.DRAFT] } },
  });

  if (!seminar) {
    return c.json({ message: "Seminar not found" }, 404);
  }

  if (
    seminar.status !== SEMINAR_STATUS.ONGOING &&
    seminar.status !== SEMINAR_STATUS.SCHEDULED
  ) {
    return c.json({ message: "This seminar not open for registration" }, 403);
  }

  try {
    const participant = await prisma.seminarParticipant.create({
      data: {
        userId: c.var.user.id,
        userName: c.var.user.name,
        userAvatar: c.var.user.image,
        seminarId: seminar.id,
        registeredAt: new Date(),
        status:
          seminar.price === 0
            ? SEMINAR_PARTICIPANT_STATUS.REGISTERED
            : SEMINAR_PARTICIPANT_STATUS.BOOKED,
        paymentStatus:
          seminar.price === 0
            ? SEMINAR_PARTICIPANT_PAYMENT_STATUS.FREE
            : SEMINAR_PARTICIPANT_PAYMENT_STATUS.UNPAID,
      },
    });
    return c.json({ data: participant });
  } catch (error) {
    return c.json({ message: "Something went wrong" }, 500);
  }
});
