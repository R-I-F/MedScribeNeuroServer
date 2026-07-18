import "reflect-metadata";
import { inject, injectable } from "inversify";
import { AppDataSource, initializeDatabase } from "../config/database.config";
import { RefApiClient } from "./refApi.client";
import { RefMirrorService } from "./refMirror.service";
import { ClerkProcService } from "../clerkProc/clerkProc.service";

/**
 * Reference data version tracker + poll-driven re-mirror (KA spoke).
 *
 * - `bootstrapSync()` runs at boot: syncs the mirror if the hub's dataVersion differs from
 *   what `ref_sync_state` recorded. Tolerates a hub outage IF a mirror already exists;
 *   fails fast only on a first-ever boot with the hub down and no mirror.
 * - `startPolling()` polls `GET /v1/version` every `REF_VERSION_POLL_MS` (default 5 min) and
 *   re-mirrors on change. Poll failures are swallowed (stale-while-error) — a missed webhook
 *   self-heals on the next successful poll.
 */
@injectable()
export class RefDataService {
  private timer: NodeJS.Timeout | null = null;
  private lastKnownVersion: string | null = null;

  constructor(
    @inject(RefApiClient) private client: RefApiClient,
    @inject(RefMirrorService) private mirror: RefMirrorService,
    @inject(ClerkProcService) private clerkProcs: ClerkProcService
  ) {}

  public getCurrentVersion(): string | null {
    return this.lastKnownVersion;
  }

  public async bootstrapSync(): Promise<void> {
    const stored = await this.readStoredVersion();
    try {
      const { dataVersion } = await this.client.getVersion();
      if (dataVersion !== stored) {
        console.log(
          `[RefData] hub dataVersion ${dataVersion} != stored ${stored ?? "none"} → syncing mirror`
        );
        const result = await this.mirror.sync();
        console.log("[RefData] mirror synced:", JSON.stringify(result));
      } else {
        console.log(`[RefData] mirror already up to date at dataVersion ${dataVersion}`);
      }
      this.lastKnownVersion = dataVersion;
    } catch (err: any) {
      if (stored) {
        console.warn(
          `[RefData] hub unreachable at boot (${err?.message}); serving existing mirror at ${stored}`
        );
        this.lastKnownVersion = stored;
      } else {
        throw new Error(
          `[RefData] hub unreachable on first-ever boot and no local mirror exists: ${err?.message}`
        );
      }
    }
  }

  public startPolling(): void {
    if (this.timer) return;
    const ms = parseInt(process.env.REF_VERSION_POLL_MS || "300000", 10);
    this.timer = setInterval(() => {
      this.pollOnce().catch(() => {
        /* handled inside pollOnce */
      });
    }, ms);
    // Don't keep the event loop alive solely for the poll.
    this.timer.unref?.();
    console.log(`[RefData] version poll started (every ${ms} ms)`);

    // One early clerk-proc healing sweep after boot (restarts shouldn't have to wait
    // a full poll interval to repair enrichments that failed before the restart).
    const bootSweep = setTimeout(() => {
      if (AppDataSource.isInitialized) {
        this.clerkProcs.retryUnresolved(AppDataSource).catch(() => {});
      }
    }, 30_000);
    bootSweep.unref?.();
  }

  public stopPolling(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async pollOnce(): Promise<void> {
    try {
      const { dataVersion } = await this.client.getVersion();
      if (dataVersion !== this.lastKnownVersion) {
        console.log(`[RefData] dataVersion changed ${this.lastKnownVersion} → ${dataVersion}; re-mirroring`);
        await this.mirror.sync();
        this.lastKnownVersion = dataVersion;
      }
      // Piggyback the clerk-proc healing sweep on the same cadence: re-enrich phrases
      // whose background resolution/translation failed transiently (bounded, no-op when
      // there's nothing to heal).
      if (AppDataSource.isInitialized) {
        await this.clerkProcs.retryUnresolved(AppDataSource);
      }
    } catch (err: any) {
      console.warn(`[RefData] version poll failed (stale-while-error): ${err?.message}`);
    }
  }

  private async readStoredVersion(): Promise<string | null> {
    if (!AppDataSource.isInitialized) {
      await initializeDatabase();
    }
    const rows = await AppDataSource.query(
      `SELECT "dataVersion" FROM "ref_sync_state" WHERE "id" = 1`
    );
    return rows[0]?.dataVersion ?? null;
  }
}
