import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";
import { Rank, RegDegree } from "../cand/cand.interface";

const rankValues = Object.values(Rank);
const regDegValues = Object.values(RegDegree);

export const updateCandValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "candidate ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  email: {
    in: ["body"],
    optional: true,
    isEmail: {
      errorMessage: "candidate email must be a valid email address",
    },
    trim: true,
  },
  password: {
    in: ["body"],
    optional: true,
    isLength: {
      options: {
        min: 8,
      },
      errorMessage: "candidate password must be at least 8 characters long",
    },
    trim: true,
  },
  fullName: {
    in: ["body"],
    optional: true,
    isLength: {
      options: {
        max: 255,
      },
      errorMessage: "full name should have a maximum of 255 characters",
    },
    trim: true,
  },
  phoneNum: {
    in: ["body"],
    optional: true,
    isLength: {
      options: {
        min: 11,
      },
      errorMessage: "phone number must be at least 11 characters",
    },
    trim: true,
  },
  regNum: {
    in: ["body"],
    optional: true,
    isLength: {
      options: {
        max: 50,
      },
      errorMessage: "regNum should have a maximum of 50 characters",
    },
    trim: true,
  },
  nationality: {
    in: ["body"],
    optional: true,
    isLength: {
      options: {
        max: 100,
      },
      errorMessage: "nationality should have a maximum of 100 characters",
    },
    trim: true,
  },
  rank: {
    in: ["body"],
    optional: true,
    isIn: {
      options: [rankValues],
      errorMessage: `rank must be one of: ${rankValues.join(", ")}`,
    },
    trim: true,
  },
  regDeg: {
    in: ["body"],
    optional: true,
    isIn: {
      options: [regDegValues],
      errorMessage: `regDeg must be one of: ${regDegValues.join(", ")}`,
    },
    trim: true,
  },
  approved: {
    in: ["body"],
    optional: true,
    isBoolean: {
      errorMessage: "approved must be a boolean value",
    },
  },
});
