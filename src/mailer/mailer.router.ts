import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { validationResult, matchedData } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { MailerController } from "./mailer.controller";
import { SendMailPayload } from "./mailer.interface";
import { sendMailValidator } from "../validators/sendMail.validator";
import extractJWT from "../middleware/extractJWT";
import { requireInstituteAdmin } from "../middleware/authorize.middleware";
import { userBasedStrictRateLimiter } from "../middleware/rateLimiter.middleware";

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
    // DISABLED (2026-07-21, security audit): the generic "send arbitrary email" endpoint is
    // not used anywhere in the app — system emails (OTP, password reset) call MailerService
    // directly. Left mounted it was an authenticated phishing vector (caller-controlled
    // from/to/html). Returns 410; restore only with `from` pinned to the verified domain.
    this.router.post(
      "/send",
      userBasedStrictRateLimiter,
      extractJWT,
      requireInstituteAdmin,
      async (_req: Request, res: Response) => {
        return res.status(StatusCodes.GONE).json({
          status: "error",
          statusCode: StatusCodes.GONE,
          message: "Gone",
          error: "This endpoint is disabled.",
          code: "ENDPOINT_DISABLED",
        });
      }
    );
  }
}

