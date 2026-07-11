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
import { ClinicalSubEntity } from "../clinicalSub/clinicalSub.mDbSchema";
import { WhatsappSessionEntity } from "../waBot/whatsappSession.mDbSchema";
import { DepartmentEntity } from "../departments/department.mDbSchema";
import { LectureTopicEntity } from "../lecture/lectureTopic.mDbSchema";

dotenv.config();

// Single-institution (KA spoke) database: the dedicated `ka-institute` Postgres service
// (env PSQL_*). This is the ONE and ONLY application datasource — the former multi-tenant
// per-institution pool and the defaultdb registry are gone. Migrations live in
// src/migrations-ka/ (git-tracked) and are run via `npm run db:ka:*`.
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
    type: "postgres",
    host: process.env.PSQL_HOST!,
    port: parseInt(process.env.PSQL_PORT || "5432", 10),
    username: process.env.PSQL_USERNAME!,
    password: process.env.PSQL_PASSWORD!,
    database: process.env.PSQL_DB_NAME || "ka-institute",
    synchronize: false, // NEVER set to true in production - use migrations instead
    logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
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
      ClinicalSubEntity,
      WhatsappSessionEntity,
      DepartmentEntity,
      LectureTopicEntity,
    ],
    migrations: [
      __dirname + "/../migrations-ka/*.ts",
    ],
    subscribers: [],
    extra: {
      max: 20,
    },
    ...sslOpts,
  };
}

// Create and export the DataSource instance.
// This is the single application datasource (the KA `ka-institute` database). In
// single-institution mode, DataSourceManager.getDataSource() and every request resolve here.
export const AppDataSource = new DataSource(getDbConfig());

// Initialize database connection
export async function initializeDatabase(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("✅ PostgreSQL connection established successfully");
    }
  } catch (error: any) {
    console.error("❌ Error connecting to PostgreSQL:", error.message);
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

// Close database connection
export async function closeDatabase(): Promise<void> {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("✅ PostgreSQL connection closed");
    }
  } catch (error: any) {
    console.error("❌ Error closing PostgreSQL connection:", error.message);
    throw new Error(`Database disconnection failed: ${error.message}`);
  }
}

// Validate environment variables for the single-institution (KA spoke) connection.
export function validateDatabaseConfig(): void {
  const required = [
    "PSQL_HOST",
    "PSQL_PORT",
    "PSQL_DB_NAME",
    "PSQL_USERNAME",
    "PSQL_PASSWORD",
    "SSL_CA_PATH",
    "INSTITUTION_ID",
  ];
  const missing = required.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missing.join(", ")}`
    );
  }
}
