import slugify from "slugify"

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

const BLOG_POSTS: BlogPostMeta[] = [
  {
    title: "How to Opt-Out of AI Training on Social Media",
    slug: slugify("how-to-opt-out-ai-training", { lower: true, strict: true }),
    description:
      "How to opt out of AI training on LinkedIn, Meta, Google, and other major platforms.",
    author: "PrivacyGPT",
    tags: ["opt-out", "ai-training", "social-media", "privacy"],
    publishDate: "2026-06-22",
    canonicalUrl: "https://privacygpt.app/blog/how-to-opt-out-ai-training",
    type: "BlogPosting",
    readingTime: 4,
  },
  {
    title: "Does Delete Actually Work?",
    slug: slugify("does-delete-actually-work", { lower: true, strict: true }),
    description:
      "When you delete your AI conversations, what really happens to your data? We investigate the truth behind the delete button.",
    author: "PrivacyGPT",
    tags: ["deletion", "ai-privacy", "data-retention", "privacy"],
    publishDate: "2026-06-21",
    canonicalUrl: "https://privacygpt.app/blog/does-delete-actually-work",
    type: "BlogPosting",
    readingTime: 4,
  },
]

export function getBlogPosts(): BlogPostMeta[] {
  return [...BLOG_POSTS].sort(
    (a, b) =>
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  )
}

export function getBlogPostBySlug(slug: string): BlogPostMeta | null {
  return BLOG_POSTS.find((p) => p.slug === slug) || null
}
