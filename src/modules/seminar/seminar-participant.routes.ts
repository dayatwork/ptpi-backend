import { Hono } from "hono";
import { requireAuth } from "../../auth/middleware/require-auth";
import { prisma } from "../../lib/prisma";

export const seminarParticipantsRoutes = new Hono();

seminarParticipantsRoutes.get("/me", requireAuth, async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const participations = await prisma.seminarParticipant.findMany({
    where: { userId: user.id },
    select: { seminarId: true, status: true, registeredAt: true },
  });

  return c.json({ data: participations });
});
