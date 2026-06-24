"use server"

import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { getDb, companies } from "./db"
import { changelogs, snapshots } from "./db/schema"
import { eq, desc, and, asc, sql } from "drizzle-orm"
import type { SQL } from "drizzle-orm"
import escapeHtml from "escape-html"
import { getBlogPosts, getBlogPostBySlug } from "./blog-data"
import {
  calculateSubScores,
  calculateTotalScore,
  mapScoreToGrade,
} from "./scoring"

export async function getCompanies(
  data: {
    limit?: number
    offset?: number
    searchQuery?: string
    filterNoTraining?: boolean
    filterOptOut?: boolean
    filterNoHumanReview?: boolean
    sortBy?: string
    weights?: {
      trainingWeight: number
      optOutWeight: number
      retentionWeight: number
      deletionWeight: number
      sharingWeight: number
      humanReviewWeight: number
    }
  } = {}
): Promise<{
  companies: any[]
  totalCount: number
  stats: {
    total: number
    trainsDefault: number
    hasOptOut: number
    hasHumanReview: number
  }
  overallStats: {
    total: number
    trainsDefault: number
    hasOptOut: number
    hasHumanReview: number
  }
}> {
  try {
    const db = await getDb()
    const allRows = await db.select().from(companies)

    const weights = data.weights || {
      trainingWeight: 25,
      optOutWeight: 20,
      retentionWeight: 15,
      deletionWeight: 15,
      sharingWeight: 15,
      humanReviewWeight: 10,
    }

    // Overall stats from unfiltered data (for hero section)
    const overallStats = {
      total: allRows.length,
      trainsDefault: allRows.filter((c) => c.trainsOnDataByDefault).length,
      hasOptOut: allRows.filter((c) => c.optOutAvailable).length,
      hasHumanReview: allRows.filter((c) => c.humanReviewOfChats).length,
    }

    // Calculate scores
    let scored = allRows.map((c) => {
      const subScores = calculateSubScores(c)
      const totalScore = calculateTotalScore(subScores, weights)
      const grade = mapScoreToGrade(totalScore)
      return { ...c, subScores, totalScore, grade }
    })

    // Apply search query
    if (data.searchQuery?.trim()) {
      const q = data.searchQuery.toLowerCase()
      scored = scored.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          c.productName.toLowerCase().includes(q) ||
          c.trainsOnDataNuance.toLowerCase().includes(q)
      )
    }

    // Apply switches
    if (data.filterNoTraining) {
      scored = scored.filter((c) => !c.trainsOnDataByDefault)
    }
    if (data.filterOptOut) {
      scored = scored.filter((c) => c.optOutAvailable)
    }
    if (data.filterNoHumanReview) {
      scored = scored.filter((c) => !c.humanReviewOfChats)
    }

    // Sort
    const sortBy = data.sortBy || "score-desc"
    scored.sort((a, b) => {
      if (sortBy === "score-desc") return b.totalScore - a.totalScore
      if (sortBy === "score-asc") return a.totalScore - b.totalScore
      if (sortBy === "name-asc")
        return a.companyName.localeCompare(b.companyName)
      if (sortBy === "name-desc")
        return b.companyName.localeCompare(a.companyName)
      if (sortBy === "training-first") {
        return (
          (a.trainsOnDataByDefault ? 1 : 0) - (b.trainsOnDataByDefault ? 1 : 0)
        )
      }
      const priority: Record<string, number> = {
        verified_from_policy_text: 0,
        inferred: 1,
        needs_review: 2,
      }
      return (priority[a.confidence] ?? 9) - (priority[b.confidence] ?? 9)
    })

    const totalCount = scored.length
    const limit = data.limit ?? 9
    const offset = data.offset ?? 0
    const sliced = scored.slice(offset, offset + limit)

    const stats = {
      total: totalCount,
      trainsDefault: scored.filter((c) => c.trainsOnDataByDefault).length,
      hasOptOut: scored.filter((c) => c.optOutAvailable).length,
      hasHumanReview: scored.filter((c) => c.humanReviewOfChats).length,
    }

    return { companies: sliced, totalCount, stats, overallStats }
  } catch (error) {
    console.error("Failed to fetch companies:", error)
    throw new Error("Failed to fetch companies")
  }
}

export const getCompaniesFn = createServerFn({ method: "GET" })
  .validator(
    (
      input:
        | {
            limit?: number
            offset?: number
            searchQuery?: string
            filterNoTraining?: boolean
            filterOptOut?: boolean
            filterNoHumanReview?: boolean
            sortBy?: string
            weights?: {
              trainingWeight: number
              optOutWeight: number
              retentionWeight: number
              deletionWeight: number
              sharingWeight: number
              humanReviewWeight: number
            }
          }
        | undefined
    ) => input || {}
  )
  .handler(async ({ data }) => {
    return getCompanies(data)
  })

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

