import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

const optionalZeroOrOne = {
  optional: true,
  isInt: { options: { min: 0, max: 1 }, errorMessage: "must be 0 or 1" },
  toInt: true,
};

export const updateAdditionalQuestionValidator = checkSchema({
  mainDiagDocId: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "mainDiagDocId is required.",
    custom: uuidValidator,
    trim: true,
  },
  spOrCran: { in: ["body"], ...optionalZeroOrOne },
  pos: { in: ["body"], ...optionalZeroOrOne },
  approach: { in: ["body"], ...optionalZeroOrOne },
  region: { in: ["body"], ...optionalZeroOrOne },
  clinPres: { in: ["body"], ...optionalZeroOrOne },
  intEvents: { in: ["body"], ...optionalZeroOrOne },
});
