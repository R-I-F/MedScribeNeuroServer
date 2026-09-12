import { checkSchema } from "express-validator";
import { strictUuidValidator } from "./uuidValidator.util";

/**
 * POST /journalEliminator/reservation - candidate journal club booking.
 *
 * Only the shape is checked here. Every rule (one per candidate, one per date, no
 * repeating your own past paper, round open) lives in journalEliminator.provider.ts,
 * and there is deliberately no candidateId field: the identity comes from the JWT.
 */
export const journalReserveValidator = checkSchema({
  journalId: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "journalId is required",
    custom: strictUuidValidator,
  },
  slotId: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "slotId is required",
    custom: strictUuidValidator,
  },
});

/** PATCH /journalEliminator/admin/campaigns/:campaignId/open - super-admin switch. */
export const journalOpenValidator = checkSchema({
  open: {
    in: ["body"],
    exists: { errorMessage: "open is required" },
    isBoolean: { errorMessage: "open must be a boolean" },
    toBoolean: true,
  },
});
