import "reflect-metadata";
import { DataSource } from "typeorm";
import { AppDataSource, initializeDatabase, closeDatabase } from "./database.config";

/**
 * DataSource Manager — single-institution (KA spoke) shim.
 *
 * The former multi-tenant design pooled one DataSource per institution (keyed by UUID,
 * loaded from the defaultdb institutions registry). In single-institution mode there is
 * exactly one database — the KA `AppDataSource` from env — so every call resolves to it.
 *
 * The class shape, the singleton accessor, and the method signatures are preserved so all
 * existing callers (`DataSourceManager.getInstance().getDataSource(institutionId)`, the
 * institutionResolver middleware, waSession service, graceful shutdown) keep working with
 * no changes. The `institutionId` argument is accepted and ignored.
 */
export class DataSourceManager {
  private static instance: DataSourceManager;

  private constructor() {}

  public static getInstance(): DataSourceManager {
    if (!DataSourceManager.instance) {
      DataSourceManager.instance = new DataSourceManager();
    }
    return DataSourceManager.instance;
  }

  /**
   * Return the single application DataSource (the KA database), initializing it on first use.
   * @param _institutionId - accepted and ignored (single-institution mode)
   */
  public async getDataSource(_institutionId?: string): Promise<DataSource> {
    if (!AppDataSource.isInitialized) {
      await initializeDatabase();
    }
    return AppDataSource;
  }

  /**
   * Close the single connection (graceful shutdown). Delegates to closeDatabase();
   * idempotent, so a following explicit closeDatabase() call is a safe no-op.
   */
  public async closeAll(): Promise<void> {
    await closeDatabase();
    console.log("[DataSourceManager] Connection closed");
  }

  /**
   * Active DataSources (for monitoring/debugging) — at most the single AppDataSource.
   */
  public getActiveDataSources(): Map<string, DataSource> {
    const map = new Map<string, DataSource>();
    if (AppDataSource.isInitialized) {
      map.set(process.env.INSTITUTION_ID || "static", AppDataSource);
    }
    return map;
  }
}
