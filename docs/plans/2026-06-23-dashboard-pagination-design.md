# Dashboard Server-Side Pagination Design

**Goal:** Implement server-side pagination (9 items per page), filtering, and sorting for the dashboard using URL search parameters for deep-linking.

## Architecture

1. **Server-Side API (`src/lib/api.ts`)**:
   - `getCompaniesFn` is updated to validate and accept pagination params, filters, sorting, and weights.
   - Calculates subscores, total score, and grade in-memory on the server to handle dynamic user weights.
   - Sorts, slices to the page limit, and returns `{ companies, totalCount }`.

2. **Route Loader & URL Params (`src/routes/index.tsx`)**:
   - TanStack Router validates search parameters: `page`, `search`, `noTraining`, `optOut`, `noHumanReview`, `sortBy`, `weights`.
   - Loader invokes `getCompaniesFn` with validated params.

3. **Dashboard UI**:
   - Updates to search, filters, sorting, or page controls navigate to the updated search params.
   - A pagination control bar is rendered at the bottom of the grid.
