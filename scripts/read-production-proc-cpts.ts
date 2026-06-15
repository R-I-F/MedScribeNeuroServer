/**
 * READ-ONLY — fetches proc_cpts from production KA MySQL database.
 * Does NOT modify anything in production.
 */
import * as mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.SQL_HOST_DEFAULT!,
    port: parseInt(process.env.SQL_PORT_DEFAULT || "3306", 10),
    user: process.env.SQL_USERNAME_DEFAULT!,
    password: process.env.SQL_PASSWORD_DEFAULT!,
    database: process.env.SQL_DB_DEF_NAME_KA!,
  });

  const [rows] = await conn.execute<any[]>(
    "SELECT id, alphaCode, numCode, title, description FROM proc_cpts ORDER BY alphaCode ASC, numCode ASC"
  );
  await conn.end();

  console.error(`Fetched ${rows.length} proc_cpts from ${process.env.SQL_DB_DEF_NAME_KA}`);
  console.log(JSON.stringify(rows, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
