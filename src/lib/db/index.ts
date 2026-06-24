import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import type { LibSQLDatabase } from "drizzle-orm/libsql"
import * as schema from "./schema"

let _db: LibSQLDatabase<typeof schema> | null = null

export async function getDb(): Promise<LibSQLDatabase<typeof schema>> {
  if (_db) return _db

  const client = createClient({
    url: "file:privacy.db",
  })
  _db = drizzle(client, { schema })
  return _db
}

export * from "./schema"
