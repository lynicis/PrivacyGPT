import { createFileRoute } from "@tanstack/react-router"
import { getDb, companies } from "../lib/db"
import { getBlogPostsFn } from "../lib/api"

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const db = await getDb()
          const [rows, blogPosts] = await Promise.all([
            db
              .select({
                companyKey: companies.companyKey,
                lastVerifiedDate: companies.lastVerifiedDate,
              })
              .from(companies),
            getBlogPostsFn(),
          ])

          const siteUrl =
            process.env.APP_URL || "https://privacygpt.lynicis.dev"
          const now = new Date().toISOString()

          const urls = [
            {
              loc: siteUrl,
              lastmod: now,
              changefreq: "weekly",
              priority: "1.0",
            },
            {
              loc: `${siteUrl}/methodology`,
              lastmod: now,
              changefreq: "monthly",
              priority: "0.8",
            },
            {
              loc: `${siteUrl}/compare`,
              lastmod: now,
              changefreq: "monthly",
              priority: "0.8",
            },
            {
              loc: `${siteUrl}/changelog`,
              lastmod: now,
              changefreq: "daily",
              priority: "0.7",
            },
            {
              loc: `${siteUrl}/blog`,
              lastmod: now,
              changefreq: "weekly",
              priority: "0.8",
            },
            ...rows.map((row) => ({
              loc: `${siteUrl}/company/${row.companyKey}`,
              lastmod: row.lastVerifiedDate || now,
              changefreq: "weekly" as const,
              priority: "0.9",
            })),
            ...blogPosts.map((post) => ({
              loc: `${siteUrl}/blog/${post.slug}`,
              lastmod: post.publishDate
                ? new Date(post.publishDate).toISOString()
                : now,
              changefreq: "monthly" as const,
              priority: "0.7",
            })),
          ]

          const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`

          return new Response(xml, {
            status: 200,
            headers: {
              "Content-Type": "application/xml",
              "Cache-Control": "public, max-age=3600, s-maxage=3600",
            },
          })
        } catch (error) {
          console.error("Error generating sitemap:", error)
          return new Response("Error generating sitemap", {
            status: 500,
            headers: {
              "Content-Type": "text/plain",
            },
          })
        }
      },
    },
  },
})
