# Add Cursor, Trae, Windsurf, and Devin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Cursor (Anysphere), Trae (ByteDance), Windsurf (Codeium), and Devin (Cognition) privacy profile seed records to the database.

**Architecture:** Append new JSON records to the source of truth file, verify with tests, run the db seed command, and run linting/typechecking.

**Tech Stack:** Bun, TypeScript, Drizzle ORM, Vitest, SQLite

---

### Task 1: Add Cursor (Anysphere) Record

**Files:**

- Modify: `src/lib/db/seedData.json`

**Step 1: Write the failing test**

We modify `src/lib/__tests__/schema.test.ts` to expect 36 companies instead of 35.

```typescript
it("should contain 36 companies (10 original + 31 new providers + 3 overlaps + 1 opencode + 1 new cursor)", () => {
  expect(seedData).toHaveLength(36)
})
```

**Step 2: Run test to verify it fails**

Run: `bun run test`
Expected: FAIL (assertion error: expected 35 to be 36)

**Step 3: Write minimal implementation**

Append the Cursor (Anysphere) JSON object to the end of `src/lib/db/seedData.json`.

```json
{
  "companyKey": "anysphere",
  "companyName": "Anysphere",
  "productName": "Cursor",
  "trainsOnDataByDefault": true,
  "trainsOnDataNuance": "Free and Pro accounts train on your prompts and code. Business and Enterprise tiers turn off training by default.",
  "optOutAvailable": true,
  "optOutHow": "Toggle Privacy Mode in Cursor settings (General tab) or in your online account settings.",
  "optOutUrl": "https://www.cursor.com/privacy",
  "retentionPeriod": "Cursor retains data when Privacy Mode is off. Turning it on ensures zero data retention for upstream models, and Cursor avoids storing prompts.",
  "dataDeletedOnRequest": true,
  "dataDeletedOnRequestTimeframe": "You can request account deletion to remove personal data, though the company keeps anonymous telemetry.",
  "thirdPartySharing": "Sends data to OpenAI and Anthropic under zero data retention terms when you use Privacy Mode.",
  "humanReviewOfChats": true,
  "humanReviewConditions": "Staff review conversations only if automated filters trigger safety or abuse alerts.",
  "regionalVariation": "GDPR protections apply for EU and UK users, including data deletion and processing objection.",
  "childrenDataPolicy": "Requires users to be at least 13 years old.",
  "enterpriseVsConsumerDifference": true,
  "enterpriseVsConsumerSummary": "Enterprise plans enable Privacy Mode by default, ensuring zero data retention and no model training.",
  "sourceUrl": "https://www.cursor.com/privacy",
  "lastVerifiedDate": "2026-06-23",
  "lastChangedDate": null,
  "confidence": "verified_from_policy_text"
}
```

**Step 4: Run test to verify it passes**

Run: `bun run test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/db/seedData.json src/lib/__tests__/schema.test.ts
git commit -m "feat: add Cursor (Anysphere) to seed data"
```

---

### Task 2: Add Trae (ByteDance) Record

**Files:**

- Modify: `src/lib/db/seedData.json`
- Modify: `src/lib/__tests__/schema.test.ts`

**Step 1: Write the failing test**

We modify `src/lib/__tests__/schema.test.ts` to expect 37 companies instead of 36.

```typescript
it("should contain 37 companies (10 original + 31 new providers + 3 overlaps + 1 opencode + 2 new)", () => {
  expect(seedData).toHaveLength(37)
})
```

**Step 2: Run test to verify it fails**

Run: `bun run test`
Expected: FAIL (assertion error: expected 36 to be 37)

**Step 3: Write minimal implementation**

Append the Trae (ByteDance) JSON object to the end of `src/lib/db/seedData.json`.

```json
{
  "companyKey": "bytedance",
  "companyName": "ByteDance",
  "productName": "Trae",
  "trainsOnDataByDefault": true,
  "trainsOnDataNuance": "Stores and uses your chat history and code snippets for AI training unless you turn on Privacy Mode.",
  "optOutAvailable": true,
  "optOutHow": "Turn on Privacy Mode in the IDE settings. This requires you to stay logged in.",
  "optOutUrl": "https://www.trae.ai/privacy-policy",
  "retentionPeriod": "Privacy Mode stops training on your data. Otherwise, the app stores chat history and telemetry for optimization.",
  "dataDeletedOnRequest": true,
  "dataDeletedOnRequestTimeframe": "Account deletion removes personal files and info. Telemetry data may persist.",
  "thirdPartySharing": "Shares telemetry and logs with ByteDance and affiliates. The app deletes plaintext codebase files after computing embeddings.",
  "humanReviewOfChats": true,
  "humanReviewConditions": "Staff review conversations and telemetry to check for policy violations and security issues.",
  "regionalVariation": "Operated by TikTok USDS Joint Venture LLC in the US, with specific regional telemetry policies.",
  "childrenDataPolicy": "The IDE is not for children under 13.",
  "enterpriseVsConsumerDifference": false,
  "enterpriseVsConsumerSummary": "All accounts use the same privacy policy. You can exclude specific files using a .aiignore file.",
  "sourceUrl": "https://www.trae.ai/privacy-policy",
  "lastVerifiedDate": "2026-06-23",
  "lastChangedDate": null,
  "confidence": "verified_from_policy_text"
}
```

**Step 4: Run test to verify it passes**

Run: `bun run test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/db/seedData.json src/lib/__tests__/schema.test.ts
git commit -m "feat: add Trae (ByteDance) to seed data"
```

---

### Task 3: Add Windsurf (Codeium) Record

