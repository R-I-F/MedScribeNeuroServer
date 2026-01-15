import { checkSchema } from "express-validator";

export const createLectureValidator = checkSchema({
  lectureTitle: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "lectureTitle is required.",
    trim: true,
  },
  google_uid: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "google_uid is required.",
    trim: true,
  },
  mainTopic: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "mainTopic is required.",
    trim: true,
  },
  level: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "level is required.",
    isIn: {
      options: [["msc", "md"]],
      errorMessage: "level must be one of: msc, md",
    },
  },
});

