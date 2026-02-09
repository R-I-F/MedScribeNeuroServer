import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import * as fs from "fs";
import * as path from "path";
import { getInstitutionById } from "../institution/institution.service";

/**
 * DataSource Manager - Singleton for managing multi-tenant database connections
 *
 * Maintains a connection pool per institution for efficient resource usage.
 * Connections are reused across requests (connection pooling).
 * Institution metadata is loaded from defaultdb (institutions table).
 */
export class DataSourceManager {
  private static instance: DataSourceManager;
  private dataSources: Map<string, DataSource> = new Map();
  private connectionPromises: Map<string, Promise<DataSource>> = new Map();

  private constructor() {}

  public static getInstance(): DataSourceManager {
    if (!DataSourceManager.instance) {
      DataSourceManager.instance = new DataSourceManager();
    }
    return DataSourceManager.instance;
  }

  /**
   * Get or create DataSource for an institution
   * Uses connection pooling - connections are reused across requests
   *
   * @param institutionId - UUID of the institution
   * @returns DataSource instance for the institution
   */
  public async getDataSource(institutionId: string): Promise<DataSource> {
    // Fast path: If already connected, return immediately
    const existing = this.dataSources.get(institutionId);
    if (existing && existing.isInitialized) {
      return existing;
    }

    // If connection is in progress, wait for it (prevents duplicate connections)
    const inProgress = this.connectionPromises.get(institutionId);
    if (inProgress) {
      return inProgress;
    }

    // Create new connection (only happens once per institution)
    const connectionPromise = this.createDataSource(institutionId);
    this.connectionPromises.set(institutionId, connectionPromise);

    try {
      const dataSource = await connectionPromise;
      this.dataSources.set(institutionId, dataSource);
      this.connectionPromises.delete(institutionId);
      return dataSource;
    } catch (error) {
      this.connectionPromises.delete(institutionId);
      throw error;
    }
  }

  /**
   * Create a new DataSource for an institution
   * Uses institution metadata from defaultdb (institutions table)
   */
  private async createDataSource(institutionId: string): Promise<DataSource> {
    const institution = await getInstitutionById(institutionId);
    if (!institution) {
      throw new Error(`Institution ${institutionId} not found`);
    }

    if (!institution.isActive) {
      throw new Error(`Institution ${institutionId} is not active`);
    }

    const sslCaPath = process.env.SSL_CA_PATH;
    const sslOpts =
      sslCaPath && fs.existsSync(path.resolve(process.cwd(), sslCaPath))
        ? {
            ssl: {
              ca: fs.readFileSync(path.resolve(process.cwd(), sslCaPath), "utf8"),
              rejectUnauthorized: true,
            },
          }
        : {};

    const dataSourceOptions: DataSourceOptions = {
      type: "mysql",
      host: institution.database.host,
      port: institution.database.port,
      database: institution.database.database,
      username: institution.database.username,
      password: institution.database.password,
      entities: [
        __dirname + "/../hospital/hospital.mDbSchema.ts",
        __dirname + "/../diagnosis/diagnosis.mDbSchema.ts",
        __dirname + "/../procCpt/procCpt.mDbSchema.ts",
        __dirname + "/../arabProc/arabProc.mDbSchema.ts",
        __dirname + "/../mainDiag/mainDiag.mDbSchema.ts",
        __dirname + "/../calSurg/calSurg.mDbSchema.ts",
        __dirname + "/../cand/cand.mDbSchema.ts",
        __dirname + "/../supervisor/supervisor.mDbSchema.ts",
        __dirname + "/../instituteAdmin/instituteAdmin.mDbSchema.ts",
        __dirname + "/../superAdmin/superAdmin.mDbSchema.ts",
        __dirname + "/../sub/sub.mDbSchema.ts",
        __dirname + "/../lecture/lecture.mDbSchema.ts",
        __dirname + "/../journal/journal.mDbSchema.ts",
        __dirname + "/../conf/conf.mDbSchema.ts",
        __dirname + "/../event/event.mDbSchema.ts",
        __dirname + "/../event/eventAttendance.mDbSchema.ts",
        __dirname + "/../passwordReset/passwordReset.mDbSchema.ts",
        __dirname + "/../clerk/clerk.mDbSchema.ts",
      ],
      migrations: [__dirname + "/../migrations/*.ts"],
      synchronize: false, // NEVER set to true in production
      logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      connectTimeout: 10000, // 10 seconds
      extra: {
        connectionLimit: 10, // Max connections per institution
      },
      ...sslOpts,
    };

    const dataSource = new DataSource(dataSourceOptions);

    // Initialize connection (happens once per institution)
    if (!dataSource.isInitialized) {
      try {
        await dataSource.initialize();
        console.log(`[DataSourceManager] ✅ Connected to institution: ${institution.name} (${institution.code})`);
      } catch (error: any) {
        console.error(`[DataSourceManager] ❌ Failed to connect to institution ${institution.name}:`, error.message);
        throw new Error(`Failed to connect to institution database: ${error.message}`);
      }
    }

    return dataSource;
  }

  /**
   * Close all connections (for graceful shutdown)
   */
  public async closeAll(): Promise<void> {
    const closePromises = Array.from(this.dataSources.values()).map((ds) =>
      ds.isInitialized ? ds.destroy() : Promise.resolve()
    );
    await Promise.all(closePromises);
    this.dataSources.clear();
    this.connectionPromises.clear();
    console.log("[DataSourceManager] All connections closed");
  }

  /**
   * Get all active DataSource instances (for monitoring/debugging)
   */
  public getActiveDataSources(): Map<string, DataSource> {
    return new Map(this.dataSources);
  }
}
