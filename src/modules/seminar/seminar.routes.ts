import { Hono } from "hono";
import { requireRole } from "../../auth/middleware/require-role";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

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
