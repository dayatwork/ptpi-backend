import { createMiddleware } from "hono/factory";
import type { AppVariables } from "../../index";

export const requireAuth = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    if (!c.get("session")) {
      c.status(401);
      return c.json({ message: "Unauthorized" });
    }
    await next();
  }
);
