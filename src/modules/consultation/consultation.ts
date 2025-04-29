// ================================
// === CONSULTATION SLOT STATUS ===
// ================================
export const CONSULTATION_SLOT_STATUS = {
  AVAILABLE: "AVAILABLE",
  NOT_AVAILABLE: "NOT_AVAILABLE",
  BOOKED: "BOOKED",
  ONGOING: "ONGOING",
  DONE: "DONE",
  NOT_PRESENT: "NOT_PRESENT",
  CANCELED: "CANCELED",
} as const;
export const validSlotStatuses = Object.values(CONSULTATION_SLOT_STATUS);
export type ValidSlotStatus = (typeof validSlotStatuses)[number];
