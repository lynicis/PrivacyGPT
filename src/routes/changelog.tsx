import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import {
  getChangelogsFn,
  getCompaniesFn,
  getSnapshotCountsFn,
  getSnapshotTotalCountFn,
  getPendingReviewsCountFn,
} from "../lib/api"
import { useState, useMemo } from "react"
import { formatDateTime } from "../lib/utils"
import {
  ArrowLeft,
  History,
  Rss,
  FileText,
  Filter,
  Plus,
  Minus,
  ArrowUpDown,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import {
  Card,
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
import { DataTable } from "@/components/ui/data-table"
import type {
  ColumnDef,
  SortingState,
  PaginationState,
  ExpandedState,
} from "@tanstack/react-table"

interface ChangelogSearch {
  page?: number
  pageSize?: number
  sortBy?: "detectedAt" | "companyName" | "status"
  sortOrder?: "asc" | "desc"
  companyFilter?: string
  statusFilter?: string
}

export const Route = createFileRoute("/changelog")({
  component: ChangelogPage,
  validateSearch: (search: Record<string, unknown>): ChangelogSearch => ({
    page: Number(search.page || 1),
    pageSize: Number(search.pageSize || 20),
    sortBy: (search.sortBy as ChangelogSearch["sortBy"]) || "detectedAt",
    sortOrder: (search.sortOrder as ChangelogSearch["sortOrder"]) || "desc",
    companyFilter: (search.companyFilter as string) || "all",
    statusFilter: (search.statusFilter as string) || "all",
  }),
  loaderDeps: ({ search }) => ({
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    companyFilter: search.companyFilter,
    statusFilter: search.statusFilter,
  }),
  loader: async ({ deps }) => {
    const pageIndex = (deps.page ?? 1) - 1
    const [changelogsRes, snapshots, res, totalSnapshots, pendingReviewsCount] =
      await Promise.all([
        getChangelogsFn({
          data: {
            page: pageIndex,
            pageSize: deps.pageSize,
            sortBy: deps.sortBy,
            sortOrder: deps.sortOrder,
            companyFilter: deps.companyFilter,
            statusFilter: deps.statusFilter,
          },
        }),
        getSnapshotCountsFn(),
        getCompaniesFn({ data: { limit: 1000 } }),
        getSnapshotTotalCountFn(),
        getPendingReviewsCountFn(),
      ])
    return {
      changelogs: changelogsRes.changelogs,
      totalCount: changelogsRes.totalCount,
      snapshots,
      companies: res.companies,
      totalSnapshots,
      pendingReviewsCount,
    }
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
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Change Log — PrivacyGPT" },
      {
        property: "og:description",
        content:
          "Track real-time changes to AI companies' privacy policies. See exactly what changed, when it changed, and how it affects your data.",
      },
      {
        property: "og:url",
        content: "https://privacygpt.lynicis.dev/changelog",
      },
      {
        property: "og:image",
        content: "https://privacygpt.lynicis.dev/og-image.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Change Log — PrivacyGPT" },
      {
        name: "twitter:description",
        content:
          "Track real-time changes to AI companies' privacy policies. See exactly what changed, when it changed, and how it affects your data.",
      },
      {
        name: "twitter:image",
        content: "https://privacygpt.lynicis.dev/og-image.png",
      },
    ],
  }),
})

