import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  AccessToken,
  Room,
  RoomServiceClient,
  WebhookReceiver,
} from "livekit-server-sdk";
import { requireRole } from "../../auth/middleware/require-role";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;
const LIVEKIT_SERVER_URL = process.env.LIVEKIT_SERVER_URL!;
const LIVEKIT_HOST = process.env.LIVEKIT_HOST!;

export const livekitAdminRoutes = new Hono<{
  Variables: { rawBody?: ArrayBuffer };
}>();

const createTokenSchema = z.object({
  roomName: z.string(),
  participantName: z.string(),
});

livekitAdminRoutes.post(
  "/token",
  zValidator("json", createTokenSchema),
  requireRole("admin"),
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

const webhookReceiver = new WebhookReceiver(
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET
);

// TODO: Add authorization
livekitAdminRoutes.post("/webhook", async (c) => {
  try {
    const body = await c.req.json();
    const event = await webhookReceiver.receive(
      body,
      c.req.header("Authorization")
    );
    console.log(`[LIVEKIT EVENT]:`, event);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error validating webhook event:", error);
    return c.json({ success: false, error: "Invalid requires" }, 400);
  }
});

const roomService = new RoomServiceClient(
  LIVEKIT_HOST,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET
);

livekitAdminRoutes.get("/rooms", requireRole("admin"), async (c) => {
  try {
    const rooms = await roomService.listRooms();
    return c.json({ success: true, data: rooms });
  } catch (error) {
    return c.json({ success: false, error: "Something went wrong" }, 500);
  }
});

const createRoomSchema = z.object({
  name: z.string(),
  maxParticipants: z.number().positive().optional(),
  emptyTimeoutInSeconds: z.number().min(0).optional(),
  departureTimeoutInSeconds: z.number().min(0).optional(),
  metadata: z.string().optional(),
});

livekitAdminRoutes.post(
  "/rooms",
  zValidator("json", createRoomSchema),
  requireRole("admin"),
  async (c) => {
    try {
      const {
        name,
        maxParticipants,
        emptyTimeoutInSeconds,
        metadata,
        departureTimeoutInSeconds,
      } = c.req.valid("json");
      const room = await roomService.createRoom({
        name,
        maxParticipants,
        emptyTimeout: emptyTimeoutInSeconds,
        departureTimeout: departureTimeoutInSeconds,
        metadata,
      });
      return c.json({ success: true, data: room });
    } catch (error) {
      return c.json({ success: false, error: "Something went wrong" }, 500);
    }
  }
);

livekitAdminRoutes.delete("rooms/:name", requireRole("admin"), async (c) => {
  try {
    const roomName = c.req.param("name");
    await roomService.deleteRoom(roomName);
    return c.json({ success: true, data: "Room deleted" });
  } catch (error) {
    return c.json({ success: false, error: "Something went wrong" }, 500);
  }
});

livekitAdminRoutes.get(
  "room/:name/participants",
  requireRole("admin"),
  async (c) => {
    try {
      const roomName = c.req.param("name");
      const participants = await roomService.listParticipants(roomName);
      return c.json({ success: true, data: participants });
    } catch (error) {
      return c.json({ success: false, error: "Something went wrong" }, 500);
    }
  }
);

export async function createRoom({
  roomName,
  metadata,
  maxParticipants,
}: {
  roomName: string;
  metadata?: string;
  maxParticipants?: number;
}): Promise<Room | null> {
  try {
    const room = await roomService.createRoom({
      name: roomName,
      maxParticipants,
      metadata,
    });
    return room;
  } catch (error) {
    return null;
  }
}

export async function deleteRoom({
  roomName,
}: {
  roomName: string;
}): Promise<void> {
  try {
    await roomService.deleteRoom(roomName);
  } catch (error) {}
}
