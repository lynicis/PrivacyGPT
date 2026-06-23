import { getDb } from "./db"
import { companies, snapshots, changelogs } from "./db/schema"
import { eq, desc } from "drizzle-orm"
import { createHash } from "node:crypto"
import FirecrawlApp from "@mendable/firecrawl-js"
import { convert } from "html-to-text"
import escapeHtml from "escape-html"

/**
 * Decodes standard HTML entities back to their raw characters.
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
}

/**
 * Normalizes text for consistent comparison by removing formatting artifacts.
 * Converts to lowercase, strips list markers, removes punctuation, and collapses whitespace.
 */
export function normalizeText(text: string): string {
  return decodeHtmlEntities(text)
    .toLowerCase()
    .replace(/^\d+[.)]\s+/gm, "") // strip numbered list markers (1. or 1))
    .replace(/^[*-]\s+/gm, "") // strip bullet markers (* or -)
    .replace(/[^\w\s]/g, " ") // remove punctuation
    .replace(/\s+/g, " ") // collapse whitespace
    .trim()
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

  const plainText = decodeHtmlEntities(convert(html, options))

  // Filter out metadata and navigation junk lines before collapsing whitespace
  const text = plainText
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim()
      // Skip empty lines
      if (!trimmed) return false
      // Skip lines that are only numbers (IDs, timestamps)
      if (/^\d+$/.test(trimmed)) return false
      // Skip lines that are only booleans
      if (/^(true|false)$/i.test(trimmed)) return false
      // Skip lines that are only "number boolean" patterns (like "2661833742547574305 true")
      if (/^\d+\s+(true|false)$/i.test(trimmed)) return false
      // Skip lines that are only "boolean number" patterns
      if (/^(true|false)\s+\d+$/i.test(trimmed)) return false
      // Skip common navigation/UI junk patterns
      if (/help center/i.test(trimmed)) return false
      if (/community/i.test(trimmed)) return false
      if (/search.*clear.*search/i.test(trimmed)) return false
      if (/close search/i.test(trimmed)) return false
      if (/main menu/i.test(trimmed)) return false
      if (/this help content/i.test(trimmed)) return false
      if (/general help/i.test(trimmed)) return false
      if (/privacy hub/i.test(trimmed)) return false
      // Skip documentation / LLM crawler indexing header junk
      if (/documentation index/i.test(trimmed)) return false
      if (/llms\.txt/i.test(trimmed)) return false
      if (/discover.*available pages/i.test(trimmed)) return false
      if (/stepfun.*documentation/i.test(trimmed)) return false
      if (/fetch.*documentation/i.test(trimmed)) return false
      return true
    })
    .join("\n")
  // Collapse whitespace (including newlines) into single spaces
  return text.replace(/\s+/g, " ").trim()
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

/**
 * Generates a SHA-256 hash of the given text.
 * Normalizes text before hashing to ignore formatting differences.
 */
export function hashText(text: string): string {
  return createHash("sha256").update(normalizeText(text)).digest("hex")
}

/**
 * Strips numbered list markers and bullet markers from text for splitting purposes,
 * preventing "1. Something" from splitting into two segments.
 */
function stripListMarkers(text: string): string {
  return text.replace(/^\d+[.)]\s+/gm, "").replace(/^[*-]\s+/gm, "")
}

/**
 * Splits text into sentence-like segments while preserving the original text.
 * Returns both the original and normalized forms of each segment.
 */
function splitIntoSegments(
  text: string
): Array<{ original: string; normalized: string }> {
  // Strip numbered/bullet list markers before splitting so "1. Something" stays together
  const cleaned = stripListMarkers(text)
  // Split on sentence boundaries: period/exclamation/question followed by space or end
  const parts = cleaned.split(/(?<=[.!?])\s+/)
  const segments: Array<{ original: string; normalized: string }> = []

  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed) {
      segments.push({ original: trimmed, normalized: normalizeText(trimmed) })
    }
  }

  return segments
}

