import { checkSchema } from "express-validator";

export const getRefQuestionsByDeptCodeValidator = checkSchema({
  deptCode: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "deptCode is required.",
    trim: true,
    matches: {
      options: /^[A-Za-z]{2,10}$/,
      errorMessage: "deptCode must be 2-10 letters (e.g. NS, CTS, OBGYN).",
    },
  },
});
