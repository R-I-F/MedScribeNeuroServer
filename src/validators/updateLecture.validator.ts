import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const updateLectureValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "lecture ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  lectureTitle: {
    in: ["body"],
    optional: true,
    trim: true,
  },
  google_uid: {
    in: ["body"],
    optional: true,
    trim: true,
  },
  mainTopic: {
    in: ["body"],
    optional: true,
    trim: true,
  },
  level: {
    in: ["body"],
    optional: true,
    isIn: {
      options: [["msc", "md"]],
      errorMessage: "level must be one of: msc, md",
    },
  },
});

