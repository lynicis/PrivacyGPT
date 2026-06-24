import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import {
  useCompanies,
  useCompanyByKey,
  companiesQueryOptions,
} from "@/lib/queries"
import {
  calculateSubScores,
  calculateTotalScore,
  mapScoreToGrade,
  DEFAULT_WEIGHTS,
} from "@/lib/scoring"
import { CompanySelect } from "@/components/CompanySelect"
import { CompareScores } from "@/components/CompareScores"
import { CompareSection } from "@/components/CompareSection"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  GitCompareArrows,
  ExternalLink,
  ArrowRightLeft,
  RotateCcw,
  BookOpen,
} from "lucide-react"

interface CompareSearch {
  companyA?: string
  companyB?: string
}

export const Route = createFileRoute("/compare")({
  validateSearch: (search: Record<string, unknown>): CompareSearch => ({
    companyA: search.companyA as string | undefined,
    companyB: search.companyB as string | undefined,
  }),
  loader: async ({ context }) => {
    await context.queryClient!.ensureQueryData(
      companiesQueryOptions({ limit: 1000 })
    )
  },
  head: () => ({
    meta: [
      {
        title: "Compare AI Privacy Policies — PrivacyGPT",
      },
      {
        name: "description",
        content:
          "Compare how two AI companies handle your conversational data side-by-side. Analyze training defaults, opt-out mechanisms, retention policies, and more.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:title",
        content: "Compare AI Privacy Policies — PrivacyGPT",
      },
      {
        property: "og:description",
        content:
          "Compare how two AI companies handle your conversational data side-by-side. Analyze training defaults, opt-out mechanisms, retention policies, and more.",
      },
      { property: "og:url", content: "https://privacygpt.lynicis.dev/compare" },
      {
        property: "og:image",
        content: "https://privacygpt.lynicis.dev/og-image.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Compare AI Privacy Policies — PrivacyGPT",
      },
      {
        name: "twitter:description",
        content:
          "Compare how two AI companies handle your conversational data side-by-side. Analyze training defaults, opt-out mechanisms, retention policies, and more.",
      },
      {
        name: "twitter:image",
        content: "https://privacygpt.lynicis.dev/og-image.png",
      },
    ],
  }),
  component: ComparePage,
})

