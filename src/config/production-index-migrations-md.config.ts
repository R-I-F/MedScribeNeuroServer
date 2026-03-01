import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

/**
 * Production MD DB - for running INDEX-ONLY migrations (SQL_*_DEFAULT + SQL_DB_DEF_NAME_MD).
 * Only the four "Add*Index" migrations are registered. No table creation, no data changes.
 */
function getProductionIndexMigrationsMdConfig(): DataSourceOptions {
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
    database: process.env.SQL_DB_DEF_NAME_MD!,
    synchronize: false,
    logging: ["error", "warn", "migration"],
    entities: [],
    // Only index migrations - adds indexes only, no table/data changes.
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

export const ProductionIndexMigrationsMdDataSource = new DataSource(
  getProductionIndexMigrationsMdConfig()
);
