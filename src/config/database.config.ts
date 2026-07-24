import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { HospitalEntity } from "../hospital/hospital.mDbSchema";
import { DiagnosisEntity } from "../diagnosis/diagnosis.mDbSchema";
import { ProcCptEntity } from "../procCpt/procCpt.mDbSchema";
import { MainDiagEntity } from "../mainDiag/mainDiag.mDbSchema";
import { CalSurgEntity } from "../calSurg/calSurg.mDbSchema";
import { ClerkProcEntity } from "../clerkProc/clerkProc.mDbSchema";
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
import { ConsumableEntity } from "../consumables/consumables.mDbSchema";
import { EquipmentEntity } from "../equipment/equipment.mDbSchema";
import { PositionEntity } from "../positions/positions.mDbSchema";
import { ApproachEntity } from "../approaches/approaches.mDbSchema";
import { RegionEntity } from "../regions/regions.mDbSchema";
import { ClinicalSubEntity } from "../clinicalSub/clinicalSub.mDbSchema";
import { WhatsappSessionEntity } from "../waBot/whatsappSession.mDbSchema";
import { DepartmentEntity } from "../departments/department.mDbSchema";
import { LectureTopicEntity } from "../lecture/lectureTopic.mDbSchema";
import { InstitutionEntity } from "../institution/institution.mDbSchema";
import { PendingSignupEntity } from "../pendingSignup/pendingSignup.mDbSchema";
import { DemoRequestEntity } from "../demoRequest/demoRequest.mDbSchema";
import { LoginEventEntity } from "../loginEvents/loginEvent.mDbSchema";
import { PublicSearchSessionEntity } from "../publicSearch/publicSearchSession.mDbSchema";

dotenv.config();

// Single-institution (KA spoke) database: the dedicated `ka-institute` Postgres service
// (env PSQL_*). This is the ONE and ONLY application datasource — the former multi-tenant
// per-institution pool and the defaultdb registry are gone. Migrations live in
// src/migrations-ka/ (git-tracked) and are run via `npm run db:ka:*`.
const PEM_MARKER = "BEGIN CERTIFICATE";

/**
 * Resolve the Postgres CA, tolerant of how it was provided (PaaS env-var setups are fiddly):
 *   - PSQL_CA_CERT_B64 — base64 of the ca.pem; if someone pasted the raw PEM here instead,
 *     we detect the marker and use it as-is rather than base64-decoding garbage.
 *   - PSQL_CA_CERT     — raw PEM text.
 *   - SSL_CA_PATH      — file path (local dev; the .pem is gitignored so absent on Railway).
 * Whitespace is trimmed. Returns undefined if nothing decodes to a real certificate.
 */
function resolvePgCa(): string | undefined {
  const b64 = process.env.PSQL_CA_CERT_B64?.trim();
  const raw = process.env.PSQL_CA_CERT?.trim();
  let ca: string | undefined;
  if (b64) {
    ca = b64.includes(PEM_MARKER) ? b64 : Buffer.from(b64, "base64").toString("utf8");
  } else if (raw) {
    ca = raw.includes(PEM_MARKER) ? raw : Buffer.from(raw, "base64").toString("utf8");
  } else if (process.env.SSL_CA_PATH) {
    const resolved = path.resolve(process.cwd(), process.env.SSL_CA_PATH);
    if (fs.existsSync(resolved)) ca = fs.readFileSync(resolved, "utf8");
  }
  if (ca && !ca.includes(PEM_MARKER)) {
    console.warn(`[DB] PSQL CA is set but the decoded value is not a PEM certificate (len ${ca.length}) — ignoring.`);
    return undefined;
  }
  return ca;
}

function getDbConfig(): DataSourceOptions {
  const ca = resolvePgCa();
  // Escape hatch: PSQL_SSL_NO_VERIFY=true keeps the connection ENCRYPTED but skips CA
  // verification (last resort if a PaaS keeps mangling the cert). Prefer a valid CA.
  const noVerify = process.env.PSQL_SSL_NO_VERIFY === "true";
  const sslOpts = ca
    ? { ssl: { ca, rejectUnauthorized: !noVerify } }
    : noVerify
      ? { ssl: { rejectUnauthorized: false } }
      : {};
  console.log(
    ca
      ? `[DB] Postgres CA loaded (${ca.length} bytes); rejectUnauthorized=${!noVerify}`
      : `[DB] Postgres CA NOT loaded; ssl=${noVerify ? "encrypted-no-verify" : "none"}`
  );

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
      MainDiagEntity,
      CalSurgEntity,
      ClerkProcEntity,
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
      ConsumableEntity,
      EquipmentEntity,
      PositionEntity,
      ApproachEntity,
      RegionEntity,
      ClinicalSubEntity,
      WhatsappSessionEntity,
      DepartmentEntity,
      LectureTopicEntity,
      InstitutionEntity,
      PendingSignupEntity,
      DemoRequestEntity,
      LoginEventEntity,
      PublicSearchSessionEntity,
    ],
    migrations: [
      __dirname + "/../migrations-ka/*.ts",
    ],
    subscribers: [],
    extra: {
      // Pool cap must fit the SERVER's limit: the staging Aiven plan has
      // max_connections=15 (~12 usable after reserved slots), shared with DBeaver,
      // Aiven's management agent and pg_cron. max 20 legally over-opened the pool and
      // Postgres refused with "sorry, too many clients already" under fan-out load.
      // Excess requests queue in the pool instead of over-connecting.
      max: parseInt(process.env.PSQL_POOL_MAX || "8", 10),
    },
    ...sslOpts,
  };
}

// Create and export the DataSource instance.
// This is the single application datasource (the KA `ka-institute` database). In
// single-institution mode, every request and service resolves to this one connection.
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
  // NB: INSTITUTION_ID / INSTITUTION_* env vars are no longer required — the institution
  // (id + feature flags) is a DB row (`institutions` table), loaded by institution.service.
  // Those env vars are now inert and may be pruned from env files at the operator's discretion.
  const required = [
    "PSQL_HOST",
    "PSQL_PORT",
    "PSQL_DB_NAME",
    "PSQL_USERNAME",
    "PSQL_PASSWORD",
    "SSL_CA_PATH",
  ];
  const missing = required.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missing.join(", ")}`
    );
  }
}
