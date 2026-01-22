import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const updateCalSurgValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "calSurg ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  timeStamp: {
    in: ["body"],
    optional: true,
    isISO8601: {
      errorMessage: "timeStamp must be a valid ISO 8601 date",
    },
    toDate: true,
  },
  patientName: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    isLength: {
      options: {
        max: 200,
      },
      errorMessage: "patientName should have a maximum of 200 characters",
    },
  },
  patientDob: {
    in: ["body"],
    optional: true,
    isISO8601: {
      errorMessage: "patientDob must be a valid ISO 8601 date",
    },
    toDate: true,
  },
  gender: {
    in: ["body"],
    optional: true,
    isIn: {
      options: [["male", "female"]],
      errorMessage: "gender must be either 'male' or 'female'",
    },
  },
  hospital: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    custom: uuidValidator,
    errorMessage: "hospital must be a valid UUID",
  },
  arabProc: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    custom: uuidValidator,
    errorMessage: "arabProc must be a valid UUID",
  },
  procDate: {
    in: ["body"],
    optional: true,
    isISO8601: {
      errorMessage: "procDate must be a valid ISO 8601 date",
    },
    toDate: true,
  },
  google_uid: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    isLength: {
      options: {
        max: 200,
      },
      errorMessage: "google_uid should have a maximum of 200 characters",
    },
  },
  formLink: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    isURL: {
      options: {
        require_protocol: false,
      },
      errorMessage: "formLink must be a valid URL",
    },
  },
});
