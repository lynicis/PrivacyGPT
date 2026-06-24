import { createHash } from "node:crypto"
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

export interface NormalizationOptions {
  lowerCase?: boolean
  stripListMarkers?: boolean
  removePunctuation?: boolean
  collapseWhitespace?: boolean
}

export interface DiffOptions {
  normalization?: NormalizationOptions
  /**
   * When true, suppresses diffs where the only change is a numeric value
   * (e.g. star count "51.2k" → "51.3k", commit count "39,804" → "39,813").
   * This reduces noise from dynamic UI counters on scraped pages.
   */
  suppressNumericNoise?: boolean
}

const DEFAULT_NORM_OPTIONS: NormalizationOptions = {
  lowerCase: true,
  stripListMarkers: true,
  removePunctuation: true,
  collapseWhitespace: true,
}

/**
 * Normalizes text for consistent comparison by removing formatting artifacts.
 * Configurable via options.
 */
export function normalizeText(
  text: string,
  options: NormalizationOptions = DEFAULT_NORM_OPTIONS
): string {
  let result = decodeHtmlEntities(text)

  if (options.lowerCase) {
    result = result.toLowerCase()
  }

  if (options.stripListMarkers) {
    result = result
      .replace(/^\d+[.)]\s+/gm, "") // strip numbered list markers (1. or 1))
      .replace(/^[*-]\s+/gm, "") // strip bullet markers (* or -)
  }

  if (options.removePunctuation) {
    result = result.replace(/[^\w\s]/g, " ")
  }

  if (options.collapseWhitespace) {
    result = result.replace(/\s+/g, " ")
  }

  return result.trim()
}

/**
 * Generates a SHA-256 hash of the given text.
 * Normalizes text before hashing to ignore formatting differences.
 */
export function hashText(text: string, options?: NormalizationOptions): string {
  return createHash("sha256").update(normalizeText(text, options)).digest("hex")
}

/**
 * Patterns that match navigation/UI junk content commonly leaked through
 * HTML-to-text conversion (GitHub navbar, session messages, error placeholders).
 */
const LOW_QUALITY_PATTERNS = [
  /^you signed in with another tab or window\.?$/i,
  /^you signed out in another tab or window\.?$/i,
  /^you switched accounts on another tab or window\.?$/i,
  /^reload to refresh your session\.?$/i,
  /^dismiss alert/i,
  /^there was an error while loading\.?$/i,
  /^please reload this page\.?$/i,
  /^notifications you must be signed in/i,
  /^uh oh!?$/i,
  /^main menu$/i,
  /^search.*clear.*search$/i,
  /^close search$/i,
  /^help center$/i,
  /^community$/i,
  /^privacy hub$/i,
  /^this help content/i,
  /^general help/i,
]

/**
 * Returns true when a block of text consists entirely of low-quality /
 * navigational content that should be excluded from diff analysis.
 */
export function isLowQualityBlock(text: string): boolean {
  const segments = splitIntoSegments(text)
  if (segments.length === 0) return true
  const nonJunk = segments.filter(
    (seg) => !LOW_QUALITY_PATTERNS.some((p) => p.test(seg.original.trim()))
  )
  return nonJunk.length === 0
}

/**
 * Splits text into paragraphs/blocks, filtering out low-quality
 * navigation/UI content in the process.
 */
export function splitIntoBlocks(
  text: string,
  filterLowQuality?: boolean
): string[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .filter((block) => !filterLowQuality || !isLowQualityBlock(block))
}

/**
 * Splits a block of text into sentence segments.
 */
export function splitIntoSegments(
  text: string,
  options?: NormalizationOptions
): Array<{ original: string; normalized: string }> {
  // Strip numbered/bullet list markers before splitting so "1. Something" stays together
  const cleaned = text.replace(/^\d+[.)]\s+/gm, "").replace(/^[*-]\s+/gm, "")
  const parts = cleaned.split(/(?<=[.!?])\s+/)
  const segments: Array<{ original: string; normalized: string }> = []

  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed) {
      segments.push({
        original: trimmed,
        normalized: normalizeText(trimmed, options),
      })
    }
  }

  return segments
}

/**
 * Computes LCS Table for any array.
 */
