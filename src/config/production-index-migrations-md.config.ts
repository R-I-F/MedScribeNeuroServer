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
    type: "postgres",
    host: process.env.PSQL_HOST_DEFAULT!,
    port: parseInt(process.env.PSQL_PORT_DEFAULT || "5432", 10),
    username: process.env.PSQL_USERNAME_DEFAULT!,
    password: process.env.PSQL_PASSWORD_DEFAULT!,
    database: process.env.SQL_DB_DEF_NAME_MD!,
    synchronize: false,
    logging: ["error", "warn", "migration"],
    entities: [],
    migrations: [
      __dirname + "/../migrations/1735000110001-AddCalSurgsProcDateIndex.ts",
      __dirname + "/../migrations/1735000110002-AddEventsDateTimeIndex.ts",
      __dirname + "/../migrations/1735000110003-AddEventAttendanceCandidateIdIndex.ts",
      __dirname + "/../migrations/1735000110004-AddSubmissionsDashboardIndexes.ts",
    ],
    subscribers: [],
    extra: {
      max: 5,
    },
    ...sslOpts,
  };
}

export const ProductionIndexMigrationsMdDataSource = new DataSource(
  getProductionIndexMigrationsMdConfig()
);
