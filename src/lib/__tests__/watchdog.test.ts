import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  stripHtmlToText,
  fetchPolicyText,
  checkCompany,
  handleWatchdogQueueMessage,
  runWatchdog,
  hashText,
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
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{}]),
    }),
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

    it("preserves standalone numeric content", () => {
      const html = `
        <p>Policy text.</p>
        2661833742547574305
        <p>More policy text.</p>
      `
      const result = stripHtmlToText(html)
      expect(result).toContain("2661833742547574305")
      expect(result).toContain("Policy text.")
      expect(result).toContain("More policy text.")
    })

    it("preserves standalone boolean content", () => {
      const html = `
        <p>Policy text.</p>
        true
        false
        <p>More policy text.</p>
      `
      const result = stripHtmlToText(html)
      expect(result).toContain("true")
      expect(result).toContain("false")
      expect(result).toContain("Policy text.")
      expect(result).toContain("More policy text.")
    })

    it("preserves content with number-boolean patterns", () => {
      const html = `
        <p>Policy text.</p>
        2661833742547574305 true
        false 5295044
        <p>More policy text.</p>
      `
      const result = stripHtmlToText(html)
      expect(result).toContain("2661833742547574305")
      expect(result).toContain("5295044")
      expect(result).toContain("Policy text.")
      expect(result).toContain("More policy text.")
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