function ChangelogPage() {
  const {
    changelogs,
    totalCount,
    snapshots,
    companies,
    totalSnapshots,
    pendingReviewsCount,
  } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const [expanded, setExpanded] = useState<ExpandedState>({})

  // Get all companies from the database for filter dropdown
  const trackedCompanies = useMemo(() => {
    return companies
      .map((c) => [c.companyKey, c.companyName] as const)
      .sort((a, b) => (a[1] || "").localeCompare(b[1] || ""))
  }, [companies])

  // Map router search params to tanstack-table pagination state
  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: (search.page ?? 1) - 1,
      pageSize: search.pageSize ?? 20,
    }),
    [search.page, search.pageSize]
  )

  const onPaginationChange = (nextState: PaginationState) => {
    navigate({
      search: {
        ...search,
        page: nextState.pageIndex + 1,
        pageSize: nextState.pageSize,
      },
    })
  }

  // Map router search params to tanstack-table sorting state
  const sorting: SortingState = useMemo(
    () => [
      {
        id: search.sortBy ?? "detectedAt",
        desc: search.sortOrder === "desc",
      },
    ],
    [search.sortBy, search.sortOrder]
  )

  const onSortingChange = (nextState: SortingState) => {
    const firstSort = nextState[0] as (typeof nextState)[number] | undefined
    if (firstSort) {
      navigate({
        search: {
          ...search,
          sortBy: firstSort.id as ChangelogSearch["sortBy"],
          sortOrder: firstSort.desc ? "desc" : "asc",
        },
      })
    }
  }

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "expand",
        header: () => null,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => row.toggleExpanded()}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ),
      },
      {
        accessorKey: "status",
        header: () => {
          return (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                const currentOrder = search.sortOrder
                const isStatusSort = search.sortBy === "status"
                const nextOrder =
                  isStatusSort && currentOrder === "asc" ? "desc" : "asc"
                navigate({
                  search: {
                    ...search,
                    page: 1,
                    sortBy: "status",
                    sortOrder: nextOrder,
                  },
                })
              }}
            >
              Status
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const isPending = row.original.status === "pending_review"
          return (
            <Badge variant={isPending ? "outline" : "secondary"}>
              {isPending ? "Pending Review" : "Reviewed"}
            </Badge>
          )
        },
      },
      {
        accessorKey: "companyName",
        header: () => {
          return (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                const currentOrder = search.sortOrder
                const isCompanySort = search.sortBy === "companyName"
                const nextOrder =
                  isCompanySort && currentOrder === "asc" ? "desc" : "asc"
                navigate({
                  search: {
                    ...search,
                    page: 1,
                    sortBy: "companyName",
                    sortOrder: nextOrder,
                  },
                })
              }}
            >
              Company
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <Link
            to="/company/$companyKey"
            params={{
              companyKey: row.original.companyKey || "",
            }}
            className="font-medium text-foreground hover:underline"
          >
            {row.original.companyName}
          </Link>
        ),
      },
      {
        accessorKey: "detectedAt",
        header: () => {
          return (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                const currentOrder = search.sortOrder
                const isDetectedSort = search.sortBy === "detectedAt"
                const nextOrder =
                  isDetectedSort && currentOrder === "asc" ? "desc" : "asc"
                navigate({
                  search: {
                    ...search,
                    page: 1,
                    sortBy: "detectedAt",
                    sortOrder: nextOrder,
                  },
                })
              }}
            >
              Detected At
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDateTime(row.original.detectedAt)}
          </span>
        ),
      },
    ],
    [search, navigate]
  )

  const pageCount = Math.ceil(totalCount / (search.pageSize ?? 20))
  const companiesTracked = trackedCompanies.length

  const renderSubComponent = ({ row }: { row: any }) => {
    const entry = row.original
    return (
      <div className="space-y-3">
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
    )
  }

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
              <div className="text-2xl font-bold">{totalCount}</div>
              <div className="text-xs text-muted-foreground">
                Changes Detected
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{pendingReviewsCount}</div>
              <div className="text-xs text-muted-foreground">
                Pending Reviews
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
          <Select
            value={search.companyFilter || "all"}
            onValueChange={(val) => {
              navigate({
                search: {
                  ...search,
                  page: 1,
                  companyFilter: val,
                },
              })
            }}
          >
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
          <Select
            value={search.statusFilter || "all"}
            onValueChange={(val) => {
              navigate({
                search: {
                  ...search,
                  page: 1,
                  statusFilter: val,
                },
              })
            }}
          >
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

        {/* DataTable */}
        {changelogs.length === 0 ? (
          <Card className="p-12 text-center">
            <CardHeader>
              <div className="mx-auto mb-2 w-fit rounded-full bg-muted p-3 text-muted-foreground">
                <FileText className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg font-bold">
                No Matching Changes
              </CardTitle>
              <CardDescription>
                Try adjusting your filters to see more results.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <DataTable
            columns={columns}
            data={changelogs}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            sorting={sorting}
            onSortingChange={onSortingChange}
            expanded={expanded}
            onExpandedChange={setExpanded}
            getRowCanExpand={() => true}
            renderSubComponent={renderSubComponent}
          />
        )}

        {/* Snapshot Status Section */}
        {snapshots.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-bold tracking-tight">
              Latest Snapshots
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {snapshots.map((snap) => (
                <Card key={snap.companyId || snap.companyKey} className="p-4">
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
              ))}
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
    if (
      line.includes('class="diff-paragraph"') ||
      line.includes('class="diff-modified"') ||
      line.includes('class="diff-word-added"') ||
      line.includes('class="diff-word-removed"')
    ) {
      return (
        <div
          key={i}
          className="px-2 py-1 font-sans text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: line }}
        />
      )
    }
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
