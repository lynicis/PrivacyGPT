import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  stripHtmlToText,
  hashText,
  generateDiff,
  fetchPolicyText,
  checkCompany,
  handleWatchdogQueueMessage,
  runWatchdog,
  normalizeText,
  decodeHtmlEntities,
} from "../watchdog"
import FirecrawlApp from "@mendable/firecrawl-js"

const mockChain = {
  from: vi.fn().mockImplementation(() => mockChain),
  where: vi.fn().mockImplementation(() => mockChain),
  orderBy: vi.fn().mockImplementation(() => mockChain),
  limit: vi.fn().mockImplementation(() => mockChain),
  then: vi.fn().mockImplementation((onfulfilled) => {
    return Promise.resolve(mockChain.resolveValue).then(onfulfilled)
  }),
  resolveValue: [] as any[],
}

const mockDb = {
  select: vi.fn().mockReturnValue(mockChain),
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockResolvedValue({}),
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({}),
    }),
  }),
}

vi.mock(import("../db"), async (importOriginal) => {
  const original = (await importOriginal()) as any
  return {
    ...original,
    getDb: () => Promise.resolve(mockDb),
  }
})

const mockQueueSend = vi.fn()
vi.mock("cloudflare:workers", () => {
  return {
    env: {
      WATCHDOG_QUEUE: {
        send: (...args: any[]) => mockQueueSend(...args),
      },
    },
  }
})

vi.mock("@mendable/firecrawl-js")

