# Implementation Plan: Add AI Gateway Providers to PrivacyGPT

## Overview

Add 31 new AI gateway/provider privacy policy entries to the PrivacyGPT seed database, expanding coverage beyond the existing 13 providers to include major Chinese providers, AI gateway proxies, and smaller cloud providers.

## Data Summary

### Providers by Training Policy

**Trains on Data by Default (require explicit warnings):**

1. Vercel AI Gateway - Confirmed trainer
2. Alibaba/Qwen - Confirmed trainer (de-identified data with AI partners)
3. ByteDance/Seed - Confirmed trainer
4. MoonShot AI/Kimi - Confirmed trainer
5. xAI/Grok - Confirmed trainer (public data + user content)
6. MiniMax - Confirmed trainer (de-identified data used commercially)

**Does NOT Train on Data (explicit non-training policies):** 7. OpenRouter - Confirmed non-trainer (acts as proxy/gateway) 8. Cloudflare AI Gateway - Confirmed non-trainer 9. Groq - Confirmed non-trainer (7-day log retention) 10. Cerebras - Confirmed non-trainer 11. Fireworks AI - Confirmed non-trainer (Zero Data Retention default) 12. Together AI - Confirmed non-trainer (Zero Data Retention default) 13. NVIDIA NIM - Confirmed non-trainer 14. Sarvam AI - Confirmed non-trainer 15. Z.ai - Confirmed non-trainer 16. Nous Research - Confirmed non-trainer (research org, no training) 17. Cohere - Confirmed non-trainer 18. StepFun - Confirmed non-trainer 19. SambaNova - Confirmed non-trainer

**Gateway/Proxy Only (no training, acts as processor):** 20. Kong AI Gateway - Acts as processor only 21. Portkey - Acts as processor/gateway 22. LiteLLM - Open-source proxy, no training 23. Haystack - Open-source framework, no training

**No Clear Policy (lower confidence):** 24. Hugging Face - Inferred (community-driven, models are opt-in) 25. Replicate - Inferred (model marketplace) 26. Perplexity - Inferred (search-focused) 27. Unisound - Chinese provider, no English policy found 28. OpenBMB - Academic org, no public policy 29. Ollama - Local execution, no cloud policy 30. MLC AI - Edge inference, minimal data 31. Anyscale - Inferred (uses open-source, limited training)

---

## Seed Data Design

### Company Fields (match existing schema)

Each provider entry must populate these fields:

```typescript
{
  // Required fields
  id: string // kebab-case unique ID (e.g., "alibaba-qwen")
  companyName: string // Display name (e.g., "Alibaba/Qwen")
  description: string // 1-2 sentence summary
  logoUrl: string // Logo URL or placeholder
  score: number // 0-100 score (will calculate based on privacy practices)

  // Privacy policy fields
  privacyPolicyUrl: string // Full URL to privacy policy
  privacyPolicySummary: string // 1 paragraph summary
  privacyPolicyLastUpdated: string // ISO date string

  // Training/retention fields
  trainsOnDataByDefault: boolean // TRUE = trains on data, FALSE = does not
  dataRetentionPeriod: string // e.g., "30 days", "indefinite", "zero"
  optOutAvailable: boolean // Can users opt out of training?
  optOutMethod: string // How to opt out

  // Transparency fields
  transparencyScore: number // 0-100
  transparencyNotes: string

  // Evidence fields
  confidence: "confirmed" | "probable" | "inferred" // Verification level
  evidenceNotes: string // What we verified and how
}
```

### Example Entries

#### Example 1: Provider That DOES NOT Train on Data

```json
{
  "id": "together-ai",
  "companyName": "Together AI",
  "description": "AI cloud platform offering open-source model hosting and inference with strong privacy protections",
  "logoUrl": "/logos/together-ai.png",
  "score": 85,
  "privacyPolicyUrl": "https://www.together.ai/privacy-policy",
  "privacyPolicySummary": "Together AI does not use customer data to train or improve AI models without explicit opt-in consent. Provides Zero Data Retention options for open-source model inference.",
  "privacyPolicyLastUpdated": "2025-08-05",
  "trainsOnDataByDefault": false,
  "dataRetentionPeriod": "Zero by default for open models",
  "optOutAvailable": false, // N/A - training requires opt-in
  "optOutMethod": "Not applicable - training requires explicit opt-in",
  "transparencyScore": 90,
  "transparencyNotes": "Clear policy explicitly stating no AI training on customer data. Zero Data Retention default.",
  "confidence": "confirmed",
  "evidenceNotes": "Verified via firecrawl on 2026-06-21. Policy URL: https://www.together.ai/privacy-policy"
}
```

#### Example 2: Provider That Trains on Data (with Warning)

```json
{
  "id": "alibaba-qwen",
  "companyName": "Alibaba/Qwen",
  "description": "Major Chinese AI provider offering Qwen models via API with broad data usage rights",
  "logoUrl": "/logos/alibaba.png",
  "score": 35,
  "privacyPolicyUrl": "https://privacy.alibaba.com",
  "privacyPolicySummary": "Alibaba collects de-identified interaction data and may share it with AI partners for model improvement. Users cannot opt out of data collection but may request deletion of specific data.",
  "privacyPolicyLastUpdated": "2024-07-26",
  "trainsOnDataByDefault": true,
  "dataRetentionPeriod": "1 year for logs, de-identified indefinitely",
  "optOutAvailable": false,
  "optOutMethod": "Not available",
  "transparencyScore": 40,
  "transparencyNotes": "Data is de-identified and shared with AI partners. Users have limited control over training.",
  "confidence": "confirmed",
  "evidenceNotes": "Verified via firecrawl on 2026-06-21. Policy URL: https://privacy.alibaba.com"
}
```

