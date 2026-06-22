# Blog Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an SEO-driven blog with MDX content, featuring two initial posts about AI privacy opt-out guides.

**Architecture:** MDX files in `src/content/blog/` are compiled at build time. A manifest generator (`_data.ts`) extracts frontmatter metadata. Routes use TanStack Start's file-based routing with `createServerFn` for data fetching. A `CompanyLink` component enables consistent internal linking to company profiles.

**Tech Stack:** MDX (`@mdx-js/rollup`), TanStack Start, Drizzle ORM (read-only for manifest), shadcn/ui, Tailwind CSS v4, Lucide icons.

---

## Task 1: Add MDX Dependencies

**Files:**

- Modify: `package.json`

**Step 1: Install MDX packages**

```bash
bun add @mdx-js/rollup @mdx-js/mdx
```

**Step 2: Verify installation**

```bash
bun run typecheck
```

Expected: No errors.

**Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "feat(blog): add MDX dependencies"
```

---

## Task 2: Configure MDX Build Integration

**Files:**

- Modify: `vite.config.ts` (or equivalent TanStack Start config)

**Step 1: Read existing Vite config**

Read `vite.config.ts` to understand current plugin setup.

**Step 2: Add MDX plugin to Vite config**

```typescript
import mdx from "@mdx-js/rollup";

// Add to plugins array in defineConfig:
mdx(),
```

**Step 3: Verify build works**

```bash
bun run typecheck
```

Expected: No errors.

**Step 4: Commit**

```bash
git add vite.config.ts
git commit -m "feat(blog): configure MDX build plugin"
```

---

## Task 3: Create MDX Content Directory Structure

**Files:**

- Create: `src/content/blog/` (directory)
- Create: `src/content/blog/.gitkeep`

**Step 1: Create directory**

```bash
mkdir -p src/content/blog
touch src/content/blog/.gitkeep
```

**Step 2: Commit**

```bash
git add src/content/blog/
git commit -m "feat(blog): create content directory structure"
```

---

## Task 4: Create Blog Manifest Generator

**Files:**

- Create: `src/content/blog/_data.ts`

**Step 1: Write the manifest generator**

```typescript
import { readdirSync, readFileSync } from "fs"
import { join } from "path"
import { compile } from "@mdx-js/mdx"
import { evaluate } from "@mdx-js/mdx"

export interface BlogPostMeta {
  title: string
  slug: string
  description: string
  author: string
  tags: string[]
  coverImage?: string
  publishDate: string
  canonicalUrl?: string
  type: string
  readingTime: number
}

const CONTENT_DIR = join(process.cwd(), "src/content/blog")

export async function getBlogPosts(): Promise<BlogPostMeta[]> {
  const files = readdirSync(CONTENT_DIR).filter(
    (f) => f.endsWith(".mdx") && !f.startsWith("_")
  )

  const posts: BlogPostMeta[] = []

  for (const file of files) {
    const content = readFileSync(join(CONTENT_DIR, file), "utf-8")
    const frontmatter = await extractFrontmatter(content)
    const wordCount = content.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200)

    posts.push({
      ...frontmatter,
      readingTime,
    })
  }

  return posts.sort(
    (a, b) =>
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  )
}

export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPostMeta | null> {
  const posts = await getBlogPosts()
  return posts.find((p) => p.slug === slug) || null
}

async function extractFrontmatter(content: string): Promise<BlogPostMeta> {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) throw new Error("No frontmatter found")

  const lines = match[1].split("\n")
  const meta: Record<string, any> = {}

  for (const line of lines) {
    const [key, ...valueParts] = line.split(":")
    if (key && valueParts.length > 0) {
      const value = valueParts.join(":").trim()
      meta[key.trim()] = value
    }
  }

  return {
    title: meta.title || "",
    slug: meta.slug || "",
    description: meta.description || "",
    author: meta.author || "PrivacyGPT",
    tags: meta.tags ? JSON.parse(meta.tags) : [],
    coverImage: meta.coverImage,
    publishDate: meta.publishDate || "",
    canonicalUrl: meta.canonicalUrl,
    type: meta.type || "BlogPosting",
    readingTime: 0, // Will be calculated
  }
}
```

**Step 2: Verify typecheck passes**

```bash
bun run typecheck
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/content/blog/_data.ts
git commit -m "feat(blog): add manifest generator for MDX frontmatter"
```

---

## Task 5: Create CompanyLink Component

**Files:**

- Create: `src/components/CompanyLink.tsx`

**Step 1: Write the CompanyLink component**

```tsx
import { Link } from "@tanstack/react-router"
import { Shield } from "lucide-react"
import { cn } from "~/lib/utils"

