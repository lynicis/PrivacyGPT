<div align="center">
  <img src="./public/logo.png" alt="PrivacyGPT logo" height="80" />

# PrivacyGPT

**Watch how AI companies handle your data**

[![Bun](https://img.shields.io/badge/Runtime-Bun-000?style=flat-square&logo=bun)](https://bun.sh)
[![React](https://img.shields.io/badge/React-19-58c4dc?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start-ff4154?style=flat-square&logo=reactrouter)](https://tanstack.com/router/latest/docs/start/overview)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-f38020?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20CSS-v4-06b6d4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-c5f74f?style=flat-square&logo=drizzle)](https://orm.drizzle.team)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[Dashboard](#features) • [Getting started](#getting-started) • [Project structure](#project-structure)

</div>

PrivacyGPT tracks how major AI companies handle conversational data — training practices, opt-out options, data retention, deletion rights, third-party sharing, and human review policies. Each datapoint is sourced from primary-source privacy policies and verified.

The dashboard lets you compare companies side by side, filter by privacy stance, and get a weighted score based on what matters to you. An automated watchdog monitors policy pages for changes and surfaces them in a changelog with admin review workflow.

## Features

- **Comparison Dashboard** — Score cards, multi-condition filters (trains on data? opt-out available? no human review?), and search across 40+ AI companies
- **Weighted Scoring** — Adjust the importance of six privacy categories; scores update in real-time with letter grades (A–D)
- **Company Profiles** — Deep-dive pages with score breakdown, citation sources, verification badges, and raw privacy stance data
- **Side-by-Side Comparison** — Select multiple companies and compare their privacy profiles directly
- **Automated Watchdog** — Cron-scheduled pipeline fetches privacy policy URLs every 6 hours, detects changes via content hashing, generates word-level diffs, and queues entries for admin review
- **Changelog with Admin Workflow** — Review pending changes, approve or reject, add notes, and notify subscribers
- **Email Subscriptions** — Double opt-in subscription system for changelog alerts per company
- **Methodology & Scoring Rubric** — Transparent documentation of how scores are calculated, with verification confidence ratings and FAQ
- **Admin CRUD** — HTTP Basic Auth protected interface for managing companies and changelog entries
- **PWA Support** — Service worker with cache-first strategies for offline access
- **Dark Mode** — Light/dark/system theme toggle with localStorage persistence
- **Atom & RSS Feeds** — Auto-discoverable changelog feeds

## Architecture

<div align="center">
  <pre style="background:#f6f8fa;padding:16px;border-radius:8px;text-align:left;font-size:13px;line-height:1.5">
+----------------+     +---------------------------------------+     +------------------+
|    Browser     | --> |   Cloudflare Worker (TanStack SSR)     | --> |  D1 Database     |
|   (React 19)   |     |                                       |     |   (libsql)       |
+----------------+     |   +----------------+  +--------------+ |     +------------------+
                       |   |   Router       |  |   Server     | |
                       |   | (TanStack Start)|  |  Functions   | |
                       |   +----------------+  |    (API)     | |
                       |                        +--------------+ |
                       +---------------------------------------+
                                    |
                       +-----------------------------------------+
                       |                    |                    |
                       v                    v                    v
           +---------------------+  +---------------------+  (shared DB)
           |  Watchdog (Cron)    |  |  Queue Consumer     |
           |  fetches & diffs    |  |  (async processing) |
           +---------------------+  +---------------------+
  </pre>
</div>

The app runs on **Cloudflare Workers** with server-side rendering via **TanStack Start**. Data is fetched through `createServerFn` calls — no direct database access from the client. A separate cron worker triggers the watchdog every 6 hours, which fetches privacy policies, detects changes via content hashing and line-level diffing, then queues results for admin review.

> [!NOTE]
> In development, the database runs on a local **libsql** (SQLite) file. In production, it uses **Cloudflare D1**. The same codebase handles both transparently via `getDb()`.

## Tech Stack

| Layer         | Technology                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime**   | [Bun](https://bun.sh) (dev) / [Cloudflare Workers](https://workers.cloudflare.com) (prod)                                                               |
| **Framework** | [TanStack Start](https://tanstack.com/router/latest/docs/start/overview) (React 19 + TypeScript 6)                                                      |
| **UI**        | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)                                                                         |
| **Database**  | [libsql](https://github.com/tursodatabase/libsql) (dev) / [D1](https://developers.cloudflare.com/d1) (prod) via [Drizzle ORM](https://orm.drizzle.team) |
| **State**     | [TanStack React Query](https://tanstack.com/query/latest) (SSR with 5-min stale time)                                                                   |
| **Routing**   | [TanStack Router](https://tanstack.com/router/latest) (file-based, SSR)                                                                                 |
| **Testing**   | [Vitest](https://vitest.dev)                                                                                                                            |
| **CI/CD**     | GitHub Actions → Cloudflare Workers via Wrangler                                                                                                        |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0

### Setup

```bash
# Clone the repository
git clone https://github.com/<your-org>/privacygpt.git
cd privacygpt

# Install dependencies
bun install

# Copy environment variables and fill them in
cp .env.example .env

# Seed the database with company privacy data
bun run src/lib/db/seed.ts

# Start the development server
bun run dev
```

The app will be available at `http://localhost:3000`.

### Seeding the Database

The file `src/lib/db/seedData.json` is the single source of truth for company privacy data. To update data:

1. Edit `seedData.json`
2. Run `bun run src/lib/db/seed.ts`
3. Run `bun run test` to verify structure

### Running Tests

```bash
bun run test         # Run vitest suite
bun run lint         # Lint with ESLint
bun run typecheck    # Verify TypeScript compilation
bun run format       # Format with Prettier
```

## Project Structure

```
src/
├── routes/                   # TanStack Start file-based routing
│   ├── __root.tsx            # Main layout (navbar, footer, theme toggle)
│   ├── index.tsx             # Comparison dashboard
│   ├── compare.tsx           # Side-by-side comparison
│   ├── company.$companyKey.tsx       # Company profile
│   ├── methodology.tsx       # Scoring rubric & FAQ
│   ├── changelog.tsx         # Policy changelog feed
│   ├── changelog.feed[.]xml.ts       # Atom/RSS XML feed
│   ├── admin.tsx             # Admin CRUD interface
│   ├── blog.index.tsx        # Blog listing page
│   ├── blog.$slug.tsx        # Individual blog post
│   ├── blog.feed[.]xml.ts    # Blog RSS feed
│   ├── api.cron.watchdog.ts  # Cron-triggered watchdog endpoint
│   ├── sitemap[.]xml.ts      # Sitemap XML endpoint
│   ├── faq.tsx               # FAQ page
│   ├── privacy.tsx           # Privacy policy page
│   └── terms.tsx             # Terms of service page
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── CompanySelect.tsx
│   ├── CompanyLink.tsx
│   ├── CompareScores.tsx
│   ├── CompareSection.tsx
│   ├── ThemeProvider.tsx
│   └── ThemeToggle.tsx
├── lib/
│   ├── db/                   # Drizzle schema, seed data, client
│   ├── __tests__/            # Vitest test suites
│   ├── api.ts                # Server functions (createServerFn)
│   ├── blog-data.ts          # Blog post metadata
│   ├── queries.ts            # TanStack Query hooks
│   ├── scoring.ts            # Scoring engine (6 weighted categories)
│   ├── utils.ts              # Classnames merge helpers
│   └── watchdog.ts           # Policy change detection pipeline
├── content/blog/             # MDX blog posts
├── styles.css                # Tailwind v4 + custom theme
├── router.tsx                # Router configuration with SSR hydration
└── entry.ts                  # Cloudflare Worker entry point
```

## Customization

### Weights

Users can adjust the relative importance of six scoring categories via the dashboard weights panel. Changes recalculate scores and letter grades instantly on the client side.

### Scoring Rubric

| Category            | Default Weight | Description                                              |
| ------------------- | -------------- | -------------------------------------------------------- |
| Training Data       | 30%            | Does the company train on user conversations by default? |
| Opt-Out             | 20%            | Can users opt out of training data use?                  |
| Data Retention      | 15%            | How long is conversational data retained?                |
| Deletion            | 15%            | Can users request deletion of their data?                |
| Third-Party Sharing | 10%            | Is data shared with third parties for training?          |
| Human Review        | 10%            | Are conversations reviewed by humans?                    |

## Deployment

The project is designed for [Cloudflare Workers](https://workers.cloudflare.com). Deploy with:

```bash
# Deploy main application
npx wrangler deploy

# Deploy cron worker (separate deployment for watchdog)
npx wrangler deploy --config wrangler.cron.jsonc
```

Configuration is in `wrangler.jsonc` (main app) and `wrangler.cron.jsonc` (cron worker with 6-hour schedule).

### Environment Variables

| Variable                            | Description                                        |
| ----------------------------------- | -------------------------------------------------- |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | HTTP Basic Auth for admin interface                |
| `CRON_SECRET`                       | Shared secret for cron-triggered watchdog endpoint |
| `APP_URL`                           | Public application URL                             |
| `FIRECRAWL_API_KEY`                 | API key for Firecrawl JS fallback scraper          |

## Database Changes

When modifying the Drizzle schema in `src/lib/db/schema.ts`:

```bash
# Generate SQL migrations
npx drizzle-kit generate

# Push changes to local database
npx drizzle-kit push
```