export function computeLcsTable<T>(
  a: T[],
  b: T[],
  equals: (x: T, y: T) => boolean
): number[][] {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (equals(a[i - 1], b[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  return dp
}

export type DiffType = "unchanged" | "added" | "removed" | "modified"

export interface DiffEntry {
  type: DiffType
  text: string
  // If type is "modified", beforeText contains the original segment
  beforeText?: string
  // If type is "modified", wordDiffHtml contains inline word diff
  wordDiffHtml?: string
}

/**
 * Backtracks through the LCS table to produce an ordered diff list.
 */
export function backtrackDiff<T>(
  a: T[],
  b: T[],
  dp: number[][],
  equals: (x: T, y: T) => boolean,
  onUnchanged: (itemA: T) => DiffEntry,
  onAdded: (itemB: T) => DiffEntry,
  onRemoved: (itemA: T) => DiffEntry
): DiffEntry[] {
  const entries: DiffEntry[] = []
  let i = a.length
  let j = b.length

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && equals(a[i - 1], b[j - 1])) {
      entries.unshift(onUnchanged(a[i - 1]))
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      entries.unshift(onAdded(b[j - 1]))
      j--
    } else {
      entries.unshift(onRemoved(a[i - 1]))
      i--
    }
  }

  return entries
}

/**
 * Compares two sentences at the word level. If they are similar enough,
 * returns an inline word-level HTML diff. Otherwise returns null.
 */
export function wordLevelDiff(
  before: string,
  after: string,
  options?: NormalizationOptions
): { diffHtml: string; isSimilar: boolean } {
  // Use regex split to keep words and whitespace separate so spacing is preserved in the output
  const wordsA = before.split(/(\s+)/).filter(Boolean)
  const wordsB = after.split(/(\s+)/).filter(Boolean)

  const normA = wordsA.map((w) => normalizeText(w, options))
  const normB = wordsB.map((w) => normalizeText(w, options))

  const equals = (idxA: number, idxB: number) => {
    const isWsA = /^\s+$/.test(wordsA[idxA])
    const isWsB = /^\s+$/.test(wordsB[idxB])
    if (isWsA && isWsB) return true
    if (!isWsA && !isWsB && normA[idxA] === normB[idxB]) return true
    return false
  }

  const m = wordsA.length
  const n = wordsB.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (equals(i - 1, j - 1)) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const nonWsA = wordsA.filter((w) => !/^\s+$/.test(w)).length
  const nonWsB = wordsB.filter((w) => !/^\s+$/.test(w)).length
  const maxNonWs = Math.max(nonWsA, nonWsB)

  // Calculate similarity of non-whitespace tokens
  let matches = 0
  let i = m,
    j = n
  while (i > 0 && j > 0) {
    if (equals(i - 1, j - 1)) {
      if (!/^\s+$/.test(wordsA[i - 1])) {
        matches++
      }
      i--
      j--
    } else if (dp[i][j - 1] >= dp[i - 1][j]) {
      j--
    } else {
      i--
    }
  }

  const similarity = maxNonWs > 0 ? matches / maxNonWs : 1.0
  const similarityThreshold = 0.4 // At least 40% of words must match to qualify as "modified"

  if (similarity < similarityThreshold) {
    return { diffHtml: "", isSimilar: false }
  }

  // Backtrack to build the inline HTML representation
  const wordEntries: Array<{
    type: "unchanged" | "added" | "removed"
    text: string
  }> = []
  i = m
  j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && equals(i - 1, j - 1)) {
      wordEntries.unshift({ type: "unchanged", text: wordsA[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      wordEntries.unshift({ type: "added", text: wordsB[j - 1] })
      j--
    } else {
      wordEntries.unshift({ type: "removed", text: wordsA[i - 1] })
      i--
    }
  }

  let html = ""
  for (const entry of wordEntries) {
    if (entry.type === "added") {
      html += `<ins class="diff-word-added">${escapeHtml(entry.text)}</ins>`
    } else if (entry.type === "removed") {
      html += `<del class="diff-word-removed">${escapeHtml(entry.text)}</del>`
    } else {
      html += escapeHtml(entry.text)
    }
  }

  return { diffHtml: html, isSimilar: true }
}

/**
 * Post-processes a list of sentence diff entries to merge adjacent removed/added sentences
 * into a single "modified" entry with inline word-level diffing.
 */
export function detectModifiedEntries(
  entries: DiffEntry[],
  options?: NormalizationOptions
): DiffEntry[] {
  const result: DiffEntry[] = []

  for (let idx = 0; idx < entries.length; idx++) {
    const current = entries[idx]
    const next = entries[idx + 1] as DiffEntry | undefined

    if (current.type === "removed" && next && next.type === "added") {
      const { diffHtml, isSimilar } = wordLevelDiff(
        current.text,
        next.text,
        options
      )
      if (isSimilar) {
        result.push({
          type: "modified",
          text: next.text,
          beforeText: current.text,
          wordDiffHtml: diffHtml,
        })
        idx++ // skip the next (added) entry
        continue
      }
    }
    result.push(current)
  }

  return result
}

/**
 * Compares two blocks using a two-tier strategy:
 * 1. Exact normalized text match (fast path)
 * 2. Sentence-bag equivalence (handles reordered but identical sentences)
 */
function blocksMatch(
  bA: string,
  bB: string,
  options?: NormalizationOptions
): boolean {
  if (normalizeText(bA, options) === normalizeText(bB, options)) return true

  const segmentsA = splitIntoSegments(bA, options)
  const segmentsB = splitIntoSegments(bB, options)

  if (segmentsA.length !== segmentsB.length) return false

  // Use bag (multiset) comparison instead of Set to correctly handle
  // duplicate sentences that may be reordered (e.g. a sentence appearing
  // twice in both A and B — Set would miss the duplicate count mismatch).
  const freqA = new Map<string, number>()
  const freqB = new Map<string, number>()
  for (const s of segmentsA)
    freqA.set(s.normalized, (freqA.get(s.normalized) || 0) + 1)
  for (const s of segmentsB)
    freqB.set(s.normalized, (freqB.get(s.normalized) || 0) + 1)

  if (freqA.size !== freqB.size) return false

  for (const [key, count] of freqA) {
    if (freqB.get(key) !== count) return false
  }

  return true
}

/**
 * Renders a block entry as HTML with diff markers.
 */
function renderBlock(
  blockText: string,
  type: "unchanged" | "added" | "removed",
  options?: NormalizationOptions
): { diffLines: string[]; html: string } {
  const prefix = type === "unchanged" ? "  " : type === "added" ? "+ " : "- "
  const cssClass =
    type === "unchanged"
      ? "diff-unchanged"
      : type === "added"
        ? "diff-added"
        : "diff-removed"
  const blockClass = type === "unchanged" ? "" : ` diff-block-${type}`

  const segments = splitIntoSegments(blockText, options)
  const diffLines: string[] = []
  let html = `<div class="diff-paragraph${blockClass}">`

  for (const seg of segments) {
    diffLines.push(`${prefix}${seg.original}`)
    html += `<span class="${cssClass}">${escapeHtml(seg.original)}</span>`
  }

  html += "</div>"
  return { diffLines, html }
}

/**
 * Post-processes block-level diff entries to pair orphaned removed↔added blocks
 * that have identical content (content was reordered, not changed).
 * Converts matching pairs to "unchanged" blocks.
 */
function matchReorderedBlocks(
  entries: DiffEntry[],
  options?: NormalizationOptions
): DiffEntry[] {
  const result: DiffEntry[] = [...entries]

  const removedIndices: number[] = []
  const addedIndices: number[] = []

  for (let i = 0; i < result.length; i++) {
    if (result[i].type === "removed") removedIndices.push(i)
    if (result[i].type === "added") addedIndices.push(i)
  }

  const skipped = new Set<number>()
  for (const ri of removedIndices) {
    for (const ai of addedIndices) {
      if (skipped.has(ai)) continue
      if (
        normalizeText(result[ri].text, options) ===
        normalizeText(result[ai].text, options)
      ) {
        result[ri] = { type: "unchanged", text: result[ri].text }
        result[ai] = { type: "unchanged", text: result[ai].text }
        skipped.add(ai)
        break
      }
    }
  }

  return result
}

/**
 * Replaces numeric tokens (integers, decimals, comma-separated, and
 * abbreviations like 51.2k, 39,813) with a uniform placeholder.
 * Useful for comparing text where only dynamic numeric counters changed.
 */
export function normalizeNumericValues(text: string): string {
  return text.replace(/\b\d{1,3}(?:,\d{3})*(?:\.\d+)?[kKmMbB]?\b/g, "999")
}

/**
 * Returns true when two text blocks are effectively the same after
 * normalizing all numeric values to a placeholder. This catches
 * blocks where only a dynamic counter (star count, commit count)
 * changed.
 */
function textEqualsIgnoringNumericNoise(
  a: string,
  b: string,
  options?: NormalizationOptions
): boolean {
  return (
    normalizeNumericValues(normalizeText(a, options)) ===
    normalizeNumericValues(normalizeText(b, options))
  )
}

/**
 * Generates an ordered, context-aware diff between two texts.
 * Handles block/paragraph-level structures and highlights sentence changes.
 */
export function generateDiff(
  before: string,
  after: string,
  options?: NormalizationOptions | DiffOptions
): { diffLines: string[]; diffHtml: string } {
  const normOpts: NormalizationOptions | undefined = options
    ? "suppressNumericNoise" in options
      ? (options as DiffOptions).normalization
      : (options as NormalizationOptions)
    : undefined
  const suppressNumeric =
    options && "suppressNumericNoise" in options
      ? ((options as DiffOptions).suppressNumericNoise ?? false)
      : false

  const blocksA = splitIntoBlocks(before, suppressNumeric)
  const blocksB = splitIntoBlocks(after, suppressNumeric)

  if (blocksA.length === 0 && blocksB.length === 0) {
    return { diffLines: [], diffHtml: "" }
  }

  const blockEq = suppressNumeric
    ? (bA: string, bB: string) =>
        textEqualsIgnoringNumericNoise(bA, bB, normOpts)
    : (bA: string, bB: string) => blocksMatch(bA, bB, normOpts)

  const blockDp = computeLcsTable(blocksA, blocksB, blockEq)
  let blockEntries = backtrackDiff(
    blocksA,
    blocksB,
    blockDp,
    blockEq,
    (bA) => ({ type: "unchanged", text: bA }),
    (bB) => ({ type: "added", text: bB }),
    (bA) => ({ type: "removed", text: bA })
  )

  blockEntries = matchReorderedBlocks(blockEntries, normOpts)

  const htmlEntries: string[] = []
  const diffLines: string[] = []

  for (let idx = 0; idx < blockEntries.length; idx++) {
    const current = blockEntries[idx]
    const next = blockEntries[idx + 1] as DiffEntry | undefined

    if (current.type === "removed" && next && next.type === "added") {
      const segmentsA = splitIntoSegments(current.text, normOpts)
      const segmentsB = splitIntoSegments(next.text, normOpts)

      const sentenceEq = suppressNumeric
        ? (sA: { normalized: string }, sB: { normalized: string }) =>
            sA.normalized === sB.normalized ||
            normalizeNumericValues(sA.normalized) ===
              normalizeNumericValues(sB.normalized)
        : (sA: { normalized: string }, sB: { normalized: string }) =>
            sA.normalized === sB.normalized

      const sentenceDp = computeLcsTable(segmentsA, segmentsB, sentenceEq)

      const sentenceEntries = backtrackDiff(
        segmentsA,
        segmentsB,
        sentenceDp,
        sentenceEq,
        (sA) => ({ type: "unchanged", text: sA.original }),
        (sB) => ({ type: "added", text: sB.original }),
        (sA) => ({ type: "removed", text: sA.original })
      )

      const processed = detectModifiedEntries(sentenceEntries, normOpts)

      let paragraphHtml = '<div class="diff-paragraph">'
      for (const entry of processed) {
        if (entry.type === "added") {
          diffLines.push(`+ ${entry.text}`)
          paragraphHtml += `<span class="diff-added">${escapeHtml(entry.text)}</span>`
        } else if (entry.type === "removed") {
          diffLines.push(`- ${entry.text}`)
          paragraphHtml += `<span class="diff-removed">${escapeHtml(entry.text)}</span>`
        } else if (entry.type === "modified") {
          diffLines.push(`- ${entry.beforeText}`)
          diffLines.push(`+ ${entry.text}`)
          paragraphHtml += `<span class="diff-modified">${entry.wordDiffHtml}</span>`
        } else {
          diffLines.push(`  ${entry.text}`)
          paragraphHtml += `<span class="diff-unchanged">${escapeHtml(entry.text)}</span>`
        }
      }
      paragraphHtml += "</div>"
      htmlEntries.push(paragraphHtml)
      idx++
    } else {
      const result = renderBlock(
        current.text,
        current.type as "unchanged" | "added" | "removed",
        normOpts
      )
      diffLines.push(...result.diffLines)
      htmlEntries.push(result.html)
    }
  }

  return {
    diffLines,
    diffHtml: htmlEntries.join("\n"),
  }
}
