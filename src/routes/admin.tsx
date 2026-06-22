import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import {
  getChangelogsFn,
  getSnapshotCountsFn,
  reviewChangelogFn,
  checkAdminAuthFn,
} from "../lib/api"
import { useState } from "react"
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
  Plus,
  Minus,
  Settings,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  beforeLoad: async ({ context }) => {
    try {
      await checkAdminAuthFn()
      return { auth: { success: true } }
    } catch (error) {
      if (error instanceof Response) {
        if (context.router) {
          context.router.stores.statusCode.set(error.status)
        }
        return { auth: { success: false } }
      }
      throw error
    }
  },
  loader: async ({ context }) => {
    if (!context.auth || !context.auth.success) {
      return { changelogs: [], snapshots: [], unauthorized: true }
    }
    const [changelogs, snapshots] = await Promise.all([
      getChangelogsFn(),
      getSnapshotCountsFn(),
    ])
    return { changelogs, snapshots, unauthorized: false }
  },
  headers: ({ loaderData }): Record<string, string> => {
    if (loaderData && (loaderData as any).unauthorized) {
      return {
        "WWW-Authenticate": 'Basic realm="Admin Portal"',
      }
    }
    return {}
  },
  head: () => ({
    meta: [
      {
        title: "Admin Portal — PrivacyGPT",
      },
      {
        name: "description",
        content:
          "Admin portal to review and approve policy change log entries.",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
})

function ChangelogReview({ id }: { id: number }) {
  const router = useRouter()
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await reviewChangelogFn({ data: { id, reviewNotes: notes } })
      router.invalidate()
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label
          htmlFor={`notes-${id}`}
          className="text-xs font-medium text-muted-foreground"
        >
          Review Notes / Summary of Changes
        </label>
        <textarea
          id={`notes-${id}`}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Google updated their data collection wording regarding workspace integration..."
          className="w-full rounded-none border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
          required
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button
        type="submit"
        disabled={submitting}
        className="h-auto rounded-none bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95"
      >
        {submitting ? "Approving..." : "Approve"}
      </Button>
    </form>
  )
}

function AdminPage() {
  const { changelogs, snapshots, unauthorized } = Route.useLoaderData()
  const [companyFilter, setCompanyFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("pending_review") // Default to pending review
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  if (unauthorized) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Card className="border-destructive/30 bg-destructive/5 p-6 shadow-sm">
          <CardHeader className="flex flex-col items-center">
            <Lock className="h-12 w-12 text-destructive" />
            <CardTitle className="mt-4 text-xl font-bold">
              401 - Unauthorized
            </CardTitle>
            <CardDescription className="mt-2 text-center text-sm text-muted-foreground">
              You must be logged in as an administrator to access the admin
              portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-4 flex flex-col gap-2">
            <Button
              onClick={() => window.location.reload()}
              className="rounded-none bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Log In / Refresh Page
            </Button>
            <Link to="/">
              <Button variant="outline" className="w-full rounded-none">
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get unique companies from snapshots for filter dropdown
  const trackedCompanies = Array.from(
    new Map(snapshots.map((s) => [s.companyKey, s.companyName])).entries()
  ).sort((a, b) => (a[1] || "").localeCompare(b[1] || ""))

  // Filter changelogs
  const filteredChangelogs = changelogs.filter((entry) => {
    if (companyFilter !== "all" && entry.companyKey !== companyFilter)
      return false
    if (statusFilter !== "all" && entry.status !== statusFilter) return false
    return true
  })

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Stats
  const totalSnapshots = snapshots.length
  const totalChanges = changelogs.length
  const pendingReviews = changelogs.filter(
    (c) => c.status === "pending_review"
  ).length
  const reviewedChanges = totalChanges - pendingReviews

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-muted/40 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              to="/"
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-foreground">Admin Portal</span>
          </div>
          <div className="mt-4 flex items-start justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                <Lock className="h-8 w-8 text-primary" />
                Admin Review Portal
              </h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Authorize, review, and approve privacy policy modifications
                detected by the watchdog system. Approved changes will be
                visible to public users and notify active email subscribers.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <Settings className="animate-spin-slow h-3.5 w-3.5 text-primary" />
              Authorized Session
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="border-l-4 border-l-primary p-4">
              <div className="text-2xl font-bold">{pendingReviews}</div>
              <div className="text-xs text-muted-foreground">
                Pending Review
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{reviewedChanges}</div>
              <div className="text-xs text-muted-foreground">
                Reviewed / Approved
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{totalChanges}</div>
              <div className="text-xs text-muted-foreground">
                Total Detected Changes
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{totalSnapshots}</div>
              <div className="text-xs text-muted-foreground">
                Policy Snapshots
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {trackedCompanies.map(([key, name]) => (
                  <SelectItem key={key} value={key || ""}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Pending Review" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Link to="/changelog">
            <Button variant="outline" size="sm" className="text-xs">
              View Public Changelog
            </Button>
          </Link>
        </div>

        {/* Timeline */}
        {filteredChangelogs.length === 0 ? (
          <Card className="p-12 text-center">
            <CardHeader>
              <div className="mx-auto mb-2 w-fit rounded-full bg-muted p-3 text-muted-foreground">
                <FileText className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg font-bold">
                {changelogs.length === 0
                  ? "No Changes Logged"
                  : "No Matching Changes"}
              </CardTitle>
              <CardDescription>
                {changelogs.length === 0
                  ? "The watchdog crawler has not detected any privacy policy changes yet."
                  : "Try adjusting your filters to see more results."}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredChangelogs.map((entry) => {
              const isExpanded =
                expandedIds.has(entry.id) || entry.status === "pending_review" // auto-expand pending items for convenience
              const detectedDate = new Date(entry.detectedAt)
              const isPending = entry.status === "pending_review"

              return (
                <Card
                  key={entry.id}
                  className={`overflow-hidden transition-all duration-200 ${isPending ? "border-chart-1/30 bg-chart-1/5 shadow-sm" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-full p-1.5 ${
                            isPending
                              ? "bg-chart-1/20 text-chart-1"
                              : "bg-chart-5/10 text-chart-5"
                          }`}
                        >
                          {isPending ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">
                            <Link
                              to="/company/$companyKey"
                              params={{
                                companyKey: entry.companyKey || "",
                              }}
                              className="hover:underline"
                            >
                              {entry.companyName}
                            </Link>
                          </CardTitle>
                          <CardDescription className="mt-0.5 flex items-center gap-1.5 text-xs">
                            <Clock className="h-3 w-3" />
                            {detectedDate.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}{" "}
                            at{" "}
                            {detectedDate.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={isPending ? "outline" : "secondary"}>
                          {isPending ? "Pending Review" : "Reviewed"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(entry.id)}
                      className="mb-2 text-xs"
                    >
                      {isExpanded ? "Hide" : "Show"} Diff Details
                    </Button>

                    {isExpanded && (
                      <div className="mt-2 space-y-3">
                        {/* Diff visualization */}
                        {entry.diffHtml ? (
                          <div className="overflow-hidden border border-border">
                            <div className="border-b border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                              Policy Text Changes
                            </div>
                            <div className="max-h-96 overflow-y-auto bg-background p-3 font-mono text-xs leading-relaxed">
                              {parseDiffHtml(entry.diffHtml)}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No diff data available for this entry.
                          </p>
                        )}

                        {/* Review notes / Admin review form */}
                        {entry.reviewNotes ? (
                          <div className="border border-border bg-muted/30 p-3">
                            <div className="mb-1 text-xs font-medium text-muted-foreground">
                              Review Notes
                            </div>
                            <p className="text-sm">{entry.reviewNotes}</p>
                            {entry.reviewedAt && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Reviewed on{" "}
                                {new Date(
                                  entry.reviewedAt
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          isPending && (
                            <div className="rounded-none border border-border bg-muted/20 p-4">
                              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                Admin Review Action
                              </div>
                              <ChangelogReview id={entry.id} />
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}

/**
 * Parses the diff HTML generated by the watchdog into React elements
 * with proper styling for additions and removals.
 */
function parseDiffHtml(diffHtml: string): React.ReactNode[] {
  const lines = diffHtml.split("\n").filter(Boolean)
  return lines.map((line, i) => {
    if (line.includes('class="diff-added"')) {
      const text = line.replace(/<[^>]+>/g, "")
      return (
        <div
          key={i}
          className="flex items-start gap-2 border-l-2 border-chart-5 bg-chart-5/5 px-2 py-0.5"
        >
          <Plus className="mt-0.5 h-3 w-3 shrink-0 text-chart-5" />
          <span className="text-chart-5">{text}</span>
        </div>
      )
    } else if (line.includes('class="diff-removed"')) {
      const text = line.replace(/<[^>]+>/g, "")
      return (
        <div
          key={i}
          className="flex items-start gap-2 border-l-2 border-destructive bg-destructive/5 px-2 py-0.5"
        >
          <Minus className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
          <span className="text-destructive">{text}</span>
        </div>
      )
    }
    const text = line.replace(/<[^>]+>/g, "")
    return (
      <div key={i} className="px-2 py-0.5 text-muted-foreground">
        {text}
      </div>
    )
  })
}
