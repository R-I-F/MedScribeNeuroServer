import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

/**
 * DefaultDB DataSource - Connects to defaultdb on Aiven (SQL_*_DEFAULT)
 * Used for: institutions table, bootstrap connection for institution metadata
 * Requires SSL (SSL_CA_PATH) for Aiven connection
 */
function getDefaultDbConfig(): DataSourceOptions {
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
    database: process.env.SQL_DB_NAME_DEFAULT || "defaultdb",
    synchronize: false,
    logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    entities: [__dirname + "/../institution/institution.mDbSchema.ts"],
    migrations: [__dirname + "/../migrations/1735000060000-CreateInstitutionsTable.ts"],
    subscribers: [],
    connectTimeout: 10000,
    extra: {
      connectionLimit: 10,
    },
    ...sslOpts,
  };
}

export const DefaultDbDataSource = new DataSource(getDefaultDbConfig());
