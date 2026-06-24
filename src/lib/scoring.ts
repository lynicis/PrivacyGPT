/**
 * Calculates individual points (0-100) for the six sub-categories
 */
export function calculateSubScores(company: {
  trainsOnDataByDefault: boolean
  trainsOnDataNuance: string
  optOutAvailable: boolean
  optOutHow: string
  retentionPeriod: string
  dataDeletedOnRequest: boolean
  dataDeletedOnRequestTimeframe: string
  thirdPartySharing: string
  humanReviewOfChats: boolean
  humanReviewConditions: string
}): {
  trainingScore: number
  optOutScore: number
  retentionScore: number
  deletionScore: number
  sharingScore: number
  humanReviewScore: number
} {
  // 1. Model Training
  const trainingScore = company.trainsOnDataByDefault ? 0 : 100

  // 2. Opt-Out Ease
  let optOutScore = 0
  if (company.optOutAvailable) {
    const optOutText = company.optOutHow.toLowerCase()
    if (
      optOutText.includes("form") ||
      optOutText.includes("request") ||
      optOutText.includes("object") ||
      optOutText.includes("email") ||
      optOutText.includes("support")
    ) {
      optOutScore = 40 // Harder opt-out (form or email)
    } else {
      optOutScore = 100 // Easy toggle or default off
    }
  }

  // 3. Retention length
  let retentionScore = 0
  const retentionText = company.retentionPeriod.toLowerCase()
  if (
    retentionText.includes("no retention") ||
    retentionText.includes("never stored") ||
    retentionText.includes("not stored") ||
    retentionText.includes("zero retention") ||
    retentionText.startsWith("0 ")
  ) {
    retentionScore = 100
  } else if (
    retentionText.includes("30 days") ||
    retentionText.includes("30-day") ||
    retentionText.includes("1 month")
  ) {
    retentionScore = 80
  } else if (
    retentionText.includes("18 months") ||
    retentionText.includes("3 months") ||
    retentionText.includes("36 months") ||
    retentionText.includes("user-specified") ||
    retentionText.includes("adjustable") ||
    retentionText.includes("activity")
  ) {
    retentionScore = 50
  }

  // 4. Deletion rights
  let deletionScore = 0
  if (company.dataDeletedOnRequest) {
    const deletionText = company.dataDeletedOnRequestTimeframe.toLowerCase()
    if (
      deletionText.includes("cannot be") ||
      deletionText.includes("cannot easily") ||
      deletionText.includes("ingested") ||
      deletionText.includes("posts") ||
      deletionText.includes("except") ||
      deletionText.includes("partial")
    ) {
      deletionScore = 50 // Partial deletion (cannot remove trained posts)
    } else {
      deletionScore = 100
    }
  }

  // 5. Third Party Sharing
  let sharingScore = 85 // Standard business vendors
  const sharingText = company.thirdPartySharing.toLowerCase()
  if (
    sharingText.includes("vpc") ||
    sharingText.includes("never share") ||
    sharingText.includes("does not share") ||
    sharingText.includes("zero sharing") ||
    sharingText.includes("not shared")
  ) {
    sharingScore = 100
  } else if (
    sharingText.includes("advertising") ||
    sharingText.includes("target") ||
    sharingText.includes("ads") ||
    sharingText.includes("sell")
  ) {
    sharingScore = 20
  }

  // 6. Human Review
  let humanReviewScore = 30 // Standard training reviewers
  if (!company.humanReviewOfChats) {
    humanReviewScore = 100
  } else {
    const reviewText = company.humanReviewConditions.toLowerCase()
    if (
      reviewText.includes("abuse") ||
      reviewText.includes("security") ||
      reviewText.includes("incident") ||
      reviewText.includes("restricted to") ||
      reviewText.includes("investigation") ||
      reviewText.includes("flagged")
    ) {
      humanReviewScore = 80 // Safety reviews only
    }
  }

  return {
    trainingScore,
    optOutScore,
    retentionScore,
    deletionScore,
    sharingScore,
    humanReviewScore,
  }
}

/**
 * Calculates total weighted score (0-100)
 */
export function calculateTotalScore(
  subScores: {
    trainingScore: number
    optOutScore: number
    retentionScore: number
    deletionScore: number
    sharingScore: number
    humanReviewScore: number
  },
  weights: {
    trainingWeight: number
    optOutWeight: number
    retentionWeight: number
    deletionWeight: number
    sharingWeight: number
    humanReviewWeight: number
  }
): number {
  const totalWeight =
    weights.trainingWeight +
    weights.optOutWeight +
    weights.retentionWeight +
    weights.deletionWeight +
    weights.sharingWeight +
    weights.humanReviewWeight

  if (totalWeight === 0) return 0

  const weightedSum =
    subScores.trainingScore * weights.trainingWeight +
    subScores.optOutScore * weights.optOutWeight +
    subScores.retentionScore * weights.retentionWeight +
    subScores.deletionScore * weights.deletionWeight +
    subScores.sharingScore * weights.sharingWeight +
    subScores.humanReviewScore * weights.humanReviewWeight

  return Math.round(weightedSum / totalWeight)
}

/**
 * Maps numerical score (0-100) to a letter grade
 */
export function mapScoreToGrade(score: number): string {
  if (score >= 97) return "A+"
  if (score >= 93) return "A"
  if (score >= 90) return "A-"
  if (score >= 87) return "B+"
  if (score >= 83) return "B"
  if (score >= 80) return "B-"
  if (score >= 70) return "C"
  if (score >= 60) return "D"
  return "F"
}