describe("watchdog utilities", () => {
  describe("normalizeText", () => {
    it("converts text to lowercase", () => {
      expect(normalizeText("HELLO WORLD")).toBe("hello world")
      expect(normalizeText("Hello World")).toBe("hello world")
    })

    it("strips numbered list markers", () => {
      expect(normalizeText("1. First item")).toBe("first item")
      expect(normalizeText("2) Second item")).toBe("second item")
      expect(normalizeText("10. Tenth item")).toBe("tenth item")
    })

    it("strips bullet markers", () => {
      expect(normalizeText("* Bullet item")).toBe("bullet item")
      expect(normalizeText("- Dash item")).toBe("dash item")
    })

    it("removes punctuation", () => {
      expect(normalizeText("Hello, world!")).toBe("hello world")
      expect(normalizeText("Terms & Conditions")).toBe("terms conditions")
      expect(normalizeText("Price: $99.99")).toBe("price 99 99")
    })

    it("collapses whitespace", () => {
      expect(normalizeText("  Multiple   spaces  ")).toBe("multiple spaces")
      expect(normalizeText("Line1\nLine2")).toBe("line1 line2")
    })

    it("normalizes identical formatting differences", () => {
      const text1 = "Is my data used for model training?"
      const text2 = "IS MY DATA USED FOR MODEL TRAINING?"
      expect(normalizeText(text1)).toBe(normalizeText(text2))
    })

    it("normalizes list formatting differences", () => {
      const text1 = "1. Select Vibe under Manage"
      const text2 = "Select Vibe under Manage"
      expect(normalizeText(text1)).toBe(normalizeText(text2))
    })

    it("detects actual content changes", () => {
      const text1 = "We collect your data for training"
      const text2 = "We do not collect your data for training"
      expect(normalizeText(text1)).not.toBe(normalizeText(text2))
    })

    it("normalizes text with HTML entities correctly", () => {
      const text1 = "User Privacy &gt; StepFun"
      const text2 = "User Privacy > StepFun"
      expect(normalizeText(text1)).toBe(normalizeText(text2))
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

    it("returns same hash for formatting differences", () => {
      const hash1 = hashText("Is my data used for training?")
      const hash2 = hashText("IS MY DATA USED FOR TRAINING?")
      expect(hash1).toBe(hash2)
    })

    it("returns same hash for list formatting differences", () => {
      const hash1 = hashText("1. Select Vibe under Manage")
      const hash2 = hashText("Select Vibe under Manage")
      expect(hash1).toBe(hash2)
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

    it("returns only unchanged lines for identical content", () => {
      const text = "We collect data. We store data."
      const { diffLines } = generateDiff(text, text)
      // All lines should be unchanged (no +/- prefixes)
      expect(diffLines.every((l) => l.startsWith("  "))).toBe(true)
      expect(diffLines.filter((l) => l.startsWith("+ "))).toHaveLength(0)
      expect(diffLines.filter((l) => l.startsWith("- "))).toHaveLength(0)
    })

    it("generates HTML diff output with all three types", () => {
      const before = "We collect data. We store data."
      const after = "We collect data. We share data."
      const { diffHtml } = generateDiff(before, after)
      expect(diffHtml).toContain("diff-removed")
      expect(diffHtml).toContain("diff-added")
      expect(diffHtml).toContain("diff-unchanged")
    })

    it("ignores case differences", () => {
      const before = "Is my data used for training?"
      const after = "IS MY DATA USED FOR TRAINING?"
      const { diffLines } = generateDiff(before, after)
      // Should be marked as unchanged since normalization makes them equal
      expect(diffLines.every((l) => l.startsWith("  "))).toBe(true)
    })

    it("ignores list formatting differences", () => {
      const before = "1. Select Vibe under Manage"
      const after = "Select Vibe under Manage"
      const { diffLines } = generateDiff(before, after)
      // Should be marked as unchanged since normalization makes them equal
      expect(diffLines.every((l) => l.startsWith("  "))).toBe(true)
    })

    it("ignores punctuation differences", () => {
      const before = "Hello, world!"
      const after = "Hello world"
      const { diffLines } = generateDiff(before, after)
      // Should be marked as unchanged since normalization makes them equal
      expect(diffLines.every((l) => l.startsWith("  "))).toBe(true)
    })

    it("preserves order of unchanged context between additions", () => {
      const before = "A. B. C."
      const after = "A. D. C."
      const { diffLines } = generateDiff(before, after)
      // Should have: unchanged A, removed B, added D, unchanged C
      const aIdx = diffLines.findIndex((l) => l.includes("A"))
      const bIdx = diffLines.findIndex(
        (l) => l.startsWith("- ") && l.includes("B")
      )
      const dIdx = diffLines.findIndex(
        (l) => l.startsWith("+ ") && l.includes("D")
      )
      const cIdx = diffLines.findIndex((l) => l.includes("C"))
      expect(aIdx).toBeLessThan(bIdx)
      expect(bIdx).toBeLessThan(dIdx)
      expect(dIdx).toBeLessThan(cIdx)
    })

    it("handles completely replaced content", () => {
      const before = "We collect data."
      const after = "We share data."
      const { diffLines } = generateDiff(before, after)
      const removed = diffLines.filter((l) => l.startsWith("- "))
      const added = diffLines.filter((l) => l.startsWith("+ "))
      expect(removed.length).toBe(1)
      expect(added.length).toBe(1)
    })

    it("handles empty 'before' text", () => {
      const after = "New policy text."
      const { diffLines } = generateDiff("", after)
      expect(diffLines).toHaveLength(1)
      expect(diffLines[0].startsWith("+ ")).toBe(true)
    })

    it("handles empty 'after' text", () => {
      const before = "Old policy text."
      const { diffLines } = generateDiff(before, "")
      expect(diffLines).toHaveLength(1)
      expect(diffLines[0].startsWith("- ")).toBe(true)
    })

    it("handles both empty texts", () => {
      const { diffLines } = generateDiff("", "")
      expect(diffLines).toHaveLength(0)
    })

    it("preserves original text casing in unchanged lines", () => {
      const before = "Is my data used for training?"
      const after = "IS MY DATA USED FOR TRAINING?"
      // These are considered the same after normalization
      const { diffLines } = generateDiff(before, after)
      // Should show as unchanged with the original text (before's casing)
      expect(diffLines).toHaveLength(1)
      expect(diffLines[0].startsWith("  ")).toBe(true)
      expect(diffLines[0]).toContain("Is my data used for training?")
    })

    it("detects multi-sentence changes with context", () => {
      const before =
        "We collect data. We store data. We protect data. We share data."
      const after =
        "We collect data. We protect data. We share data with partners."
      const { diffLines } = generateDiff(before, after)
      // "We store data." should be removed
      const removed = diffLines.filter((l) => l.startsWith("- "))
      expect(removed.some((l) => l.includes("store"))).toBe(true)
      // "We share data with partners." should be added
      const added = diffLines.filter((l) => l.startsWith("+ "))
      expect(added.some((l) => l.includes("with partners"))).toBe(true)
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

  describe("watchdog pipeline & queue", () => {
    beforeEach(() => {
      vi.clearAllMocks()
      vi.stubGlobal("fetch", vi.fn())
      mockChain.then.mockImplementation((onfulfilled) => {
        return Promise.resolve(mockChain.resolveValue).then(onfulfilled)
      })
      mockChain.resolveValue = []
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    describe("checkCompany", () => {
      it("throws if company is not found", async () => {
        mockChain.resolveValue = [] // No company
        await expect(checkCompany(999)).rejects.toThrow(
          "Company with ID 999 not found"
        )
      })

      it("throws if fetchPolicyText returns null", async () => {
        mockChain.resolveValue = [
          {
            id: 1,
            companyName: "Test Company",
            sourceUrl: "https://example.com",
          },
        ]
        vi.mocked(fetch).mockResolvedValue({ ok: false } as any) // fails fetch
        await expect(checkCompany(1)).rejects.toThrow(
          "Failed to fetch policy text for Test Company"
        )
      })

      it("stores baseline snapshot if no previous snapshot exists", async () => {
        let selectCount = 0
        mockChain.then.mockImplementation((onfulfilled) => {
          selectCount++
          if (selectCount === 1) {
            return Promise.resolve([
              {
                id: 1,
                companyName: "Test Company",
                sourceUrl: "https://example.com",
              },
            ]).then(onfulfilled)
          }
          return Promise.resolve([]).then(onfulfilled)
        })

        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          text: () => Promise.resolve("Baseline policy text"),
        } as any)

        await checkCompany(1)

        expect(mockDb.insert).toHaveBeenCalledWith(expect.anything()) // snapshots
      })

      it("does nothing if snapshot hash matches", async () => {
        let selectCount = 0
        mockChain.then.mockImplementation((onfulfilled) => {
          selectCount++
          if (selectCount === 1) {
            return Promise.resolve([
              {
                id: 1,
                companyName: "Test Company",
                sourceUrl: "https://example.com",
              },
            ]).then(onfulfilled)
          }
          const text = "Same policy text"
          const hash = hashText(text)
          return Promise.resolve([
            { id: 1, companyId: 1, contentHash: hash, rawContent: text },
          ]).then(onfulfilled)
        })

        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          text: () => Promise.resolve("Same policy text"),
        } as any)

        const insertSpy = vi.spyOn(mockDb, "insert")
        await checkCompany(1)
        expect(insertSpy).not.toHaveBeenCalled()
      })

      it("inserts snapshot, changelog, and updates company lastChangedDate if change detected", async () => {
        let selectCount = 0
        mockChain.then.mockImplementation((onfulfilled) => {
          selectCount++
          if (selectCount === 1) {
            return Promise.resolve([
              {
                id: 1,
                companyName: "Test Company",
                sourceUrl: "https://example.com",
              },
            ]).then(onfulfilled)
          }
          return Promise.resolve([
            {
              id: 1,
              companyId: 1,
              contentHash: "oldhash",
              rawContent: "Old text",
            },
          ]).then(onfulfilled)
        })

        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          text: () => Promise.resolve("New policy text"),
        } as any)

        await checkCompany(1)
        expect(mockDb.insert).toHaveBeenCalledTimes(2) // changelog & snapshot
        expect(mockDb.update).toHaveBeenCalled() // update company
      })
    })

    describe("handleWatchdogQueueMessage", () => {
      it("throws on invalid message body", async () => {
        await expect(handleWatchdogQueueMessage(null as any)).rejects.toThrow(
          "Invalid watchdog queue message body"
        )
        await expect(handleWatchdogQueueMessage({} as any)).rejects.toThrow(
          "Invalid watchdog queue message body"
        )
      })

      it("calls checkCompany with companyId", async () => {
        let selectCount = 0
        mockChain.then.mockImplementation((onfulfilled) => {
          selectCount++
          if (selectCount === 1) {
            return Promise.resolve([
              {
                id: 1,
                companyName: "Test Company",
                sourceUrl: "https://example.com",
              },
            ]).then(onfulfilled)
          }
          return Promise.resolve([]).then(onfulfilled)
        })

        vi.mocked(fetch).mockResolvedValue({
          ok: true,
          text: () => Promise.resolve("Policy text"),
        } as any)

        await handleWatchdogQueueMessage({ companyId: 1 })
        expect(mockDb.select).toHaveBeenCalled()
      })
    })

    describe("runWatchdog queue behavior", () => {
      it("enqueues check if queue binding exists", async () => {
        mockChain.resolveValue = [
          { id: 1, companyName: "A", sourceUrl: "url1" },
          { id: 2, companyName: "B", sourceUrl: "url2" },
        ]

        mockQueueSend.mockResolvedValue(undefined)

        const result = await runWatchdog()
        expect(result).toEqual({ enqueued: 2 })
        expect(mockQueueSend).toHaveBeenCalledTimes(2)
        expect(mockQueueSend).toHaveBeenNthCalledWith(1, { companyId: 1 })
        expect(mockQueueSend).toHaveBeenNthCalledWith(2, { companyId: 2 })
      })
    })
  })
})
