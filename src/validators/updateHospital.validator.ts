import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const updateHospitalValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Hospital ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  arabName: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    isLength: {
      options: { max: 100 },
      errorMessage: "hospital arabic name should have a maximum of 100 characters",
    },
  },
  engName: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    isLength: {
      options: { max: 100 },
      errorMessage: "hospital english name should have a maximum of 100 characters",
    },
  },
  "location.long": {
    in: ["body"],
    optional: true,
    isFloat: {
      options: { min: -180, max: 180 },
      errorMessage: "Longitude must be a valid number between -180 and 180",
    },
    toFloat: true,
  },
  "location.lat": {
    in: ["body"],
    optional: true,
    isFloat: {
      options: { min: -90, max: 90 },
      errorMessage: "Latitude must be a valid number between -90 and 90",
    },
    toFloat: true,
  },
});
