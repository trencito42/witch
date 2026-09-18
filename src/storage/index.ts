import "server-only";
import { mkdir, readFile, unlink, writeFile, stat, rm } from "node:fs/promises";
import path from "node:path";
import { getEnv } from "@/lib/env";

export interface StorageAdapter {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  deletePrefix(prefix: string): Promise<void>;
}

function assertSafeKey(key: string) {
  if (!key || key.includes("..") || key.startsWith("/") || key.includes("\\")) {
    throw new Error("Invalid storage key");
  }
}

class LocalStorage implements StorageAdapter {
  constructor(private root: string) {}

  private resolve(key: string) {
    assertSafeKey(key);
    const full = path.resolve(this.root, key);
    const root = path.resolve(this.root);
    if (!full.startsWith(root + path.sep) && full !== root) {
      throw new Error("Invalid storage key");
    }
    return full;
  }

  async put(key: string, data: Buffer) {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
  }

  async get(key: string) {
    try {
      return await readFile(this.resolve(key));
    } catch {
      return null;
    }
  }

  async delete(key: string) {
    try {
      await unlink(this.resolve(key));
    } catch {
      // already gone
    }
  }

  async deletePrefix(prefix: string) {
    const safe = prefix.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
    if (!safe || safe.includes("..")) throw new Error("Invalid storage prefix");
    const full = this.resolve(safe);
    await rm(full, { recursive: true, force: true });
  }
}

let adapter: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!adapter) {
    adapter = new LocalStorage(getEnv().STORAGE_PATH);
  }
  return adapter;
}

export function snapshotKey(input: {
  organizationId: string;
  siteId: string;
  snapshotId: string;
  kind: "desktop" | "mobile" | "diff";
}) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${input.organizationId}/${input.siteId}/${year}/${month}/${input.kind}-${input.snapshotId}.webp`;
}

export async function storageUsageBytes(root = getEnv().STORAGE_PATH): Promise<number> {
  const { readdir } = await import("node:fs/promises");
  async function walk(dir: string): Promise<number> {
    let total = 0;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return 0;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) total += await walk(full);
      else {
        const info = await stat(full);
        total += info.size;
      }
    }
    return total;
  }
  return walk(root);
}
