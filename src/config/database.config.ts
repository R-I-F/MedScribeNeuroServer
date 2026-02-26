import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
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

dotenv.config();

// Fallback DB = first institution on Aiven (kasr-el-ainy). Used when no institution context.
// Multi-tenant: DataSourceManager loads institutions from defaultdb (institutions table).
// Institution DB migrations: use runMigrations.ts (SQL_*_KA) or run-defaultdb-migrations.ts.
function getDbConfig(): DataSourceOptions {
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

  return {
    type: "mysql",
    host: process.env.SQL_HOST_DEFAULT!,
    port: parseInt(process.env.SQL_PORT_DEFAULT || "3306", 10),
    username: process.env.SQL_USERNAME_DEFAULT!,
    password: process.env.SQL_PASSWORD_DEFAULT!,
    database: process.env.SQL_DB_DEF_NAME_KA || "kasr-el-ainy",
    synchronize: false, // NEVER set to true in production - use migrations instead
    logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"], // NODE_ENV is optional
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
    migrations: [
      __dirname + "/../migrations/*.ts",
    ],
    subscribers: [],
    connectTimeout: 10000, // 10 seconds as recommended
    extra: {
      connectionLimit: 20, // Connection pool limit
    },
    ...sslOpts,
  };
}

// Create and export the DataSource instance
// NOTE: This AppDataSource is fallback when no institution context (e.g. registerCand without institutionId).
// For multi-tenant support, use DataSourceManager.getInstance().getDataSource(institutionId)
// to get institution-specific DataSource instances.
export const AppDataSource = new DataSource(getDbConfig());

// Initialize database connection
export async function initializeDatabase(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("✅ MariaDB connection established successfully");
    }
  } catch (error: any) {
    console.error("❌ Error connecting to MariaDB:", error.message);
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

// Close database connection
export async function closeDatabase(): Promise<void> {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("✅ MariaDB connection closed");
    }
  } catch (error: any) {
    console.error("❌ Error closing MariaDB connection:", error.message);
    throw new Error(`Database disconnection failed: ${error.message}`);
  }
}

// Validate environment variables for defaultdb bootstrap and fallback connection
export function validateDatabaseConfig(): void {
  const required = [
    "SQL_HOST_DEFAULT",
    "SQL_PORT_DEFAULT",
    "SQL_DB_NAME_DEFAULT",
    "SQL_USERNAME_DEFAULT",
    "SQL_PASSWORD_DEFAULT",
    "SSL_CA_PATH",
  ];
  const missing = required.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missing.join(", ")}`
    );
  }
}
