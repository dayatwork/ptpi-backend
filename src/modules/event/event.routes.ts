import { Hono } from "hono";
import { requireAuth } from "../../auth/middleware/require-auth";
import { prisma } from "../../lib/prisma";
import { EVENT_STATUS } from "./event";
import { SEMINAR_STATUS } from "../seminar/seminar";

export const eventRoutes = new Hono();

eventRoutes.get("/upcoming", requireAuth, async (c) => {
  const events = await prisma.event.findMany({
    where: {
      status: EVENT_STATUS.SCHEDULED,
    },
  });
  const eventIds = events.map((event) => event.id);
  const seminarsWithEvent = await prisma.seminar.findMany({
    where: {
      eventId: { in: eventIds },
      status: { notIn: [SEMINAR_STATUS.DRAFT, SEMINAR_STATUS.CANCELED] },
    },
    select: { eventId: true },
    distinct: ["eventId"],
  });
  const eventIdsWithSeminar = seminarsWithEvent.map(
    (seminar) => seminar.eventId ?? ""
  );

  return c.json({
    data: events.map((event) => {
      const activities: string[] = [];
      if (eventIdsWithSeminar.includes(event.id)) {
        activities.push("seminar");
      }
      return { ...event, activities };
    }),
  });
});

eventRoutes.get("/previous", requireAuth, async (c) => {
  const events = await prisma.event.findMany({
    where: {
      status: EVENT_STATUS.DONE,
    },
  });
  const eventIds = events.map((event) => event.id);
  const seminarsWithEvent = await prisma.seminar.findMany({
    where: {
      eventId: { in: eventIds },
      status: { notIn: [SEMINAR_STATUS.DRAFT, SEMINAR_STATUS.CANCELED] },
    },
    select: { eventId: true },
    distinct: ["eventId"],
  });
  const eventIdsWithSeminar = seminarsWithEvent.map(
    (seminar) => seminar.eventId ?? ""
  );

  return c.json({
    data: events.map((event) => {
      const activities: string[] = [];
      if (eventIdsWithSeminar.includes(event.id)) {
        activities.push("seminar");
      }
      return { ...event, activities };
    }),
  });
});

eventRoutes.get("/ongoing", requireAuth, async (c) => {
  const events = await prisma.event.findMany({
    where: {
      status: EVENT_STATUS.ONGOING,
    },
  });
  const eventIds = events.map((event) => event.id);
  const seminarsWithEvent = await prisma.seminar.findMany({
    where: {
      eventId: { in: eventIds },
      status: { notIn: [SEMINAR_STATUS.DRAFT, SEMINAR_STATUS.CANCELED] },
    },
    select: { eventId: true },
    distinct: ["eventId"],
  });
  const eventIdsWithSeminar = seminarsWithEvent.map(
    (seminar) => seminar.eventId ?? ""
  );

  return c.json({
    data: events.map((event) => {
      const activities: string[] = [];
      if (eventIdsWithSeminar.includes(event.id)) {
        activities.push("seminar");
      }
      return { ...event, activities };
    }),
  });
});

eventRoutes.get("/:id", requireAuth, async (c) => {
  const event = await prisma.event.findUnique({
    where: { id: c.req.param("id"), status: { notIn: [EVENT_STATUS.DRAFT] } },
  });

  if (!event) {
    return c.json({ message: "Event not found" }, 404);
  }

  const [seminars, consultations] = await Promise.all([
    prisma.seminar.findMany({
      where: { eventId: event.id, status: { notIn: [SEMINAR_STATUS.DRAFT] } },
    }),
    prisma.consultation.findMany({
      where: { eventId: event.id },
      select: {
        id: true,
        exhibitor: { select: { id: true, name: true, logo: true } },
        slots: {
          select: { id: true, startTime: true, endTime: true, status: true },
          orderBy: { startTime: "asc" },
        },
      },
    }),
  ]);

  return c.json({ data: { ...event, seminars, consultations } });
});