**Files:**

- Modify: `src/lib/db/seedData.json`
- Modify: `src/lib/__tests__/schema.test.ts`

**Step 1: Write the failing test**

We modify `src/lib/__tests__/schema.test.ts` to expect 38 companies instead of 37.

```typescript
it("should contain 38 companies (10 original + 31 new providers + 3 overlaps + 1 opencode + 3 new)", () => {
  expect(seedData).toHaveLength(38)
})
```

**Step 2: Run test to verify it fails**

Run: `bun run test`
Expected: FAIL (assertion error: expected 37 to be 38)

**Step 3: Write minimal implementation**

Append the Windsurf (Codeium) JSON object to the end of `src/lib/db/seedData.json`.

```json
{
  "companyKey": "codeium",
  "companyName": "Codeium",
  "productName": "Windsurf",
  "trainsOnDataByDefault": false,
  "trainsOnDataNuance": "Does not train models on private user code. Zero Data Retention is active by default.",
  "optOutAvailable": true,
  "optOutHow": "Zero Data Retention is active by default. You can adjust telemetry settings in your web profile or extension options.",
  "optOutUrl": "https://codeium.com/privacy",
  "retentionPeriod": "The servers do not store plaintext code. The app keeps telemetry data to monitor performance.",
  "dataDeletedOnRequest": true,
  "dataDeletedOnRequestTimeframe": "You can delete your account and associated metadata by contacting support.",
  "thirdPartySharing": "Uses telemetry internally. Under Zero Data Retention, the app processes code in transit and does not share it for model training.",
  "humanReviewOfChats": false,
  "humanReviewConditions": "No human reviews private code or chat history. Telemetry is reviewed to monitor performance.",
  "regionalVariation": "EU users have standard GDPR rights, including data access and deletion.",
  "childrenDataPolicy": "Intended for users 13 years of age or older.",
  "enterpriseVsConsumerDifference": true,
  "enterpriseVsConsumerSummary": "Teams and Enterprise plans offer dedicated deployment options and guaranteed Zero Data Retention. Cognition acquired the brand in 2025.",
  "sourceUrl": "https://codeium.com/privacy",
  "lastVerifiedDate": "2026-06-23",
  "lastChangedDate": null,
  "confidence": "verified_from_policy_text"
}
```

**Step 4: Run test to verify it passes**

Run: `bun run test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/db/seedData.json src/lib/__tests__/schema.test.ts
git commit -m "feat: add Windsurf (Codeium) to seed data"
```

---

### Task 4: Add Devin (Cognition) Record

**Files:**

- Modify: `src/lib/db/seedData.json`
- Modify: `src/lib/__tests__/schema.test.ts`

**Step 1: Write the failing test**

We modify `src/lib/__tests__/schema.test.ts` to expect 39 companies instead of 38.

```typescript
it("should contain 39 companies (10 original + 31 new providers + 3 overlaps + 1 opencode + 4 new)", () => {
  expect(seedData).toHaveLength(39)
})
```

**Step 2: Run test to verify it fails**

Run: `bun run test`
Expected: FAIL (assertion error: expected 38 to be 39)

**Step 3: Write minimal implementation**

Append the Devin (Cognition) JSON object to the end of `src/lib/db/seedData.json`.

```json
{
  "companyKey": "cognition",
  "companyName": "Cognition",
  "productName": "Devin",
  "trainsOnDataByDefault": false,
  "trainsOnDataNuance": "Does not use customer data to train models unless you explicitly opt in.",
  "optOutAvailable": false,
  "optOutHow": "Not applicable because training is off by default. You can email security@cognition.ai for specific data requests.",
  "optOutUrl": "https://www.cognition.ai/privacy-policy",
  "retentionPeriod": "Retains customer data for the duration of the business relationship. The app keeps feedback and interaction logs as long as needed.",
  "dataDeletedOnRequest": true,
  "dataDeletedOnRequestTimeframe": "You can request account and data deletion by contacting support or emailing the privacy team.",
  "thirdPartySharing": "Shares data with service providers under data processing agreements. Telemetry sent to external integrations depends on their policies.",
  "humanReviewOfChats": true,
  "humanReviewConditions": "Staff review telemetry, interaction logs, and flagged agent runs to fix bugs and monitor security.",
  "regionalVariation": "Complies with GDPR; EU users can contact privacy@cognition.ai for data requests.",
  "childrenDataPolicy": "Designed for users 18 years or older.",
  "enterpriseVsConsumerDifference": true,
  "enterpriseVsConsumerSummary": "Enterprise accounts use custom agreements that can specify private cloud deployments and custom data retention times.",
  "sourceUrl": "https://www.cognition.ai/privacy-policy",
  "lastVerifiedDate": "2026-06-23",
  "lastChangedDate": null,
  "confidence": "verified_from_policy_text"
}
```

**Step 4: Run test to verify it passes**

Run: `bun run test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/db/seedData.json src/lib/__tests__/schema.test.ts
git commit -m "feat: add Devin (Cognition) to seed data"
```

---

### Task 5: Seed the Database and Run Final Quality Checks

**Files:**

- None (Run scripts)

**Step 1: Execute Seed Script**

Run: `bun run src/lib/db/seed.ts`
Expected: Database seeded successfully.

**Step 2: Format and Lint Code**

Run: `bun run format && bun run lint && bun run typecheck`
Expected: All clean, no errors.

**Step 3: Run Vitest Suite**

Run: `bun run test`
Expected: All tests pass.

**Step 4: Commit**

```bash
git commit -m "chore: seed database and finalize new providers"
```