export async function getChangelogs(
  data: {
    page?: number
    pageSize?: number
    sortBy?: "detectedAt" | "companyName" | "status"
    sortOrder?: "asc" | "desc"
    companyFilter?: string
    statusFilter?: string
  } = {}
): Promise<{ changelogs: any[]; totalCount: number }> {
  try {
    const db = await getDb()
    const page = data.page ?? 0
    const pageSize = data.pageSize ?? 20
    const sortBy = data.sortBy ?? "detectedAt"
    const sortOrder = data.sortOrder ?? "desc"
    const companyFilter = data.companyFilter ?? "all"
    const statusFilter = data.statusFilter ?? "all"

    const conditions: SQL[] = []
    if (companyFilter !== "all") {
      conditions.push(eq(companies.companyKey, companyFilter))
    }
    if (statusFilter !== "all") {
      conditions.push(eq(changelogs.status, statusFilter))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Fetch count query
    const countRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(changelogs)
      .leftJoin(companies, eq(changelogs.companyId, companies.id))
      .where(whereClause)

    const totalCount = countRes[0]?.count ?? 0

    // Ordering logic
    let orderByClause: any = desc(changelogs.detectedAt)
    if (sortBy === "companyName") {
      orderByClause =
        sortOrder === "asc"
          ? asc(companies.companyName)
          : desc(companies.companyName)
    } else if (sortBy === "status") {
      orderByClause =
        sortOrder === "asc" ? asc(changelogs.status) : desc(changelogs.status)
    } else {
      orderByClause =
        sortOrder === "asc"
          ? asc(changelogs.detectedAt)
          : desc(changelogs.detectedAt)
    }

    // Query data
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
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(page * pageSize)

    return { changelogs: rows, totalCount }
  } catch (error) {
    console.error("Failed to fetch changelogs:", error)
    throw new Error("Failed to fetch changelogs")
  }
}

export const getChangelogsFn = createServerFn({ method: "GET" })
  .validator(
    (
      input:
        | {
            page?: number
            pageSize?: number
            sortBy?: "detectedAt" | "companyName" | "status"
            sortOrder?: "asc" | "desc"
            companyFilter?: string
            statusFilter?: string
          }
        | undefined
    ) => input || {}
  )
  .handler(async ({ data }) => {
    return getChangelogs(data)
  })

export const getSnapshotCountsFn = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const db = await getDb()

      const latestSubquery = db
        .select({
          companyId: snapshots.companyId,
          maxFetched: sql<string>`max(${snapshots.fetchedAt})`.as(
            "max_fetched"
          ),
        })
        .from(snapshots)
        .groupBy(snapshots.companyId)
        .as("latest_sub")

      const rows = await db
        .select({
          companyId: snapshots.companyId,
          companyName: companies.companyName,
          companyKey: companies.companyKey,
          fetchedAt: snapshots.fetchedAt,
          contentHash: snapshots.contentHash,
        })
        .from(snapshots)
        .innerJoin(
          latestSubquery,
          and(
            eq(snapshots.companyId, latestSubquery.companyId),
            eq(snapshots.fetchedAt, latestSubquery.maxFetched)
          )
        )
        .leftJoin(companies, eq(snapshots.companyId, companies.id))
        .orderBy(desc(snapshots.fetchedAt))
      return rows
    } catch (error) {
      console.error("Failed to fetch snapshots:", error)
      throw new Error("Failed to fetch snapshots")
    }
  }
)

export const getSnapshotTotalCountFn = createServerFn({
  method: "GET",
}).handler(async () => {
  try {
    const db = await getDb()
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(snapshots)
    return result[0]?.count ?? 0
  } catch (error) {
    console.error("Failed to count snapshots:", error)
    throw new Error("Failed to count snapshots")
  }
})

export const getPendingReviewsCountFn = createServerFn({
  method: "GET",
}).handler(async () => {
  try {
    const db = await getDb()
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(changelogs)
      .where(eq(changelogs.status, "pending_review"))
    return result[0]?.count ?? 0
  } catch (error) {
    console.error("Failed to count pending reviews:", error)
    throw new Error("Failed to count pending reviews")
  }
})

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
  return escapeHtml(str)
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

export const getBlogPostsFn = createServerFn({ method: "GET" }).handler(
  async () => {
    return getBlogPosts()
  }
)

export const getBlogPostBySlugFn = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    return getBlogPostBySlug(slug)
  })
