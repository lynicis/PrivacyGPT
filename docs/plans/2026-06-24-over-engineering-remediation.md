# Over-Engineering Remediation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove ~900 lines of over-engineered code and 2 unused dependencies across 8 findings without changing observable behavior.

**Architecture:** Each finding is an independent, behavior-preserving refactor. Tasks are ordered by risk (lowest first) so progress compounds safely. Every task has a corresponding test command to verify nothing broke.

**Tech Stack:** Bun, TypeScript 6, Vitest, TanStack Start, Tailwind CSS v4

---

### Task 1: Delete `PwaRegister.tsx` (dead service-worker registration)

**Files:**

- Delete: `src/components/PwaRegister.tsx`
- Modify: `src/routes/__root.tsx:11,329` — remove import and `<PwaRegister />`

**Step 1: Remove the file and its references**

Delete the component file:

```bash
rm src/components/PwaRegister.tsx
```

Edit `src/routes/__root.tsx`:

- Remove `import { PwaRegister } from "../components/PwaRegister"` (line 11)
- Remove `<PwaRegister />` (line 329)

**Step 2: Verify the app still builds and tests pass**

```bash
bun run typecheck && bun run test
```

No test coverage exists for this component — it returns null and has no tests.

**Step 3: Commit**

```bash
git add -A && git commit -m "delete: remove dead PwaRegister component (no /sw.js exists)"
```

---

### Task 2: Shrink `stripHtmlToText` in watchdog.ts (redundant line-level filters)

**Files:**

- Modify: `src/lib/watchdog.ts:12-67`

**Step 1: Remove the redundant line-level filtering loop**

Replace `stripHtmlToText` with a version that skips the post-hoc line filter block. The `html-to-text` config's `selectors` already handle skipping nav/header/footer/aside/form/svg/script/style.

Current code (lines 30-66):

```typescript
const plainText = decodeHtmlEntities(convert(html, options))

// Filter out metadata and navigation junk lines before collapsing whitespace
const text = plainText
  .split(/\r?\n/)
  .filter((line) => {
    const trimmed = line.trim()
    if (!trimmed) return false
    if (/^\d+$/.test(trimmed)) return false
    if (/^(true|false)$/i.test(trimmed)) return false
    if (/^\d+\s+(true|false)$/i.test(trimmed)) return false
    if (/^(true|false)\s+\d+$/i.test(trimmed)) return false
    if (/help center/i.test(trimmed)) return false
    if (/community/i.test(trimmed)) return false
    if (/search.*clear.*search/i.test(trimmed)) return false
    if (/close search/i.test(trimmed)) return false
    if (/main menu/i.test(trimmed)) return false
    if (/this help content/i.test(trimmed)) return false
    if (/general help/i.test(trimmed)) return false
    if (/privacy hub/i.test(trimmed)) return false
    if (/documentation index/i.test(trimmed)) return false
    if (/llms\.txt/i.test(trimmed)) return false
    if (/discover.*available pages/i.test(trimmed)) return false
    if (/stepfun.*documentation/i.test(trimmed)) return false
    if (/fetch.*documentation/i.test(trimmed)) return false
    return true
  })
  .join("\n")
return text.replace(/\s+/g, " ").trim()
```

Replace with:

```typescript
return decodeHtmlEntities(convert(html, options)).replace(/\s+/g, " ").trim()
```

**Step 2: Verify existing behavior**

The watchdog tests (`src/lib/__tests__/watchdog.test.ts`) should confirm `stripHtmlToText` still produces equivalent cleaned text.

```bash
bun run test -- --watch
```

Check the watchdog test file to see if specific line-level filter behavior is tested. If tests assert on filtered-out content, update the expected values.

**Step 3: Commit**

```bash
git add -A && git commit -m "shrink: remove redundant line-level filters in stripHtmlToText (html-to-text config already handles nav/session junk)"
```

---

### Task 3: Shrink `CompareSection.tsx` duplicated boolean renderers

**Files:**

- Modify: `src/components/CompareSection.tsx:21-63`

**Step 1: Replace two near-identical functions with config-driven helpers**

Replace `renderBooleanIcon` and `renderBooleanBadge` with single functions that accept a `goodPolarity` parameter:

```typescript
const booleanIcon = (value: boolean, goodIs: boolean) => {
  const positive = goodIs ? value : !value
  if (positive) return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  return goodIs
    ? <XCircle className="h-4 w-4 text-red-400" />
    : <AlertTriangle className="h-4 w-4 text-amber-500" />
}

const booleanBadge = (value: boolean, goodIs: boolean) => (
  <Badge
    variant="outline"
    className={
      (goodIs ? value : !value)
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : goodIs
          ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
          : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
    }
  >
    {value ? "Yes" : "No"}
  </Badge>
)
```

