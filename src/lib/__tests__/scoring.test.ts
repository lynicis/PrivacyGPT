import { describe, it, expect } from "vitest"
import { 
  calculateSubScores, 
  calculateTotalScore, 
  mapScoreToGrade,
  DEFAULT_WEIGHTS
} from "../scoring"

describe("PrivacyGPT Scoring Logic Validation", () => {
  // Test company: private by default, easy opt-out, no retention, full deletion, secure sharing, no human review (Perfect profile)
  const perfectCompany = {
    trainsOnDataByDefault: false,
    trainsOnDataNuance: "Data is private.",
    optOutAvailable: true,
    optOutHow: "Toggle in Settings.",
    retentionPeriod: "No retention.",
    dataDeletedOnRequest: true,
    dataDeletedOnRequestTimeframe: "Immediate deletion.",
    thirdPartySharing: "Zero sharing.",
    humanReviewOfChats: false,
    humanReviewConditions: "No reviews.",
  }

  // Test company: default training, difficult opt-out, long retention, partial deletion, ad sharing, human reviews (Worst profile)
  const worstCompany = {
    trainsOnDataByDefault: true,
    trainsOnDataNuance: "Trains on all chats.",
    optOutAvailable: true,
    optOutHow: "Fill out Right to Object form.",
    retentionPeriod: "Vague.",
    dataDeletedOnRequest: true,
    dataDeletedOnRequestTimeframe: "Ingested posts cannot be deleted.",
    thirdPartySharing: "Shared for targeted advertising.",
    humanReviewOfChats: true,
    humanReviewConditions: "Conversations are sampled and reviewed by humans.",
  }

  describe("calculateSubScores", () => {
    it("should calculate perfect subscores correctly", () => {
      const scores = calculateSubScores(perfectCompany)
      expect(scores.trainingScore).toBe(100)
      expect(scores.optOutScore).toBe(100)
      expect(scores.retentionScore).toBe(100)
      expect(scores.deletionScore).toBe(100)
      expect(scores.sharingScore).toBe(100)
      expect(scores.humanReviewScore).toBe(100)
    })

    it("should calculate worst subscores correctly", () => {
      const scores = calculateSubScores(worstCompany)
      expect(scores.trainingScore).toBe(0)
      expect(scores.optOutScore).toBe(40) // Form-based
      expect(scores.retentionScore).toBe(0) // Vague
      expect(scores.deletionScore).toBe(50) // Partial (cannot delete ingested posts)
      expect(scores.sharingScore).toBe(20) // Advertising
      expect(scores.humanReviewScore).toBe(30) // Standard review
    })

    it("should classify human review for safety/abuse correctly", () => {
      const safetyReviewCompany = {
        ...perfectCompany,
        humanReviewOfChats: true,
        humanReviewConditions: "Reviewed only for abuse reports and security violations.",
      }
      const scores = calculateSubScores(safetyReviewCompany)
      expect(scores.humanReviewScore).toBe(80) // Safety restricted
    })
  })

  describe("calculateTotalScore", () => {
    it("should return 100 for a perfect company", () => {
      const subScores = calculateSubScores(perfectCompany)
      const total = calculateTotalScore(subScores, DEFAULT_WEIGHTS)
      expect(total).toBe(100)
    })

    it("should return the correct weighted score for a mixed company", () => {
      const subScores = calculateSubScores(worstCompany)
      const total = calculateTotalScore(subScores, DEFAULT_WEIGHTS)
      
      // Expected math:
      // trainingScore: 0 * 30 = 0
      // optOutScore: 40 * 20 = 800
      // retentionScore: 0 * 15 = 0
      // deletionScore: 50 * 15 = 750
      // sharingScore: 20 * 10 = 200
      // humanReviewScore: 30 * 10 = 300
      // Sum = 800 + 750 + 200 + 300 = 2050
      // Total weight = 100
      // 2050 / 100 = 20.5 -> rounded to 21
      expect(total).toBe(21)
    })

    it("should respect custom weights re-adjustments", () => {
      const subScores = calculateSubScores(worstCompany)
      const customWeights = {
        trainingWeight: 100, // Only care about default training
        optOutWeight: 0,
        retentionWeight: 0,
        deletionWeight: 0,
        sharingWeight: 0,
        humanReviewWeight: 0,
      }
      const total = calculateTotalScore(subScores, customWeights)
      expect(total).toBe(0) // trainsByDefault is true, so 0 points
    })
  })

  describe("mapScoreToGrade", () => {
    it("should map scores to correct letter grades", () => {
      expect(mapScoreToGrade(100)).toBe("A+")
      expect(mapScoreToGrade(97)).toBe("A+")
      expect(mapScoreToGrade(95)).toBe("A")
      expect(mapScoreToGrade(91)).toBe("A-")
      expect(mapScoreToGrade(88)).toBe("B+")
      expect(mapScoreToGrade(84)).toBe("B")
      expect(mapScoreToGrade(81)).toBe("B-")
      expect(mapScoreToGrade(75)).toBe("C")
      expect(mapScoreToGrade(62)).toBe("D")
      expect(mapScoreToGrade(45)).toBe("F")
      expect(mapScoreToGrade(0)).toBe("F")
    })
  })
})