/**
 * Computes the Longest Common Subsequence (LCS) of two normalized segment arrays.
 * Returns a 2D DP table where dp[i][j] is the LCS length of segmentsA[0..i-1] and segmentsB[0..j-1].
 */
function computeLcsTable(
  segmentsA: Array<{ original: string; normalized: string }>,
  segmentsB: Array<{ original: string; normalized: string }>
): number[][] {
  const m = segmentsA.length
  const n = segmentsB.length
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (segmentsA[i - 1].normalized === segmentsB[j - 1].normalized) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  return dp
}

/**
 * Backtracks through the LCS table to produce an ordered diff of segments.
 * Each entry is tagged as 'unchanged', 'added', or 'removed'.
 */
type DiffEntry = {
  type: "unchanged" | "added" | "removed"
  text: string
}

function backtrackDiff(
  segmentsA: Array<{ original: string; normalized: string }>,
  segmentsB: Array<{ original: string; normalized: string }>,
  dp: number[][]
): DiffEntry[] {
  const entries: DiffEntry[] = []
  let i = segmentsA.length
  let j = segmentsB.length

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      segmentsA[i - 1].normalized === segmentsB[j - 1].normalized
    ) {
      // Unchanged segment — push to front so order is preserved
      entries.unshift({ type: "unchanged", text: segmentsA[i - 1].original })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // Added segment in 'after' — push to front
      entries.unshift({ type: "added", text: segmentsB[j - 1].original })
      j--
    } else {
      // Removed segment in 'before' — push to front
      entries.unshift({ type: "removed", text: segmentsA[i - 1].original })
      i--
    }
  }

  return entries
}

/**
 * Generates an ordered, context-aware diff between two texts.
 * Uses normalized text for comparison but displays original text.
 * Returns an array of diff lines and HTML for visualization.
 */
export function generateDiff(
  before: string,
  after: string
): { diffLines: string[]; diffHtml: string } {
  const segmentsA = splitIntoSegments(before)
  const segmentsB = splitIntoSegments(after)

  // No segments to diff
  if (segmentsA.length === 0 && segmentsB.length === 0) {
    return { diffLines: [], diffHtml: "" }
  }

  // Compute LCS table
  const dp = computeLcsTable(segmentsA, segmentsB)

  // Backtrack to produce ordered diff entries
  const entries = backtrackDiff(segmentsA, segmentsB, dp)

  // Build diff lines array
  const diffLines: string[] = entries.map((entry) => {
    if (entry.type === "added") return `+ ${entry.text}`
    if (entry.type === "removed") return `- ${entry.text}`
    return `  ${entry.text}`
  })

  // Generate HTML diff for visualization
  const diffHtml = entries
    .map((entry) => {
      if (entry.type === "added") {
        return `<div class="diff-added">${escapeHtml(entry.text)}</div>`
      } else if (entry.type === "removed") {
        return `<div class="diff-removed">${escapeHtml(entry.text)}</div>`
      }
      return `<div class="diff-unchanged">${escapeHtml(entry.text)}</div>`
    })
    .join("\n")

  return { diffLines, diffHtml }
}

export async function checkCompany(
  companyId: number
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
    const { diffHtml } = generateDiff(latestSnapshot.rawContent, result.text)

    await db.insert(changelogs).values({
      companyId: company.id,
      detectedAt: now,
      beforeText: latestSnapshot.rawContent.slice(0, 5000),
      afterText: result.text.slice(0, 5000),
      diffHtml,
      status: "pending_review",
    })

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
  const allCompanies = await db.select().from(companies)

  // Attempt to check if queue binding exists (Cloudflare context)
  let queue: { send: (msg: any) => Promise<void> } | undefined
  try {
    const mod = await import("cloudflare:workers")
    queue = (mod.env as any).WATCHDOG_QUEUE
  } catch {
    // Fallback to direct synchronous execution if not in Worker context with Queue
  }

  if (queue) {
    console.log("[watchdog] Queue binding detected. Enqueuing checks...")
    let enqueued = 0
    for (const company of allCompanies) {
      await queue.send({ companyId: company.id })
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
      const status = await checkCompany(company.id)
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
