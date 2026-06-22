"use server"

import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { db, companies } from "./db"
import { changelogs, snapshots, subscriptions } from "./db/schema"
import { eq, desc, and, isNull, or } from "drizzle-orm"

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

export const getChangelogsFn = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
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

      // 1. Update the changelog status
      await db
        .update(changelogs)
        .set({
          status: "reviewed",
          reviewNotes: data.reviewNotes,
          reviewedAt: new Date().toISOString(),
        })
        .where(eq(changelogs.id, data.id))

      // 2. Fetch the changelog and company details
      const changelogEntry = await db
        .select({
          companyId: changelogs.companyId,
          companyName: companies.companyName,
          companyKey: companies.companyKey,
        })
        .from(changelogs)
        .leftJoin(companies, eq(changelogs.companyId, companies.id))
        .where(eq(changelogs.id, data.id))
        .then((rows) => (rows[0] as (typeof rows)[0] | undefined) || null)

      if (changelogEntry && changelogEntry.companyId) {
        const { companyId, companyName } = changelogEntry

        // 3. Query all confirmed subscribers for this company or all companies
        const subs = await db
          .select()
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.status, "confirmed"),
              or(
                eq(subscriptions.companyId, companyId),
                isNull(subscriptions.companyId)
              )
            )
          )

        // 4. Send mock alert notification emails
        for (const sub of subs) {
          console.log(`
========================================================================
[MOCK EMAIL ALERT SENT]
To: ${sub.email}
Subject: Privacy Policy Update Alert: ${companyName}
Body:
------------------------------------------------------------------------
Dear PrivacyGPT Subscriber,

We detected a privacy policy change for ${companyName} (${changelogEntry.companyKey}).

Review Details:
${data.reviewNotes}

View the line-by-line diff visualizer at:
http://localhost:3000/changelog

To stop receiving these alerts, you can unsubscribe at any time:
http://localhost:3000/subscribe/unsubscribe?token=${sub.token}
------------------------------------------------------------------------
========================================================================
`)
        }
      }

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
      const siteUrl = "https://privacygpt.app"

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

export async function subscribeEmailHandler(data: {
  email: string
  companyId: number | null
}) {
  const email = data.email.trim().toLowerCase()
  // Basic email validation regex
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Invalid email format" }
  }

  // Check if already subscribed
  const existing = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.email, email),
        data.companyId
          ? eq(subscriptions.companyId, data.companyId)
          : isNull(subscriptions.companyId)
      )
    )
    .then((rows) => (rows[0] as (typeof rows)[0] | undefined) || null)

  if (existing) {
    if (existing.status === "confirmed") {
      return {
        success: true,
        message: "You are already subscribed to this option.",
      }
    }
    // If pending, resend invitation
    console.log(`
========================================================================
[MOCK EMAIL SENT - RESEND CONFIRMATION]
To: ${email}
Subject: Confirm your PrivacyGPT Alert Subscription
Body:
------------------------------------------------------------------------
Hello,

Please confirm your subscription to PrivacyGPT policy updates by clicking the link below:

http://localhost:3000/subscribe/confirm?token=${existing.token}

If you did not request this subscription, you can ignore this email.
------------------------------------------------------------------------
========================================================================
    `)
    return {
      success: true,
      message: "Confirmation link resent! Please check your inbox.",
    }
  }

  // Create new subscription
  const token = crypto.randomUUID()
  await db.insert(subscriptions).values({
    email,
    companyId: data.companyId,
    status: "pending_confirmation",
    token,
    createdAt: new Date().toISOString(),
  })

  console.log(`
========================================================================
[MOCK EMAIL SENT - NEW SUBSCRIPTION]
To: ${email}
Subject: Confirm your PrivacyGPT Alert Subscription
Body:
------------------------------------------------------------------------
Hello,

Please confirm your subscription to PrivacyGPT policy updates by clicking the link below:

http://localhost:3000/subscribe/confirm?token=${token}

If you did not request this subscription, you can ignore this email.
------------------------------------------------------------------------
========================================================================
  `)

  return {
    success: true,
    message: "Please check your email to confirm your subscription.",
  }
}

export async function confirmSubscriptionHandler(data: { token: string }) {
  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.token, data.token))
    .then((rows) => (rows[0] as (typeof rows)[0] | undefined) || null)

  if (!sub) {
    return { success: false, error: "Invalid confirmation token" }
  }

  // Update status
  await db
    .update(subscriptions)
    .set({ status: "confirmed" })
    .where(eq(subscriptions.id, sub.id))

  // Get target company name
  let companyName = "All Companies"
  if (sub.companyId) {
    const comp = await db
      .select({ companyName: companies.companyName })
      .from(companies)
      .where(eq(companies.id, sub.companyId))
      .then((rows) => (rows[0] as (typeof rows)[0] | undefined) || null)
    if (comp) {
      companyName = comp.companyName
    }
  }

  return { success: true, companyName }
}

export async function unsubscribeHandler(data: { token: string }) {
  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.token, data.token))
    .then((rows) => (rows[0] as (typeof rows)[0] | undefined) || null)

  if (!sub) {
    return { success: false, error: "Invalid unsubscribe token" }
  }

  // Delete subscription record
  await db.delete(subscriptions).where(eq(subscriptions.id, sub.id))

  return { success: true }
}

export const subscribeEmailFn = createServerFn({ method: "POST" })
  .validator((input: { email: string; companyId: number | null }) => input)
  .handler(async ({ data }) => {
    try {
      return await subscribeEmailHandler(data)
    } catch (error) {
      console.error("Subscription failed:", error)
      return {
        success: false,
        error: "Subscription failed. Please try again later.",
      }
    }
  })

export const confirmSubscriptionFn = createServerFn({ method: "POST" })
  .validator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    try {
      return await confirmSubscriptionHandler(data)
    } catch (error) {
      console.error("Confirmation failed:", error)
      return { success: false, error: "Confirmation failed" }
    }
  })

export const unsubscribeFn = createServerFn({ method: "POST" })
  .validator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    try {
      return await unsubscribeHandler(data)
    } catch (error) {
      console.error("Unsubscribe failed:", error)
      return { success: false, error: "Unsubscribe failed" }
    }
  })
