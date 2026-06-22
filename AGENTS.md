# AI Coding Agent Guidelines (`AGENTS.md`)

Welcome! This file provides the context, structure, commands, and rules required for AI coding agents to work effectively on the **PrivacyGPT** codebase.

---

## 🛠️ Project Overview & Technology Stack

The **PrivacyGPT** is a web application designed to monitor how major AI companies handle conversational data. It features a comparison dashboard, detailed company profile pages, a methodology page, and an SQLite database loaded with verified primary-source privacy data.

### Stack Details:

- **Runtime**: [Bun](https://bun.sh/)
- **Frontend & Routing**: [TanStack Start](https://tanstack.com/router/latest/docs/start/overview) (React 19 + TypeScript 6)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (using `@tailwindcss/vite` plugin, no `tailwind.config.js`)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (located in `src/components/ui`)
- **Database ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database Engine**: [libsql](https://github.com/tursodatabase/libsql) (SQLite)
- **Testing**: [Vitest](https://vitest.dev/)

---

## 📂 Project Directory Structure

Use this mapping to navigate the repository:

- 📁 `src/`
  - 📁 `routes/` (TanStack Start file-based routing)
    - 📄 `__root.tsx` — Main application layout, navbar, and footer.
    - 📄 `index.tsx` — Comparison dashboard with search, filters, and sorting.
    - 📄 `company.$companyKey.tsx` — Detailed company privacy profile.
    - 📄 `methodology.tsx` — Scoring rubric, verification ratings, and criteria.
  - 📁 `components/`
    - 📁 `ui/` — Native shadcn/ui components (`badge`, `button`, `card`, `input`, `select`, `switch`, `table`).
  - 📁 `lib/`
    - 📁 `db/`
      - 📄 `index.ts` — Drizzle ORM client initialization.
      - 📄 `schema.ts` — SQLite tables: `companies`, `snapshots`, `changelogs`.
      - 📄 `seed.ts` — Seeding pipeline database loader.
      - 📄 `seedData.json` — **Source of Truth** for company privacy profile seed records.
    - 📁 `__tests__/`
      - 📄 `schema.test.ts` — Vitest schema validation and seed data validation tests.
    - 📄 `api.ts` — Server functions (`getCompaniesFn`, `getCompanyByKeyFn`) for data fetching.
    - 📄 `utils.ts` — Classnames merge helpers.
- 📁 `drizzle/` — Schema migrations output.
- 📄 `drizzle.config.ts` — Drizzle CLI configuration.
- 📄 `package.json` — Dependency management and scripts.
- 📄 `privacy.db` — Local SQLite development database.

---

## ⚡ Operational Commands

Please use the following commands to run, build, and test the project:

### 1. Running the Development Server

Starts the dev server with live route generation.

```bash
bun run dev
```

_Note: The dev server will run on port `3000` by default and auto-generate `src/routeTree.gen.ts` as routes are added or changed._

### 2. Seeding the Database

Seeds the local database (`privacy.db`) using the static JSON file.

```bash
bun run src/lib/db/seed.ts
```

### 3. Running Tests

Executes the Vitest test suite.

```bash
bun run test
```

### 4. Code Formatting & Linting

Runs Prettier checks and ESLint.

```bash
bun run format  # Formats files
bun run lint    # Lints files
bun run check   # Checks format without modifying
```

### 5. Type Checking

Verifies TypeScript compilation without emitting output.

```bash
bun run typecheck
```

### 6. Database Migrations (Drizzle Kit)

When modifying the Drizzle schema in `src/lib/db/schema.ts`, run:

```bash
# Generate SQL migrations inside drizzle/
npx drizzle-kit generate

# Push changes directly to development database (local file)
npx drizzle-kit push
```

---

## 🧭 Crucial Development Guidelines

To maintain code quality and compatibility, adhere to the following guidelines:

### 1. Seed Data updates

- Do **NOT** write data modifications directly to the `privacy.db` file.
- The `src/lib/db/seedData.json` is the sole source of truth for comparison data.
- To update company data:
  1. Edit `src/lib/db/seedData.json`.
  2. Run the seed script: `bun run src/lib/db/seed.ts`.
  3. Run tests `bun run test` to verify structure matches constraints.

### 2. Styling Rules

- We use Tailwind CSS v4. Do **not** create a `tailwind.config.js`.
- Custom configurations, keyframes, variables, and fonts are set directly in `src/styles.css` using standard CSS rules or `@theme` overrides.
- Use shadcn/ui components where applicable and keep layouts consistent.

### 3. TanStack Start Routing

- All routes are defined in `src/routes/` using file-based routing.
- Do not manually edit `src/routeTree.gen.ts` as it is automatically updated by the TanStack Start compiler.
- Use `createServerFn` inside `src/lib/api.ts` to query DB data securely.

### 4. Integrity Checks

- Keep all existing comments and docstrings intact unless they are directly related to code being refactored.
- Ensure that the Vitest suite in `src/lib/__tests__/schema.test.ts` passes successfully after any database schema or seed data updates.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **PrivacyGPT** (298 symbols, 653 relationships, 21 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/PrivacyGPT/context` | Codebase overview, check index freshness |
| `gitnexus://repo/PrivacyGPT/clusters` | All functional areas |
| `gitnexus://repo/PrivacyGPT/processes` | All execution flows |
| `gitnexus://repo/PrivacyGPT/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
