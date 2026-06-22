import { createFileRoute } from "@tanstack/react-router"
import { runWatchdog } from "../lib/watchdog"

export const Route = createFileRoute("/api/cron/watchdog")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const authHeader = request.headers.get("Authorization")
          const cronSecret = process.env.CRON_SECRET

          if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return new Response(
              JSON.stringify({ success: false, error: "Unauthorized" }),
              {
                status: 401,
                headers: {
                  "Content-Type": "application/json",
                },
              }
            )
          }

          console.log("[cron-watchdog] Triggering watchdog run...")
          const stats = await runWatchdog()
          console.log("[cron-watchdog] Watchdog run complete:", stats)

          return new Response(
            JSON.stringify({
              success: true,
              stats,
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store, no-cache, must-revalidate",
              },
            }
          )
        } catch (error) {
          console.error(
            "[cron-watchdog] Scheduled watchdog execution failed:",
            error
          )
          return new Response(
            JSON.stringify({
              success: false,
              error: "Watchdog execution failed",
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
        }
      },
    },
  },
})
