/**
 * Executes sql/create_whatsapp_sessions_per_tenant.sql against SQL_HOST_DEFAULT.
 * CREATE TABLE IF NOT EXISTS only — no drops/deletes.
 *
 * Usage from repo root: npx ts-node sql/run-create-whatsapp-sessions.ts
 */
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import mysql from "mysql2/promise";

dotenv.config();

async function main(): Promise<void> {
  const cwd = process.cwd();
  const sqlPath = path.join(cwd, "sql", "create_whatsapp_sessions_per_tenant.sql");
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
    multipleStatements: true,
    connectTimeout: 30000,
    ...sslOpts,
  });

  try {
    await conn.query(sql);
    console.log(
      "Done: CREATE TABLE IF NOT EXISTS whatsapp_sessions ran for kasr-el-ainy, kasr-el-ainy-cts, masr-el-dawly, fayoum-university-ns.",
    );
  } finally {
    await conn.end();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
