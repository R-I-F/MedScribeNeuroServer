import { checkSchema } from "express-validator";

export const updateSupervisorValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "supervisor ID is required.",
    isMongoId: {
      errorMessage: "supervisor ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
  email: {
    in: ["body"],
    optional: true,
    isEmail: {
      errorMessage: "supervisor email must be a valid email address",
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
      errorMessage: "supervisor password must be at least 8 characters long",
    },
    trim: true,
  },
  fullName: {
    in: ["body"],
    optional: true,
    isLength: {
      options: {
        max: 100,
      },
      errorMessage: "supervisor full name should have a maximum of 100 characters",
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
      errorMessage: "supervisor phone number must be at least 11 digits",
    },
    trim: true,
  },
  approved: {
    in: ["body"],
    optional: true,
    isBoolean: {
      errorMessage: "supervisor approval status must be a boolean value",
    },
  },
  approvedSubs: {
    in: ["body"],
    optional: true,
    isArray: {
      errorMessage: "approvedSubs must be an array",
    },
  },
  pendingSubs: {
    in: ["body"],
    optional: true,
    isArray: {
      errorMessage: "pendingSubs must be an array",
    },
  },
  rejectedSubs: {
    in: ["body"],
    optional: true,
    isArray: {
      errorMessage: "rejectedSubs must be an array",
    },
  },
});
