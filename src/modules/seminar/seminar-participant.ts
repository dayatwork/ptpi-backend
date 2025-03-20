// ================================
// == SEMINAR PARTICIPANT STATUS ==
// ================================
export const SEMINAR_PARTICIPANT_STATUS = {
  BOOKED: "BOOKED",
  REGISTERED: "REGISTERED",
  PRESENT: "PRESENT",
  NOT_PRESENT: "NOT_PRESENT",
  CANCELED: "CANCELED",
} as const;
export const validParticipantStatuses = Object.values(
  SEMINAR_PARTICIPANT_STATUS
);
export type ValidParticipantStatus = (typeof validParticipantStatuses)[number];

// ========================================
// == SEMINAR PARTICIPANT PAYMENT STATUS ==
// ========================================
export const SEMINAR_PARTICIPANT_PAYMENT_STATUS = {
  FREE: "FREE",
  PAID: "PAID",
  UNPAID: "UNPAID",
} as const;
export const validParticipantPaymentStatuses = Object.values(
  SEMINAR_PARTICIPANT_PAYMENT_STATUS
);
export type ValidParticipantPaymentStatus =
  (typeof validParticipantPaymentStatuses)[number];
