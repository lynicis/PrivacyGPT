# Dashboard Server-Side Pagination Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement server-side pagination, search, sorting, and filtering for the dashboard, utilizing URL search parameters in TanStack Router.

**Architecture:** We will modify `getCompaniesFn` in `src/lib/api.ts` to accept filters, sorting, dynamic weights, and limit/offset, returning the paginated slice and total count. Then we will configure `validateSearch` in `src/routes/index.tsx` to handle the URL parameters, fetch this data in the route loader, and render pagination controls in the dashboard view.

**Tech Stack:** Bun, Drizzle ORM, TanStack Start/Router, React, Tailwind CSS

---

### Task 1: Update getCompaniesFn API

**Files:**

- Modify: `src/lib/api.ts`
- Test: `src/lib/__tests__/api.test.ts` (create)

**Step 1: Write test for paginated fetching**
Create `src/lib/__tests__/api.test.ts` to verify the paginated and filtered API logic.

```typescript
import { describe, it, expect, vi } from "vitest"
import { getCompaniesFn } from "../api"

// We can mock the DB query or verify calling it.
// Let's test calling getCompaniesFn with parameters and verifying return structure.
```

**Step 2: Run test to verify it fails**
Run: `bun run test`
Expected: FAIL (types or code mismatch)

**Step 3: Implement getCompaniesFn updates**
Update `getCompaniesFn` to validate the pagination inputs and calculate scores, filter, sort, and slice in-memory on the server.

```typescript
export const getCompaniesFn = createServerFn({ method: "GET" })
  .validator(
    (input: {
      limit?: number
      offset?: number
      searchQuery?: string
      filterNoTraining?: boolean
      filterOptOut?: boolean
      filterNoHumanReview?: boolean
      sortBy?: string
      weights?: any
    }) => input
  )
  .handler(async ({ data }) => {
    try {
      const db = await getDb()
      const allRows = await db.select().from(companies)

      const weights = data.weights || {
        trainingWeight: 25,
        optOutWeight: 20,
        retentionWeight: 15,
        deletionWeight: 15,
        sharingWeight: 15,
        humanReviewWeight: 10,
      }

      // Calculate scores
      let scored = allRows.map((c) => {
        const subScores = calculateSubScores(c)
        const totalScore = calculateTotalScore(subScores, weights)
        const grade = mapScoreToGrade(totalScore)
        return { ...c, subScores, totalScore, grade }
      })

      // Apply search query
      if (data.searchQuery?.trim()) {
        const q = data.searchQuery.toLowerCase()
        scored = scored.filter(
          (c) =>
            c.companyName.toLowerCase().includes(q) ||
            c.productName.toLowerCase().includes(q) ||
            c.trainsOnDataNuance.toLowerCase().includes(q)
        )
      }

      // Apply switches
      if (data.filterNoTraining) {
        scored = scored.filter((c) => !c.trainsOnDataByDefault)
      }
      if (data.filterOptOut) {
        scored = scored.filter((c) => c.optOutAvailable)
      }
      if (data.filterNoHumanReview) {
        scored = scored.filter((c) => !c.humanReviewOfChats)
      }

      // Sort
      const sortBy = data.sortBy || "score-desc"
      scored.sort((a, b) => {
        if (sortBy === "score-desc") return b.totalScore - a.totalScore
        if (sortBy === "score-asc") return a.totalScore - b.totalScore
        if (sortBy === "name-asc")
          return a.companyName.localeCompare(b.companyName)
        if (sortBy === "name-desc")
          return b.companyName.localeCompare(a.companyName)
        if (sortBy === "training-first") {
          return (
            (a.trainsOnDataByDefault ? 1 : 0) -
            (b.trainsOnDataByDefault ? 1 : 0)
          )
        }
        const priority: Record<string, number> = {
          verified_from_policy_text: 0,
          inferred: 1,
          needs_review: 2,
        }
        return (priority[a.confidence] ?? 9) - (priority[b.confidence] ?? 9)
      })

      const totalCount = scored.length
      const limit = data.limit ?? 9
      const offset = data.offset ?? 0
      const sliced = scored.slice(offset, offset + limit)

      return { companies: sliced, totalCount }
    } catch (error) {
      console.error("Failed to fetch companies:", error)
      throw new Error("Failed to fetch companies")
    }
  })
```

**Step 4: Run test to verify it passes**
Run: `bun run test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: enhance getCompaniesFn with server-side pagination, filters, and dynamic weights scoring"
```

---

### Task 2: Configure Route Search Params Validation

**Files:**

- Modify: `src/routes/index.tsx`

**Step 1: Implement search params validation and loader update**
Add `validateSearch` to Route and make the loader invoke `getCompaniesFn` using the URL parameters.

```typescript
interface DashboardSearch {
  page?: number
  search?: string
  noTraining?: boolean
  optOut?: boolean
  noHumanReview?: boolean
  sortBy?: "score-desc" | "score-asc" | "name-asc" | "name-desc" | "training-first" | "confidence-first"
  weights?: string
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => ({
    page: Number(search.page || 1),
    search: (search.search as string) || undefined,
    noTraining: search.noTraining === true || search.noTraining === "true" || undefined,
    optOut: search.optOut === true || search.optOut === "true" || undefined,
    noHumanReview: search.noHumanReview === true || search.noHumanReview === "true" || undefined,
    sortBy: (search.sortBy as DashboardSearch["sortBy"]) || "score-desc",
    weights: (search.weights as string) || undefined,
  }),
  loader: async ({ search }) => {
    try {
      const parsedWeights = search.weights ? JSON.parse(search.weights) : undefined
      const page = search.page || 1
      const limit = 9
      const offset = (page - 1) * limit

      const { companies, totalCount } = await getCompaniesFn({
        limit,
        offset,
        searchQuery: search.search,
        filterNoTraining: search.noTraining,
        filterOptOut: search.optOut,
        filterNoHumanReview: search.noHumanReview,
        sortBy: search.sortBy,
        weights: parsedWeights,
      })
      return { companies, totalCount }
    } catch (error) {
      console.error("Failed to load companies on dashboard:", error)
      return { companies: [], totalCount: 0 }
    }
  },
  ...
})
```

**Step 2: Verify typecheck**
Run: `bun run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/routes/index.tsx
git commit -m "feat: configure validated search params and route loader for server-side paginated dashboard"
```

---

### Task 3: Refactor Dashboard View and Add Pagination UI

**Files:**

- Modify: `src/routes/index.tsx`

**Step 1: Refactor UI inputs to bind to URL Navigation**
Modify the dashboard inputs to push changes to the URL query parameters using the router context or TanStack router `<Link>` or `router.navigate()`.
Add the pagination navigation buttons at the bottom of the grid.

```typescript
// Add page selectors, previous/next controls at the bottom of the layout
```

**Step 2: Verify typecheck & tests**
Run: `bun run typecheck`
Expected: PASS
Run: `bun run test`
Expected: PASS

**Step 3: Commit**

```bash
git add src/routes/index.tsx
git commit -m "feat: render pagination controls and bind dashboard inputs to URL params"
```
