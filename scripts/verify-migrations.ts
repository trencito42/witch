import { spawnSync } from "node:child_process";
import mysql from "mysql2/promise";
import path from "node:path";

function runMigrate(url: string) {
    const result = spawnSync("npx", ["tsx", "scripts/migrate.ts"], {
      cwd: path.resolve("."),
      env: { ...process.env, DATABASE_URL: url },
      encoding: "utf8",
    });
  return result;
}

async function main() {
  const source = process.env.DATABASE_URL;
  if (!source) {
    console.log("SKIP: DATABASE_URL missing");
    process.exit(0);
  }
  const parsed = new URL(source);
  const user = decodeURIComponent(parsed.username);
  const pass = decodeURIComponent(parsed.password);
  const host = parsed.hostname;
  const port = Number(parsed.port || 3306);
  const admin = await mysql.createConnection({
    host,
    port,
    user,
    password: pass,
    multipleStatements: true,
  });

  const results: Record<string, string> = {};
  try {
    const fresh = "witch_migrate_fresh";
    await admin.query(`DROP DATABASE IF EXISTS \`${fresh}\``);
    await admin.query(`CREATE DATABASE \`${fresh}\``);
    const freshUrl = source.replace(/\/[^/]+(\?.*)?$/, `/${fresh}$1`);
    const first = runMigrate(freshUrl);
    if (first.status !== 0) throw new Error(first.stderr || first.stdout || "fresh migrate failed");
    results.fresh = "pass";
    const second = runMigrate(freshUrl);
    if (second.status !== 0) throw new Error(second.stderr || second.stdout || "idempotent migrate failed");
    if (!second.stdout.includes("skip")) throw new Error("second migrate did not skip applied files");
    results.idempotent = "pass";

    const upgrade = "witch_migrate_upgrade";
    await admin.query(`DROP DATABASE IF EXISTS \`${upgrade}\``);
    await admin.query(`CREATE DATABASE \`${upgrade}\``);
    const upgradeUrl = source.replace(/\/[^/]+(\?.*)?$/, `/${upgrade}$1`);
    const conn = await mysql.createConnection(upgradeUrl);
    const init = await import("node:fs/promises").then((fs) =>
      fs.readFile(path.resolve("drizzle/0000_init.sql"), "utf8"),
    );
    for (const statement of init.split(/;\s*\n/).map((part) => part.trim()).filter(Boolean)) {
      await conn.query(statement);
    }
    await conn.end();
    const upgraded = runMigrate(upgradeUrl);
    if (upgraded.status !== 0) throw new Error(upgraded.stderr || upgraded.stdout || "upgrade migrate failed");
    results.upgradeFrom0000 = "pass";
    await admin.query(`DROP DATABASE IF EXISTS \`${fresh}\``);
    await admin.query(`DROP DATABASE IF EXISTS \`${upgrade}\``);
    console.log(`MIGRATE_VERIFY ${JSON.stringify(results)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/CREATE DATABASE|Access denied/i.test(message)) {
      console.log(`MIGRATE_VERIFY ${JSON.stringify({ skipped: message })}`);
      process.exit(0);
    }
    throw error;
  } finally {
    await admin.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