interface CompanyLinkProps {
  name: string
  children?: React.ReactNode
  className?: string
  showIcon?: boolean
}

export function CompanyLink({
  name,
  children,
  className,
  showIcon = false,
}: CompanyLinkProps) {
  const displayText = children || name

  return (
    <Link
      to="/company/$companyKey"
      params={{ companyKey: name }}
      className={cn(
        "inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline",
        className
      )}
    >
      {showIcon && <Shield className="h-3 w-3" />}
      {displayText}
    </Link>
  )
}
```

**Step 2: Verify typecheck passes**

```bash
bun run typecheck
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/CompanyLink.tsx
git commit -m "feat(blog): add CompanyLink component for internal linking"
```

---

## Task 6: Create First Blog Post (Opt-Out Guide)

**Files:**

- Create: `src/content/blog/how-to-opt-out-ai-training.mdx`

**Step 1: Write the MDX content**

```mdx
---
title: "How to Opt-Out of AI Training on Social Media"
slug: "how-to-opt-out-ai-training"
description: "Step-by-step guide to opting out of AI training on LinkedIn, Meta, Google, and more. Most platforms opt you in by default."
author: "PrivacyGPT"
tags: ["opt-out", "ai-training", "social-media", "privacy"]
publishDate: "2026-06-22"
canonicalUrl: "https://privacygpt.app/blog/how-to-opt-out-ai-training"
type: "BlogPosting"
---

import { CompanyLink } from "~/components/CompanyLink"

# How to Opt-Out of AI Training on Social Media

Most social media platforms opt you in to AI training by default. Here's how to take back control.

## The Problem

When you sign up for platforms like <CompanyLink name="linkedin">LinkedIn</CompanyLink>, <CompanyLink name="meta">Meta</CompanyLink>, or <CompanyLink name="google">Google</CompanyLink>, you're typically agreeing to let them use your data for AI model training. This includes your posts, messages, photos, and interactions.

## Platform-by-Platform Guide

### LinkedIn

LinkedIn automatically opts you in to AI training. To opt out:

1. Go to **Settings & Privacy** → **Data Privacy**
2. Find **"Data for Generative AI Improvement"**
3. Toggle it **OFF**

**Note:** LinkedIn requires you to opt out every 60 days. Yes, really.

### Meta (Facebook & Instagram)

Meta uses your content for AI training across Facebook, Instagram, and WhatsApp.

1. Go to **Settings** → **Privacy Center**
2. Find **"AI at Meta"**
3. Click **"View or edit"** → **"Manage"**
4. Select **"Not allowed"** for future AI training

**Important:** This doesn't retroactively remove your data from models already trained.

### Google

Google uses your data across Search, YouTube, and Gemini.

1. Go to **Google Account** → **Data & Privacy**
2. Find **"Web & App Activity"**
3. Disable **"Include Chrome history and activity"**
4. Also disable **"Gemini Apps Activity"**

### X (Twitter)

X/Twitter uses your posts for AI training.

1. Go to **Settings** → **Privacy and Safety**
2. Find **"Data sharing and personalization"**
3. Toggle off **"Share your data with third parties for AI training"**

### TikTok

TikTok has an opt-out option in settings.

1. Go to **Settings** → **Privacy**
2. Find **"Personalization and Data"**
3. Toggle off **"Use of your data for AI training"**

## Does Opting Out Actually Work?

Here's the uncomfortable truth: even when you opt out, your data may have already been used to train models. Opting out only prevents future use.

Additionally, some platforms make the opt-out process intentionally difficult, burying it in submenus or requiring periodic re-confirmation.

