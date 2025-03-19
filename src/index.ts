import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./lib/auth";
import { requireAuth } from "./auth/middleware/require-auth";
import { userRoutes } from "./modules/user/user.routes";
import { institutionRoutes } from "./modules/institution/institution.routes";
import { eventRoutes } from "./modules/event/event.routes";
import { seminarRoutes } from "./modules/seminar/seminar.routes";

export type AppVariables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

const app = new Hono<{ Variables: AppVariables }>();

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});

app.use(
  "/api/auth/*",
  cors({
    origin: process.env.BETTER_AUTH_TRUSTED_ORIGINS!,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    // maxAge: 600,
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.use(
  "/api/*",
  cors({
    origin: [process.env.BETTER_AUTH_TRUSTED_ORIGINS!],
    credentials: true,
  })
);

app.route("/api/users", userRoutes);
app.route("/api/institutions", institutionRoutes);
app.route("/api/events", eventRoutes);
app.route("/api/seminars", seminarRoutes);

app.get("/", requireAuth, (c) => {
  return c.text("OK");
});

app.get("/session", async (c) => {
  const session = c.get("session");
  const user = c.get("user");

  if (!user) return c.body(null, 401);

  return c.json({
    data: {
      session,
      user,
    },
  });
});

app.notFound((c) => {
  return c.json({ message: "404 Not found" }, 404);
});

app.onError((err, c) => {
  // console.log("HAHAHAHA");
  // console.error(`${err.name}`);
  // console.error(`${err.message}`);
  // if (err instanceof PrismaClientValidationError) {
  //   console.log("prisma error");
  //   console.log(err);
  // }
  return c.json({ message: "Something went wrong" }, 500);
});

export default app;
