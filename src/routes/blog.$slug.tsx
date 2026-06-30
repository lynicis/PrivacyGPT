import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Calendar, Clock, User, Tag } from "lucide-react"
import { getBlogPostBySlugFn } from "../lib/api"
import { lazy, Suspense, useEffect, useMemo } from "react"
import { getProp } from "../lib/utils"

const APP_URL = process.env.APP_URL || "https://privacygpt.lynicis.dev"

const postModules = import.meta.glob<{ default: React.ComponentType<any> }>(
  "../content/blog/*.mdx"
)

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getBlogPostBySlugFn({ data: params.slug })
    if (!post) {
      throw new Error("Post not found")
    }

    return { post }
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

  useEffect(() => {
    document.title = `${post.title} - PrivacyGPT`
  }, [post.title])

  const PostComponent = useMemo(() => {
    const matchKey = `../content/blog/${post.slug}.mdx`
    const loadPost = getProp(postModules, matchKey) as
      | (() => Promise<{ default: React.ComponentType<any> }>)
      | undefined
    if (!loadPost) return null
    return lazy(loadPost)
  }, [post.slug])

  return (
    <article className="mx-auto max-w-[680px] px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            author: { "@type": "Organization", name: post.author },
            datePublished: post.publishDate,
            url: post.canonicalUrl || `${APP_URL}/blog/${post.slug}`,
          }),
        }}
      />
      <link
        rel="canonical"
        href={post.canonicalUrl || `${APP_URL}/blog/${post.slug}`}
      />

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
            {post.tags.map((tag: string) => (
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
      <div className="prose mt-8 max-w-none prose-neutral dark:prose-invert">
        {PostComponent ? (
          <Suspense fallback={<div>Loading post...</div>}>
            <PostComponent />
          </Suspense>
        ) : (
          <p className="text-destructive">Error loading post content.</p>
        )}
      </div>
    </article>
  )
}
