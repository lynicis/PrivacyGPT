import { describe, it, expect } from "vitest"
import {
  normalizeText,
  decodeHtmlEntities,
  hashText,
  generateDiff,
  wordLevelDiff,
  splitIntoBlocks,
  classifyDiff,
  detectModifiedEntries,
} from "../diff"
import type { DiffEntry } from "../diff"

describe("diff engine utilities", () => {
  describe("normalizeText", () => {
    it("converts text to lowercase by default", () => {
      expect(normalizeText("HELLO WORLD")).toBe("hello world")
      expect(normalizeText("Hello World")).toBe("hello world")
    })

    it("strips numbered list markers by default", () => {
      expect(normalizeText("1. First item")).toBe("first item")
      expect(normalizeText("2) Second item")).toBe("second item")
      expect(normalizeText("10. Tenth item")).toBe("tenth item")
    })

    it("strips bullet markers by default", () => {
      expect(normalizeText("* Bullet item")).toBe("bullet item")
      expect(normalizeText("- Dash item")).toBe("dash item")
    })

    it("removes punctuation by default", () => {
      expect(normalizeText("Hello, world!")).toBe("hello world")
      expect(normalizeText("Terms & Conditions")).toBe("terms conditions")
      expect(normalizeText("Price: $99.99")).toBe("price 99 99")
    })

    it("collapses whitespace by default", () => {
      expect(normalizeText("  Multiple   spaces  ")).toBe("multiple spaces")
      expect(normalizeText("Line1\nLine2")).toBe("line1 line2")
    })

    it("supports configurable normalization options", () => {
      const text = "1. Hello, World!"
      // Disable everything
      expect(
        normalizeText(text, {
          lowerCase: false,
          stripListMarkers: false,
          removePunctuation: false,
          collapseWhitespace: false,
        })
      ).toBe("1. Hello, World!")

      // Case preserved
      expect(
        normalizeText(text, {
          lowerCase: false,
          stripListMarkers: true,
          removePunctuation: true,
          collapseWhitespace: true,
        })
      ).toBe("Hello World")
    })
  })

  describe("decodeHtmlEntities", () => {
    it("decodes entities to their standard characters", () => {
      expect(decodeHtmlEntities("&amp;")).toBe("&")
      expect(decodeHtmlEntities("&lt;")).toBe("<")
      expect(decodeHtmlEntities("&gt;")).toBe(">")
      expect(decodeHtmlEntities("&quot;")).toBe('"')
      expect(decodeHtmlEntities("&#39;")).toBe("'")
      expect(decodeHtmlEntities("&apos;")).toBe("'")
      expect(decodeHtmlEntities("&nbsp;")).toBe(" ")
    })
  })

  describe("hashText", () => {
    it("returns a consistent SHA-256 hash", () => {
      const hash1 = hashText("test content")
      const hash2 = hashText("test content")
      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64)
    })

    it("respects normalization differences", () => {
      const hash1 = hashText("Hello, World!")
      const hash2 = hashText("hello world")
      expect(hash1).toBe(hash2)
    })
  })

  describe("splitIntoBlocks", () => {
    it("splits text by double newlines into blocks", () => {
      const text = "Paragraph 1.\n\nParagraph 2.\n  \nParagraph 3."
      expect(splitIntoBlocks(text)).toEqual([
        "Paragraph 1.",
        "Paragraph 2.",
        "Paragraph 3.",
      ])
    })
  })

  describe("wordLevelDiff", () => {
    it("calculates inline difference for similar sentences", () => {
      const before = "We collect your email address."
      const after = "We collect your physical address."
      const { diffHtml, isSimilar } = wordLevelDiff(before, after)
      expect(isSimilar).toBe(true)
      expect(diffHtml).toContain('<del class="diff-word-removed">email</del>')
      expect(diffHtml).toContain('<ins class="diff-word-added">physical</ins>')
    })

    it("returns isSimilar=false for completely different sentences", () => {
      const before = "We collect your email address."
      const after = "You must be 18 years old to register."
      const { isSimilar } = wordLevelDiff(before, after)
      expect(isSimilar).toBe(false)
    })
  })

  describe("generateDiff", () => {
    it("detects added sentences within paragraphs", () => {
      const before = "We collect data. We store data."
      const after = "We collect data. We store data. We share data."
      const { diffLines } = generateDiff(before, after)
      const added = diffLines.filter((l) => l.startsWith("+ "))
      expect(added.length).toBeGreaterThan(0)
      expect(added.some((l) => l.includes("share"))).toBe(true)
    })

    it("detects removed sentences", () => {
      const before = "We collect data. We store data. We protect data."
      const after = "We collect data. We store data."
      const { diffLines } = generateDiff(before, after)
      const removed = diffLines.filter((l) => l.startsWith("- "))
      expect(removed.length).toBeGreaterThan(0)
      expect(removed.some((l) => l.includes("protect"))).toBe(true)
    })

    it("performs inline word-level diffing for modified sentences", () => {
      const before = "We collect your email address."
      const after = "We collect your billing address."
      const { diffHtml } = generateDiff(before, after)
      expect(diffHtml).toContain("diff-modified")
      expect(diffHtml).toContain("diff-word-removed")
      expect(diffHtml).toContain("diff-word-added")
    })

    it("preserves block-level paragraphs in HTML output", () => {
      const before = "Paragraph one.\n\nParagraph two."
      const after = "Paragraph one modified.\n\nParagraph two."
      const { diffHtml } = generateDiff(before, after)
      expect(diffHtml).toContain("diff-paragraph")
      const paragraphCount = (diffHtml.match(/class="diff-paragraph"/g) || [])
        .length
      expect(paragraphCount).toBe(2)
    })

    it("treats reordered sentences within a paragraph as unchanged", () => {
      const before =
        "We collect your data. We store it securely. We never share it."
      const after =
        "We never share it. We collect your data. We store it securely."
      const { diffLines } = generateDiff(before, after)
      const changed = diffLines.filter(
        (l) => l.startsWith("+ ") || l.startsWith("- ")
      )
      expect(changed.length).toBe(0)
    })

    it("treats reordered blocks as unchanged", () => {
      const before =
        "First paragraph content.\n\nSecond paragraph content.\n\nThird paragraph content."
      const after =
        "Third paragraph content.\n\nFirst paragraph content.\n\nSecond paragraph content."
      const { diffLines } = generateDiff(before, after)
      const changed = diffLines.filter(
        (l) => l.startsWith("+ ") || l.startsWith("- ")
      )
      expect(changed.length).toBe(0)
    })

    it("handles list formatting changes (adding numbering) without noise", () => {
      const before =
        "Data collection section.\nData storage section.\nData deletion section."
      const after =
        "1. Data collection section.\n2. Data storage section.\n3. Data deletion section."
      const { diffLines } = generateDiff(before, after)
      const unchanged = diffLines.filter((l) => l.startsWith("  "))
      expect(unchanged.length).toBeGreaterThan(0)
    })

    it("detects formatting-only changes as minimal noise", () => {
      const before = "Section 1: Introduction\nThis is the privacy policy."
      const after = "SECTION 1: INTRODUCTION\nThis is the privacy policy."
      const { diffLines } = generateDiff(before, after)
      const changed = diffLines.filter(
        (l) => l.startsWith("+ ") || l.startsWith("- ")
      )
      expect(changed.length).toBeLessThanOrEqual(1)
    })

    it("classifies numeric-only changes", () => {
      const before = "Star 51.3k\nFork 9.1k"
      const after = "Star 51.4k\nFork 9.2k"
      const classification = classifyDiff(before, after)
      expect(classification.category).toBe("numeric_only")
      expect(classification.hasNumericChanges).toBe(true)
      expect(classification.hasContentChanges).toBe(false)
    })

    it("classifies content changes", () => {
      const before = "We collect your email address."
      const after = "We collect your physical address."
      const classification = classifyDiff(before, after)
      expect(classification.hasContentChanges).toBe(true)
      expect(classification.category).toBe("content_change")
    })

    it("classifies formatting-only changes", () => {
      const before = "Hello World"
      const after = "HELLO WORLD"
      const classification = classifyDiff(before, after)
      expect(classification.category).toBe("formatting_only")
      expect(classification.hasFormattingChanges).toBe(true)
      expect(classification.hasContentChanges).toBe(false)
    })

    it("exposes similarity from wordLevelDiff", () => {
      const before = "We collect your email address."
      const after = "We collect your physical address."
      const result = wordLevelDiff(before, after)
      expect(result.isSimilar).toBe(true)
      expect(result.similarity).toBeGreaterThanOrEqual(0.4)
      expect(result.similarity).toBeLessThanOrEqual(1.0)
    })

    it("returns low similarity for completely different sentences", () => {
      const before = "We collect your email address."
      const after = "You must be 18 years old to register."
      const result = wordLevelDiff(before, after)
      expect(result.isSimilar).toBe(false)
      expect(result.similarity).toBeLessThan(0.4)
    })
  })

  describe("detectModifiedEntries with best-pair matching", () => {
    it("pairs adjacent removed→added as before (backward compatible)", () => {
      const entries: DiffEntry[] = [
        { type: "removed", text: "We collect your email." },
        { type: "added", text: "We collect your phone number." },
      ]
      const result = detectModifiedEntries(entries)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe("modified")
    })

    it("matches non-adjacent removed/added pairs by best similarity", () => {
      const entries: DiffEntry[] = [
        { type: "removed", text: "We collect your email address." },
        { type: "removed", text: "We store data in the cloud." },
        { type: "added", text: "We store data in secure servers." },
        { type: "added", text: "We collect your physical address." },
      ]
      const result = detectModifiedEntries(entries)
      const modified = result.filter((e) => e.type === "modified")
      // Both pairs should be matched as "modified" (not orphaned as separate removed/added)
      expect(modified.length).toBe(2)
    })

    it("leaves unmatched entries as-is when no similarity found", () => {
      const entries: DiffEntry[] = [
        { type: "removed", text: "We collect your email." },
        { type: "removed", text: "Data is stored securely." },
        { type: "added", text: "You must be 18 or older." },
        { type: "added", text: "Contact support for help." },
      ]
      const result = detectModifiedEntries(entries)
      const modified = result.filter((e) => e.type === "modified")
      expect(modified.length).toBe(0)
    })
  })

  describe("classifyDiff", () => {
    it("detects numeric_only category", () => {
      const result = classifyDiff("Stars: 51.3k", "Stars: 51.4k")
      expect(result.category).toBe("numeric_only")
      expect(result.hasNumericChanges).toBe(true)
      expect(result.summary).toContain("numeric")
    })

    it("detects formatting_only category", () => {
      const result = classifyDiff("Privacy Policy", "PRIVACY POLICY")
      expect(result.category).toBe("formatting_only")
      expect(result.hasFormattingChanges).toBe(true)
    })

    it("detects content_change category", () => {
      const result = classifyDiff(
        "We share data with third parties.",
        "We do not share data with third parties."
      )
      expect(result.category).toBe("content_change")
      expect(result.hasContentChanges).toBe(true)
      expect(result.blocksModified).toBeGreaterThan(0)
    })
  })
})
