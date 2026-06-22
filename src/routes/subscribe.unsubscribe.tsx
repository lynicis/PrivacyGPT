import { createFileRoute, Link } from "@tanstack/react-router"
import { unsubscribeFn } from "../lib/api"
import { CheckCircle2, AlertTriangle } from "lucide-react"

type UnsubscribeSearch = {
  token?: string
}

export const Route = createFileRoute("/subscribe/unsubscribe")({
  validateSearch: (search: Record<string, unknown>): UnsubscribeSearch => {
    return {
      token: typeof search.token === "string" ? search.token : undefined,
    }
  },
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: async ({ deps }) => {
    if (!deps.token) {
      return { success: false, error: "Missing unsubscribe token." }
    }
    try {
      const res = await unsubscribeFn({ data: { token: deps.token } })
      return res
    } catch (err) {
      console.error("Unsubscribe error:", err)
      return {
        success: false,
        error: "An unexpected error occurred during unsubscribe request.",
      }
    }
  },
  component: UnsubscribePage,
  head: () => ({
    meta: [
      {
        title: "Unsubscribe — PrivacyGPT",
      },
    ],
  }),
})

function UnsubscribePage() {
  const data = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <div className="border border-border bg-card p-8 text-center text-card-foreground">
        {data.success ? (
          <>
            <div className="mx-auto mb-4 w-fit bg-chart-5/10 p-3 text-chart-5">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Unsubscribed</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              You have been successfully unsubscribed. You will no longer
              receive privacy policy update notifications.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 w-fit bg-destructive/10 p-3 text-destructive">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Request Failed</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {data.error || "The unsubscribe token is invalid or has expired."}
            </p>
          </>
        )}
        <div className="mt-8 border-t border-border pt-6">
          <Link
            to="/"
            className="inline-flex h-9 cursor-pointer items-center justify-center bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
