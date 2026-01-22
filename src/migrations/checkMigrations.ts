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
    migrations: [],
  };
  return new DataSource(dbConfig);
}

async function checkMigrations() {
  // Only run if executed directly, not when imported
  if (require.main !== module) {
    return;
  }

  const migrationDataSource = createMigrationDataSource();
  
  try {
    console.log("🔄 Initializing database connection...");
    await migrationDataSource.initialize();
    console.log("✅ Database connection established");

    // Check if migrations table exists
    const queryRunner = migrationDataSource.createQueryRunner();
    const migrationsTableExists = await queryRunner.hasTable("migrations");
    
    if (migrationsTableExists) {
      console.log("\n📋 Checking migration status...");
      const executedMigrations = await migrationDataSource.query(
        "SELECT * FROM migrations ORDER BY timestamp DESC"
      );
      
      console.log(`\n✅ Found ${executedMigrations.length} executed migration(s):`);
      executedMigrations.forEach((migration: any) => {
        console.log(`   - ${migration.name} (timestamp: ${migration.timestamp})`);
      });
    } else {
      console.log("\n⚠️  Migrations table does not exist - no migrations have been run yet");
    }

    await queryRunner.release();
    await migrationDataSource.destroy();
    console.log("\n✅ Database connection closed");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
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
  checkMigrations();
}
