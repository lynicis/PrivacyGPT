import { readdirSync, readFileSync } from "fs"
import { join } from "path"
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

  // Helper to parse YAML-like list: ["opt-out", "ai-training"] or [opt-out, ai-training]
  const parseTags = (tagsStr?: string): string[] => {
    if (!tagsStr) return []
    try {
      // Remove outer brackets and quotes/spaces
      const clean = tagsStr.replace(/[\[\]"]/g, "").trim()
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
    readingTime: 0, // Will be calculated
  }
}
