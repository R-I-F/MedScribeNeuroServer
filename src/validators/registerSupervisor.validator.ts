import { body } from "express-validator";

export const registerSupervisorValidator = [
  body("email")
    .isEmail()
    .withMessage("email must be a valid email address"),

  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("password must be at least 8 characters long"),

  body("fullName")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("fullName is required"),

  body("phoneNum")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("phoneNum is required"),

  body("institutionId")
    .isUUID()
    .withMessage("institutionId must be a valid UUID"),

  body("position")
    .optional({ values: "falsy" })
    .isIn([
      "Professor",
      "Assistant Professor",
      "Lecturer",
      "Assistant Lecturer",
      "Guest Doctor",
      "Consultant",
      "unknown",
    ])
    .withMessage(
      "position must be one of: Professor, Assistant Professor, Lecturer, Assistant Lecturer, Guest Doctor, Consultant, unknown"
    ),
];
