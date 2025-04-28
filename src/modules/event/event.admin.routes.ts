import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { requireRole } from "../../auth/middleware/require-role";
import { prisma } from "../../lib/prisma";

export const eventAdminRoutes = new Hono();

eventAdminRoutes.get("/", requireRole("admin"), async (c) => {
  const events = await prisma.event.findMany();
  return c.json({ data: events });
});

eventAdminRoutes.get("/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id");

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return c.json({ message: "Event not found" }, 404);
  }

  const [seminars, exhibitions, consultations] = await Promise.all([
    prisma.seminar.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.exhibition.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.consultation.findMany({
      where: { eventId: event.id },
      include: { exhibitor: true },
    }),
  ]);

  const data = {
    ...event,
    seminars,
    exhibitions,
    consultations,
  };

  return c.json({ data });
});

const createEventSchema = z.object({
  title: z.string().nonempty(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  location: z.string().optional(),
  format: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
});

eventAdminRoutes.post(
  "/",
  zValidator("json", createEventSchema),
  requireRole("admin"),
  async (c) => {
    const data = c.req.valid("json");
    const event = await prisma.event.create({ data });
    return c.json({ data: event }, 201);
  }
);

const editEventSchema = z.object({
  title: z.string().nonempty(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  location: z.string().optional(),
  format: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
});

eventAdminRoutes.put(
  "/:id",
  zValidator("json", editEventSchema),
  requireRole("admin"),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const event = await prisma.event.update({ where: { id }, data });
    return c.json({ data: event }, 200);
  }
);

eventAdminRoutes.post("/:id/start", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const event = await prisma.event.update({
    where: { id },
    data: { status: "ONGOING" },
  });
  return c.json({ data: event }, 200);
});

eventAdminRoutes.post("/:id/cancel", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const event = await prisma.event.update({
    where: { id },
    data: { status: "CANCELED" },
  });
  return c.json({ data: event }, 200);
});

eventAdminRoutes.post("/:id/complete", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const event = await prisma.event.update({
    where: { id },
    data: { status: "DONE" },
  });
  return c.json({ data: event }, 200);
});

eventAdminRoutes.delete("/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const event = await prisma.event.delete({
    where: { id },
  });
  return c.json({ data: event }, 200);
});

eventAdminRoutes.get("/:id/activities", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const [seminars, exhibitions] = await Promise.all([
    prisma.seminar.findMany({ where: { eventId: id } }),
    prisma.exhibition.findMany({ where: { eventId: id } }),
  ]);

  return c.json({ data: { seminars, exhibitions } });
});

const createEventSeminarSchema = z.object({
  title: z.string().nonempty(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  location: z.string().optional(),
  format: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
  pricingType: z.enum(["PAID", "FREE"]),
});

eventAdminRoutes.post(
  "/:id/seminars",
  zValidator("json", createEventSeminarSchema),
  requireRole("admin"),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const seminar = await prisma.seminar.create({
      data: { ...data, eventId: id },
    });

    return c.json({ data: seminar }, 201);
  }
);
