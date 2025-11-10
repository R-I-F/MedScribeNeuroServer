import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { validationResult, matchedData } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { MailerController } from "./mailer.controller";
import { SendMailPayload } from "./mailer.interface";
import { sendMailValidator } from "../validators/sendMail.validator";

@injectable()
export class MailerRouter {
  public router: Router;

  constructor(
    @inject(MailerController) private mailerController: MailerController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/send",
      sendMailValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        console.log("[MailerRouter] Validation result", result);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }

        const { text, html } = req.body ?? {};

        if (
          (typeof text !== "string" || text.trim().length === 0) &&
          (typeof html !== "string" || html.trim().length === 0)
        ) {
          console.warn("[MailerRouter] Missing text/html payload", req.body);
          return res.status(StatusCodes.BAD_REQUEST).json({
            message: "Provide at least one of 'text' or 'html' in the request body.",
          });
        }

        try {
          console.log("[MailerRouter] Valid request body", req.body);
          const validatedPayload = matchedData(req, {
            locations: ["body"],
            includeOptionals: true,
          }) as SendMailPayload;
          console.log("[MailerRouter] Matched data payload", validatedPayload);
          const { to } = await this.mailerController.handleSendMail(validatedPayload);
          return res
            .status(StatusCodes.OK)
            .json({ message: `Email sent successfully to ${to}` });
        } catch (error: any) {
          console.error("[MailerRouter] Failed to send email", error);
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: error?.message ?? "Failed to send email",
          });
        }
      }
    );
  }
}

