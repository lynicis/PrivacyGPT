import { getDb } from "./db"
import { companies, snapshots, changelogs } from "./db/schema"
import { eq, desc } from "drizzle-orm"
import { createHash } from "node:crypto"

/**
 * Strips HTML of scripts, styles, nav, footer, and tag markup,
 * returning only the visible text content of the page.
 */
export function stripHtmlToText(html: string): string {
  let text = html
  // Remove script and style blocks entirely
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "")
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "")
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
  // Remove non-content structural elements
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, "")
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, "")
  text = text.replace(/<header[\s\S]*?<\/header>/gi, "")
  text = text.replace(/<aside[\s\S]*?<\/aside>/gi, "")
  text = text.replace(/<form[\s\S]*?<\/form>/gi, "")
  text = text.replace(/<svg[\s\S]*?<\/svg>/gi, "")
  // Remove all HTML tags (replace with newline to preserve line structure)
  text = text.replace(/<[^>]+>/g, "\n")
  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
  // Filter out metadata and navigation junk lines before collapsing whitespace
  text = text
    .split(/\n/)
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
      return true
    })
    .join("\n")
  // Collapse whitespace (including newlines) into single spaces
  text = text.replace(/\s+/g, " ").trim()
  return text
}

/**
 * Fetches the raw HTML from a URL and returns cleaned text.
 * Wraps the network call in a try/catch to handle bot protection or downtime.
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

    if (!response.ok) {
      console.warn(
        `[watchdog] HTTP ${response.status} fetching ${url} — skipping`
      )
      return null
    }

    const raw = await response.text()
    const text = stripHtmlToText(raw)
    return { text, raw }
  } catch (error) {
    console.warn(`[watchdog] Failed to fetch ${url}:`, error)
    return null
  }
}

/**
 * Generates a SHA-256 hash of the given text.
 */
export function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex")
}

/**
 * Generates a simple line-by-line diff between two texts.
 * Returns an array of diff lines with +/- prefixes.
 */
export function generateDiff(
  before: string,
  after: string
): { diffLines: string[]; diffHtml: string } {
  const beforeLines = before.split(/[.!?]\s+/)
  const afterLines = after.split(/[.!?]\s+/)

  const diffLines: string[] = []

  // Simple LCS-based approach: find removed and added sentences
  const beforeSet = new Set(beforeLines.map((l) => l.trim()).filter(Boolean))
  const afterSet = new Set(afterLines.map((l) => l.trim()).filter(Boolean))

  for (const line of beforeLines) {
    const trimmed = line.trim()
    if (trimmed && !afterSet.has(trimmed)) {
      diffLines.push(`- ${trimmed}`)
    }
  }

  for (const line of afterLines) {
    const trimmed = line.trim()
    if (trimmed && !beforeSet.has(trimmed)) {
      diffLines.push(`+ ${trimmed}`)
    }
  }

  // Generate HTML diff for visualization
  const diffHtml = diffLines
    .map((line) => {
      if (line.startsWith("+ ")) {
        return `<div class="diff-added">${escapeHtml(line.slice(2))}</div>`
      } else if (line.startsWith("- ")) {
        return `<div class="diff-removed">${escapeHtml(line.slice(2))}</div>`
      }
      return `<div>${escapeHtml(line)}</div>`
    })
    .join("\n")

  return { diffLines, diffHtml }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Main watchdog pipeline. For each company:
 * 1. Fetch the current policy text.
 * 2. Hash it.
 * 3. Compare to the latest snapshot.
 * 4. If changed (or no baseline exists), store snapshot and changelog.
 */
export async function runWatchdog(): Promise<{
  checked: number
  baselines: number
  changes: number
  errors: number
}> {
  const db = await getDb()
  const allCompanies = await db.select().from(companies)
  let checked = 0
  let baselines = 0
  let changes = 0
  let errors = 0

  for (const company of allCompanies) {
    console.log(`[watchdog] Checking ${company.companyName}...`)

    const result = await fetchPolicyText(company.sourceUrl)
    if (!result) {
      errors++
      continue
    }

    checked++
    const contentHash = hashText(result.text)
    const now = new Date().toISOString()

    // Get the latest snapshot for this company
    const latestSnapshot = await db
      .select()
      .from(snapshots)
      .where(eq(snapshots.companyId, company.id))
      .orderBy(desc(snapshots.fetchedAt))
      .limit(1)
      .then((rows) => (rows[0] as (typeof rows)[0] | undefined) || null)

    if (!latestSnapshot) {
      // First run — store baseline snapshot
      console.log(`[watchdog] Storing baseline for ${company.companyName}`)
      await db.insert(snapshots).values({
        companyId: company.id,
        fetchedAt: now,
        contentHash,
        rawContent: result.text,
      })
      baselines++
    } else if (latestSnapshot.contentHash !== contentHash) {
      // Change detected!
      console.log(`[watchdog] ⚠ CHANGE DETECTED for ${company.companyName}!`)

      const { diffHtml } = generateDiff(latestSnapshot.rawContent, result.text)

      // Insert changelog entry
      await db.insert(changelogs).values({
        companyId: company.id,
        detectedAt: now,
        beforeText: latestSnapshot.rawContent.slice(0, 5000),
        afterText: result.text.slice(0, 5000),
        diffHtml,
        status: "pending_review",
      })

      // Insert new snapshot
      await db.insert(snapshots).values({
        companyId: company.id,
        fetchedAt: now,
        contentHash,
        rawContent: result.text,
      })

      // Update the company's lastChangedDate
      await db
        .update(companies)
        .set({ lastChangedDate: now.split("T")[0] })
        .where(eq(companies.id, company.id))

      changes++
    } else {
      console.log(`[watchdog] No changes for ${company.companyName}`)
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
