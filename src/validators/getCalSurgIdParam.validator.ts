import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getCalSurgIdParamValidator = checkSchema({
  calSurgId: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "CalSurg ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});
