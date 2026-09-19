import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

async function main() {
  try {
    process.loadEnvFile?.(".env");
  } catch {
    /* optional */
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  const connection = await mysql.createConnection(url);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
      \`id\` varchar(255) NOT NULL PRIMARY KEY,
      \`applied_at\` datetime(3) NOT NULL
    )
  `);
  const [appliedRows] = await connection.query("SELECT `id` FROM `schema_migrations`");
  const applied = new Set(
    (Array.isArray(appliedRows) ? appliedRows : []).map((row) => String((row as { id: string }).id)),
  );

  async function tableExists(name: string) {
    const [rows] = await connection.query("SHOW TABLES LIKE ?", [name]);
    return Array.isArray(rows) && rows.length > 0;
  }

  async function columnExists(table: string, column: string) {
    const [rows] = await connection.query(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column],
    );
    return Array.isArray(rows) && rows.length > 0;
  }

  async function markApplied(id: string) {
    if (applied.has(id)) return;
    await connection.query("INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES (?, ?)", [
      id,
      new Date(),
    ]);
    applied.add(id);
    console.log(`recorded existing ${id}`);
  }

  if (await tableExists("user")) await markApplied("0000_init.sql");
  if (await columnExists("visual_diff", "metadata")) await markApplied("0001_monitoring_hardening.sql");
  if (await columnExists("subscription", "last_stripe_event_created")) {
    await markApplied("0002_launch_fixes.sql");
  }
  if (await columnExists("site", "visual_noise_settings")) {
    await markApplied("0003_visual_monitoring.sql");
  }
  if (await columnExists("status_page_subscriber", "confirmed_at")) {
    await markApplied("0004_status_subscriber_confirmation.sql");
  }

  const dir = path.resolve("drizzle");
  const files = (await readdir(dir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip ${file}`);
      continue;
    }
    const sql = await readFile(path.join(dir, file), "utf8");
    const statements = sql
      .split(/;\s*\n/)
      .map((part) => part.trim())
      .filter(Boolean);
    for (const statement of statements) {
      await connection.query(statement);
    }
    await connection.query("INSERT INTO `schema_migrations` (`id`, `applied_at`) VALUES (?, ?)", [
      file,
      new Date(),
    ]);
    console.log(`applied ${file}`);
  }

  await connection.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
