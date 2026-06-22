import { createFileRoute, Link } from "@tanstack/react-router"
import { confirmSubscriptionFn } from "../lib/api"
import { ShieldCheck, AlertTriangle } from "lucide-react"

type ConfirmSearch = {
  token?: string
}

export const Route = createFileRoute("/subscribe/confirm")({
  validateSearch: (search: Record<string, unknown>): ConfirmSearch => {
    return {
      token: typeof search.token === "string" ? search.token : undefined,
    }
  },
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: async ({ deps }) => {
    if (!deps.token) {
      return { success: false, error: "Missing confirmation token." }
    }
    try {
      const res = await confirmSubscriptionFn({ data: { token: deps.token } })
      return res
    } catch (err) {
      console.error("Confirmation error:", err)
      return {
        success: false,
        error: "An unexpected error occurred during confirmation.",
      }
    }
  },
  component: ConfirmPage,
  head: () => ({
    meta: [
      {
        title: "Confirm Subscription — PrivacyGPT",
      },
    ],
  }),
})

function ConfirmPage() {
  const data = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <div className="border border-border bg-card p-8 text-center text-card-foreground">
        {data.success ? (
          <>
            <div className="mx-auto mb-4 w-fit bg-chart-5/10 p-3 text-chart-5">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Subscription Confirmed!
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Your email alert subscription for{" "}
              <strong className="text-foreground">{data.companyName}</strong>{" "}
              has been successfully confirmed. You will now receive alerts
              whenever their privacy policies are updated.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 w-fit bg-destructive/10 p-3 text-destructive">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Confirmation Failed
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {data.error ||
                "The confirmation token is invalid or has expired."}
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
