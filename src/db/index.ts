import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pool: mysql.Pool | undefined;
  poolUri: string | undefined;
};

function createPool(uri: string) {
  return mysql.createPool({
    uri,
    waitForConnections: true,
    connectionLimit: 10,
    enableKeepAlive: true,
    timezone: "Z",
  });
}

export function getPool() {
  const uri = getEnv().DATABASE_URL;
  if (!uri) {
    throw new Error("DATABASE_URL is missing. Restart the app after updating .env.");
  }
  if (!globalForDb.pool || globalForDb.poolUri !== uri) {
    const previous = globalForDb.pool;
    globalForDb.pool = createPool(uri);
    globalForDb.poolUri = uri;
    void previous?.end();
  }
  return globalForDb.pool;
}

export const db = drizzle(getPool(), {
  schema,
  mode: "default",
});
