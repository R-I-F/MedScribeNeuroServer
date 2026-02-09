import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

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
    __dirname + "/../hospital/hospital.mDbSchema.ts",
    __dirname + "/../diagnosis/diagnosis.mDbSchema.ts",
    __dirname + "/../procCpt/procCpt.mDbSchema.ts",
    __dirname + "/../arabProc/arabProc.mDbSchema.ts",
    __dirname + "/../mainDiag/mainDiag.mDbSchema.ts",
    __dirname + "/../calSurg/calSurg.mDbSchema.ts",
    __dirname + "/../cand/cand.mDbSchema.ts",
    __dirname + "/../supervisor/supervisor.mDbSchema.ts",
    __dirname + "/../instituteAdmin/instituteAdmin.mDbSchema.ts",
    __dirname + "/../superAdmin/superAdmin.mDbSchema.ts",
    __dirname + "/../sub/sub.mDbSchema.ts", // Added for Submissions
    __dirname + "/../lecture/lecture.mDbSchema.ts", // Added for Lectures
    __dirname + "/../journal/journal.mDbSchema.ts", // Added for Journals
    __dirname + "/../conf/conf.mDbSchema.ts", // Added for Confs
    __dirname + "/../event/event.mDbSchema.ts", // Added for Events
    __dirname + "/../event/eventAttendance.mDbSchema.ts", // Added for Event Attendance
    __dirname + "/../passwordReset/passwordReset.mDbSchema.ts", // Added for Password Reset Tokens
    __dirname + "/../clerk/clerk.mDbSchema.ts", // Added for Clerks
  ],
  migrations: [
    __dirname + "/../migrations/*.ts",
  ],
  subscribers: [],
    connectTimeout: 10000, // 10 seconds as recommended
    extra: {
      connectionLimit: 10, // Connection pool limit
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
