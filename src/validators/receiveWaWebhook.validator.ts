import { body } from "express-validator";

export const receiveWaWebhookValidator = [
  body("object")
    .isString()
    .withMessage("'object' must be a string")
    .bail()
    .equals("whatsapp_business_account")
    .withMessage("'object' must equal 'whatsapp_business_account'"),
  body("entry")
    .isArray({ min: 1 })
    .withMessage("'entry' must be a non-empty array"),
];
