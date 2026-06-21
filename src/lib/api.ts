import { createServerFn } from "@tanstack/react-start"
import { db, companies } from "./db"
import { eq } from "drizzle-orm"

export const getCompaniesFn = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const data = await db.select().from(companies)
      return data
    } catch (error) {
      console.error("Failed to fetch companies:", error)
      throw new Error("Failed to fetch companies")
    }
  }
)

export const getCompanyByKeyFn = createServerFn({ method: "GET" })
  .validator((key: string) => key)
  .handler(async ({ data: key }) => {
    try {
      const rows = await db
        .select()
        .from(companies)
        .where(eq(companies.companyKey, key))
        .limit(1)
      return rows[0] || null
    } catch (error) {
      console.error(`Failed to fetch company with key ${key}:`, error)
      throw new Error(`Failed to fetch company: ${key}`)
    }
  })
