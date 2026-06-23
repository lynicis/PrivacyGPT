import { createFileRoute, Link } from "@tanstack/react-router"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import { getBlogPostsFn } from "../lib/api"

const APP_URL = process.env.APP_URL || "https://privacygpt.lynicis.dev"

export const Route = createFileRoute("/blog/")({
  head: () => ({
    title: "Blog - PrivacyGPT",
    meta: [
      {
        name: "description",
        content:
          "Privacy insights, guides, and analysis on how major AI companies handle your conversational data.",
      },
      { property: "og:title", content: "Blog - PrivacyGPT" },
      {
        property: "og:description",
        content:
          "Privacy insights, guides, and analysis on how major AI companies handle your conversational data.",
      },
      { property: "og:url", content: `${APP_URL}/blog` },
      { name: "twitter:title", content: "Blog - PrivacyGPT" },
      {
        name: "twitter:description",
        content:
          "Privacy insights, guides, and analysis on how major AI companies handle your conversational data.",
      },
    ],
    links: [{ rel: "canonical", href: `${APP_URL}/blog` }],
    scripts: [
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Blog - PrivacyGPT",
          url: `${APP_URL}/blog`,
          description:
            "Privacy insights, guides, and analysis on how major AI companies handle your conversational data.",
        }),
      },
    ],
  }),
  loader: async () => {
    const posts = await getBlogPostsFn()
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
          <article
            key={post.slug}
            className="group border-b border-border pb-8 last:border-0"
          >
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
