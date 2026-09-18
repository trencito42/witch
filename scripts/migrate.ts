import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

async function main() {
  try {
    process.loadEnvFile?.(".env");
  } catch {
    /* optional: unquoted values in .env can fail this */
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  const connection = await mysql.createConnection(url);
  const dir = path.resolve("drizzle");
  const files = (await readdir(dir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = await readFile(path.join(dir, file), "utf8");
    const statements = sql
      .split(/;\s*\n/)
      .map((part) => part.trim())
      .filter(Boolean);
    for (const statement of statements) {
      await connection.query(statement);
    }
    console.log(`applied ${file}`);
  }

  await connection.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
