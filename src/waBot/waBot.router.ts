import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { matchedData, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { WaBotController } from "./waBot.controller";
import { IWaWebhookPayload } from "./waBot.interface";
import { verifyWaWebhookValidator } from "../validators/verifyWaWebhook.validator";
import { receiveWaWebhookValidator } from "../validators/receiveWaWebhook.validator";
import { strictRateLimiter } from "../middleware/rateLimiter.middleware";

@injectable()
export class WaBotRouter {
  public router: Router;

  constructor(
    @inject(WaBotController) private waBotController: WaBotController,
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes() {
    // Meta webhook verification handshake (called once when saving the Callback URL).
    // Must respond with the raw `hub.challenge` string in plain text, NOT the wrapped JSON.
    this.router.get(
      "/webhook",
      strictRateLimiter,
      verifyWaWebhookValidator,
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
          // Do not use `matchedData` here: it can omit dotted keys like `hub.mode`, so
          // the provider would see undefined and return `invalid_mode` even for valid requests.
          const outcome = await this.waBotController.handleVerification(
            req.query as Record<string, unknown>,
          );

          if (!outcome.ok) {
            const code =
              outcome.reason === "server_misconfigured"
                ? StatusCodes.SERVICE_UNAVAILABLE
                : StatusCodes.FORBIDDEN;
            return res.status(code).json({
              status: "error",
              statusCode: code,
              message:
                code === StatusCodes.SERVICE_UNAVAILABLE
                  ? "Service Unavailable"
                  : "Forbidden",
              error: outcome.reason,
            });
          }

          // res.send bypasses the responseFormatter (which only wraps res.json),
          // so Meta receives the bare challenge string in plain text as required.
          return res
            .status(StatusCodes.OK)
            .type("text/plain")
            .send(outcome.challenge);
        } catch (error: any) {
          console.error("[WaBotRouter] verification error", error);
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: "error",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            message: "Internal Server Error",
            error: error?.message ?? "Failed to verify webhook",
          });
        }
      },
    );

    // Inbound message/status events from Meta. Must ack with 2xx within ~20s
    // or Meta retries. Signature is verified against the raw request body.
    this.router.post(
      "/webhook",
      strictRateLimiter,
      receiveWaWebhookValidator,
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
          const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
          const signatureHeader = req.header("x-hub-signature-256");
          const payload = req.body as IWaWebhookPayload;

          const outcome = await this.waBotController.handleInboundEvent({
            rawBody,
            signatureHeader,
            payload,
          });

          if (!outcome.ok) {
            const code =
              outcome.reason === "server_misconfigured"
                ? StatusCodes.SERVICE_UNAVAILABLE
                : StatusCodes.UNAUTHORIZED;
            return res.status(code).json({
              status: "error",
              statusCode: code,
              message:
                code === StatusCodes.SERVICE_UNAVAILABLE
                  ? "Service Unavailable"
                  : "Unauthorized",
              error: outcome.reason,
            });
          }

          return res.status(StatusCodes.OK).json({ received: true });
        } catch (error: any) {
          console.error("[WaBotRouter] inbound webhook error", error);
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: "error",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            message: "Internal Server Error",
            error: error?.message ?? "Failed to process webhook",
          });
        }
      },
    );
  }
}
