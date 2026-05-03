/**
 * Executes sql/create_wa_session_routing_default.sql on defaultdb (SQL_*_DEFAULT).
 * CREATE TABLE IF NOT EXISTS only.
 *
 * Usage: npx ts-node sql/run-create-wa-session-routing.ts
 */
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import mysql from "mysql2/promise";

dotenv.config();

async function main(): Promise<void> {
  const cwd = process.cwd();
  const sqlPath = path.join(cwd, "sql", "create_wa_session_routing_default.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const sslCaPath = process.env.SSL_CA_PATH;
  const sslOpts =
    sslCaPath && fs.existsSync(path.resolve(cwd, sslCaPath))
      ? {
          ssl: {
            ca: fs.readFileSync(path.resolve(cwd, sslCaPath), "utf8"),
            rejectUnauthorized: true,
          },
        }
      : {};

  const conn = await mysql.createConnection({
    host: process.env.SQL_HOST_DEFAULT!,
    port: parseInt(process.env.SQL_PORT_DEFAULT || "3306", 10),
    user: process.env.SQL_USERNAME_DEFAULT!,
    password: process.env.SQL_PASSWORD_DEFAULT!,
    database: process.env.SQL_DB_NAME_DEFAULT || "defaultdb",
    multipleStatements: true,
    connectTimeout: 30000,
    ...sslOpts,
  });

  try {
    await conn.query(sql);
    console.log(
      "Done: CREATE TABLE IF NOT EXISTS wa_session_routing on defaultdb.",
    );
  } finally {
    await conn.end();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
