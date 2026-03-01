import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

/**
 * Backup DB DataSource - Connects to backup Kasr El Ainy DB (SQL_*_B_KA).
 * Used ONLY for running migrations against the backup database so production is not affected.
 * Use SSL only when SSL_CA_PATH_B_KA is set (so production SSL_CA_PATH is not applied to backup).
 */
function getBackupDbConfig(): DataSourceOptions {
  const sslPath = process.env.SSL_CA_PATH_B_KA;
  const sslOpts =
    sslPath && fs.existsSync(path.resolve(process.cwd(), sslPath))
      ? {
          ssl: {
            ca: fs.readFileSync(path.resolve(process.cwd(), sslPath), "utf8"),
            rejectUnauthorized: true,
          },
        }
      : {};

  return {
    type: "mysql",
    host: process.env.SQL_HOST_B_KA!,
    port: parseInt(process.env.SQL_PORT_B_KA || "3306", 10),
    username: process.env.SQL_USERNAME_B_KA!,
    password: process.env.SQL_PASSWORD_B_KA!,
    database: process.env.SQL_DB_NAME_B_KA!,
    synchronize: false,
    logging: ["error", "warn", "migration"],
    entities: [],
    // Only index migrations - backup DB already has tables; we only add indexes.
    migrations: [
      __dirname + "/../migrations/1735000110001-AddCalSurgsProcDateIndex.ts",
      __dirname + "/../migrations/1735000110002-AddEventsDateTimeIndex.ts",
      __dirname + "/../migrations/1735000110003-AddEventAttendanceCandidateIdIndex.ts",
      __dirname + "/../migrations/1735000110004-AddSubmissionsDashboardIndexes.ts",
    ],
    subscribers: [],
    connectTimeout: 10000,
    extra: {
      connectionLimit: 5,
    },
    ...sslOpts,
  };
}

export const BackupDbDataSource = new DataSource(getBackupDbConfig());
