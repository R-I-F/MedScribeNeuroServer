import { inject, injectable } from "inversify";
import { WaBotProvider } from "./waBot.provider";
import { IWaWebhookPayload, WaHandshakeResult } from "./waBot.interface";

@injectable()
export class WaBotController {
  constructor(@inject(WaBotProvider) private waBotProvider: WaBotProvider) {}

  public async handleVerification(
    query: Record<string, unknown>,
  ): Promise<WaHandshakeResult> | never {
    try {
      return this.waBotProvider.handleVerification(query);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleInboundEvent(input: {
    rawBody: Buffer | undefined;
    signatureHeader: string | undefined;
    payload: IWaWebhookPayload;
  }): Promise<{ ok: boolean; reason?: string }> | never {
    try {
      const sigCheck = this.waBotProvider.verifyInboundSignature(
        input.rawBody,
        input.signatureHeader,
      );
      if (!sigCheck.ok) return sigCheck;

      const events = this.waBotProvider.parseEvents(input.payload);
      this.waBotProvider.dispatchEvents(events);
      return { ok: true };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
