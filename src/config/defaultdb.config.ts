import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { InstitutionEntity } from "../institution/institution.mDbSchema";
import { WaSessionRoutingEntity } from "../waBot/waSessionRouting.mDbSchema";

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
    type: "postgres",
    host: process.env.PSQL_HOST_DEFAULT!,
    port: parseInt(process.env.PSQL_PORT_DEFAULT || "5432", 10),
    username: process.env.PSQL_USERNAME_DEFAULT!,
    password: process.env.PSQL_PASSWORD_DEFAULT!,
    database: process.env.PSQL_DB_NAME_DEFAULT || "defaultdb",
    synchronize: false,
    logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    entities: [InstitutionEntity, WaSessionRoutingEntity],
    migrations: [
      __dirname + "/../migrations/1735000060000-CreateInstitutionsTable.ts",
      __dirname + "/../migrations/1735000060001-AddDepartmentToInstitutions.ts",
    ],
    subscribers: [],
    extra: {
      max: 20,
    },
    ...sslOpts,
  };
}

export const DefaultDbDataSource = new DataSource(getDefaultDbConfig());

// Close defaultdb connection (for graceful shutdown)
export async function closeDefaultDatabase(): Promise<void> {
  try {
    if (DefaultDbDataSource.isInitialized) {
      await DefaultDbDataSource.destroy();
      console.log("✅ DefaultDB connection closed");
    }
  } catch (error: any) {
    console.error("❌ Error closing DefaultDB connection:", error.message);
    throw new Error(`DefaultDB disconnection failed: ${error.message}`);
  }
}
