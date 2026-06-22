# Changelog

All notable changes to the **PrivacyGPT** project will be documented in this file.

## [Phase 1] - 2026-06-21

### Added
- **Database Schema**: Implemented the core Drizzle ORM schema defining the `companies` database table (for comparison records) along with placeholder tables for `snapshots` (change detection), `changelogs`, and email `subscriptions` to support future phases.
- **LibSQL Client Connection**: Configured Drizzle connection with `@libsql/client` (SQLite) supporting local file development and serverless deployability on Vercel.
- **Seeding Pipeline**: Built a dedicated, repeatable seed script in `src/lib/db/seed.ts` loaded with curated and verified primary-source privacy data for 10 AI platforms.
- **Server API Functions**: Implemented server-side loaders `getCompaniesFn` and `getCompanyByKeyFn` using TanStack Start's server functions to securely read SQLite data.
- **Interactive Dashboard UI**: Built the home page comparing 10 companies' default data usage, opt-out mechanisms, retention periods, human reviews, and metadata, featuring search, multi-condition filters (e.g. training off, opt-out available, no human review), and custom sorting dropdowns.
- **Detailed Company Profile Page**: Implemented dynamic profile pages at `/company/$companyKey` detailing the legal terms and direct citations for each platform.
- **Methodology Page**: Created `/methodology` to outline the assessment criteria, confidence ratings, and upcoming weights.
- **Test Suite**: Added schema validation and data integrity tests in `src/lib/__tests__/schema.test.ts` running on Vitest.
- **shadcn/ui Refactoring**: Integrated standard shadcn/ui components (`Card`, `Badge`, `Input`, `Select`, `Switch`, `Button`) and refactored all frontend views (dashboard, details, methodology) to use native shadcn CSS tokens and layout components.

## [Phase 2] - 2026-06-21

### Added
- **Scoring Engine**: Implemented robust scoring computations inside `src/lib/scoring.ts` to compute points, weights, composite scores, and letter grades.
- **Customizable Weights Panel**: Built an interactive weights console on the main dashboard for Data Retention, Opt-out control, Model Training, Policy Transparency, and Privacy Safeguards.
- **Score Visualizations**: Integrated composite letter grade badges, ranking, and sub-category grading grids on the dashboard and profile pages.
- **Methodology Documentation**: Documented the point breakdowns, grading scales, and calculation methodology on the Methodology page.
- **Vitest Unit Tests**: Added `src/lib/__tests__/scoring.test.ts` to validate scoring logic and grading rules.

## [Phase 3] - 2026-06-21

### Added
- **Watchdog Crawler Pipeline**: Implemented `src/lib/watchdog.ts` to fetch policy texts, strip boilerplate HTML elements, hash content, and detect changes.
- **Change Log Timeline Route**: Created `/changelog` with status/company filters and statistics.
- **Line-by-Line Diff Viewer**: Built an expandable diff visualizer showing added (green +) and removed (red -) policy statements.
- **RSS XML Feed**: Added an RSS XML endpoint at `/changelog/feed.xml`.
- **Vitest Unit Tests**: Added `src/lib/__tests__/watchdog.test.ts` to verify text extraction, hashing, and diff generation.


## [Phase 4] - 2026-06-22

### Added
- **Subscription API Handlers**: Implemented double opt-in email subscriptions in `src/lib/api.ts` with `subscribeEmailHandler`, `confirmSubscriptionHandler`, and `unsubscribeHandler`.
- **Alert Notifications**: Updated `reviewChangelogFn` to query confirmed subscribers and print mock notification alerts to the console whenever policy changes are approved.
- **In-App Admin Review Panel**: Added a custom inline review notes text area and "Approve & Alert Subscribers" button directly on the `/changelog` route under pending timeline entries.
- **Scheduled Watchdog Cron Endpoint**: Exposed `/api/cron/watchdog` supporting secure execution (authenticated via `Authorization` header check matching `CRON_SECRET`) for Vercel Cron.
- **Subscription Confirmation/Unsubscription Routes**: Built `/subscribe/confirm` and `/subscribe/unsubscribe` page routes to handle double opt-in verification and quick opt-out actions.
- **Cleaned Vercel UX**: Removed CLI commands from `/changelog` empty state for clean public-facing UX.
- **Global Footer Subscription Form**: Added subscription email input and target company selector widget to the primary site layout footer.
- **Unit Tests**: Added `src/lib/__tests__/subscriptions.test.ts` to test invalid email filtering, pending subscriptions, token confirmations, and unsubscriptions.
