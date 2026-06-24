import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  parseAIResponse,
  buildAIPrompt,
  reviewChangelogWithAI,
} from "../ai-reviewer"

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

describe("parseAIResponse", () => {
  it("parses valid JSON", () => {
    const input = JSON.stringify({
      isBreaking: false,
      fieldChanges: [],
      reviewNotes: "No changes needed",
    })
    const result = parseAIResponse(input)
    expect(result.isBreaking).toBe(false)
    expect(result.fieldChanges).toEqual([])
    expect(result.reviewNotes).toBe("No changes needed")
  })

  it("parses JSON wrapped in markdown code fences", () => {
    const input =
      '```json\n{"isBreaking":true,"fieldChanges":[],"reviewNotes":"Breaking"}\n```'
    const result = parseAIResponse(input)
    expect(result.isBreaking).toBe(true)
  })

  it("throws on invalid JSON", () => {
    expect(() => parseAIResponse("not json at all")).toThrow()
  })

  it("throws when isBreaking is missing", () => {
    expect(() =>
      parseAIResponse(JSON.stringify({ fieldChanges: [], reviewNotes: "ok" }))
    ).toThrow("isBreaking must be boolean")
  })

  it("throws when fieldChanges is not an array", () => {
    expect(() =>
      parseAIResponse(
        JSON.stringify({
          isBreaking: false,
          fieldChanges: "bad",
          reviewNotes: "ok",
        })
      )
    ).toThrow("fieldChanges must be array")
  })

  it("throws when reviewNotes is not a string", () => {
    expect(() =>
      parseAIResponse(
        JSON.stringify({
          isBreaking: false,
          fieldChanges: [],
          reviewNotes: 123,
        })
      )
    ).toThrow("reviewNotes must be string")
  })
})

describe("buildAIPrompt", () => {
  it("includes company fields and diff", () => {
    const company = {
      companyName: "TestCo",
      productName: "TestProduct",
      trainsOnDataByDefault: true,
      optOutAvailable: false,
      sourceUrl: "https://example.com/privacy",
    }
    const prompt = buildAIPrompt(
      company,
      "old text",
      "new text",
      "<span>diff</span>"
    )
    expect(prompt).toContain("TestCo")
    expect(prompt).toContain("TestProduct")
    expect(prompt).toContain("trainsOnDataByDefault: true")
    expect(prompt).toContain("<span>diff</span>")
    expect(prompt).toContain("old text")
    expect(prompt).toContain("new text")
  })
})

describe("reviewChangelogWithAI", () => {
  const mockAiRun = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockChain.resolveValue = []
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("updates company fields for non-breaking change", async () => {
    mockChain.then.mockImplementation((onfulfilled) => {
      // First call returns changelog, second returns company
      const callCount = mockDb.select.mock.calls.length
      if (callCount <= 1) {
        return Promise.resolve([
          {
            id: 1,
            companyId: 1,
            beforeText: "old",
            afterText: "new",
            diffHtml: "<span>diff</span>",
            status: "pending_review",
          },
        ]).then(onfulfilled)
      }
      return Promise.resolve([
        { id: 1, companyName: "TestCo", trainsOnDataByDefault: true },
      ]).then(onfulfilled)
    })

    mockAiRun.mockResolvedValue({
      response: JSON.stringify({
        isBreaking: false,
        fieldChanges: [
          {
            field: "trainsOnDataByDefault",
            oldValue: "true",
            newValue: "false",
            reasoning: "Changed",
          },
        ],
        reviewNotes: "Training policy changed",
      }),
    })

    const result = await reviewChangelogWithAI(1, { AI: { run: mockAiRun } })
    expect(result.isBreaking).toBe(false)
    expect(mockDb.update).toHaveBeenCalled()
  })

  it("leaves changelog pending for breaking change", async () => {
    mockChain.then.mockImplementation((onfulfilled) => {
      const callCount = mockDb.select.mock.calls.length
      if (callCount <= 1) {
        return Promise.resolve([
          {
            id: 1,
            companyId: 1,
            beforeText: "old",
            afterText: "new",
            diffHtml: "<span>diff</span>",
            status: "pending_review",
          },
        ]).then(onfulfilled)
      }
      return Promise.resolve([
        { id: 1, companyName: "TestCo", trainsOnDataByDefault: true },
      ]).then(onfulfilled)
    })

    mockAiRun.mockResolvedValue({
      response: JSON.stringify({
        isBreaking: true,
        fieldChanges: [
          {
            field: "trainsOnDataByDefault",
            oldValue: "true",
            newValue: "false",
            reasoning: "Major change",
          },
        ],
        reviewNotes: "Breaking policy change",
      }),
    })

    const result = await reviewChangelogWithAI(1, { AI: { run: mockAiRun } })
    expect(result.isBreaking).toBe(true)
  })

  it("treats parse failure as breaking change", async () => {
    mockChain.then.mockImplementation((onfulfilled) => {
      const callCount = mockDb.select.mock.calls.length
      if (callCount <= 1) {
        return Promise.resolve([
          {
            id: 1,
            companyId: 1,
            beforeText: "old",
            afterText: "new",
            diffHtml: "<span>diff</span>",
            status: "pending_review",
          },
        ]).then(onfulfilled)
      }
      return Promise.resolve([
        { id: 1, companyName: "TestCo", trainsOnDataByDefault: true },
      ]).then(onfulfilled)
    })

    mockAiRun.mockResolvedValue({ response: "not valid json" })

    const result = await reviewChangelogWithAI(1, { AI: { run: mockAiRun } })
    expect(result.isBreaking).toBe(true)
  })

  it("throws when changelog not found", async () => {
    mockChain.then.mockImplementation((onfulfilled) => {
      return Promise.resolve([]).then(onfulfilled)
    })
    await expect(
      reviewChangelogWithAI(999, { AI: { run: mockAiRun } })
    ).rejects.toThrow("Changelog 999 not found")
  })
})
