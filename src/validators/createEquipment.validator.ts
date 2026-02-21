import { checkSchema } from "express-validator";

export const createEquipmentValidator = checkSchema({
  equipment: {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
    isLength: { options: { max: 100 }, errorMessage: "equipment must be at most 100 characters" },
    errorMessage: "equipment is required",
  },
});
