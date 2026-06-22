import { describe, it, expect } from "vitest"
import seedData from "../db/seedData.json"

describe("PrivacyGPT Seed Data Schema Validation", () => {
  it("should contain 34 companies (10 original + 31 new providers + 3 overlaps)", () => {
    expect(seedData).toHaveLength(34)
  })

  it("should have all required fields for every company profile", () => {
    seedData.forEach((company) => {
      expect(company).toHaveProperty("companyKey")
      expect(company).toHaveProperty("companyName")
      expect(company).toHaveProperty("productName")
      expect(company).toHaveProperty("trainsOnDataByDefault")
      expect(company).toHaveProperty("trainsOnDataNuance")
      expect(company).toHaveProperty("optOutAvailable")
      expect(company).toHaveProperty("optOutHow")
      expect(company).toHaveProperty("retentionPeriod")
      expect(company).toHaveProperty("dataDeletedOnRequest")
      expect(company).toHaveProperty("dataDeletedOnRequestTimeframe")
      expect(company).toHaveProperty("thirdPartySharing")
      expect(company).toHaveProperty("humanReviewOfChats")
      expect(company).toHaveProperty("humanReviewConditions")
      expect(company).toHaveProperty("regionalVariation")
      expect(company).toHaveProperty("childrenDataPolicy")
      expect(company).toHaveProperty("enterpriseVsConsumerDifference")
      expect(company).toHaveProperty("enterpriseVsConsumerSummary")
      expect(company).toHaveProperty("sourceUrl")
      expect(company).toHaveProperty("lastVerifiedDate")
      expect(company).toHaveProperty("confidence")
    })
  })

  it("should have valid confidence values", () => {
    const validConfidences = [
      "verified_from_policy_text",
      "inferred",
      "needs_review",
      "unverified",
    ]
    seedData.forEach((company) => {
      expect(validConfidences).toContain(company.confidence)
    })
  })

  it("should have valid boolean types for flags", () => {
    seedData.forEach((company) => {
      expect(typeof company.trainsOnDataByDefault).toBe("boolean")
      expect(typeof company.optOutAvailable).toBe("boolean")
      expect(typeof company.dataDeletedOnRequest).toBe("boolean")
      expect(typeof company.humanReviewOfChats).toBe("boolean")
      expect(typeof company.enterpriseVsConsumerDifference).toBe("boolean")
    })
  })

  it("should have correct URLs", () => {
    seedData.forEach((company) => {
      expect(company.sourceUrl).toMatch(/^https?:\/\//)
    })
  })
})
