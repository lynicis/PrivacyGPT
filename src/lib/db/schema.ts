import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Basic Info
  companyKey: text("company_key").unique().notNull(), // Unique slug, e.g., 'openai'
  companyName: text("company_name").notNull(), // e.g., 'OpenAI'
  productName: text("product_name").notNull(), // e.g., 'ChatGPT / API'

  // Data Training Defaults
  trainsOnDataByDefault: integer("trains_on_data_by_default", {
    mode: "boolean",
  }).notNull(),
  trainsOnDataNuance: text("trains_on_data_nuance").notNull(), // Explaining opt-outs, enterprise exceptions, etc.

  // Opt Out Policy
  optOutAvailable: integer("opt_out_available", { mode: "boolean" }).notNull(),
  optOutHow: text("opt_out_how").notNull(), // Settings toggle vs. support form, etc.
  optOutUrl: text("opt_out_url"), // Nullable — direct link to opt-out page

  // Retention & Deletion
  retentionPeriod: text("retention_period").notNull(), // E.g., '30 days if history disabled'
  dataDeletedOnRequest: integer("data_deleted_on_request", {
    mode: "boolean",
  }).notNull(),
  dataDeletedOnRequestTimeframe: text(
    "data_deleted_on_request_timeframe"
  ).notNull(),

  // Third Party Sharing
  thirdPartySharing: text("third_party_sharing").notNull(), // Summary of third-party terms

  // Human Review / Safety
  humanReviewOfChats: integer("human_review_of_chats", {
    mode: "boolean",
  }).notNull(),
  humanReviewConditions: text("human_review_conditions").notNull(), // Conditions under which humans read chats

  // Regional & Demographic
  regionalVariation: text("regional_variation").notNull(), // E.g., GDPR exceptions for EU
  childrenDataPolicy: text("children_data_policy").notNull(), // Minimum age requirements & child privacy terms

  // Consumer vs Enterprise Distinction
  enterpriseVsConsumerDifference: integer("enterprise_vs_consumer_difference", {
    mode: "boolean",
  }).notNull(),
  enterpriseVsConsumerSummary: text("enterprise_vs_consumer_summary").notNull(), // Key differences

  // Verification metadata
  sourceUrl: text("source_url").notNull(), // Primary privacy policy link
  lastVerifiedDate: text("last_verified_date").notNull(), // YYYY-MM-DD
  lastChangedDate: text("last_changed_date"), // YYYY-MM-DD (null if no known changes since last_verified_date)
  confidence: text("confidence").notNull(), // 'verified_from_policy_text' | 'inferred' | 'needs_review'
})

export const snapshots = sqliteTable("snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id")
    .references(() => companies.id)
    .notNull(),
  fetchedAt: text("fetched_at").notNull(), // ISO Timestamp
  contentHash: text("content_hash").notNull(),
  rawContent: text("raw_content").notNull(), // Markdown or HTML representation of the page
})

export const changelogs = sqliteTable("changelogs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id")
    .references(() => companies.id)
    .notNull(),
  detectedAt: text("detected_at").notNull(), // ISO Timestamp
  beforeText: text("before_text").notNull(),
  afterText: text("after_text").notNull(),
  diffHtml: text("diff_html"), // HTML diff for visualization
  status: text("status").notNull(), // 'pending_review' | 'reviewed'
  reviewNotes: text("review_notes"),
  reviewedAt: text("reviewed_at"), // ISO Timestamp
})
