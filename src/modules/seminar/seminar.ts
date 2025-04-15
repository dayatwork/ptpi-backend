// ====================
// == SEMINAR FORMAT ==
// ====================
export const SEMINAR_FORMAT = {
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
  HYBRID: "HYBRID",
} as const;
export const validFormats = Object.values(SEMINAR_FORMAT);
export type ValidFormat = (typeof validFormats)[number];

// ====================
// == SEMINAR STATUS ==
// ====================
export const SEMINAR_STATUS = {
  DRAFT: "DRAFT",
  SCHEDULED: "SCHEDULED",
  ONGOING: "ONGOING",
  DONE: "DONE",
  CANCELED: "CANCELED",
} as const;
export const validStatuses = Object.values(SEMINAR_STATUS);
export type ValidStatus = (typeof validStatuses)[number];