Update call sites at lines 75-92:

```typescript
{booleanA !== undefined && (
  <>
    {booleanIcon(booleanA, booleanGood)}
    {booleanBadge(booleanA, booleanGood)}
  </>
)}
```

**Step 2: Verify**

```bash
bun run typecheck && bun run test
```

Also visually verify the compare page renders boolean icons/badges correctly:

```bash
bun run dev
```

Navigate to `/compare?companyA=openai&companyB=anthropic`.

**Step 3: Commit**

```bash
git add -A && git commit -m "shrink: deduplicate CompareSection boolean render helpers"
```

---

### Task 4: Shrink `scoring.ts` unused type abstraction

**Files:**

- Modify: `src/lib/scoring.ts:1-26`

**Step 1: Remove `Weights` and `SubScores` interfaces and `DEFAULT_WEIGHTS` constant**

These interfaces each have exactly one implementation. The `DEFAULT_WEIGHTS` constant is never used — `api.ts` defines its own inline weights.

Delete lines 1-26 (interface + constant definitions).

Update the `calculateTotalScore` function signature to accept a plain object inline:

```typescript
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
```

Also update `Weights` import in `api.ts`:

- Remove `import type { Weights } from "./scoring"` (line 15)
- Inline the weights type at the usage site in the function parameter (line 27/48)

**Step 2: Verify**

```bash
bun run typecheck && bun run test
```

**Step 3: Commit**

```bash
git add -A && git commit -m "shrink: inline single-implementation types in scoring.ts, drop unused DEFAULT_WEIGHTS"
```

---

### Task 5: Use `escape-html` dep instead of hand-rolled `escapeXml`

**Files:**

- Modify: `src/lib/api.ts:411-418`

**Step 1: Replace `escapeXml` function body**

Replace:

```typescript
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
```

With:

```typescript
import escapeHtml from "escape-html"

function escapeXml(str: string): string {
  return escapeHtml(str)
}
```

**Step 2: Verify**

```bash
bun run typecheck && bun run test
```

The RSS feed endpoint uses `escapeXml` — verify the changelog feed still renders valid XML:

```bash
bun run dev
```

Fetch `/changelog/feed.xml` and validate XML structure.

**Step 3: Commit**

```bash
git add -A && git commit -m "stdlib: replace hand-rolled escapeXml with existing escape-html dep"
```

---

### Task 6: Shrink `db/index.ts` dead Cloudflare Workers import path

**Files:**

- Modify: `src/lib/db/index.ts:12-25`

**Step 1: Remove the dead CF Workers D1 path**

The `cfModule` variable + dynamic `import("cloudflare:workers")` block always falls through to the catch in non-Worker contexts. The Workers entry point (`cron-worker.ts`) manages its own D1 binding separately.

Delete lines 12-25:

```typescript
try {
  const cfModule = "cloudflare:workers"
  const { env } = await import(/* @vite-ignore */ cfModule)
  const d1Db = (env as { DB?: D1Database }).DB
  if (d1Db) {
    _db = drizzleD1(d1Db, { schema }) as unknown as LibSQLDatabase<
      typeof schema
    >
    return _db
  }
} catch {}
```

Also remove the now-unused import:

```typescript
import { drizzle as drizzleD1 } from "drizzle-orm/d1"
```

**Step 2: Verify**

```bash
bun run typecheck && bun run test
```

The seed script and all server functions depend on `getDb()` — verify the local SQLite path still works:

```bash
bun run src/lib/db/seed.ts
```

**Step 3: Commit**

```bash
git add -A && git commit -m "shrink: remove dead Cloudflare Workers import path in db/index.ts"
```

---

### Task 7: Inline `query-keys.ts` into `queries.ts`

**Files:**

- Modify: `src/lib/queries.ts` — inline the key definitions
- Delete: `src/lib/query-keys.ts`

**Step 1: Move query key definitions into queries.ts**

Copy the `queryKeys` object (22 lines) from `query-keys.ts` into `queries.ts`, removing the separate import.

In `queries.ts`:

- Remove `import { queryKeys } from "./query-keys"` (line 16)
- Paste the `queryKeys` constant directly (before the exported functions)

**Step 2: Delete query-keys.ts**

