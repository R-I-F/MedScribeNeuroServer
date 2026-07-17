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

dotenv.config();

/**
 * Migration runner DataSource for the KA institute database (`ka-institute` on the
 * dedicated staging Aiven service — env `PSQL_*`, NOT the legacy `PSQL_*_DEFAULT`).
 *
 * Entity list = the unified tenant schema (the union of database.config.ts and
 * datasource.manager.ts lists; DepartmentEntity dropped as unused). Migrations live
 * in src/migrations-ka/ (git-tracked): the generated InitKaSchema + hand-written
 * seeds. The legacy MySQL-flavored 1735* migrations do NOT run on Postgres and are
 * not referenced here.
 *
 * ⚠️ Staging only — run via `npm run db:ka:*` (wired through dotenv -e .env.staging).
 */
function getKaMigrationsConfig(): DataSourceOptions {
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
    synchronize: false,
    logging: ["error", "warn", "migration"],
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
    ],
    migrations: [__dirname + "/../migrations-ka/*.ts"],
    subscribers: [],
    extra: { max: 5 },
    ...sslOpts,
  };
}

export const KaMigrationsDataSource = new DataSource(getKaMigrationsConfig());
