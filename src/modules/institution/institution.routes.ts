import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { requireRole } from "../../auth/middleware/require-role";
import { prisma } from "../../lib/prisma";

export const institutionRoutes = new Hono();

institutionRoutes.get("/", requireRole("admin"), async (c) => {
  const institutions = await prisma.institution.findMany();
  return c.json({ data: institutions });
});

institutionRoutes.get("/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const institution = await prisma.institution.findUnique({
    where: { id },
  });
  if (!institution) {
    return c.json({ message: "Institution not found" }, 404);
  }
  return c.json({ data: institution });
});

const createInstitutionSchema = z.object({
  name: z.string().nonempty(),
  logo: z.string().url().optional(),
});

institutionRoutes.post(
  "/",
  zValidator("json", createInstitutionSchema),
  requireRole("admin"),
  async (c) => {
    const data = c.req.valid("json");
    const institution = await prisma.institution.create({ data });
    return c.json({ data: institution }, 201);
  }
);

const editInstitutionSchema = z.object({
  name: z.string().nonempty(),
  logo: z.string().url().optional(),
});

institutionRoutes.put(
  "/:id",
  zValidator("json", editInstitutionSchema),
  requireRole("admin"),
  async (c) => {
    const data = c.req.valid("json");
    const institution = await prisma.institution.update({
      where: { id: c.req.param("id") },
      data,
    });
    return c.json({ data: institution }, 200);
  }
);

institutionRoutes.delete("/:id", async (c) => {
  const institution = await prisma.institution.delete({
    where: { id: c.req.param("id") },
  });
  return c.json({ data: institution }, 200);
});