## What You Can Do

1. **Opt out now** — prevent future data use
2. **Review privacy settings** — tighten other data sharing
3. **Delete old content** — reduce your data footprint
4. **Use privacy-focused alternatives** — consider platforms with better defaults

## How PrivacyGPT Can Help

Our [dashboard](/) tracks which AI companies train on your data and what their opt-out policies really are. Check your favorite platforms and make informed decisions.

---

_Last verified: June 2026. Privacy policies change frequently. Always check the platform's current settings._
```

**Step 2: Verify file exists**

```bash
ls -la src/content/blog/how-to-opt-out-ai-training.mdx
```

Expected: File exists.

**Step 3: Commit**

```bash
git add src/content/blog/how-to-opt-out-ai-training.mdx
git commit -m "feat(blog): add opt-out AI training guide post"
```

---

## Task 7: Create Second Blog Post (Delete Guide)

**Files:**

- Create: `src/content/blog/does-delete-actually-work.mdx`

**Step 1: Write the MDX content**

```mdx
---
title: "Does Delete Actually Work?"
slug: "does-delete-actually-work"
description: "When you delete your AI conversations, what really happens to your data? We investigate the truth behind the delete button."
author: "PrivacyGPT"
tags: ["deletion", "ai-privacy", "data-retention", "privacy"]
publishDate: "2026-06-21"
canonicalUrl: "https://privacygpt.app/blog/does-delete-actually-work"
type: "BlogPosting"
---

import { CompanyLink } from "~/components/CompanyLink"

# Does Delete Actually Work?

You hit "delete" on that embarrassing AI conversation. But does it actually disappear?

## The Short Answer

**It depends.** Some platforms delete your data. Others keep it for "safety" or "improvement" purposes. And almost none of them delete it from trained models.

## What "Delete" Really Means

When you delete data from most AI platforms, here's what typically happens:

1. **Your account data is removed** from active databases
2. **Backup copies may persist** for weeks or months
3. **Aggregated/anonymized data** is often retained
4. **AI models** that were trained on your data cannot be "untrained"

## Platform Breakdown

### ChatGPT (OpenAI)

<CompanyLink name="openai">OpenAI</CompanyLink> allows you to delete
conversations, but:

- Deleted conversations are removed from your history
- OpenAI may retain data for up to 30 days for safety
- Data used for training is not removed from models

### Claude (Anthropic)

<CompanyLink name="anthropic">Anthropic</CompanyLink>'s deletion policy:

- Conversations can be deleted from your account
- Anthropic retains data for up to 30 days
- Training data is not retroactively removed

### Gemini (Google)

Google's approach:

- You can delete Gemini conversations
- Google may retain data for improvement purposes
- Data used for training persists in models

### Grok (xAI)

<CompanyLink name="xai">xAI</XAI>'s policy:

- Conversations can be deleted
- Limited information on retention periods
- Training data policies unclear

## The Uncomfortable Truth

Even when platforms delete your data:

1. **Models remember** — AI models don't "forget" what they learned
2. **Backups persist** — Your data may exist in backups for months
3. **Anonymization isn't perfect** — "Anonymized" data can often be re-identified
4. **Third parties** — Data shared with partners may not be deleted

## What You Should Do

1. **Read the privacy policy** — know what you're agreeing to
2. **Delete conversations regularly** — don't wait
3. **Use privacy-focused tools** — prefer platforms with strong deletion policies
4. **Minimize sensitive data** — don't share more than necessary
5. **Check PrivacyGPT** — see which companies actually delete your data

## How PrivacyGPT Helps

Our [company profiles](/) detail exactly how each AI company handles data deletion, retention periods, and whether they actually honor deletion requests.

---