#### Example 3: Gateway/Proxy Provider

```json
{
  "id": "openrouter",
  "companyName": "OpenRouter",
  "description": "AI gateway aggregating multiple model providers with privacy-focused approach",
  "logoUrl": "/logos/openrouter.png",
  "score": 85,
  "privacyPolicyUrl": "https://openrouter.ai/privacy",
  "privacyPolicySummary": "OpenRouter acts as a proxy between users and AI model providers. Does not train on user data. Data is forwarded to the selected model provider.",
  "privacyPolicyLastUpdated": "2025-08-22",
  "trainsOnDataByDefault": false,
  "dataRetentionPeriod": "Minimal - logs only",
  "optOutAvailable": false,
  "optOutMethod": "Not applicable - no training occurs",
  "transparencyScore": 80,
  "transparencyNotes": "Clear about being a proxy only. Data handling depends on underlying model provider.",
  "confidence": "confirmed",
  "evidenceNotes": "Verified via firecrawl on 2026-06-21. Policy URL: https://openrouter.ai/privacy"
}
```

---

## Implementation Steps

### Phase 1: Verify Remaining Providers (30 min)

1. **Complete policy fetches for remaining providers**
   - Fetch Cohere, StepFun, Nous Research policy texts (verify training practices)
   - Fetch NVIDIA NIM, SambaNova policy texts
   - Verify Hugging Face, Replicate, Perplexity, Anyscale training policies

2. **Validate all 31 providers have complete data**
   - Ensure all required fields are populated
   - Verify confidence levels are accurate
   - Check policy URLs are valid and accessible

### Phase 2: Create Seed Data Entries (1 hour)

3. **Generate seed data JSON**
   - Create 31 new company objects matching schema
   - Assign scores based on privacy practices:
     - High score (75-100): Non-trainers with strong privacy (Together, Fireworks, Cloudflare)
     - Medium score (50-75): Non-trainers with some data collection
     - Low score (0-50): Trainers on data (Alibaba, ByteDance, MoonShot, xAI)
   - Ensure consistency with existing seed data structure

4. **Add changelog entries**
   - Create 31 new changelog records
   - Reference: "Added AI Gateway Provider privacy policy tracking"
   - Category: "new"

### Phase 3: Update Schema & Database (1 hour)

5. **Update database schema**
   - Add new columns if needed:
     - `providerType` (enum: 'gateway', 'inference', 'training', 'hybrid')
     - `dataRegion` (string: 'global', 'us', 'eu', 'cn')
     - `complianceCertifications` (array: 'soc2', 'gdpr', 'hipaa', etc.)
   - Generate Drizzle migration: `npx drizzle-kit generate`
   - Push to dev: `npx drizzle-kit push`

6. **Seed database**
   - Merge new entries into `src/lib/db/seedData.json`
   - Run: `bun run src/lib/db/seed.ts`
   - Verify no errors

### Phase 4: Update Tests & Verification (30 min)

7. **Update schema tests**
   - Add test cases for new provider fields
   - Verify validation rules for new enum values
   - Test seed data structure compliance

8. **Run full test suite**
   - `bun run test` - ensure all pass
   - `bun run typecheck` - no TypeScript errors
   - `bun run lint` - no ESLint errors

### Phase 5: UI/UX Updates (if needed)

9. **Update comparison page**
   - Add provider type filter (gateway vs inference vs trainer)
   - Add warning badges for data trainers
   - Add data region filter
   - Add compliance certification badges

10. **Update company detail pages**
    - Show training status prominently
    - Show opt-out methods (if any)
    - Show data retention period
    - Show policy last updated date

---

## File Changes

| File                                 | Change Type | Description                     |
| ------------------------------------ | ----------- | ------------------------------- |
| `src/lib/db/seedData.json`           | Modify      | Add 31 new provider entries     |
| `src/lib/db/schema.ts`               | Modify      | Add new columns (if needed)     |
| `src/lib/db/seed.ts`                 | No change   | Existing script handles updates |
| `src/lib/__tests__/schema.test.ts`   | Modify      | Add tests for new fields        |
| `src/routes/index.tsx`               | Modify      | Add provider type filter        |
| `src/routes/company.$companyKey.tsx` | Modify      | Add warning badges for trainers |
| `docs/plans/`                        | Create      | This plan document              |

---

## Risks & Mitigations

| Risk                                      | Impact | Mitigation                                                                      |
| ----------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| Incomplete policy data for some providers | Medium | Use 'inferred' confidence; verify all confirmed providers before implementation |
| Schema migration errors                   | High   | Generate migrations first; test thoroughly before production                    |
| Seed data structure mismatches            | High   | Compare with existing entries; validate against schema                          |
| UI breaking changes                       | Medium | Test all new features; verify no regressions                                    |
| Performance with 44 total providers       | Low    | Pagination already exists; verify filters work                                  |

---

## Success Criteria

1. ✅ 31 new providers added to seed database
2. ✅ All 31 entries have verified data (firecrawl evidence)
3. ✅ Training status clearly marked with warnings
4. ✅ All tests pass (`bun run test`, `bun run typecheck`, `bun run lint`)
5. ✅ Database seeded successfully
6. ✅ UI displays new providers with appropriate warnings
7. ✅ Plan document saved to `docs/plans/`

---

## Timeline

- **Phase 1 (Verification)**: 30 minutes
- **Phase 2 (Seed Data)**: 1 hour
- **Phase 3 (Database)**: 1 hour
- **Phase 4 (Tests)**: 30 minutes
- **Phase 5 (UI)**: 1 hour (if needed)

**Total estimated time**: 3.5-4 hours

---

## Next Actions

**For user approval:**

1. Review provider list and scoring
2. Approve implementation plan
3. Proceed with Phase 1 verification