```bash
rm src/lib/query-keys.ts
```

**Step 3: Verify**

```bash
bun run typecheck && bun run test
```

Check that no other files import from `query-keys`:

```bash
grep -rn "query-keys" src/ --include="*.ts" --include="*.tsx"
```

**Step 4: Commit**

```bash
git add -A && git commit -m "shrink: inline query-keys.ts into queries.ts"
```

---

### Task 8: Shrink `diff.ts` — extract needed helpers, delete diff engine

**Risk: MEDIUM** — affects watchdog change detection pipeline

**Files:**

- Delete: `src/lib/diff.ts`
- Modify: `src/lib/watchdog.ts`

**Step 1: Audit what watchdog.ts actually needs from diff.ts**

```typescript
// watchdog.ts imports:
import { decodeHtmlEntities, hashText, generateDiff } from "./diff"
```

Usage breakdown:

- `decodeHtmlEntities` — used once in `stripHtmlToText` (line 30)
- `hashText` — used once in `checkCompany` (line 157) to hash and compare
- `generateDiff` — used once in `checkCompany` (line 179) to produce HTML diff for changelog

**Step 2: Inline `hashText` and `decodeHtmlEntities` into watchdog.ts**

Add these two small helpers at the top of `watchdog.ts`:

```typescript
import { createHash } from "node:crypto"

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex")
}
```

Note: `hashText` no longer normalizes text before hashing (the normalization options were used in the original but watchdog calls it as `hashText(result.text)` with no options, so normalization was a no-op in practice).

**Step 3: Replace `generateDiff` with a simple diff library**

Install a minimal diff library:

```bash
bun add diff
bun add -d @types/diff
```

Replace the `generateDiff` call in `checkCompany` (line 179):

```typescript
// Replace:
const { diffHtml } = generateDiff(latestSnapshot.rawContent, result.text)

// With:
import { diffLines } from "diff"
const diffHtml = diffLines(latestSnapshot.rawContent, result.text)
  .map((part) =>
    part.added
      ? `<span class="diff-added">${escapeHtml(part.value)}</span>`
      : part.removed
        ? `<span class="diff-removed">${escapeHtml(part.value)}</span>`
        : `<span class="diff-unchanged">${escapeHtml(part.value)}</span>`
  )
  .join("\n")
```

**Step 4: Update imports in watchdog.ts**

Remove:

```typescript
import { decodeHtmlEntities, hashText, generateDiff } from "./diff"
```

Keep/add:

```typescript
import { createHash } from "node:crypto"
import escapeHtml from "escape-html"
import { diffLines } from "diff"
```

**Step 5: Verify**

```bash
bun run typecheck && bun run test
```

Watchdog tests (`src/lib/__tests__/watchdog.test.ts`) should cover `checkCompany` and `runWatchdog`. If the diff HTML format differs, update test assertions to match the new format.

Run the seed script too, in case the seed tests depend on diff output:

```bash
bun run src/lib/db/seed.ts
```

**Step 6: Remove unused dependencies**

```bash
bun remove escape-html
bun remove @types/escape-html
```

**Step 7: Verify everything end-to-end**

```bash
bun run typecheck && bun run test && bun run src/lib/db/seed.ts
```

**Step 8: Commit**

```bash
git add -A && git commit -m "delete: replace custom LCS diff engine with diff npm pkg, inline tiny helpers"
```

---

## Summary

| Task      | Tag    | Change                        | Lines      | Deps   |
| --------- | ------ | ----------------------------- | ---------- | ------ |
| 1         | delete | PwaRegister.tsx + import      | -14        | —      |
| 2         | shrink | stripHtmlToText line filters  | -30        | —      |
| 3         | shrink | CompareSection boolean dupes  | -25        | —      |
| 4         | yagni  | scoring.ts type abstraction   | -20        | —      |
| 5         | stdlib | escapeHtml dep usage          | -7         | —      |
| 6         | shrink | db/index.ts dead CF path      | -12        | —      |
| 7         | shrink | query-keys.ts into queries.ts | -22 (file) | —      |
| 8         | delete | diff.ts engine                | -800       | -2     |
| **Total** |        |                               | **~930**   | **-2** |

**Risks:**

- **Task 8** is the only risky change. The diff HTML output format may differ slightly from the custom LCS implementation, which could affect the changelog display or any tests asserting on exact HTML. Review the changelog page visually after implementing.
- **Tasks 2-7** are low-risk (removing dead code, deduplication, inlining). Run `bun run test` after each to catch regressions.
