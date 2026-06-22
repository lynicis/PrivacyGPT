import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { drizzle as drizzleD1 } from "drizzle-orm/d1"
import type { LibSQLDatabase } from "drizzle-orm/libsql"
import * as schema from "./schema"

let _db: LibSQLDatabase<typeof schema> | null = null

export async function getDb(): Promise<LibSQLDatabase<typeof schema>> {
  if (_db) return _db

  try {
    const mod = await import("cloudflare:workers")
    const env = mod.env as { DB?: D1Database }
    if (env.DB) {
      _db = drizzleD1(env.DB, { schema }) as unknown as LibSQLDatabase<
        typeof schema
      >
      return _db
    }
  } catch {
    // Not running in Cloudflare Workers — fall through to local SQLite
  }

  const client = createClient({
    url: "file:privacy.db",
  })
  _db = drizzle(client, { schema })
  return _db
}

export * from "./schema"
