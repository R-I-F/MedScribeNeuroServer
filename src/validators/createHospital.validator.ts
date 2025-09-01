import { checkSchema } from "express-validator";

export const createHospitalValidator = checkSchema({
  arabName: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "hospital name is required in arabic.",
    isLength: {
      options: {
        max: 100,
      },
      errorMessage:
        "hospital arabic name should have a maximum of 100 characters",
    },
    trim: true,
  },
  engName: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "hospital name is required in english.",
    isLength: {
      options: {
        max: 100,
      },
      errorMessage:
        "hospital english name should have a maximum of 100 characters",
    },
    trim: true,
  },
  "location.long": {
    in: ["body"],
    isFloat: {
      options: { min: -180, max: 180 }, // valid longitude range
      errorMessage: "Longitude must be a valid number between -180 and 180",
    },
    toFloat: true, // converts to float automatically
  },
  "location.lat": {
    in: ["body"],
    isFloat: {
      options: { min: -90, max: 90 }, // valid latitude range
      errorMessage: "Latitude must be a valid number between -90 and 90",
    },
    toFloat: true,
  },
});
