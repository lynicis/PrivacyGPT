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
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Eye,
  Trash2,
  Lock,
  Share2,
  UserCheck,
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
  loader: async () => {
    try {
      return await getCompaniesFn()
    } catch (error) {
      console.error("Failed to load companies on dashboard:", error)
      return []
    }
  },
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

  const [isWeightsExpanded, setIsWeightsExpanded] = useState(false)
  const [weights, setWeights] = useState<Weights>({
    trainingWeight: DEFAULT_WEIGHTS.trainingWeight,
    optOutWeight: DEFAULT_WEIGHTS.optOutWeight,
    retentionWeight: DEFAULT_WEIGHTS.retentionWeight,
    deletionWeight: DEFAULT_WEIGHTS.deletionWeight,
    sharingWeight: DEFAULT_WEIGHTS.sharingWeight,
    humanReviewWeight: DEFAULT_WEIGHTS.humanReviewWeight,
  })

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

  const scoredCompanies = useMemo(() => {
    return allCompanies.map((company) => {
      const subScores = calculateSubScores(company)
      const totalScore = calculateTotalScore(subScores, weights)
      const grade = mapScoreToGrade(totalScore)
      return { ...company, subScores, totalScore, grade }
    })
  }, [allCompanies, weights])

  const companyRanks = useMemo(() => {
    const sorted = [...scoredCompanies].sort(
      (a, b) => b.totalScore - a.totalScore
    )
    const ranks: Record<string, number> = {}
    let currentRank = 1
    sorted.forEach((c, idx) => {
      if (idx > 0 && c.totalScore < sorted[idx - 1].totalScore) {
        currentRank = idx + 1
      }
      ranks[c.companyKey] = currentRank
    })
    return ranks
  }, [scoredCompanies])

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

  const processedCompanies = useMemo(() => {
    let result = [...scoredCompanies]
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          c.productName.toLowerCase().includes(q) ||
          c.trainsOnDataNuance.toLowerCase().includes(q)
      )
    }
    if (filterNoTraining)
      result = result.filter((c) => !c.trainsOnDataByDefault)
    if (filterOptOut) result = result.filter((c) => c.optOutAvailable)
    if (filterNoHumanReview)
      result = result.filter((c) => !c.humanReviewOfChats)

    result.sort((a, b) => {
      if (sortBy === "score-desc") return b.totalScore - a.totalScore
      if (sortBy === "score-asc") return a.totalScore - b.totalScore
      if (sortBy === "name-asc")
        return a.companyName.localeCompare(b.companyName)
      if (sortBy === "name-desc")
        return b.companyName.localeCompare(a.companyName)
      if (sortBy === "training-first")
        return (
          (a.trainsOnDataByDefault ? 1 : 0) - (b.trainsOnDataByDefault ? 1 : 0)
        )
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

  const getGradeBadgeStyle = (grade: string) => {
    if (grade.startsWith("A"))
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
    if (grade.startsWith("B"))
      return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
    if (grade === "C")
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
    return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
  }

  const getGradeBorderColor = (grade: string) => {
    if (grade.startsWith("A")) return "border-l-emerald-500"
    if (grade.startsWith("B")) return "border-l-sky-500"
    if (grade === "C") return "border-l-amber-500"
    return "border-l-red-500"
  }

  const getSubScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500"
    if (score >= 50) return "bg-amber-500"
    return "bg-red-500"
  }

  const renderConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "verified_from_policy_text":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/20 bg-emerald-500/5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
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
            className="border-amber-500/20 bg-amber-500/5 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
          >
            Review Needed
          </Badge>
        )
    }
  }

  const subScoreLabels = [
    { key: "trainingScore" as const, label: "Training", icon: Lock },
    { key: "optOutScore" as const, label: "Opt-Out", icon: ShieldCheck },
    { key: "retentionScore" as const, label: "Retention", icon: Trash2 },
    { key: "deletionScore" as const, label: "Deletion", icon: Trash2 },
    { key: "sharingScore" as const, label: "Sharing", icon: Share2 },
    { key: "humanReviewScore" as const, label: "Review", icon: UserCheck },
  ]

  return (
    <>
      {/* Hero Section */}
      <section className="border-b-2 border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 border border-border bg-muted px-4 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <ShieldAlert className="h-3.5 w-3.5" />
              Living database updated from source policies
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground uppercase sm:text-5xl lg:text-6xl">
              Is your AI conversation{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                truly private
              </span>
              ?
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              We monitor how major AI companies handle your conversational data.
              This living database tracks model training defaults, opt-out
              mechanisms, and retention timelines directly from source policies.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link to="/methodology">
                <Button variant="outline" className="gap-2">
                  <BookOpen className="h-4 w-4" /> Our Methodology
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="border border-border bg-card p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center bg-primary/10">
                <ShieldAlert className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-extrabold text-foreground tabular-nums">
                {stats.total}
              </div>
              <div className="mt-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Platforms Tracked
              </div>
            </div>
            <div className="border border-red-500/15 bg-red-500/5 p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center bg-red-500/10">
                <ShieldX className="h-5 w-5 text-red-500" />
              </div>
              <div className="text-2xl font-extrabold text-red-600 tabular-nums dark:text-red-400">
                {stats.trainsDefault}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  / {stats.total}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Train by Default
              </div>
            </div>
            <div className="border border-emerald-500/15 bg-emerald-500/5 p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center bg-emerald-500/10">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 tabular-nums dark:text-emerald-400">
                {stats.hasOptOut}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  / {stats.total}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Provide Opt-Out
              </div>
            </div>
            <div className="border border-amber-500/15 bg-amber-500/5 p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center bg-amber-500/10">
                <Eye className="h-5 w-5 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-amber-600 tabular-nums dark:text-amber-400">
                {stats.hasHumanReview}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  / {stats.total}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Use Human Review
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Weights Panel */}
        <Card className="mb-5 overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-4">
            <div className="space-y-0.5">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                Privacy Scoring Weights
              </CardTitle>
              <CardDescription className="text-xs">
                Adjust how each privacy factor impacts overall rankings
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs text-muted-foreground"
                onClick={handleResetWeights}
              >
                <Undo2 className="h-3.5 w-3.5" /> Reset
              </Button>
              <Button
                variant={isWeightsExpanded ? "secondary" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setIsWeightsExpanded(!isWeightsExpanded)}
              >
                {isWeightsExpanded ? "Hide" : "Configure"}
              </Button>
            </div>
          </div>

          {isWeightsExpanded && (
            <div className="grid gap-x-8 gap-y-5 border-t border-border bg-muted/20 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  { key: "trainingWeight", label: "Default Training Disabled" },
                  { key: "optOutWeight", label: "Opt-Out Ease" },
                  { key: "retentionWeight", label: "Data Retention Timeline" },
                  { key: "deletionWeight", label: "Deletion Rights" },
                  { key: "sharingWeight", label: "Third-Party Sharing" },
                  { key: "humanReviewWeight", label: "No Human Review" },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground">
                      {label}
                    </label>
                    <span className="bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
                      {weights[key]}{" "}
                      <span className="text-[9px] font-normal">
                        ({Math.round((weights[key] / totalWeightSum) * 100)}%)
                      </span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={weights[key]}
                    onChange={(e) =>
                      setWeights({
                        ...weights,
                        [key]: parseInt(e.target.value),
                      })
                    }
                    className="h-1.5 w-full cursor-pointer bg-border accent-primary"
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Filters */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by company, product..."
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <Select
                value={sortBy}
                onValueChange={(val: any) => setSortBy(val)}
              >
                <SelectTrigger className="h-9 w-[180px] text-xs">
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score-desc">Score: High to Low</SelectItem>
                  <SelectItem value="score-asc">Score: Low to High</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  <SelectItem value="name-desc">Name: Z to A</SelectItem>
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

          <div className="mt-3 flex flex-wrap items-center gap-5 border-t border-border/60 pt-3">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Switch
                id="no-training"
                checked={filterNoTraining}
                onCheckedChange={setFilterNoTraining}
              />
              <label
                htmlFor="no-training"
                className="cursor-pointer text-xs font-medium"
              >
                Training Off
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="opt-out"
                checked={filterOptOut}
                onCheckedChange={setFilterOptOut}
              />
              <label
                htmlFor="opt-out"
                className="cursor-pointer text-xs font-medium"
              >
                Opt-Out Available
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="no-human"
                checked={filterNoHumanReview}
                onCheckedChange={setFilterNoHumanReview}
              />
              <label
                htmlFor="no-human"
                className="cursor-pointer text-xs font-medium"
              >
                No Human Review
              </label>
            </div>
            <span className="ml-auto text-[11px] text-muted-foreground">
              {processedCompanies.length} of {scoredCompanies.length}
            </span>
          </div>
        </Card>

        {/* Company Cards Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {processedCompanies.map((company) => (
            <Card
              key={company.id}
              className={`group flex flex-col border-l-2 ${getGradeBorderColor(company.grade)}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 min-w-[28px] items-center justify-center bg-muted px-1.5 font-mono text-[11px] font-bold text-muted-foreground">
                        #{companyRanks[company.companyKey]}
                      </span>
                      <CardTitle className="truncate text-base font-bold">
                        {company.companyName}
                      </CardTitle>
                    </div>
                    <CardDescription className="mt-1 truncate text-xs">
                      {company.productName}
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <div
                      className={`border px-2.5 py-1 font-mono text-sm font-bold ${getGradeBadgeStyle(company.grade)}`}
                    >
                      {company.grade}
                      <span className="ml-1 text-[10px] font-normal opacity-70">
                        {company.totalScore}
                      </span>
                    </div>
                    {renderConfidenceBadge(company.confidence)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-3 pt-0">
                {/* Sub-score bars */}
                <div className="space-y-2">
                  {subScoreLabels.map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Icon className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                      <span className="w-16 shrink-0 text-[10px] font-medium text-muted-foreground">
                        {label}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden bg-border/60">
                        <div
                          className={`h-full ${getSubScoreColor(company.subScores[key])}`}
                          style={{ width: `${company.subScores[key]}%` }}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-right font-mono text-[10px] font-semibold text-muted-foreground tabular-nums">
                        {mapScoreToGrade(company.subScores[key])}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Nuance */}
                <p className="bg-muted/50 p-2.5 text-xs leading-relaxed text-muted-foreground">
                  {company.trainsOnDataNuance}
                </p>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-border/50 pt-3">
                <a
                  href={company.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Source Policy <ExternalLink className="h-3 w-3" />
                </a>
                <Link
                  to="/company/$companyKey"
                  params={{ companyKey: company.companyKey }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-0.5 pr-1 text-xs font-semibold"
                  >
                    Full Profile <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}

          {processedCompanies.length === 0 && (
            <Card className="col-span-full p-12 text-center">
              <CardHeader>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center bg-muted">
                  <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg font-bold">
                  No Companies Match
                </CardTitle>
                <CardDescription className="mx-auto max-w-md text-sm">
                  Try loosening your filters or clearing your search to see all
                  tracked AI privacy profiles.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  variant="outline"
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
