"use server"

import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { getDb, companies } from "./db"
import { changelogs, snapshots } from "./db/schema"
import { eq, desc } from "drizzle-orm"

export const getCompaniesFn = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const db = await getDb()
      const data = await db.select().from(companies)
      return data
    } catch (error) {
      console.error("Failed to fetch companies:", error)
      throw new Error(
        error instanceof Error
          ? `Failed to fetch companies: ${error.message}`
          : "Failed to fetch companies"
      )
    }
  }
)

export const getCompanyByKeyFn = createServerFn({ method: "GET" })
  .validator((key: string) => key)
  .handler(async ({ data: key }) => {
    try {
      const db = await getDb()
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

export const getChangelogsFn = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const db = await getDb()
      const rows = await db
        .select({
          id: changelogs.id,
          companyId: changelogs.companyId,
          detectedAt: changelogs.detectedAt,
          beforeText: changelogs.beforeText,
          afterText: changelogs.afterText,
          diffHtml: changelogs.diffHtml,
          status: changelogs.status,
          reviewNotes: changelogs.reviewNotes,
          reviewedAt: changelogs.reviewedAt,
          companyName: companies.companyName,
          companyKey: companies.companyKey,
        })
        .from(changelogs)
        .leftJoin(companies, eq(changelogs.companyId, companies.id))
        .orderBy(desc(changelogs.detectedAt))
      return rows
    } catch (error) {
      console.error("Failed to fetch changelogs:", error)
      throw new Error("Failed to fetch changelogs")
    }
  }
)

export const getSnapshotCountsFn = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const db = await getDb()
      const rows = await db
        .select({
          companyId: snapshots.companyId,
          companyName: companies.companyName,
          companyKey: companies.companyKey,
          fetchedAt: snapshots.fetchedAt,
          contentHash: snapshots.contentHash,
        })
        .from(snapshots)
        .leftJoin(companies, eq(snapshots.companyId, companies.id))
        .orderBy(desc(snapshots.fetchedAt))
      return rows
    } catch (error) {
      console.error("Failed to fetch snapshots:", error)
      throw new Error("Failed to fetch snapshots")
    }
  }
)

export function checkAdminAuth(headers: Headers) {
  const authHeader = headers.get("authorization")

  const username = process.env.ADMIN_USERNAME || "admin"
  const password = process.env.ADMIN_PASSWORD || "adminpassword"

  const expectedAuth =
    "Basic " + Buffer.from(`${username}:${password}`).toString("base64")

  if (!authHeader || authHeader !== expectedAuth) {
    throw new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin Portal"',
      },
    })
  }
  return { success: true }
}

export const checkAdminAuthFn = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const headers = getRequestHeaders()
      return checkAdminAuth(headers)
    } catch (error) {
      if (error instanceof Response) {
        throw error
      }
      console.error("Auth check failed:", error)
      throw new Error("Internal Server Error during auth check")
    }
  }
)

export const reviewChangelogFn = createServerFn({ method: "POST" })
  .validator((input: { id: number; reviewNotes: string }) => input)
  .handler(async ({ data }) => {
    try {
      // Check auth
      await checkAdminAuthFn()

      const db = await getDb()

      // 1. Update the changelog status
      await db
        .update(changelogs)
        .set({
          status: "reviewed",
          reviewNotes: data.reviewNotes,
          reviewedAt: new Date().toISOString(),
        })
        .where(eq(changelogs.id, data.id))

      return { success: true }
    } catch (error) {
      console.error(`Failed to review changelog ${data.id}:`, error)
      throw new Error(`Failed to review changelog: ${data.id}`)
    }
  })

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export const getRssFeedFn = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const db = await getDb()
      const rows = await db
        .select({
          id: changelogs.id,
          detectedAt: changelogs.detectedAt,
          status: changelogs.status,
          companyName: companies.companyName,
        })
        .from(changelogs)
        .leftJoin(companies, eq(changelogs.companyId, companies.id))
        .orderBy(desc(changelogs.detectedAt))
        .limit(50)

      const now = new Date().toUTCString()
      const siteUrl = "https://privacygpt.lynicis.dev"

      const items = rows
        .map((entry) => {
          const pubDate = new Date(entry.detectedAt).toUTCString()
          const title = `Policy change detected: ${entry.companyName}`
          const description = `Privacy policy change detected for ${entry.companyName}. Status: ${entry.status === "reviewed" ? "Reviewed" : "Pending review"}.`

          return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(siteUrl + "/changelog")}</link>
      <guid isPermaLink="false">privacygpt-changelog-${entry.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
      <category>${escapeXml(entry.companyName || "Unknown")}</category>
    </item>`
        })
        .join("\n")

      return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PrivacyGPT — Policy Change Log</title>
    <link>${siteUrl}/changelog</link>
    <description>Automated tracking of privacy policy changes across major AI companies.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>`
    } catch (error) {
      console.error("Failed to generate RSS feed:", error)
      throw new Error("Failed to generate RSS feed")
    }
  }
)

