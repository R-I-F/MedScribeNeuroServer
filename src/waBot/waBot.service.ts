import { injectable } from "inversify";
import crypto from "crypto";

@injectable()
export class WaBotService {
  /**
   * Verifies the X-Hub-Signature-256 header sent by Meta against the raw request body
   * using HMAC-SHA256 with the app secret. Uses timing-safe comparison.
   *
   * @param rawBody Raw request body buffer (must be the bytes Meta sent, not re-serialized JSON).
   * @param signatureHeader Value of `X-Hub-Signature-256` header (e.g. "sha256=abc123...").
   * @param appSecret Meta App Secret (from Meta App > Settings > Basic).
   */
  public verifySignature(
    rawBody: Buffer | undefined,
    signatureHeader: string | undefined,
    appSecret: string,
  ): boolean | never {
    try {
      if (!rawBody || !signatureHeader || !appSecret) return false;

      const [scheme, providedHex] = signatureHeader.split("=");
      if (scheme !== "sha256" || !providedHex) return false;

      const expectedHex = crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex");

      const expectedBuf = Buffer.from(expectedHex, "hex");
      const providedBuf = Buffer.from(providedHex, "hex");

      if (expectedBuf.length !== providedBuf.length) return false;
      return crypto.timingSafeEqual(expectedBuf, providedBuf);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Constant-time string comparison for the GET handshake verify token.
   */
  public safeEqual(a: string, b: string): boolean | never {
    try {
      const bufA = Buffer.from(a);
      const bufB = Buffer.from(b);
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