function ComparePage() {
  const search = Route.useSearch()

  const [selectedA, setSelectedA] = useState(search.companyA || "")
  const [selectedB, setSelectedB] = useState(search.companyB || "")
  const [activeTab, setActiveTab] = useState<"a" | "b">("a")

  const { data: companiesData } = useCompanies({ limit: 1000 })
  const companies = companiesData?.companies ?? []

  const { data: companyA, isLoading: loadingA } = useCompanyByKey(selectedA)
  const { data: companyB, isLoading: loadingB } = useCompanyByKey(selectedB)

  const updateSearch = (key: "companyA" | "companyB", value: string) => {
    if (key === "companyA") setSelectedA(value)
    else setSelectedB(value)

    const newSearch = new URLSearchParams(window.location.search)
    if (value) {
      newSearch.set(key, value)
    } else {
      newSearch.delete(key)
    }
    window.history.replaceState(null, "", `?${newSearch.toString()}`)
  }

  const handleSwap = () => {
    const tempA = selectedA
    const tempB = selectedB
    updateSearch("companyA", tempB)
    updateSearch("companyB", tempA)
  }

  const handleReset = () => {
    updateSearch("companyA", "")
    updateSearch("companyB", "")
  }

  const hasSelection = selectedA && selectedB

  const scoresA = companyA ? calculateSubScores(companyA) : null
  const scoresB = companyB ? calculateSubScores(companyB) : null

  const totalScoreA = scoresA
    ? calculateTotalScore(scoresA, DEFAULT_WEIGHTS)
    : 0
  const totalScoreB = scoresB
    ? calculateTotalScore(scoresB, DEFAULT_WEIGHTS)
    : 0
  const totalA = { letter: mapScoreToGrade(totalScoreA), points: totalScoreA }
  const totalB = { letter: mapScoreToGrade(totalScoreB), points: totalScoreB }

  const subScoresA = scoresA
    ? {
        training: {
          letter: mapScoreToGrade(scoresA.trainingScore),
          points: scoresA.trainingScore,
        },
        optOut: {
          letter: mapScoreToGrade(scoresA.optOutScore),
          points: scoresA.optOutScore,
        },
        retention: {
          letter: mapScoreToGrade(scoresA.retentionScore),
          points: scoresA.retentionScore,
        },
        deletion: {
          letter: mapScoreToGrade(scoresA.deletionScore),
          points: scoresA.deletionScore,
        },
        sharing: {
          letter: mapScoreToGrade(scoresA.sharingScore),
          points: scoresA.sharingScore,
        },
        humanReview: {
          letter: mapScoreToGrade(scoresA.humanReviewScore),
          points: scoresA.humanReviewScore,
        },
      }
    : ({} as Record<string, { letter: string; points: number }>)

  const subScoresB = scoresB
    ? {
        training: {
          letter: mapScoreToGrade(scoresB.trainingScore),
          points: scoresB.trainingScore,
        },
        optOut: {
          letter: mapScoreToGrade(scoresB.optOutScore),
          points: scoresB.optOutScore,
        },
        retention: {
          letter: mapScoreToGrade(scoresB.retentionScore),
          points: scoresB.retentionScore,
        },
        deletion: {
          letter: mapScoreToGrade(scoresB.deletionScore),
          points: scoresB.deletionScore,
        },
        sharing: {
          letter: mapScoreToGrade(scoresB.sharingScore),
          points: scoresB.sharingScore,
        },
        humanReview: {
          letter: mapScoreToGrade(scoresB.humanReviewScore),
          points: scoresB.humanReviewScore,
        },
      }
    : ({} as Record<string, { letter: string; points: number }>)

  return (
    <>
      {/* Hero Section */}
      <section className="border-b-2 border-border">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 border border-border bg-muted px-4 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <GitCompareArrows className="h-3.5 w-3.5" />
              Side-by-side comparison
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground uppercase sm:text-4xl lg:text-5xl">
              Compare{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                Privacy Policies
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Select two AI platforms to compare their data handling practices
              side-by-side, powered by verified policy data.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link to="/methodology">
                <Button variant="outline" size="sm" className="gap-2">
                  <BookOpen className="h-3.5 w-3.5" /> Our Methodology
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Company Selection */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
              <div className="flex-1">
                <CompanySelect
                  companies={companies}
                  value={selectedA}
                  onChange={(v) => updateSearch("companyA", v)}
                  disabledCompany={selectedB}
                  label="First Company"
                />
              </div>

              <div className="flex items-center justify-center self-center lg:px-5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={handleSwap}
                  disabled={!selectedA && !selectedB}
                  title="Swap companies"
                >
                  <ArrowRightLeft className="h-4 w-4 rotate-90" />
                </Button>
              </div>

              <div className="flex-1">
                <CompanySelect
                  companies={companies}
                  value={selectedB}
                  onChange={(v) => updateSearch("companyB", v)}
                  disabledCompany={selectedA}
                  label="Second Company"
                />
              </div>

              {(selectedA || selectedB) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 self-start text-muted-foreground"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        {!hasSelection && (
          <Card className="p-12 text-center">
            <CardContent>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <GitCompareArrows className="h-7 w-7 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                Select Two Companies
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Choose two AI platforms from the dropdowns above to compare
                their privacy policies, training defaults, and data handling
                practices.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading state for company comparison */}
        {hasSelection && (loadingA || loadingB) && (
          <Card className="p-12 text-center">
            <CardContent>
              <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-muted" />
              <h2 className="text-lg font-bold text-foreground">
                Loading company data...
              </h2>
            </CardContent>
          </Card>
        )}

        {/* Comparison Content */}
        {hasSelection && companyA && companyB && (
          <>
            {/* Mobile Tabs */}
            <div className="mb-5 md:hidden">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "a" | "b")}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="a" className="flex-1 text-xs">
                    {companyA.companyName}
                  </TabsTrigger>
                  <TabsTrigger value="b" className="flex-1 text-xs">
                    {companyB.companyName}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Scores Section */}
            <div className="mb-8">
              <h2 className="mb-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Score Breakdown
              </h2>
              <CompareScores
                scoresA={subScoresA}
                scoresB={subScoresB}
                totalA={totalA}
                totalB={totalB}
                nameA={companyA.companyName}
                nameB={companyB.companyName}
              />
            </div>

            {/* Source Links */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <a
                href={companyA.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
              >
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {companyA.companyName} Source Policy
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                    Last verified: {companyA.lastVerifiedDate}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              </a>
              <a
                href={companyB.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
              >
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {companyB.companyName} Source Policy
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                    Last verified: {companyB.lastVerifiedDate}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              </a>
            </div>

            {/* Policy Details */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Policy Details
              </h2>
              <CompareSection
                label="Model Training"
                valueA={companyA.trainsOnDataNuance}
                valueB={companyB.trainsOnDataNuance}
                booleanA={companyA.trainsOnDataByDefault}
                booleanB={companyB.trainsOnDataByDefault}
                booleanGood={false}
              />
              <CompareSection
                label="Opt-Out Mechanism"
                valueA={companyA.optOutHow}
                valueB={companyB.optOutHow}
                booleanA={companyA.optOutAvailable}
                booleanB={companyB.optOutAvailable}
                booleanGood={true}
              />
              <CompareSection
                label="Data Retention & Deletion"
                valueA={`${companyA.retentionPeriod}. Deletion: ${companyA.dataDeletedOnRequestTimeframe}`}
                valueB={`${companyB.retentionPeriod}. Deletion: ${companyB.dataDeletedOnRequestTimeframe}`}
                booleanA={companyA.dataDeletedOnRequest}
                booleanB={companyB.dataDeletedOnRequest}
                booleanGood={true}
              />
              <CompareSection
                label="Third-Party Sharing"
                valueA={companyA.thirdPartySharing}
                valueB={companyB.thirdPartySharing}
              />
              <CompareSection
                label="Human Review"
                valueA={companyA.humanReviewConditions}
                valueB={companyB.humanReviewConditions}
                booleanA={companyA.humanReviewOfChats}
                booleanB={companyB.humanReviewOfChats}
                booleanGood={false}
              />
              <CompareSection
                label="Regional Variations"
                valueA={companyA.regionalVariation}
                valueB={companyB.regionalVariation}
              />
              <CompareSection
                label="Children's Data Policy"
                valueA={companyA.childrenDataPolicy}
                valueB={companyB.childrenDataPolicy}
              />
              <CompareSection
                label="Enterprise vs Consumer"
                valueA={companyA.enterpriseVsConsumerSummary}
                valueB={companyB.enterpriseVsConsumerSummary}
                booleanA={companyA.enterpriseVsConsumerDifference}
                booleanB={companyB.enterpriseVsConsumerDifference}
                booleanGood={false}
              />
            </div>
          </>
        )}
      </main>
    </>
  )
}
