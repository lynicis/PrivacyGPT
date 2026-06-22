import { createFileRoute } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import { getBlogPostsFn } from "../lib/api"

export const Route = createFileRoute("/blog/")({
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
