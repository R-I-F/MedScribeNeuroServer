import "reflect-metadata";
import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import { RefMirrorService } from "./refMirror.service";

/**
 * Service-to-service re-mirror webhook (KA spoke). Mounted at `/admin/ref-resync`.
 *
 * The hub superadmin's broadcast POSTs `{ dataVersion, triggeredAt }` signed with this
 * spoke's shared secret as `X-Hub-Signature: sha256=<hex>` (HMAC-SHA256 over the raw body).
 * We verify the signature against `HUB_WEBHOOK_SECRET` (NOT a JWT) and, on success, trigger
 * an immediate mirror sync. A missed/failed webhook self-heals via the dataVersion poll.
 */
@injectable()
export class RefResyncRouter {
  public router: Router;

  constructor(@inject(RefMirrorService) private mirror: RefMirrorService) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post("/ref-resync", async (req: Request, res: Response) => {
      const secret = process.env.HUB_WEBHOOK_SECRET;
      if (!secret) {
        return res
          .status(StatusCodes.SERVICE_UNAVAILABLE)
          .json({ error: "resync webhook not configured (HUB_WEBHOOK_SECRET missing)" });
      }

      const provided = req.get("X-Hub-Signature") || "";
      const raw: Buffer | undefined = (req as any).rawBody;
      if (!raw) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "missing raw request body for signature verification" });
      }

      const expected = "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
      const providedBuf = Buffer.from(provided);
      const expectedBuf = Buffer.from(expected);
      const valid =
        providedBuf.length === expectedBuf.length &&
        crypto.timingSafeEqual(providedBuf, expectedBuf);
      if (!valid) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: "invalid signature" });
      }

      try {
        const result = await this.mirror.sync();
        return res.status(StatusCodes.OK).json({ synced: true, ...result });
      } catch (err: any) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ synced: false, error: err?.message ?? "mirror sync failed" });
      }
    });
  }
}
