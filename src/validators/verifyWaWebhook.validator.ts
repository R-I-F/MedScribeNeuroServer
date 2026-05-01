import { query } from "express-validator";

export const verifyWaWebhookValidator = [
  query("hub.mode")
    .isString()
    .withMessage("'hub.mode' must be a string")
    .bail()
    .equals("subscribe")
    .withMessage("'hub.mode' must equal 'subscribe'"),
  query("hub.verify_token")
    .isString()
    .withMessage("'hub.verify_token' must be a string")
    .bail()
    .notEmpty()
    .withMessage("'hub.verify_token' must not be empty"),
  query("hub.challenge")
    .isString()
    .withMessage("'hub.challenge' must be a string")
    .bail()
    .notEmpty()
    .withMessage("'hub.challenge' must not be empty"),
];
