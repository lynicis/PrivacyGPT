import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  stripHtmlToText,
  hashText,
  generateDiff,
  fetchPolicyText,
} from "../watchdog"
import FirecrawlApp from "@mendable/firecrawl-js"

vi.mock("@mendable/firecrawl-js")

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

    it("removes aside, form, and svg elements", () => {
      const html = `
        <aside>Sidebar content</aside>
        <form><input type="text" placeholder="Search"></form>
        <svg><path d="M0 0"></path></svg>
        <main>Important policy text.</main>
      `
      const result = stripHtmlToText(html)
      expect(result).not.toContain("Sidebar content")
      expect(result).not.toContain("Search")
      expect(result).toContain("Important policy text.")
    })

    it("removes lines that are only numbers (IDs)", () => {
      const html = `
        <p>Policy text.</p>
        2661833742547574305
        <p>More policy text.</p>
      `
      const result = stripHtmlToText(html)
      expect(result).not.toContain("2661833742547574305")
      expect(result).toContain("Policy text.")
      expect(result).toContain("More policy text.")
    })

    it("removes lines that are only booleans", () => {
      const html = `
        <p>Policy text.</p>
        true
        false
        <p>More policy text.</p>
      `
      const result = stripHtmlToText(html)
      expect(result).not.toContain("true")
      expect(result).not.toContain("false")
      expect(result).toContain("Policy text.")
      expect(result).toContain("More policy text.")
    })

    it("removes lines with number-boolean patterns", () => {
      const html = `
        <p>Policy text.</p>
        2661833742547574305 true
        false 5295044
        <p>More policy text.</p>
      `
      const result = stripHtmlToText(html)
      expect(result).not.toContain("2661833742547574305")
      expect(result).not.toContain("5295044")
      expect(result).toContain("Policy text.")
      expect(result).toContain("More policy text.")
    })

    it("cleans Google Help Center navigation junk", () => {
      const html = `
        <div>This help content &amp; information</div>
        <div>General Help Center experience</div>
        <div>Next Help Center Community Privacy Hub</div>
        <div>false</div>
        <div>Search Clear search Close search Main menu</div>
        <div>2661833742547574305</div>
        <div>true</div>
        <div>5295044</div>
        <main>Actual privacy policy content here.</main>
      `
      const result = stripHtmlToText(html)
      expect(result).not.toContain("This help content")
      expect(result).not.toContain("General Help Center experience")
      expect(result).not.toContain("2661833742547574305")
      expect(result).toContain("Actual privacy policy content here.")
    })
  })

  describe("hashText", () => {
    it("returns a consistent SHA-256 hash", () => {
      const hash1 = hashText("test content")
      const hash2 = hashText("test content")
      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64)
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

  describe("fetchPolicyText", () => {
    const originalEnv = process.env.FIRECRAWL_API_KEY
    const MockedFirecrawl = vi.mocked(FirecrawlApp)

    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn())
      MockedFirecrawl.mockClear()
    })

    afterEach(() => {
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
      if (originalEnv !== undefined) {
        process.env.FIRECRAWL_API_KEY = originalEnv
      } else {
        delete process.env.FIRECRAWL_API_KEY
      }
    })

    it("returns HTML content on successful fetch (no Firecrawl)", async () => {
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve("<p>Privacy policy text.</p>"),
      }
      vi.mocked(fetch).mockResolvedValue(mockResponse as any)

      const result = await fetchPolicyText("https://example.com/privacy")
      expect(result).not.toBeNull()
      expect(result!.text).toContain("Privacy policy text.")
      expect(fetch).toHaveBeenCalledOnce()
      expect(MockedFirecrawl).not.toHaveBeenCalled()
    })

    it("falls back to Firecrawl on HTTP 403", async () => {
      const blockedResponse = { ok: false, status: 403 }
      vi.mocked(fetch).mockResolvedValue(blockedResponse as any)

      const mockScrape = vi.fn().mockResolvedValue({
        markdown: "Firecrawl retrieved content.",
      })
      MockedFirecrawl.mockImplementation(function () {
        this.scrape = mockScrape
      })

      process.env.FIRECRAWL_API_KEY = "test-key"

      const result = await fetchPolicyText(
        "https://blocked.example.com/privacy"
      )
      expect(result).not.toBeNull()
      expect(result!.text).toContain("Firecrawl retrieved content.")
      expect(MockedFirecrawl).toHaveBeenCalledWith({
        apiKey: "test-key",
        apiUrl: "https://api.firecrawl.dev",
      })
      expect(mockScrape).toHaveBeenCalledWith(
        "https://blocked.example.com/privacy",
        expect.objectContaining({ formats: ["markdown"] })
      )
    })

    it("falls back to Firecrawl on network error", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("Network timeout"))

      const mockScrape = vi.fn().mockResolvedValue({
        markdown: "Firecrawl fallback content.",
      })
      MockedFirecrawl.mockImplementation(function () {
        this.scrape = mockScrape
      })

      process.env.FIRECRAWL_API_KEY = "test-key"

      const result = await fetchPolicyText(
        "https://timeout.example.com/privacy"
      )
      expect(result).not.toBeNull()
      expect(result!.text).toContain("Firecrawl fallback content.")
      expect(mockScrape).toHaveBeenCalledOnce()
    })

    it("returns null when both fetch and Firecrawl fail", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"))

      const mockScrape = vi
        .fn()
        .mockRejectedValue(new Error("Firecrawl API error"))
      MockedFirecrawl.mockImplementation(function () {
        this.scrape = mockScrape
      })

      process.env.FIRECRAWL_API_KEY = "test-key"

      const result = await fetchPolicyText("https://fail.example.com/privacy")
      expect(result).toBeNull()
    })

    it("returns null when no API key and fetch fails", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"))
      delete process.env.FIRECRAWL_API_KEY

      const result = await fetchPolicyText("https://fail.example.com/privacy")
      expect(result).toBeNull()
    })
  })
})
