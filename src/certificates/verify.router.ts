/**
 * Public certificate verification: GET /verify/:code (no login).
 *
 * A third party (a hospital, another university) scans the QR code on an E-Certificate or types
 * its code and sees whether it is valid or revoked, plus the numbers it certified at issue time.
 * Only document-checking fields are returned (see CertificateService.publicView). Codes carry
 * 40 random bits and the route sits behind the per-IP API limiter, so guessing is not practical.
 */
import { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { StatusCodes } from "http-status-codes";
import { AppDataSource, initializeDatabase } from "../config/database.config";
import { apiRateLimiter } from "../middleware/rateLimiter.middleware";
import { CertificateService, canonicalCertificateCode } from "./certificate.service";

@injectable()
export class VerifyRouter {
  public router: Router;

  constructor(@inject(CertificateService) private certificateService: CertificateService) {
    this.router = Router();
    this.router.get("/:code", apiRateLimiter, async (req: Request, res: Response) => {
      const code = canonicalCertificateCode(String(req.params.code ?? ""));
      if (!code) {
        res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid certificate code" });
        return;
      }
      try {
        if (!AppDataSource.isInitialized) await initializeDatabase();
        const view = await this.certificateService.publicView(AppDataSource, code);
        res.setHeader("Cache-Control", "no-store");
        if (!view) {
          res.status(StatusCodes.NOT_FOUND).json({ error: "Certificate not found" });
          return;
        }
        res.status(StatusCodes.OK).json(view);
      } catch (err: any) {
        console.error("[verify]", err?.message ?? err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Could not check the certificate" });
      }
    });
  }
}
