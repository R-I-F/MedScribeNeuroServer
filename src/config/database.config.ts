import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

// Database configuration using environment variables
const dbConfig: DataSourceOptions = {
  type: "mysql",
  host: process.env.SQL_HOST!,
  port: parseInt(process.env.SQL_PORT || "3306", 10),
  username: process.env.SQL_USERNAME!,
  password: process.env.SQL_PASSWORD!,
  database: process.env.SQL_DB_NAME!,
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
  ],
  migrations: [
    __dirname + "/../migrations/*.ts",
  ],
  subscribers: [],
  connectTimeout: 10000, // 10 seconds as recommended
  extra: {
    connectionLimit: 10, // Connection pool limit
  },
};

// Create and export the DataSource instance
export const AppDataSource = new DataSource(dbConfig);

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

// Validate environment variables
export function validateDatabaseConfig(): void {
  const requiredVars = ["SQL_HOST", "SQL_PORT", "SQL_DB_NAME", "SQL_USERNAME", "SQL_PASSWORD"];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missingVars.join(", ")}`
    );
  }
}
