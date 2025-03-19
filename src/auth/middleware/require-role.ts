import { createMiddleware } from "hono/factory";
import type { AppVariables } from "../../index";

type Role = "admin" | "user";

export const requireRole = (role: Role | Role[]) =>
  createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    const user = c.get("user");
    if (!user) {
      c.status(401);
      return c.json({ message: "Unauthorized" });
    }
    if (
      !user.role ||
      (role !== user.role && role.includes(user.role as Role))
    ) {
      c.status(403);
      return c.json({ message: "Forbidden", code: "USER_NOT_AUTHORIZED" });
    }
    await next();
  });
