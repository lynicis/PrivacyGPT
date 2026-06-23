import { describe, it, expect, vi, beforeEach } from "vitest"
import { getCompanies, getChangelogs } from "../api"

const mockChain = {
  from: vi.fn().mockImplementation(() => mockChain),
  leftJoin: vi.fn().mockImplementation(() => mockChain),
  where: vi.fn().mockImplementation(() => mockChain),
  orderBy: vi.fn().mockImplementation(() => mockChain),
  limit: vi.fn().mockImplementation(() => mockChain),
  offset: vi.fn().mockImplementation(() => mockChain),
  then: vi.fn().mockImplementation((onfulfilled) => {
    return Promise.resolve(mockChain.resolveValue).then(onfulfilled)
  }),
  resolveValue: [] as any[],
}

const mockDb = {
  select: vi.fn().mockReturnValue(mockChain),
}

vi.mock(import("../db"), async (importOriginal) => {
  const original = (await importOriginal()) as any
  return {
    ...original,
    getDb: () => Promise.resolve(mockDb),
  }
})

describe("getCompaniesFn API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChain.resolveValue = []
  })

  it("calculates subscores and total scores, then returns paginated list and total count", async () => {
    mockChain.resolveValue = [
      {
        id: 1,
        companyName: "Company A",
        productName: "Product A",
        companyKey: "comp-a",
        trainsOnDataByDefault: true,
        trainsOnDataNuance: "Uses for training",
        optOutAvailable: true,
        optOutHow: "Through account settings toggle",
        retentionPeriod: "30 days",
        dataDeletedOnRequest: true,
        dataDeletedOnRequestTimeframe: "30 days",
        thirdPartySharing: "No sharing",
        humanReviewOfChats: true,
        humanReviewConditions: "Only on abuse",
        confidence: "verified_from_policy_text",
        sourceUrl: "https://example.com/a",
      },
      {
        id: 2,
        companyName: "Company B",
        productName: "Product B",
        companyKey: "comp-b",
        trainsOnDataByDefault: false,
        trainsOnDataNuance: "Does not train",
        optOutAvailable: true,
        optOutHow: "Send email",
        retentionPeriod: "60 days",
        dataDeletedOnRequest: false,
        dataDeletedOnRequestTimeframe: "None",
        thirdPartySharing: "Shared for analytics",
        humanReviewOfChats: false,
        humanReviewConditions: "No review",
        confidence: "verified_from_policy_text",
        sourceUrl: "https://example.com/b",
      },
    ]

    const result = await getCompanies({
      limit: 1,
      offset: 0,
    })

    expect(result.totalCount).toBe(2)
    expect(result.companies).toHaveLength(1)
    expect(result.companies[0].totalScore).toBeDefined()
    expect(result.companies[0].grade).toBeDefined()
  })

  it("filters out training-enabled companies if filterNoTraining is true", async () => {
    mockChain.resolveValue = [
      {
        id: 1,
        companyName: "Company A",
        productName: "Product A",
        companyKey: "comp-a",
        trainsOnDataByDefault: true,
        trainsOnDataNuance: "Uses for training",
        optOutAvailable: true,
        optOutHow: "Through account settings toggle",
        retentionPeriod: "30 days",
        dataDeletedOnRequest: true,
        dataDeletedOnRequestTimeframe: "30 days",
        thirdPartySharing: "No sharing",
        humanReviewOfChats: true,
        humanReviewConditions: "Only on abuse",
        confidence: "verified_from_policy_text",
        sourceUrl: "https://example.com/a",
      },
      {
        id: 2,
        companyName: "Company B",
        productName: "Product B",
        companyKey: "comp-b",
        trainsOnDataByDefault: false,
        trainsOnDataNuance: "Does not train",
        optOutAvailable: true,
        optOutHow: "Send email",
        retentionPeriod: "60 days",
        dataDeletedOnRequest: false,
        dataDeletedOnRequestTimeframe: "None",
        thirdPartySharing: "Shared for analytics",
        humanReviewOfChats: false,
        humanReviewConditions: "No review",
        confidence: "verified_from_policy_text",
        sourceUrl: "https://example.com/b",
      },
    ]

    const result = await getCompanies({
      filterNoTraining: true,
    })

    expect(result.totalCount).toBe(1)
    expect(result.companies[0].companyName).toBe("Company B")
  })
})

describe("getChangelogsFn API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChain.resolveValue = []
  })

  it("returns paginated and filtered changelogs", async () => {
    const mockLogs = [
      {
        id: 1,
        companyId: 1,
        detectedAt: "2026-06-22T12:00:00Z",
        beforeText: "before",
        afterText: "after",
        diffHtml: "diff",
        status: "pending_review",
        reviewNotes: null,
        reviewedAt: null,
        companyName: "Company A",
        companyKey: "comp-a",
      },
    ]

    mockChain.resolveValue = mockLogs

    const result = await getChangelogs({
      page: 0,
      pageSize: 10,
      companyFilter: "comp-a",
      statusFilter: "pending_review",
    })

    expect(result).toHaveProperty("changelogs")
    expect(result).toHaveProperty("totalCount")
    expect(result.changelogs).toHaveLength(1)
    expect(result.changelogs[0].companyName).toBe("Company A")
  })
})
