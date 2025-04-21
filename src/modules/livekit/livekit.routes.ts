import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AccessToken } from "livekit-server-sdk";
import { requireAuth } from "../../auth/middleware/require-auth";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;
const LIVEKIT_SERVER_URL = process.env.LIVEKIT_SERVER_URL!;

export const livekitRoutes = new Hono<{
  Variables: { rawBody?: ArrayBuffer };
}>();

const createTokenSchema = z.object({
  roomName: z.string(),
  participantName: z.string(),
});

livekitRoutes.post(
  "/token",
  zValidator("json", createTokenSchema),
  requireAuth,
  async (c) => {
    const { participantName, roomName } = c.req.valid("json");
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
    });
    at.addGrant({ roomJoin: true, room: roomName });
    const token = await at.toJwt();
    return c.json({
      data: {
        token,
        livekitUrl: LIVEKIT_SERVER_URL,
      },
    });
  }
);
