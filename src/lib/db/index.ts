import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { drizzle as drizzleD1 } from "drizzle-orm/d1"
import type { LibSQLDatabase } from "drizzle-orm/libsql"
import * as schema from "./schema"

let _db: LibSQLDatabase<typeof schema> | null = null

export async function getDb(): Promise<LibSQLDatabase<typeof schema>> {
  if (_db) return _db

  try {
    // Use variable to prevent Vite from statically analyzing this import
    const cfModule = "cloudflare:workers"
    const { env } = await import(/* @vite-ignore */ cfModule)
    const d1Db = (env as { DB?: D1Database }).DB
    if (d1Db) {
      _db = drizzleD1(d1Db, { schema }) as unknown as LibSQLDatabase<
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
