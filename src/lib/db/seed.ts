import { db } from "./index"
import { companies } from "./schema"
import { eq } from "drizzle-orm"
import seedData from "./seedData.json"

async function main() {
  console.log("Seeding database with AI companies privacy data...")

  for (const data of seedData) {
    // Check if company already exists
    const existing = await db
      .select()
      .from(companies)
      .where(eq(companies.companyKey, data.companyKey))
      .get()

    if (existing) {
      console.log(`Updating existing entry for ${data.companyName}...`)
      await db
        .update(companies)
        .set({
          companyName: data.companyName,
          productName: data.productName,
          trainsOnDataByDefault: data.trainsOnDataByDefault,
          trainsOnDataNuance: data.trainsOnDataNuance,
          optOutAvailable: data.optOutAvailable,
          optOutHow: data.optOutHow,
          retentionPeriod: data.retentionPeriod,
          dataDeletedOnRequest: data.dataDeletedOnRequest,
          dataDeletedOnRequestTimeframe: data.dataDeletedOnRequestTimeframe,
          thirdPartySharing: data.thirdPartySharing,
          humanReviewOfChats: data.humanReviewOfChats,
          humanReviewConditions: data.humanReviewConditions,
          regionalVariation: data.regionalVariation,
          childrenDataPolicy: data.childrenDataPolicy,
          enterpriseVsConsumerDifference: data.enterpriseVsConsumerDifference,
          enterpriseVsConsumerSummary: data.enterpriseVsConsumerSummary,
          sourceUrl: data.sourceUrl,
          lastVerifiedDate: data.lastVerifiedDate,
          lastChangedDate: data.lastChangedDate,
          confidence: data.confidence,
        })
        .where(eq(companies.companyKey, data.companyKey))
    } else {
      console.log(`Inserting new entry for ${data.companyName}...`)
      await db.insert(companies).values({
        companyKey: data.companyKey,
        companyName: data.companyName,
        productName: data.productName,
        trainsOnDataByDefault: data.trainsOnDataByDefault,
        trainsOnDataNuance: data.trainsOnDataNuance,
        optOutAvailable: data.optOutAvailable,
        optOutHow: data.optOutHow,
        retentionPeriod: data.retentionPeriod,
        dataDeletedOnRequest: data.dataDeletedOnRequest,
        dataDeletedOnRequestTimeframe: data.dataDeletedOnRequestTimeframe,
        thirdPartySharing: data.thirdPartySharing,
        humanReviewOfChats: data.humanReviewOfChats,
        humanReviewConditions: data.humanReviewConditions,
        regionalVariation: data.regionalVariation,
        childrenDataPolicy: data.childrenDataPolicy,
        enterpriseVsConsumerDifference: data.enterpriseVsConsumerDifference,
        enterpriseVsConsumerSummary: data.enterpriseVsConsumerSummary,
        sourceUrl: data.sourceUrl,
        lastVerifiedDate: data.lastVerifiedDate,
        lastChangedDate: data.lastChangedDate,
        confidence: data.confidence as any,
      })
    }
  }

  console.log("Seeding complete!")
}

main().catch((err) => {
  console.error("Seeding failed:", err)
  process.exit(1)
})