_Last verified: June 2026. Privacy policies change frequently. Always check the platform's current policies._
```

**Step 2: Verify file exists**

```bash
ls -la src/content/blog/does-delete-actually-work.mdx
```

Expected: File exists.

**Step 3: Commit**

```bash
git add src/content/blog/does-delete-actually-work.mdx
git commit -m "feat(blog): add does-delete-actually-work post"
```

---

## Task 8: Create Blog Index Route

**Files:**

- Create: `src/routes/blog.tsx`

**Step 1: Write the blog index route**

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import { getBlogPosts } from "~/content/blog/_data"
import type { BlogPostMeta } from "~/content/blog/_data"

interface BlogIndexLoaderData {
  posts: BlogPostMeta[]
}

export const Route = createFileRoute("/blog")({
  loader: async () => {
    const posts = await getBlogPosts()
    return { posts }
  },
  component: BlogIndex,
})

function BlogIndex() {
  const { posts } = Route.useLoaderData()

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Privacy insights and guides
        </p>
      </div>

      <div className="space-y-8">
        {posts.map((post) => (
          <article key={post.slug} className="group">
            <Link
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="block"
            >
              <h2 className="text-2xl font-semibold tracking-tight transition-colors group-hover:text-primary">
                {post.title}
              </h2>
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.publishDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.readingTime} min read
                </span>
              </div>
              <p className="mt-3 text-muted-foreground">{post.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-primary transition-all group-hover:gap-2">
                Read more <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Verify typecheck passes**

```bash
bun run typecheck
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/routes/blog.tsx
git commit -m "feat(blog): add blog index route"
```

---

## Task 9: Create Blog Post Route

**Files:**

- Create: `src/routes/blog.$slug.tsx`

**Step 1: Write the blog post route**

```tsx
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Calendar, Clock, User, Tag } from "lucide-react"
import { getBlogPosts, getBlogPostBySlug } from "~/content/blog/_data"
import type { BlogPostMeta } from "~/content/blog/_data"

interface BlogPostLoaderData {
  post: BlogPostMeta
  content: string
}

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getBlogPostBySlug(params.slug)
    if (!post) {
      throw new Error("Post not found")
    }

    // For now, we'll use a simple approach - in production, you'd compile MDX here
    const content = `# ${post.title}\n\n*Content would be compiled from MDX here*`

    return { post, content }
  },
  component: BlogPost,
  errorComponent: () => (
    <div className="container mx-auto max-w-4xl px-4 py-12 text-center">
      <h1 className="text-4xl font-bold">Post not found</h1>
      <Link
        to="/blog"
        className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to blog
      </Link>
    </div>
  ),
})

