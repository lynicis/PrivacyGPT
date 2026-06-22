import { createFileRoute, Link } from "@tanstack/react-router"
import { getCompaniesFn } from "../lib/api"
import { useState, useMemo } from "react"
import {
  Search,
  AlertTriangle,
  SlidersHorizontal,
  ExternalLink,
  BookOpen,
  ArrowUpDown,
  ChevronRight,
  Settings2,
  Undo2,
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
import {
  calculateSubScores,
  calculateTotalScore,
  mapScoreToGrade,
  DEFAULT_WEIGHTS,
} from "../lib/scoring"
import type { Weights } from "../lib/scoring"

export const Route = createFileRoute("/")({
  loader: () => getCompaniesFn(),
  head: () => ({
    meta: [
      {
        title:
          "AI Privacy Watchdog — Compare AI Company Data Policies | PrivacyGPT",
      },
      {
        name: "description",
        content:
          "Compare how major AI companies handle your conversational data. PrivacyGPT tracks model training defaults, opt-out mechanisms, and retention policies from verified source documents.",
      },
    ],
  }),
  component: App,
})

function App() {
  const allCompanies = Route.useLoaderData()

  // State for search, filters, and sorting
  const [searchQuery, setSearchQuery] = useState("")
  const [filterNoTraining, setFilterNoTraining] = useState(false)
  const [filterOptOut, setFilterOptOut] = useState(false)
  const [filterNoHumanReview, setFilterNoHumanReview] = useState(false)
  const [sortBy, setSortBy] = useState<
    | "score-desc"
    | "score-asc"
    | "name-asc"
    | "name-desc"
    | "training-first"
    | "confidence-first"
  >("score-desc")

  // State for weights customization
  const [isWeightsExpanded, setIsWeightsExpanded] = useState(false)
  const [weights, setWeights] = useState<Weights>({
    trainingWeight: DEFAULT_WEIGHTS.trainingWeight,
    optOutWeight: DEFAULT_WEIGHTS.optOutWeight,
    retentionWeight: DEFAULT_WEIGHTS.retentionWeight,
    deletionWeight: DEFAULT_WEIGHTS.deletionWeight,
    sharingWeight: DEFAULT_WEIGHTS.sharingWeight,
    humanReviewWeight: DEFAULT_WEIGHTS.humanReviewWeight,
  })

  // Calculate sum of weights for percentage calculation
  const totalWeightSum = useMemo(() => {
    const sum =
      weights.trainingWeight +
      weights.optOutWeight +
      weights.retentionWeight +
      weights.deletionWeight +
      weights.sharingWeight +
      weights.humanReviewWeight
    return sum === 0 ? 1 : sum
  }, [weights])

  // Reset weights to default
  const handleResetWeights = () => {
    setWeights({
      trainingWeight: DEFAULT_WEIGHTS.trainingWeight,
      optOutWeight: DEFAULT_WEIGHTS.optOutWeight,
      retentionWeight: DEFAULT_WEIGHTS.retentionWeight,
      deletionWeight: DEFAULT_WEIGHTS.deletionWeight,
      sharingWeight: DEFAULT_WEIGHTS.sharingWeight,
      humanReviewWeight: DEFAULT_WEIGHTS.humanReviewWeight,
    })
  }

  // Calculate scores and grades for all companies
  const scoredCompanies = useMemo(() => {
    return allCompanies.map((company) => {
      const subScores = calculateSubScores(company)
      const totalScore = calculateTotalScore(subScores, weights)
      const grade = mapScoreToGrade(totalScore)
      return {
        ...company,
        subScores,
        totalScore,
        grade,
      }
    })
  }, [allCompanies, weights])

  // Calculate global ranks based on the total weighted score
  const companyRanks = useMemo(() => {
    const sorted = [...scoredCompanies].sort(
      (a, b) => b.totalScore - a.totalScore
    )
    const ranks: Record<string, number> = {}

    let currentRank = 1
    sorted.forEach((c, idx) => {
      // Handle ties in score
      if (idx > 0 && c.totalScore < sorted[idx - 1].totalScore) {
        currentRank = idx + 1
      }
      ranks[c.companyKey] = currentRank
    })
    return ranks
  }, [scoredCompanies])

  // Calculated stats based on scored companies
  const stats = useMemo(() => {
    const total = scoredCompanies.length
    if (total === 0)
      return { total: 0, trainsDefault: 0, hasOptOut: 0, hasHumanReview: 0 }

    const trainsDefault = scoredCompanies.filter(
      (c) => c.trainsOnDataByDefault
    ).length
    const hasOptOut = scoredCompanies.filter((c) => c.optOutAvailable).length
    const hasHumanReview = scoredCompanies.filter(
      (c) => c.humanReviewOfChats
    ).length
    return { total, trainsDefault, hasOptOut, hasHumanReview }
  }, [scoredCompanies])

  // Processed companies based on search, filtering, and sorting
  const processedCompanies = useMemo(() => {
    let result = [...scoredCompanies]

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
      if (sortBy === "score-desc") {
        return b.totalScore - a.totalScore
      }
      if (sortBy === "score-asc") {
        return a.totalScore - b.totalScore
      }
      if (sortBy === "name-asc") {
        return a.companyName.localeCompare(b.companyName)
      }
      if (sortBy === "name-desc") {
        return b.companyName.localeCompare(a.companyName)
      }
      if (sortBy === "training-first") {
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
    scoredCompanies,
    searchQuery,
    filterNoTraining,
    filterOptOut,
    filterNoHumanReview,
    sortBy,
  ])

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
            Review Needed
          </Badge>
        )
    }
  }

  const getSubScoreGrade = (score: number) => {
    return mapScoreToGrade(score)
  }

  return (
    <>
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
        {/* Customizable Weights Slider Controls Panel */}
        <Card className="mb-6 p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Settings2 className="h-4 w-4 text-primary" /> Customizable
                Privacy Weights
              </CardTitle>
              <CardDescription>
                Adjust the sliders below to weight the importance of each
                privacy factor.Ranks will update instantly.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleResetWeights}
              >
                <Undo2 className="mr-1 h-3.5 w-3.5" /> Reset
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="text-xs"
                onClick={() => setIsWeightsExpanded(!isWeightsExpanded)}
              >
                {isWeightsExpanded ? "Hide Settings" : "Configure Weights"}
              </Button>
            </div>
          </div>

          {isWeightsExpanded && (
            <div className="mt-4 grid gap-6 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Weight 1 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>Default Training Disabled</span>
                  <span className="font-mono text-muted-foreground">
                    {weights.trainingWeight} (
                    {Math.round(
                      (weights.trainingWeight / totalWeightSum) * 100
                    )}
                    %)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.trainingWeight}
                  onChange={(e) =>
                    setWeights({
                      ...weights,
                      trainingWeight: parseInt(e.target.value),
                    })
                  }
                  className="h-1 w-full cursor-pointer bg-muted accent-primary"
                />
              </div>

              {/* Weight 2 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>Opt-Out Ease</span>
                  <span className="font-mono text-muted-foreground">
                    {weights.optOutWeight} (
                    {Math.round((weights.optOutWeight / totalWeightSum) * 100)}
                    %)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.optOutWeight}
                  onChange={(e) =>
                    setWeights({
                      ...weights,
                      optOutWeight: parseInt(e.target.value),
                    })
                  }
                  className="h-1 w-full cursor-pointer bg-muted accent-primary"
                />
              </div>

              {/* Weight 3 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>Data Retention Timeline</span>
                  <span className="font-mono text-muted-foreground">
                    {weights.retentionWeight} (
                    {Math.round(
                      (weights.retentionWeight / totalWeightSum) * 100
                    )}
                    %)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.retentionWeight}
                  onChange={(e) =>
                    setWeights({
                      ...weights,
                      retentionWeight: parseInt(e.target.value),
                    })
                  }
                  className="h-1 w-full cursor-pointer bg-muted accent-primary"
                />
              </div>

              {/* Weight 4 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>Deletion Rights</span>
                  <span className="font-mono text-muted-foreground">
                    {weights.deletionWeight} (
                    {Math.round(
                      (weights.deletionWeight / totalWeightSum) * 100
                    )}
                    %)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.deletionWeight}
                  onChange={(e) =>
                    setWeights({
                      ...weights,
                      deletionWeight: parseInt(e.target.value),
                    })
                  }
                  className="h-1 w-full cursor-pointer bg-muted accent-primary"
                />
              </div>

              {/* Weight 5 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>Third-Party Sharing</span>
                  <span className="font-mono text-muted-foreground">
                    {weights.sharingWeight} (
                    {Math.round((weights.sharingWeight / totalWeightSum) * 100)}
                    %)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.sharingWeight}
                  onChange={(e) =>
                    setWeights({
                      ...weights,
                      sharingWeight: parseInt(e.target.value),
                    })
                  }
                  className="h-1 w-full cursor-pointer bg-muted accent-primary"
                />
              </div>

              {/* Weight 6 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>No Human Review</span>
                  <span className="font-mono text-muted-foreground">
                    {weights.humanReviewWeight} (
                    {Math.round(
                      (weights.humanReviewWeight / totalWeightSum) * 100
                    )}
                    %)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights.humanReviewWeight}
                  onChange={(e) =>
                    setWeights({
                      ...weights,
                      humanReviewWeight: parseInt(e.target.value),
                    })
                  }
                  className="h-1 w-full cursor-pointer bg-muted accent-primary"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Filters Controls Panel */}
        <Card className="mb-8 space-y-4 p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            {/* Search Input */}
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

            {/* Sorting Select */}
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
                  <SelectItem value="score-desc">
                    Overall Score (High-Low)
                  </SelectItem>
                  <SelectItem value="score-asc">
                    Overall Score (Low-High)
                  </SelectItem>
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

          {/* Filtering Toggles */}
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
          Showing {processedCompanies.length} of {scoredCompanies.length}{" "}
          companies
        </div>

        {/* Grid View of Scored Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {processedCompanies.map((company) => (
            <Card
              key={company.id}
              className="flex flex-col justify-between transition-all duration-300 hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="border border-border bg-muted px-1.5 py-0.5 font-mono text-xs font-bold text-muted-foreground">
                        #{companyRanks[company.companyKey]}
                      </span>
                      <CardTitle className="text-lg font-bold text-foreground">
                        {company.companyName}
                      </CardTitle>
                    </div>
                    <CardDescription className="mt-0.5 text-xs font-medium">
                      {company.productName}
                    </CardDescription>
                  </div>

                  {/* Overall Grade Display */}
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="border border-border bg-primary px-2 py-0.5 font-mono text-sm font-bold text-primary-foreground select-none">
                      {company.grade} ({company.totalScore})
                    </div>
                    {renderConfidenceBadge(company.confidence)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 py-2">
                {/* Category mini-grades grid */}
                <div className="my-1 grid grid-cols-3 gap-1.5 border-t border-b border-border/60 py-2.5 text-[10px]">
                  <div className="flex flex-col justify-between border border-border/40 bg-muted/10 p-1 text-center">
                    <span
                      className="truncate text-[9px] text-muted-foreground"
                      title="Default Training"
                    >
                      Training
                    </span>
                    <span className="mt-0.5 font-mono text-[11px] font-bold">
                      {getSubScoreGrade(company.subScores.trainingScore)}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/40 bg-muted/10 p-1 text-center">
                    <span
                      className="truncate text-[9px] text-muted-foreground"
                      title="Opt-Out Ease"
                    >
                      Opt-Out
                    </span>
                    <span className="mt-0.5 font-mono text-[11px] font-bold">
                      {getSubScoreGrade(company.subScores.optOutScore)}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/40 bg-muted/10 p-1 text-center">
                    <span
                      className="truncate text-[9px] text-muted-foreground"
                      title="Retention length"
                    >
                      Retention
                    </span>
                    <span className="mt-0.5 font-mono text-[11px] font-bold">
                      {getSubScoreGrade(company.subScores.retentionScore)}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/40 bg-muted/10 p-1 text-center">
                    <span
                      className="truncate text-[9px] text-muted-foreground"
                      title="Deletion rights"
                    >
                      Deletion
                    </span>
                    <span className="mt-0.5 font-mono text-[11px] font-bold">
                      {getSubScoreGrade(company.subScores.deletionScore)}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/40 bg-muted/10 p-1 text-center">
                    <span
                      className="truncate text-[9px] text-muted-foreground"
                      title="Third party sharing"
                    >
                      Sharing
                    </span>
                    <span className="mt-0.5 font-mono text-[11px] font-bold">
                      {getSubScoreGrade(company.subScores.sharingScore)}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between border border-border/40 bg-muted/10 p-1 text-center">
                    <span
                      className="truncate text-[9px] text-muted-foreground"
                      title="Human review"
                    >
                      Review
                    </span>
                    <span className="mt-0.5 font-mono text-[11px] font-bold">
                      {getSubScoreGrade(company.subScores.humanReviewScore)}
                    </span>
                  </div>
                </div>

                {/* Nuance summary snippet */}
                <div className="border border-border/30 bg-muted/30 p-2.5">
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {company.trainsOnDataNuance}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="mt-2 flex items-center justify-between gap-4">
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
                <div className="mx-auto mb-2 w-fit rounded-full bg-destructive/10 p-3 text-destructive">
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
    </>
  )
}
