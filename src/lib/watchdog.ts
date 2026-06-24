import { createHash } from "node:crypto"
import { getDb } from "./db"
import { companies, snapshots, changelogs } from "./db/schema"
import { eq, desc } from "drizzle-orm"
import FirecrawlApp from "@mendable/firecrawl-js"
import { convert } from "html-to-text"
import escapeHtml from "escape-html"
import { diffLines } from "diff"

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
}

export function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex")
}

/**
 * Strips HTML of scripts, styles, nav, footer, and tag markup,
 * returning only the visible text content of the page.
 */
export function stripHtmlToText(html: string): string {
  const options = {
    selectors: [
      { selector: "nav", format: "skip" },
      { selector: "header", format: "skip" },
      { selector: "footer", format: "skip" },
      { selector: "aside", format: "skip" },
      { selector: "form", format: "skip" },
      { selector: "svg", format: "skip" },
      { selector: "script", format: "skip" },
      { selector: "style", format: "skip" },
      { selector: "a", options: { ignoreHref: true } },
      { selector: "img", format: "skip" },
    ],
    wordwrap: null,
    preserveNewlines: true,
  }

  return decodeHtmlEntities(convert(html, options)).replace(/\s+/g, " ").trim()
}

/**
 * Attempts to scrape a URL using Firecrawl API.
 * Returns null if FIRECRAWL_API_KEY is not set or scraping fails.
 */
async function scrapeWithFirecrawl(
  url: string
): Promise<{ text: string; raw: string } | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) return null

  try {
    const app = new FirecrawlApp({
      apiKey,
      apiUrl: "https://api.firecrawl.dev",
    })
    const result = await app.scrape(url, {
      formats: ["markdown"],
      onlyMainContent: true,
      timeout: 30000,
    })

    const markdown = (result as any).markdown
    if (!markdown) return null

    console.log(`[watchdog] Firecrawl fallback succeeded for ${url}`)
    return { text: markdown, raw: markdown }
  } catch (error) {
    console.warn(`[watchdog] Firecrawl fallback failed for ${url}:`, error)
    return null
  }
}

/**
 * Fetches the raw HTML from a URL and returns cleaned text.
 * Uses plain fetch first; falls back to Firecrawl if blocked or on error.
 */
export async function fetchPolicyText(
  url: string
): Promise<{ text: string; raw: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "PrivacyGPT-Watchdog/1.0 (https://github.com/privacygpt; privacy policy monitor)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    })

    if (response.ok) {
      const raw = await response.text()
      const text = stripHtmlToText(raw)
      return { text, raw }
    }

    // Fetch failed — try Firecrawl as fallback
    console.warn(
      `[watchdog] HTTP ${response.status} fetching ${url} — trying Firecrawl fallback`
    )
    return await scrapeWithFirecrawl(url)
  } catch (error) {
    // Network error or timeout — try Firecrawl as fallback
    console.warn(`[watchdog] Failed to fetch ${url}, trying Firecrawl:`, error)
    return await scrapeWithFirecrawl(url)
  }
}