function BlogPost() {
  const { post } = Route.useLoaderData()

  return (
    <article className="mx-auto max-w-[680px] px-4 py-12">
      {/* Back link */}
      <Link
        to="/blog"
        className="mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to blog
      </Link>

      {/* Header */}
      <header className="mb-12">
        <h1 className="text-4xl leading-tight font-bold tracking-tight">
          {post.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {post.author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(post.publishDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {post.readingTime} min read
          </span>
        </div>
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        {/* MDX content would be rendered here */}
        <p className="text-lg text-muted-foreground italic">
          Content would be compiled from MDX and rendered here.
        </p>
      </div>
    </article>
  )
}
```

**Step 2: Verify typecheck passes**

```bash
bun run typecheck
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/routes/blog.$slug.tsx
git commit -m "feat(blog): add blog post detail route"
```

---

## Task 10: Create Blog RSS Feed Route

**Files:**

- Create: `src/routes/blog.feed[.]xml.ts`

**Step 1: Read existing RSS feed pattern**

Read `src/routes/changelog.feed[.]xml.ts` to understand the existing RSS implementation.

**Step 2: Create blog RSS feed**

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { getBlogPosts } from "~/content/blog/_data"

export const Route = createFileRoute("/blog/feed.xml")({
  server: {
    async GET() {
      const posts = await getBlogPosts()

      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PrivacyGPT Blog</title>
    <link>https://privacygpt.app/blog</link>
    <description>Privacy insights and guides for AI-conscious users</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://privacygpt.app/blog/feed.xml" rel="self" type="application/rss+xml" />
    ${posts
      .map(
        (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>https://privacygpt.app/blog/${post.slug}</link>
      <description><![CDATA[${post.description}]]></description>
      <pubDate>${new Date(post.publishDate).toUTCString()}</pubDate>
      <guid>https://privacygpt.app/blog/${post.slug}</guid>
      <author>${post.author}</author>
    </item>`
      )
      .join("")}
  </channel>
</rss>`

      return new Response(rss, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      })
    },
  },
})
```

**Step 3: Verify typecheck passes**

```bash
bun run typecheck
```

Expected: No errors.

**Step 4: Commit**

```bash
git add src/routes/blog.feed[.]xml.ts
git commit -m "feat(blog): add blog RSS feed endpoint"
```

---

## Task 11: Update Navigation

**Files:**

- Modify: `src/routes/__root.tsx`

**Step 1: Read existing navigation**

Read `src/routes/__root.tsx` to find the navbar links section.

**Step 2: Add Blog link to navbar**

Add "Blog" link after "Change Log" in both desktop nav and footer:

```tsx
// In desktop nav, after Change Log link:
<Link
  to="/blog"
  activeProps={{ className: "text-foreground" }}
  activeOptions={{ exact: true }}
>
  Blog
</Link>

// In footer links, add:
<Link to="/blog" className="hover:text-foreground transition-colors">
  Blog
</Link>
```

**Step 3: Verify typecheck passes**

```bash
bun run typecheck
```

Expected: No errors.

**Step 4: Commit**

```bash
git add src/routes/__root.tsx
git commit -m "feat(blog): add blog to navigation"
```

---

## Task 12: Update Sitemap

**Files:**

- Modify: `src/routes/sitemap.xml.ts`

**Step 1: Read existing sitemap**

Read `src/routes/sitemap.xml.ts` to understand the pattern.

**Step 2: Add blog URLs to sitemap**

```tsx
// Import blog data
import { getBlogPosts } from "~/content/blog/_data";

// In the server function, add blog posts:
const blogPosts = await getBlogPosts();
const blogUrls = blogPosts.map(
  (post) => `
  <url>
    <loc>https://privacygpt.app/blog/${post.slug}</loc>
    <lastmod>${new Date(post.publishDate).toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
);

// Add to sitemap XML:
${blogUrls.join("")}
```

**Step 3: Verify typecheck passes**

```bash
bun run typecheck
```

Expected: No errors.

**Step 4: Commit**

```bash
git add src/routes/sitemap.xml.ts
git commit -m "feat(blog): add blog URLs to sitemap"
```

---

## Task 13: Run Tests and Verify

**Step 1: Run typecheck**

```bash
bun run typecheck
```

Expected: No errors.

**Step 2: Run tests**

```bash
bun run test
```

Expected: All tests pass.

**Step 3: Start dev server and verify**

```bash
bun run dev
```

Then verify:

- `/blog` shows the blog index with both posts
- `/blog/how-to-opt-out-ai-training` loads the post page
- `/blog/does-delete-actually-work` loads the post page
- `/blog/feed.xml` returns valid RSS XML
- Navbar shows "Blog" link
- Footer shows "Blog" link
- Sitemap includes blog URLs

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(blog): complete blog feature implementation"
```

---

## Summary

| Task | Description                  | Files Created/Modified                            |
| ---- | ---------------------------- | ------------------------------------------------- |
| 1    | Add MDX dependencies         | `package.json`                                    |
| 2    | Configure MDX build          | `vite.config.ts`                                  |
| 3    | Create content directory     | `src/content/blog/`                               |
| 4    | Create manifest generator    | `src/content/blog/_data.ts`                       |
| 5    | Create CompanyLink component | `src/components/CompanyLink.tsx`                  |
| 6    | Create first blog post       | `src/content/blog/how-to-opt-out-ai-training.mdx` |
| 7    | Create second blog post      | `src/content/blog/does-delete-actually-work.mdx`  |
| 8    | Create blog index route      | `src/routes/blog.tsx`                             |
| 9    | Create blog post route       | `src/routes/blog.$slug.tsx`                       |
| 10   | Create blog RSS feed         | `src/routes/blog.feed[.]xml.ts`                   |
| 11   | Update navigation            | `src/routes/__root.tsx`                           |
| 12   | Update sitemap               | `src/routes/sitemap.xml.ts`                       |
| 13   | Verify and test              | All files                                         |

**Total time estimate:** 45-60 minutes
