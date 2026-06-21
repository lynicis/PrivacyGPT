import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import * as schema from "./schema"

// Use process.env.TURSO_CONNECTION_URL for production (Turso) and local file for development.
// During build time on Vercel, if the env variable isn't present, it will fallback to local file database.
const client = createClient({
  url: process.env.TURSO_CONNECTION_URL || "file:privacy.db",
})

export const db = drizzle(client, { schema })
export * from "./schema"
