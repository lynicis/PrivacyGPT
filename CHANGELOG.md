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
