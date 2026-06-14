import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

/**
 * ReferenceDataSource — pooled connection to defaultdb for SHARED REFERENCE DATA
 * (diagnoses, main_diags, departments, and their join tables).
 *
 * Deliberately registers NO entities and runs raw parameterized SQL. This keeps it
 * decoupled from the ORM entity set on DefaultDbDataSource (which maps tenant/registry
 * tables and includes MySQL-typed entities incompatible with these reads), and matches
 * the fact that the reference tables are managed by migrations, not entities.
 */
function getReferenceDbConfig(): DataSourceOptions {
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
    entities: [],
    migrations: [],
    subscribers: [],
    extra: { max: 10 },
    ...sslOpts,
  };
}

export const ReferenceDataSource = new DataSource(getReferenceDbConfig());

/** Ensure the reference connection is initialized (idempotent). */
export async function ensureReferenceDbInitialized(): Promise<void> {
  if (!ReferenceDataSource.isInitialized) {
    await ReferenceDataSource.initialize();
  }
}

/** Close the reference connection (for graceful shutdown). */
export async function closeReferenceDatabase(): Promise<void> {
  try {
    if (ReferenceDataSource.isInitialized) {
      await ReferenceDataSource.destroy();
      console.log("✅ ReferenceDB connection closed");
    }
  } catch (error: any) {
    console.error("❌ Error closing ReferenceDB connection:", error.message);
  }
}
