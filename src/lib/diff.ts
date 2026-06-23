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
 * Splits text into paragraphs/blocks.
 */
export function splitIntoBlocks(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
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
 * Generates an ordered, context-aware diff between two texts.
 * Handles block/paragraph-level structures and highlights sentence changes.
 */
export function generateDiff(
  before: string,
  after: string,
  options?: NormalizationOptions
): { diffLines: string[]; diffHtml: string } {
  // Paragraph/block level splitting
  const blocksA = splitIntoBlocks(before)
  const blocksB = splitIntoBlocks(after)

  if (blocksA.length === 0 && blocksB.length === 0) {
    return { diffLines: [], diffHtml: "" }
  }

  // Helper to compare blocks
  const blockEquals = (bA: string, bB: string) => {
    return normalizeText(bA, options) === normalizeText(bB, options)
  }

  const blockDp = computeLcsTable(blocksA, blocksB, blockEquals)
  const blockEntries = backtrackDiff(
    blocksA,
    blocksB,
    blockDp,
    blockEquals,
    (bA) => ({ type: "unchanged", text: bA }),
    (bB) => ({ type: "added", text: bB }),
    (bA) => ({ type: "removed", text: bA })
  )

  const finalHtmlEntries: string[] = []
  const diffLines: string[] = []

  for (const blockEntry of blockEntries) {
    if (blockEntry.type === "unchanged") {
      // Diff sentences within the unchanged block to capture minor edits accurately
      const segmentsA = splitIntoSegments(blockEntry.text, options)
      const segmentsB = splitIntoSegments(blockEntry.text, options) // they are the same block

      const sentenceDp = computeLcsTable(
        segmentsA,
        segmentsB,
        (sA, sB) => sA.normalized === sB.normalized
      )

      const sentenceEntries = backtrackDiff(
        segmentsA,
        segmentsB,
        sentenceDp,
        (sA, sB) => sA.normalized === sB.normalized,
        (sA) => ({ type: "unchanged", text: sA.original }),
        (sB) => ({ type: "added", text: sB.original }),
        (sA) => ({ type: "removed", text: sA.original })
      )

      const processedSentences = detectModifiedEntries(sentenceEntries, options)

      let paragraphHtml = '<div class="diff-paragraph">'
      for (const entry of processedSentences) {
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
      finalHtmlEntries.push(paragraphHtml)
    } else if (blockEntry.type === "added") {
      // Entire block was added
      const segments = splitIntoSegments(blockEntry.text, options)
      let paragraphHtml = '<div class="diff-paragraph diff-block-added">'
      for (const seg of segments) {
        diffLines.push(`+ ${seg.original}`)
        paragraphHtml += `<span class="diff-added">${escapeHtml(seg.original)}</span>`
      }
      paragraphHtml += "</div>"
      finalHtmlEntries.push(paragraphHtml)
    } else {
      // Entire block was removed
      const segments = splitIntoSegments(blockEntry.text, options)
      let paragraphHtml = '<div class="diff-paragraph diff-block-removed">'
      for (const seg of segments) {
        diffLines.push(`- ${seg.original}`)
        paragraphHtml += `<span class="diff-removed">${escapeHtml(seg.original)}</span>`
      }
      paragraphHtml += "</div>"
      finalHtmlEntries.push(paragraphHtml)
    }
  }

  // To maintain compatibility with block layout, we can do some similarity detection
  // between adjacent added/removed blocks and perform sentence-level cross-block diffing
  // but for paragraphs/sections in policies, keeping them block-aligned is cleaner.
  // We can post-process the block entries to merge adjacent removed and added blocks into sentence diffs!
  // Let's do that to get the absolute best of both worlds: paragraph layout + sentence/word-level diffs!
  const finalMergedHtmlEntries: string[] = []
  const finalDiffLines: string[] = []

  for (let idx = 0; idx < blockEntries.length; idx++) {
    const current = blockEntries[idx]
    const next = blockEntries[idx + 1] as DiffEntry | undefined

    if (current.type === "removed" && next && next.type === "added") {
      // Diff at the sentence level between the removed and added blocks
      const segmentsA = splitIntoSegments(current.text, options)
      const segmentsB = splitIntoSegments(next.text, options)

      const sentenceDp = computeLcsTable(
        segmentsA,
        segmentsB,
        (sA, sB) => sA.normalized === sB.normalized
      )

      const sentenceEntries = backtrackDiff(
        segmentsA,
        segmentsB,
        sentenceDp,
        (sA, sB) => sA.normalized === sB.normalized,
        (sA) => ({ type: "unchanged", text: sA.original }),
        (sB) => ({ type: "added", text: sB.original }),
        (sA) => ({ type: "removed", text: sA.original })
      )

      const processedSentences = detectModifiedEntries(sentenceEntries, options)

      let paragraphHtml = '<div class="diff-paragraph">'
      for (const entry of processedSentences) {
        if (entry.type === "added") {
          finalDiffLines.push(`+ ${entry.text}`)
          paragraphHtml += `<span class="diff-added">${escapeHtml(entry.text)}</span>`
        } else if (entry.type === "removed") {
          finalDiffLines.push(`- ${entry.text}`)
          paragraphHtml += `<span class="diff-removed">${escapeHtml(entry.text)}</span>`
        } else if (entry.type === "modified") {
          finalDiffLines.push(`- ${entry.beforeText}`)
          finalDiffLines.push(`+ ${entry.text}`)
          paragraphHtml += `<span class="diff-modified">${entry.wordDiffHtml}</span>`
        } else {
          finalDiffLines.push(`  ${entry.text}`)
          paragraphHtml += `<span class="diff-unchanged">${escapeHtml(entry.text)}</span>`
        }
      }
      paragraphHtml += "</div>"
      finalMergedHtmlEntries.push(paragraphHtml)
      idx++ // Skip the next block (added block)
    } else {
      // Render as before
      if (current.type === "unchanged") {
        const segmentsA = splitIntoSegments(current.text, options)
        let paragraphHtml = '<div class="diff-paragraph">'
        for (const seg of segmentsA) {
          finalDiffLines.push(`  ${seg.original}`)
          paragraphHtml += `<span class="diff-unchanged">${escapeHtml(seg.original)}</span>`
        }
        paragraphHtml += "</div>"
        finalMergedHtmlEntries.push(paragraphHtml)
      } else if (current.type === "added") {
        const segments = splitIntoSegments(current.text, options)
        let paragraphHtml = '<div class="diff-paragraph diff-block-added">'
        for (const seg of segments) {
          finalDiffLines.push(`+ ${seg.original}`)
          paragraphHtml += `<span class="diff-added">${escapeHtml(seg.original)}</span>`
        }
        paragraphHtml += "</div>"
        finalMergedHtmlEntries.push(paragraphHtml)
      } else {
        const segments = splitIntoSegments(current.text, options)
        let paragraphHtml = '<div class="diff-paragraph diff-block-removed">'
        for (const seg of segments) {
          finalDiffLines.push(`- ${seg.original}`)
          paragraphHtml += `<span class="diff-removed">${escapeHtml(seg.original)}</span>`
        }
        paragraphHtml += "</div>"
        finalMergedHtmlEntries.push(paragraphHtml)
      }
    }
  }

  return {
    diffLines: finalDiffLines,
    diffHtml: finalMergedHtmlEntries.join("\n"),
  }
}
