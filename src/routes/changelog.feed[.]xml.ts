import { createFileRoute } from "@tanstack/react-router"
import { getRssFeedFn } from "../lib/api"

export const Route = createFileRoute("/changelog/feed.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const xml = await getRssFeedFn()
          return new Response(xml, {
            status: 200,
            headers: {
              "Content-Type": "application/xml",
              "Cache-Control": "public, max-age=300, s-maxage=300",
            },
          })
        } catch (error) {
          console.error("Error generating RSS feed response:", error)
          return new Response("Error generating RSS feed", {
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
