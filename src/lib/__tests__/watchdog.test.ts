import { describe, it, expect } from "vitest"
import { stripHtmlToText, hashText, generateDiff } from "../watchdog"

describe("watchdog utilities", () => {
  describe("stripHtmlToText", () => {
    it("removes script and style tags entirely", () => {
      const html = `
        <html>
          <head><style>body { color: red; }</style></head>
          <body>
            <script>alert('hello')</script>
            <p>Visible text here.</p>
          </body>
        </html>
      `
      const result = stripHtmlToText(html)
      expect(result).not.toContain("alert")
      expect(result).not.toContain("color: red")
      expect(result).toContain("Visible text here.")
    })

    it("removes nav, header, and footer elements", () => {
      const html = `
        <nav><a href="/">Home</a></nav>
        <header><h1>Header Title</h1></header>
        <main><p>Main content here.</p></main>
        <footer>Copyright 2026</footer>
      `
      const result = stripHtmlToText(html)
      expect(result).not.toContain("Home")
      expect(result).not.toContain("Header Title")
      expect(result).not.toContain("Copyright 2026")
      expect(result).toContain("Main content here.")
    })

    it("decodes HTML entities", () => {
      const html = "<p>Terms &amp; Conditions &lt;important&gt;</p>"
      const result = stripHtmlToText(html)
      expect(result).toContain("Terms & Conditions <important>")
    })

    it("collapses whitespace", () => {
      const html = "<p>  Multiple   spaces   and\n\n\nnewlines  </p>"
      const result = stripHtmlToText(html)
      expect(result).not.toContain("  ")
      expect(result).toContain("Multiple spaces and newlines")
    })
  })

  describe("hashText", () => {
    it("returns a consistent SHA-256 hash", () => {
      const hash1 = hashText("test content")
      const hash2 = hashText("test content")
      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64) // SHA-256 hex digest
    })

    it("returns different hashes for different content", () => {
      const hash1 = hashText("content version 1")
      const hash2 = hashText("content version 2")
      expect(hash1).not.toBe(hash2)
    })
  })

  describe("generateDiff", () => {
    it("detects added sentences", () => {
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

    it("returns empty diff for identical content", () => {
      const text = "We collect data. We store data."
      const { diffLines } = generateDiff(text, text)
      expect(diffLines).toHaveLength(0)
    })

    it("generates HTML diff output", () => {
      const before = "Old policy text."
      const after = "New policy text."
      const { diffHtml } = generateDiff(before, after)
      expect(diffHtml).toContain("diff-removed")
      expect(diffHtml).toContain("diff-added")
    })
  })
})
