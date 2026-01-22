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
    this.router.post(
      "/send",
      userBasedStrictRateLimiter,
      extractJWT,
      requireInstituteAdmin,
      sendMailValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            status: "error",
            statusCode: StatusCodes.BAD_REQUEST,
            message: "Bad Request",
            error: result.array(),
          });
        }

        try {
          const validatedPayload = matchedData(req, {
            locations: ["body"],
            includeOptionals: true,
          }) as SendMailPayload;
          const { to } = await this.mailerController.handleSendMail(validatedPayload);
          return res.status(StatusCodes.OK).json({
            status: "success",
            statusCode: StatusCodes.OK,
            message: `Email sent successfully to ${to}`,
            data: { to },
          });
        } catch (error: any) {
          console.error("[MailerRouter] Failed to send email", error);
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: "error",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            message: "Internal Server Error",
            error: error?.message ?? "Failed to send email",
          });
        }
      }
    );
  }
}

