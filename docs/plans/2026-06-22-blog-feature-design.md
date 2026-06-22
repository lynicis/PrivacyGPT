# Blog Feature Design

## Goal

SEO-driven informational content to attract users searching for AI privacy opt-out guides. Two initial posts:

1. "How to Opt-Out of AI Training on Social Media" — covering platforms like LinkedIn, Meta, Google, etc.
2. "Does Delete Actually Work?" — on deleting AI conversations and what really happens to your data.

## Architecture

| Aspect           | Decision                                                      |
| ---------------- | ------------------------------------------------------------- |
| Content format   | MDX files in `src/content/blog/*.mdx`                         |
| Blog index       | Minimal list (title, excerpt, date, reading time) at `/blog`  |
| Individual posts | Clean reading layout (680px column) at `/blog/:slug`          |
| SEO              | Full frontmatter kit + auto-generated JSON-LD structured data |
| Reading time     | Auto-calculated (~200 words/min)                              |
| RSS feed         | `/blog/feed.xml` (reuse changelog RSS pattern)                |
| Internal linking | Manual markdown + `<CompanyLink>` component                   |
| Navigation       | "Blog" as 5th navbar link + footer                            |

## MDX Frontmatter Schema

```yaml
---
title: "How to Opt-Out of AI Training on Social Media"
slug: "how-to-opt-out-ai-training"
description: "Step-by-step guide to opting out of AI training on LinkedIn, Meta, Google, and more."
author: "PrivacyGPT"
tags: ["opt-out", "ai-training", "social-media", "privacy"]
coverImage: "/blog/opt-out-ai-training.jpg" # optional, for OG/social
publishDate: "2026-06-22"
canonicalUrl: "https://privacygpt.app/blog/how-to-opt-out-ai-training"
type: "BlogPosting" # or "Article"
---
```

### Auto-generated fields

- `readingTime` — calculated from word count (~200 words/min)
- `ogImage` — falls back to `coverImage` or a default OG image
- Structured data (JSON-LD) — generated from frontmatter at render time

## File Structure

```
src/
├── content/
│   └── blog/
│       ├── _data.ts              # Manifest generator (scans MDX, extracts frontmatter)
│       ├── how-to-opt-out-ai-training.mdx
│       └── does-delete-actually-work.mdx
├── components/
│   └── CompanyLink.tsx           # Reusable company link component
├── routes/
│   ├── blog.tsx                  # Blog index page (/blog)
│   ├── blog.$slug.tsx            # Individual blog post (/blog/:slug)
│   └── blog.feed[.]xml.ts        # Blog RSS feed (/blog/feed.xml)
└── routes/__root.tsx             # Modified: add "Blog" nav link
```

## Pages

### Blog Index (`/blog`)

- Page heading: "Blog" with subtitle "Privacy insights and guides"
- Minimal list sorted by `publishDate` descending
- Each item: **title** (linked), **excerpt** (description), **date**, **reading time**
- No images, no cards — clean typography

### Individual Post (`/blog/:slug`)

- Clean reading layout: narrow content column (max-width ~680px), large typography
- Header: title, author, date, reading time, tags
- Body: compiled MDX content
- Footer: "Back to Blog" link
- SEO: `<head>` with title, description, canonical URL, OG tags, JSON-LD structured data

### Blog RSS Feed (`/blog/feed.xml`)

- Reuse RSS generation pattern from `changelog.feed[.]xml.ts`
- Each post as `<item>` with title, link, description, publish date, author
- Feed title: "PrivacyGPT Blog"

## Components

### CompanyLink

Props: `name` (company key), optional `children` (override text)

Renders a link to `/company/{name}` with consistent styling. Can optionally show a small badge/icon matching the dashboard's shield style.

## Navigation Updates

- Add "Blog" as 5th link in navbar between "Change Log" and theme toggle
- Add "Blog" to footer links
- Update `sitemap.xml.ts` to include `/blog` and all post URLs

## SEO Strategy

- Each post targets a specific search query (e.g., "how to opt out of AI training")
- Internal links from blog posts to company profile pages using CompanyLink
- JSON-LD structured data auto-generated from frontmatter
- Canonical URLs specified in frontmatter
- OG images for social sharing

## Build Integration

- Add MDX support via `@mdx-js/rollup` or equivalent
- `_data.ts` manifest generated at build time by scanning MDX files
- Route loaders read manifest for data fetching (no database needed)
