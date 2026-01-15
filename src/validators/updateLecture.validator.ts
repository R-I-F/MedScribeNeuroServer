import { checkSchema } from "express-validator";

export const updateLectureValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "lecture ID is required.",
    isMongoId: {
      errorMessage: "lecture ID must be a valid MongoDB ObjectId",
    },
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

