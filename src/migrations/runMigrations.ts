import "reflect-metadata";
import * as dotenv from "dotenv";
import { DataSource, DataSourceOptions } from "typeorm";

dotenv.config();

// Create isolated DataSource for migration scripts to avoid interfering with server
function createMigrationDataSource(): DataSource {
  const dbConfig: DataSourceOptions = {
    type: "mysql",
    host: process.env.SQL_HOST!,
    port: parseInt(process.env.SQL_PORT || "3306", 10),
    username: process.env.SQL_USERNAME!,
    password: process.env.SQL_PASSWORD!,
    database: process.env.SQL_DB_NAME!,
    synchronize: false,
    logging: false,
    entities: [],
    migrations: [__dirname + "/*.ts"], // Load all migration files from migrations directory
  };
  return new DataSource(dbConfig);
}

async function runMigrations() {
  // Only run if executed directly, not when imported
  if (require.main !== module) {
    return;
  }

  const migrationDataSource = createMigrationDataSource();
  
  try {
    console.log("🔄 Initializing database connection...");
    await migrationDataSource.initialize();
    console.log("✅ Database connection established");

    console.log("🔄 Running pending migrations...");
    const migrations = await migrationDataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log("✅ No pending migrations found - database is up to date");
    } else {
      console.log(`✅ Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach((migration) => {
        console.log(`   - ${migration.name}`);
      });
    }

    await migrationDataSource.destroy();
    console.log("✅ Database connection closed");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Migration error:", error.message);
    if (migrationDataSource.isInitialized) {
      try {
        await migrationDataSource.destroy();
      } catch (destroyError) {
        // Ignore destroy errors
      }
    }
    process.exit(1);
  }
}

// Only execute if run directly
if (require.main === module) {
  runMigrations();
}
