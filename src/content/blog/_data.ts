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

const mdxSources = import.meta.glob<{
  default: string
}>("./*.mdx?raw", { eager: true })

function extractFrontmatter(content: string): BlogPostMeta {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) throw new Error("No frontmatter found")

  const lines = match[1].split("\n")
  const meta: Record<string, any> = {}

  for (const line of lines) {
    const [key, ...valueParts] = line.split(":")
    if (key && valueParts.length > 0) {
      let value = valueParts.join(":").trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      meta[key.trim()] = value
    }
  }

  const parseTags = (tagsStr?: string): string[] => {
    if (!tagsStr) return []
    try {
      const clean = tagsStr.replace(/[[\]"]/g, "").trim()
      if (!clean) return []
      return clean.split(",").map((t) => t.trim())
    } catch {
      return []
    }
  }

  return {
    title: meta.title || "",
    slug: slugify(meta.slug || meta.title || "", { lower: true, strict: true }),
    description: meta.description || "",
    author: meta.author || "PrivacyGPT",
    tags: parseTags(meta.tags),
    coverImage: meta.coverImage,
    publishDate: meta.publishDate || "",
    canonicalUrl: meta.canonicalUrl,
    type: meta.type || "BlogPosting",
    readingTime: 0,
  }
}

export function getBlogPosts(): BlogPostMeta[] {
  const posts: BlogPostMeta[] = []

  for (const [, mod] of Object.entries(mdxSources)) {
    const raw = mod.default
    try {
      const meta = extractFrontmatter(raw)
      const wordCount = raw.split(/\s+/).filter(Boolean).length
      meta.readingTime = Math.max(1, Math.ceil(wordCount / 200))
      posts.push(meta)
    } catch {
      // skip files without valid frontmatter
    }
  }

  return posts.sort(
    (a, b) =>
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  )
}

export function getBlogPostBySlug(slug: string): BlogPostMeta | null {
  const posts = getBlogPosts()
  return posts.find((p) => p.slug === slug) || null
}
