import { Hono } from "hono";
import { requireRole } from "../../auth/middleware/require-role";
import { prisma } from "../../lib/prisma";

export const userRoutes = new Hono();

userRoutes.get("/", requireRole("admin"), async (c) => {
  const users = await prisma.user.findMany();
  return c.json({ data: users });
});

userRoutes.get("/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }
  return c.json({ data: user });
});
