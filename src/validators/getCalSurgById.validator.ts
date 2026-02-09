import { checkSchema } from "express-validator";

export const getCalSurgByIdValidator = checkSchema({
  "_id": {
    in: ["query"],
    notEmpty: true,
    isString: true,
    trim: true,
    errorMessage: "_id is required and must be a valid string",
  },
});
