import { checkSchema } from "express-validator";
import { strictUuidValidator } from "./uuidValidator.util";

/**
 * POST /eliminator/:campaignId/reservations - public, no-login lecture booking.
 * Business rules (min/max cap, lecture/date conflicts) are enforced in
 * eliminator.provider.ts; this only validates shape.
 */
export const eliminatorReserveValidator = checkSchema({
  supervisorId: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "supervisorId is required",
    custom: strictUuidValidator,
  },
  selections: {
    in: ["body"],
    isArray: {
      options: { min: 1, max: 5 },
      errorMessage: "selections must be an array of 1-5 items",
    },
  },
  "selections.*.lectureId": {
    in: ["body"],
    notEmpty: true,
    errorMessage: "each selection needs a lectureId",
    custom: strictUuidValidator,
  },
  "selections.*.slotId": {
    in: ["body"],
    notEmpty: true,
    errorMessage: "each selection needs a slotId",
    custom: strictUuidValidator,
  },
});
