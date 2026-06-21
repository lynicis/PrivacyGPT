import { createFileRoute, Link } from "@tanstack/react-router"
import { getCompaniesFn } from "../lib/api"
import { useState, useMemo } from "react"
import {
  ShieldCheck,
  Search,
  AlertTriangle,
  SlidersHorizontal,
  ExternalLink,
  BookOpen,
  ArrowUpDown,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export const Route = createFileRoute("/")({
  loader: () => getCompaniesFn(),
  component: App,
})

function App() {
  const allCompanies = Route.useLoaderData()

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("")
  const [filterNoTraining, setFilterNoTraining] = useState(false)
  const [filterOptOut, setFilterOptOut] = useState(false)
  const [filterNoHumanReview, setFilterNoHumanReview] = useState(false)
  const [sortBy, setSortBy] = useState<
    "name-asc" | "name-desc" | "training-first" | "confidence-first"
  >("name-asc")

  // Calculated Stats
  const stats = useMemo(() => {
    if (allCompanies.length === 0)
      return { total: 0, trainsDefault: 0, hasOptOut: 0, hasHumanReview: 0 }
    const total = allCompanies.length
    const trainsDefault = allCompanies.filter(
      (c) => c.trainsOnDataByDefault
    ).length
    const hasOptOut = allCompanies.filter((c) => c.optOutAvailable).length
    const hasHumanReview = allCompanies.filter(
      (c) => c.humanReviewOfChats
    ).length
    return { total, trainsDefault, hasOptOut, hasHumanReview }
  }, [allCompanies])

  // Processed companies based on search, filtering, and sorting
  const processedCompanies = useMemo(() => {
    let result = [...allCompanies]

    // Apply Search
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          c.productName.toLowerCase().includes(q) ||
          c.trainsOnDataNuance.toLowerCase().includes(q)
      )
    }

    // Apply Filters
    if (filterNoTraining) {
      result = result.filter((c) => !c.trainsOnDataByDefault)
    }
    if (filterOptOut) {
      result = result.filter((c) => c.optOutAvailable)
    }
    if (filterNoHumanReview) {
      result = result.filter((c) => !c.humanReviewOfChats)
    }

    // Apply Sorting
    result.sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.companyName.localeCompare(b.companyName)
      }
      if (sortBy === "name-desc") {
        return b.companyName.localeCompare(a.companyName)
      }
      if (sortBy === "training-first") {
        // false (no training) first, true last
        return (
          (a.trainsOnDataByDefault ? 1 : 0) - (b.trainsOnDataByDefault ? 1 : 0)
        )
      }
      // verified first, needs_review last
      const priority: Record<string, number> = {
        verified_from_policy_text: 0,
        inferred: 1,
        needs_review: 2,
      }
      return (priority[a.confidence] ?? 9) - (priority[b.confidence] ?? 9)
    })

    return result
  }, [
    allCompanies,
    searchQuery,
    filterNoTraining,
    filterOptOut,
    filterNoHumanReview,
    sortBy,
  ])

  // Rendering Helpers
  const renderBooleanBadge = (
    val: boolean,
    labelYes = "Yes",
    labelNo = "No",
    warningIfTrue = false
  ) => {
    if (val) {
      return (
        <Badge variant={warningIfTrue ? "destructive" : "secondary"}>
          {labelYes}
        </Badge>
      )
    } else {
      return (
        <Badge
          variant={warningIfTrue ? "outline" : "outline"}
          className={warningIfTrue ? "border-muted" : "border-border"}
        >
          {labelNo}
        </Badge>
      )
    }
  }

  const renderConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "verified_from_policy_text":
        return (
          <Badge
            variant="outline"
            className="border-border bg-muted/30 text-[10px] font-semibold"
          >
            Verified
          </Badge>
        )
      case "inferred":
        return (
          <Badge variant="secondary" className="text-[10px] font-semibold">
            Inferred
          </Badge>
        )
      default:
        return (
          <Badge
            variant="outline"
            className="border-destructive/30 bg-destructive/5 text-[10px] font-semibold text-destructive"
          >
            Needs Review
          </Badge>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent selection:text-accent-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <Link
              to="/"
              className="text-xl font-bold tracking-tight text-foreground"
            >
              PrivacyGPT
            </Link>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="border-b-2 border-primary pb-1 text-sm font-semibold text-primary"
            >
              Dashboard
            </Link>
            <Link
              to="/methodology"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Methodology
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="border-b border-border bg-muted/40 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Is your AI conversation truly private?
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              We monitor how major AI companies handle your conversational data.
              This living database tracks model training defaults, opt-out
              mechanisms, and retention timelines directly from source policies.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link to="/methodology">
                <Button variant="outline" className="gap-2">
                  <BookOpen className="h-4 w-4" /> Our Methodology
                </Button>
              </Link>
            </div>
          </div>

          {/* Aggregate Stats Cards */}
          <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-4">
            <Card>
              <CardHeader className="p-4 text-center">
                <CardTitle className="text-3xl font-extrabold">
                  {stats.total}
                </CardTitle>
                <CardDescription className="mt-1 text-xs font-semibold tracking-wider uppercase">
                  Platforms Tracked
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-4 text-center">
                <CardTitle className="text-3xl font-extrabold text-destructive">
                  {stats.trainsDefault}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {stats.total}
                  </span>
                </CardTitle>
                <CardDescription className="mt-1 text-xs font-semibold tracking-wider uppercase">
                  Train by Default
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-4 text-center">
                <CardTitle className="text-3xl font-extrabold text-foreground">
                  {stats.hasOptOut}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {stats.total}
                  </span>
                </CardTitle>
                <CardDescription className="mt-1 text-xs font-semibold tracking-wider uppercase">
                  Provide Opt-Out
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-4 text-center">
                <CardTitle className="text-3xl font-extrabold text-destructive">
                  {stats.hasHumanReview}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {stats.total}
                  </span>
                </CardTitle>
                <CardDescription className="mt-1 text-xs font-semibold tracking-wider uppercase">
                  Use Human Reviewers
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Dashboard Area */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Controls Panel */}
        <Card className="mb-8 space-y-4 p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            {/* Search Input using shadcn Input */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by company, product..."
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.target.value)}
                className="pr-4 pl-9"
              />
            </div>

            {/* Sorting Select using shadcn Select */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <ArrowUpDown className="h-3.5 w-3.5" /> Sort By:
              </span>
              <Select
                value={sortBy}
                onValueChange={(val: any) => setSortBy(val)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Company Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Company Name (Z-A)</SelectItem>
                  <SelectItem value="training-first">
                    No Training First
                  </SelectItem>
                  <SelectItem value="confidence-first">
                    Verified First
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtering Toggles using shadcn Switches */}
          <div className="flex flex-wrap items-center gap-6 border-t border-border pt-4">
            <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters:
            </span>

            <div className="flex items-center space-x-2">
              <Switch
                id="no-training"
                checked={filterNoTraining}
                onCheckedChange={setFilterNoTraining}
              />
              <label
                htmlFor="no-training"
                className="cursor-pointer text-xs leading-none font-medium"
              >
                Default Training Off
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="opt-out"
                checked={filterOptOut}
                onCheckedChange={setFilterOptOut}
              />
              <label
                htmlFor="opt-out"
                className="cursor-pointer text-xs leading-none font-medium"
              >
                Opt-Out Available
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="no-human"
                checked={filterNoHumanReview}
                onCheckedChange={setFilterNoHumanReview}
              />
              <label
                htmlFor="no-human"
                className="cursor-pointer text-xs leading-none font-medium"
              >
                No Human Review
              </label>
            </div>
          </div>
        </Card>

        {/* Results Counter */}
        <div className="mb-4 text-xs font-medium text-muted-foreground">
          Showing {processedCompanies.length} of {allCompanies.length} companies
        </div>

        {/* Grid View using shadcn Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {processedCompanies.map((company) => (
            <Card
              key={company.id}
              className="flex flex-col justify-between transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">
                      {company.companyName}
                    </CardTitle>
                    <CardDescription className="mt-0.5 text-xs font-medium">
                      {company.productName}
                    </CardDescription>
                  </div>
                  {renderConfidenceBadge(company.confidence)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 py-2">
                {/* Quick Info */}
                <div className="space-y-2.5 border-t border-border/60 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">
                      Default Training:
                    </span>
                    {renderBooleanBadge(
                      company.trainsOnDataByDefault,
                      "Trains on Chats",
                      "Private by Default",
                      true
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">
                      Opt-Out Available:
                    </span>
                    {renderBooleanBadge(
                      company.optOutAvailable,
                      "Available",
                      "Not Offered"
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">
                      Human Review:
                    </span>
                    {renderBooleanBadge(
                      company.humanReviewOfChats,
                      "Yes",
                      "No Human Review",
                      true
                    )}
                  </div>
                </div>

                {/* Nuance summary snippet */}
                <p className="line-clamp-2 border border-border/30 bg-muted/30 p-2.5 text-xs text-muted-foreground">
                  {company.trainsOnDataNuance}
                </p>
              </CardContent>

              <CardFooter className="mt-2 flex items-center justify-between gap-4 pt-4">
                <a
                  href={company.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Source Policy <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <Link
                  to="/company/$companyKey"
                  params={{ companyKey: company.companyKey }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 pr-1 text-xs font-semibold"
                  >
                    View Full Profile <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}

          {processedCompanies.length === 0 && (
            <Card className="col-span-full p-12 text-center">
              <CardHeader>
                <div className="mx-auto mb-2 w-fit rounded-none bg-destructive/10 p-3 text-destructive">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold">
                  No Companies Match Filters
                </CardTitle>
                <CardDescription className="mx-auto max-w-md">
                  Try loosening your filters or clearing your search term to see
                  the registered AI privacy profiles.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  onClick={() => {
                    setSearchQuery("")
                    setFilterNoTraining(false)
                    setFilterOptOut(false)
                    setFilterNoHumanReview(false)
                  }}
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-border bg-background py-8 text-center text-xs text-muted-foreground">
        <p>© 2026 PrivacyGPT. Built as an open, verifiable watchdog.</p>
      </footer>
    </div>
  )
}
