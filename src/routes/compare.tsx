import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { getCompaniesFn, getCompanyByKeyFn } from "@/lib/api"
import {
  calculateSubScores,
  calculateTotalScore,
  mapScoreToGrade,
  DEFAULT_WEIGHTS,
} from "@/lib/scoring"
import type { companies } from "@/lib/db/schema"
import { CompanySelect } from "@/components/CompanySelect"
import { CompareScores } from "@/components/CompareScores"
import { CompareSection } from "@/components/CompareSection"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Company = typeof companies.$inferSelect

interface CompareSearch {
  companyA?: string
  companyB?: string
}

export const Route = createFileRoute("/compare")({
  validateSearch: (search: Record<string, unknown>): CompareSearch => ({
    companyA: search.companyA as string | undefined,
    companyB: search.companyB as string | undefined,
  }),
  loader: async () => {
    const companies = await getCompaniesFn()
    return { companies }
  },
  component: ComparePage,
})

function ComparePage() {
  const { companies } = Route.useLoaderData()
  const search = Route.useSearch()

  const [selectedA, setSelectedA] = useState(search.companyA || "")
  const [selectedB, setSelectedB] = useState(search.companyB || "")
  const [activeTab, setActiveTab] = useState<"a" | "b">("a")

  const [companyA, setCompanyA] = useState<Company | null>(null)
  const [companyB, setCompanyB] = useState<Company | null>(null)

  // Fetch company data when selections change
  useEffect(() => {
    if (selectedA) {
      getCompanyByKeyFn({ data: selectedA }).then(setCompanyA)
    } else {
      setCompanyA(null)
    }
  }, [selectedA])

  useEffect(() => {
    if (selectedB) {
      getCompanyByKeyFn({ data: selectedB }).then(setCompanyB)
    } else {
      setCompanyB(null)
    }
  }, [selectedB])

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

  const hasSelection = selectedA && selectedB

  // Calculate scores
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

  // Convert sub scores to comparison format
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Compare Privacy Policies</h1>

      {/* Company Selection */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <CompanySelect
          companies={companies}
          value={selectedA}
          onChange={(v) => updateSearch("companyA", v)}
          disabledCompany={selectedB}
          label="First Company"
        />
        <CompanySelect
          companies={companies}
          value={selectedB}
          onChange={(v) => updateSearch("companyB", v)}
          disabledCompany={selectedA}
          label="Second Company"
        />
      </div>

      {/* Empty State */}
      {!hasSelection && (
        <div className="py-12 text-center text-muted-foreground">
          Select two companies to compare their privacy policies
        </div>
      )}

      {/* Comparison Content */}
      {hasSelection && companyA && companyB && (
        <>
          {/* Mobile Tabs */}
          <div className="mb-4 md:hidden">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "a" | "b")}
            >
              <TabsList className="w-full">
                <TabsTrigger value="a" className="flex-1">
                  {companyA.companyName}
                </TabsTrigger>
                <TabsTrigger value="b" className="flex-1">
                  {companyB.companyName}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Scores */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Scores</h2>
            <CompareScores
              scoresA={subScoresA}
              scoresB={subScoresB}
              totalA={totalA}
              totalB={totalB}
            />
          </div>

          {/* Policy Details */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Policy Details</h2>
            <CompareSection
              label="Model Training"
              valueA={companyA.trainsOnDataNuance}
              valueB={companyB.trainsOnDataNuance}
              booleanA={companyA.trainsOnDataByDefault}
              booleanB={companyB.trainsOnDataByDefault}
            />
            <CompareSection
              label="Opt-Out Mechanism"
              valueA={companyA.optOutHow}
              valueB={companyB.optOutHow}
              booleanA={companyA.optOutAvailable}
              booleanB={companyB.optOutAvailable}
            />
            <CompareSection
              label="Data Retention & Deletion"
              valueA={`${companyA.retentionPeriod}. Deletion: ${companyA.dataDeletedOnRequestTimeframe}`}
              valueB={`${companyB.retentionPeriod}. Deletion: ${companyB.dataDeletedOnRequestTimeframe}`}
              booleanA={companyA.dataDeletedOnRequest}
              booleanB={companyB.dataDeletedOnRequest}
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
            />
          </div>
        </>
      )}
    </div>
  )
}
