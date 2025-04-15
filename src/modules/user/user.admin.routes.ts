import { Hono } from "hono";
import { requireRole } from "../../auth/middleware/require-role";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

export const userAdminRoutes = new Hono();

const getUsersQueryParamsSchema = z.object({
  q: z.string().optional(),
});

userAdminRoutes.get(
  "/",
  zValidator("query", getUsersQueryParamsSchema),
  requireRole("admin"),
  async (c) => {
    const query = c.req.valid("query");
    const take = query.q ? 10 : undefined;
    const users = await prisma.user.findMany({
      where: query.q ? { name: { contains: query.q } } : undefined,
      take,
    });
    return c.json({ data: users });
  }
);

userAdminRoutes.get("/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }
  return c.json({ data: user });
});