export async function checkCompany(
  companyId: number,
  env?: { AI_REVIEW_QUEUE?: { send: (msg: any) => Promise<void> } }
): Promise<"baseline" | "change" | "none"> {
  const db = await getDb()
  const company = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1)
    .then((rows) => (rows[0] as (typeof rows)[0] | undefined) || null)

  if (!company) {
    throw new Error(`Company with ID ${companyId} not found`)
  }

  console.log(`[watchdog] Checking ${company.companyName}...`)
  const result = await fetchPolicyText(company.sourceUrl)
  if (!result) {
    throw new Error(`Failed to fetch policy text for ${company.companyName}`)
  }

  const contentHash = hashText(result.text)
  const now = new Date().toISOString()

  const latestSnapshot = await db
    .select()
    .from(snapshots)
    .where(eq(snapshots.companyId, company.id))
    .orderBy(desc(snapshots.fetchedAt))
    .limit(1)
    .then((rows) => (rows[0] as (typeof rows)[0] | undefined) || null)

  if (!latestSnapshot) {
    console.log(`[watchdog] Storing baseline for ${company.companyName}`)
    await db.insert(snapshots).values({
      companyId: company.id,
      fetchedAt: now,
      contentHash,
      rawContent: result.text,
    })
    return "baseline"
  } else if (latestSnapshot.contentHash !== contentHash) {
    console.log(`[watchdog] ⚠ CHANGE DETECTED for ${company.companyName}!`)
    const diffHtml = diffLines(latestSnapshot.rawContent, result.text)
      .map((part) =>
        part.added
          ? `<span class="diff-added">${escapeHtml(part.value)}</span>`
          : part.removed
            ? `<span class="diff-removed">${escapeHtml(part.value)}</span>`
            : `<span class="diff-unchanged">${escapeHtml(part.value)}</span>`
      )
      .join("\n")

    const [inserted] = await db
      .insert(changelogs)
      .values({
        companyId: company.id,
        detectedAt: now,
        beforeText: latestSnapshot.rawContent.slice(0, 5000),
        afterText: result.text.slice(0, 5000),
        diffHtml,
        status: "pending_review",
      })
      .returning({ id: changelogs.id })

    if (env?.AI_REVIEW_QUEUE) {
      await env.AI_REVIEW_QUEUE.send({ changelogId: inserted.id })
      console.log(`[watchdog] Enqueued AI review for changelog ${inserted.id}`)
    }

    await db.insert(snapshots).values({
      companyId: company.id,
      fetchedAt: now,
      contentHash,
      rawContent: result.text,
    })

    await db
      .update(companies)
      .set({ lastChangedDate: now.split("T")[0] })
      .where(eq(companies.id, company.id))
    return "change"
  } else {
    console.log(`[watchdog] No changes for ${company.companyName}`)
    return "none"
  }
}

export async function handleWatchdogQueueMessage(
  body: { companyId: number } | null | undefined,
  _env?: any
): Promise<void> {
  if (typeof body?.companyId !== "number") {
    throw new Error("Invalid watchdog queue message body")
  }
  await checkCompany(body.companyId)
}

/**
 * Main watchdog pipeline. For each company:
 * 1. Fetch the current policy text.
 * 2. Hash it.
 * 3. Compare to the latest snapshot.
 * 4. If changed (or no baseline exists), store snapshot and changelog.
 */
export async function runWatchdog(): Promise<{
  checked?: number
  baselines?: number
  changes?: number
  errors?: number
  enqueued?: number
}> {
  const db = await getDb()
  const allCompanies = await db
    .select()
    .from(companies)
    .where(eq(companies.hasValidPrivacyPolicy, true))

  // Attempt to check if queue binding exists (Cloudflare context)
  let watchdogQueue: { send: (msg: any) => Promise<void> } | undefined
  let aiReviewQueue: { send: (msg: any) => Promise<void> } | undefined
  try {
    const mod = await import("cloudflare:workers")
    const env = mod.env as any
    watchdogQueue = env.WATCHDOG_QUEUE
    aiReviewQueue = env.AI_REVIEW_QUEUE
  } catch {
    // Fallback to direct synchronous execution if not in Worker context with Queue
  }

  if (watchdogQueue) {
    console.log("[watchdog] Queue binding detected. Enqueuing checks...")
    let enqueued = 0
    for (const company of allCompanies) {
      await watchdogQueue.send({ companyId: company.id })
      enqueued++
    }
    return { enqueued }
  }

  let checked = 0
  let baselines = 0
  let changes = 0
  let errors = 0

  for (const company of allCompanies) {
    try {
      const status = await checkCompany(company.id, {
        AI_REVIEW_QUEUE: aiReviewQueue,
      })
      checked++
      if (status === "baseline") {
        baselines++
      } else if (status === "change") {
        changes++
      }
    } catch (e) {
      console.error(`[watchdog] Error checking company ${company.id}:`, e)
      errors++
    }
  }

  return { checked, baselines, changes, errors }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("[watchdog] Starting privacy policy watchdog run...")
  runWatchdog()
    .then((stats) => {
      console.log("\n[watchdog] Run complete!")
      console.log(`  Checked: ${stats.checked}`)
      console.log(`  Baselines stored: ${stats.baselines}`)
      console.log(`  Changes detected: ${stats.changes}`)
      console.log(`  Errors/skipped: ${stats.errors}`)
    })
    .catch((err) => {
      console.error("[watchdog] Fatal error:", err)
      process.exit(1)
    })
}
