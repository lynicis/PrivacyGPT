import { getProp } from "./utils"
import { getDb } from "./db"
import { companies, changelogs } from "./db/schema"
import { eq } from "drizzle-orm"

interface FieldChange {
  field: string
  oldValue: string
  newValue: string
  reasoning: string
}

interface AIReviewResult {
  isBreaking: boolean
  fieldChanges: FieldChange[]
  reviewNotes: string
}

const COMPANY_FIELDS = [
  "trainsOnDataByDefault",
  "trainsOnDataNuance",
  "optOutAvailable",
  "optOutHow",
  "optOutUrl",
  "retentionPeriod",
  "dataDeletedOnRequest",
  "dataDeletedOnRequestTimeframe",
  "thirdPartySharing",
  "humanReviewOfChats",
  "humanReviewConditions",
  "regionalVariation",
  "childrenDataPolicy",
  "enterpriseVsConsumerDifference",
  "enterpriseVsConsumerSummary",
  "sourceUrl",
] as const

export function buildAIPrompt(
  company: Record<string, any>,
  beforeText: string,
  afterText: string,
  diffHtml: string
): string {
  const currentProfile = COMPANY_FIELDS.map(
    (f) => `- ${f}: ${String(getProp(company, f) ?? "N/A")}`
  ).join("\n")

  return `Company: ${company.companyName}
Product: ${company.productName}

CURRENT PROFILE:
${currentProfile}

POLICY CHANGE DIFF:
${diffHtml}

BEFORE (first 3000 chars):
${beforeText.slice(0, 3000)}

AFTER (first 3000 chars):
${afterText.slice(0, 3000)}

Analyze the diff. Determine:
1. Would any of the current profile fields above need to change?
2. If yes, what should each field change to?
3. Is this a breaking change (field values change) or non-breaking (wording/formatting only)?

Return ONLY valid JSON in this exact format:
{
  "isBreaking": true/false,
  "fieldChanges": [
    {
      "field": "fieldName",
      "oldValue": "current value",
      "newValue": "new value",
      "reasoning": "why this changes"
    }
  ],
  "reviewNotes": "Summary of what changed and why"
}`
}

export function parseAIResponse(raw: string): AIReviewResult {
  // Extract JSON from response (handle markdown code fences)
  let jsonStr = raw.trim()
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim()
  }

  const parsed = JSON.parse(jsonStr)

  if (typeof parsed.isBreaking !== "boolean") {
    throw new Error("Invalid AI response: isBreaking must be boolean")
  }
  if (!Array.isArray(parsed.fieldChanges)) {
    throw new Error("Invalid AI response: fieldChanges must be array")
  }
  if (typeof parsed.reviewNotes !== "string") {
    throw new Error("Invalid AI response: reviewNotes must be string")
  }

  return parsed as AIReviewResult
}

export async function reviewChangelogWithAI(
  changelogId: number,
  env: { AI: { run: (model: string, input: any) => Promise<any> } }
): Promise<{ success: boolean; isBreaking: boolean }> {
  const db = await getDb()

  // Fetch changelog
  const changelogRows = await db
    .select()
    .from(changelogs)
    .where(eq(changelogs.id, changelogId))
    .limit(1)

  if (changelogRows.length === 0) {
    throw new Error(`Changelog ${changelogId} not found`)
  }
  const changelog = changelogRows[0]

  // Fetch company
  const companyRows = await db
    .select()
    .from(companies)
    .where(eq(companies.id, changelog.companyId))
    .limit(1)

  if (companyRows.length === 0) {
    throw new Error(`Company ${changelog.companyId} not found`)
  }
  const company = companyRows[0]

  // Build prompt and call AI
  const prompt = buildAIPrompt(
    company,
    changelog.beforeText,
    changelog.afterText,
    changelog.diffHtml || ""
  )

  const response = await env.AI.run("@cf/meta/llama-3.2-3b-instruct", {
    messages: [
      {
        role: "system",
        content:
          "You are a privacy policy analyst for PrivacyGPT. Analyze a policy change diff and determine if it affects any of the company's structured profile fields. You must return ONLY valid JSON, no other text.",
      },
      { role: "user", content: prompt },
    ],
  })

  const aiOutput =
    typeof response === "string"
      ? response
      : response?.response || JSON.stringify(response)

  let result: AIReviewResult
  try {
    result = parseAIResponse(aiOutput)
  } catch {
    // Parse failure → treat as breaking (safe fallback)
    await db
      .update(changelogs)
      .set({
        status: "pending_review",
        reviewNotes: `AI Review: Failed to parse AI response. Raw: ${aiOutput.slice(0, 500)}`,
        reviewedAt: new Date().toISOString(),
      })
      .where(eq(changelogs.id, changelogId))
    return { success: true, isBreaking: true }
  }

  if (result.isBreaking) {
    // Breaking change → leave for human, add AI analysis
    await db
      .update(changelogs)
      .set({
        status: "pending_review",
        reviewNotes: `AI Review [BREAKING]: ${result.reviewNotes}`,
      })
      .where(eq(changelogs.id, changelogId))
    return { success: true, isBreaking: true }
  }

  // Non-breaking → update company fields
  const updateData: Record<string, any> = {}
  for (const change of result.fieldChanges) {
    if (change.field in company) {
      updateData[change.field] = change.newValue
    }
  }

  if (Object.keys(updateData).length > 0) {
    await db
      .update(companies)
      .set(updateData)
      .where(eq(companies.id, company.id))
  }

  // Mark changelog as reviewed
  const notesSummary =
    result.fieldChanges.length > 0
      ? `AI Review: Updated ${result.fieldChanges.map((c) => c.field).join(", ")}. ${result.reviewNotes}`
      : `AI Review: No field changes needed. ${result.reviewNotes}`

  await db
    .update(changelogs)
    .set({
      status: "reviewed",
      reviewNotes: notesSummary,
      reviewedAt: new Date().toISOString(),
    })
    .where(eq(changelogs.id, changelogId))

  return { success: true, isBreaking: false }
}
