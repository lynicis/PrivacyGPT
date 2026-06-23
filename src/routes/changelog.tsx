import { createFileRoute, Link } from "@tanstack/react-router"
import {
  getChangelogsFn,
  getCompaniesFn,
  getSnapshotCountsFn,
} from "../lib/api"
import { useState } from "react"
import { formatDateTime } from "../lib/utils"
import {
  ArrowLeft,
  History,
  Clock,
  CheckCircle2,
  AlertCircle,
  Rss,
  FileText,
  Filter,
  Plus,
  Minus,
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

export const Route = createFileRoute("/changelog")({
  component: ChangelogPage,
  loader: async () => {
    const [changelogs, snapshots, companies] = await Promise.all([
      getChangelogsFn(),
      getSnapshotCountsFn(),
      getCompaniesFn(),
    ])
    return { changelogs, snapshots, companies }
  },
  head: () => ({
    meta: [
      {
        title: "Change Log — PrivacyGPT",
      },
      {
        name: "description",
        content:
          "Track real-time changes to AI companies' privacy policies. See exactly what changed, when it changed, and how it affects your data.",
      },
    ],
  }),
})

function ChangelogPage() {
  const { changelogs, snapshots, companies } = Route.useLoaderData()
  const [companyFilter, setCompanyFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  // Get all companies from the database for filter dropdown
  const trackedCompanies = companies
    .map((c) => [c.companyKey, c.companyName] as const)
    .sort((a, b) => (a[1] || "").localeCompare(b[1] || ""))

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
  const companiesTracked = trackedCompanies.length

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
            <span className="text-foreground">Change Log</span>
          </div>
          <div className="mt-4 flex items-start justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                <History className="h-8 w-8 text-primary" />
                Policy Change Log
              </h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Automated tracking of privacy policy changes across major AI
                platforms. Each change is detected by our watchdog crawler,
                logged here, and reviewed for accuracy.
              </p>
            </div>
            <a
              href="/changelog/feed.xml"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              title="Subscribe to RSS Feed"
            >
              <Rss className="h-4 w-4" />
              RSS Feed
            </a>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="p-4">
              <div className="text-2xl font-bold">{companiesTracked}</div>
              <div className="text-xs text-muted-foreground">
                Companies Tracked
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{totalSnapshots}</div>
              <div className="text-xs text-muted-foreground">
                Snapshots Stored
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{totalChanges}</div>
              <div className="text-xs text-muted-foreground">
                Changes Detected
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{pendingReviews}</div>
              <div className="text-xs text-muted-foreground">
                Pending Review
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
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
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
            </SelectContent>
          </Select>
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
                  ? "No Changes Detected Yet"
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
              const isExpanded = expandedIds.has(entry.id)
              const isPending = entry.status === "pending_review"

              return (
                <Card key={entry.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-full p-1.5 ${
                            isPending
                              ? "bg-chart-1/10 text-chart-1"
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
                            {formatDateTime(entry.detectedAt)}
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
                            <div className="max-h-96 overflow-y-auto p-3 font-mono text-xs leading-relaxed">
                              {parseDiffHtml(entry.diffHtml)}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No diff data available for this entry.
                          </p>
                        )}

                        {/* Review notes */}
                        {entry.reviewNotes && (
                          <div className="border border-border bg-muted/30 p-3">
                            <div className="mb-1 text-xs font-medium text-muted-foreground">
                              Review Notes
                            </div>
                            <p className="text-sm">{entry.reviewNotes}</p>
                            {entry.reviewedAt && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Reviewed on {formatDateTime(entry.reviewedAt)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Snapshot Status Section */}
        {snapshots.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-bold tracking-tight">
              Latest Snapshots
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Group snapshots by company and show latest */}
              {(() => {
                const latestByCompany = new Map<string, (typeof snapshots)[0]>()
                for (const snap of snapshots) {
                  const key = snap.companyKey || ""
                  if (!latestByCompany.has(key)) {
                    latestByCompany.set(key, snap)
                  }
                }
                return Array.from(latestByCompany.entries()).map(
                  ([key, snap]) => (
                    <Card key={key} className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {snap.companyName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {snap.contentHash.slice(0, 8)}…
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Last fetched: {formatDateTime(snap.fetchedAt)}
                      </p>
                    </Card>
                  )
                )
              })()}
            </div>
          </section>
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
