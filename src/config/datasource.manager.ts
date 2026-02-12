import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import * as fs from "fs";
import * as path from "path";
import { getInstitutionById } from "../institution/institution.service";
import { HospitalEntity } from "../hospital/hospital.mDbSchema";
import { DiagnosisEntity } from "../diagnosis/diagnosis.mDbSchema";
import { ProcCptEntity } from "../procCpt/procCpt.mDbSchema";
import { ArabProcEntity } from "../arabProc/arabProc.mDbSchema";
import { MainDiagEntity } from "../mainDiag/mainDiag.mDbSchema";
import { CalSurgEntity } from "../calSurg/calSurg.mDbSchema";
import { CandidateEntity } from "../cand/cand.mDbSchema";
import { SupervisorEntity } from "../supervisor/supervisor.mDbSchema";
import { InstituteAdminEntity } from "../instituteAdmin/instituteAdmin.mDbSchema";
import { SuperAdminEntity } from "../superAdmin/superAdmin.mDbSchema";
import { SubmissionEntity } from "../sub/sub.mDbSchema";
import { LectureEntity } from "../lecture/lecture.mDbSchema";
import { JournalEntity } from "../journal/journal.mDbSchema";
import { ConfEntity } from "../conf/conf.mDbSchema";
import { EventEntity } from "../event/event.mDbSchema";
import { EventAttendanceEntity } from "../event/eventAttendance.mDbSchema";
import { PasswordResetTokenEntity } from "../passwordReset/passwordReset.mDbSchema";
import { ClerkEntity } from "../clerk/clerk.mDbSchema";
import { AdditionalQuestionEntity } from "../additionalQuestions/additionalQuestions.mDbSchema";
import { ConsumableEntity } from "../consumables/consumables.mDbSchema";
import { EquipmentEntity } from "../equipment/equipment.mDbSchema";
import { PositionEntity } from "../positions/positions.mDbSchema";
import { ApproachEntity } from "../approaches/approaches.mDbSchema";
import { RegionEntity } from "../regions/regions.mDbSchema";

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
        HospitalEntity,
        DiagnosisEntity,
        ProcCptEntity,
        ArabProcEntity,
        MainDiagEntity,
        CalSurgEntity,
        CandidateEntity,
        SupervisorEntity,
        InstituteAdminEntity,
        SuperAdminEntity,
        SubmissionEntity,
        LectureEntity,
        JournalEntity,
        ConfEntity,
        EventEntity,
        EventAttendanceEntity,
        PasswordResetTokenEntity,
        ClerkEntity,
        AdditionalQuestionEntity,
        ConsumableEntity,
        EquipmentEntity,
        PositionEntity,
        ApproachEntity,
        RegionEntity,
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
