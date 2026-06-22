import { createFileRoute, Link } from "@tanstack/react-router"
import { getCompanyByKeyFn } from "../lib/api"
import {
  calculateSubScores,
  calculateTotalScore,
  mapScoreToGrade,
  DEFAULT_WEIGHTS,
} from "../lib/scoring"
import {
  ArrowLeft,
  ExternalLink,
  Database,
  ToggleLeft,
  Clock,
  Share2,
  Eye,
  Globe,
  UserX,
  Building2,
  Calendar,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const Route = createFileRoute("/company/$companyKey")({
  loader: async ({ params }) => {
    try {
      return await getCompanyByKeyFn({ data: params.companyKey })
    } catch (error) {
      console.error(`Failed to load company ${params.companyKey}:`, error)
      return null
    }
  },
  head: ({ loaderData }) => {
    const company = loaderData
    if (!company) {
      return {
        meta: [{ title: "Company Not Found | PrivacyGPT" }],
      }
    }
    return {
      meta: [
        {
          title: `${company.companyName} ${company.productName} Privacy Policy Analysis | PrivacyGPT`,
        },
        {
          name: "description",
          content: `Detailed privacy analysis for ${company.companyName} ${company.productName}. See how they handle data training, opt-out, data retention, deletion rights, third-party sharing, and human review — verified from official policy documents.`,
        },
      ],
    }
  },
  component: CompanyDetailPage,
})

function CompanyDetailPage() {
  const company = Route.useLoaderData()

   
  if (!company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <Card className="max-w-md p-8 text-center">
          <CardHeader>
            <div className="mx-auto mb-2 w-fit rounded-full bg-destructive/10 p-3 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold">
              Company Not Found
            </CardTitle>
            <CardDescription>
              The requested company privacy profile could not be found or has
              not been seeded yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Link to="/">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate scores
  const subScores = calculateSubScores(company)
  const totalScore = calculateTotalScore(subScores, DEFAULT_WEIGHTS)
  const overallGrade = mapScoreToGrade(totalScore)

  // Helper for boolean status badges
  const renderBooleanBadge = (val: boolean, reverse = false) => {
    const isWarning = reverse ? val : !val // True is warning for default training/human review (reverse=true)
    if (val) {
      return (
        <Badge variant={isWarning ? "destructive" : "secondary"}>Yes</Badge>
      )
    } else {
      return (
        <Badge
          variant={isWarning ? "outline" : "outline"}
          className={isWarning ? "border-muted" : "border-border"}
        >
          No
        </Badge>
      )
    }
  }

  // Helper for confidence badges
  const renderConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "verified_from_policy_text":
        return (
          <Badge
            variant="outline"
            className="border-border bg-muted/40 text-xs font-semibold"
          >
            Verified
          </Badge>
        )
      case "inferred":
        return (
          <Badge variant="secondary" className="text-xs font-semibold">
            Inferred
          </Badge>
        )
      case "unverified":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/5 text-xs font-semibold text-amber-600 dark:text-amber-400"
          >
            Unverified
          </Badge>
        )
      default:
        return (
          <Badge
            variant="outline"
            className="border-destructive/30 bg-destructive/5 text-xs font-semibold text-destructive"
          >
            Needs Review
          </Badge>
        )
    }
  }

  // Helper to render letter grade for individual sub-scores
  const getSubScoreGrade = (score: number) => {
    return mapScoreToGrade(score)
  }

  return (
    <>
      {/* Main content wrapper */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Link to="/">
            <Button
              variant="ghost"
              className="-ml-3 gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Company Jumbotron Card */}
        <Card className="relative mb-6 overflow-hidden bg-muted/20">
          <CardHeader className="p-6 sm:p-8">
            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground">
                    {company.companyName}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="border-border bg-background px-2.5 py-0.5 text-sm"
                  >
                    {company.productName}
                  </Badge>
                </div>
                {company.confidence === "unverified" && (
                  <div className="mb-3 inline-flex items-center gap-1.5 border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-sm font-semibold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    Privacy policy not verified — data may be inaccurate
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Verified:{" "}
                    {company.lastVerifiedDate}
                  </span>
                  {company.lastChangedDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Changed:{" "}
                      {company.lastChangedDate}
                    </span>
                  )}
                </div>
              </div>

              {company.optOutAvailable && company.optOutUrl && (
                <div className="mt-3">
                  <a
                    href={company.optOutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="gap-2">
                      Opt Out of Training <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              )}

              {/* Large Grade Circle/Box */}
              <div className="flex shrink-0 items-center gap-4 sm:self-center">
                <div className="flex h-20 w-20 flex-col items-center justify-center border border-border bg-primary p-4 text-primary-foreground shadow-sm select-none">
                  <span className="font-mono text-2xl font-bold">
                    {overallGrade}
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase opacity-90">
                    {totalScore} Pts
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {renderConfidenceBadge(company.confidence)}
                  <a
                    href={company.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:underline"
                  >
                    Primary Policy Source <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Sub-scores Grid Dashboard */}
        <Card className="mb-8 p-6">
          <CardHeader className="mb-4 border-b border-border p-0 pb-4">
            <CardTitle className="text-base font-bold">
              Privacy Grade Breakdown
            </CardTitle>
            <CardDescription>
              Scores are calculated based on default weights. Visit the
              Methodology page for the formulas.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 p-0 sm:grid-cols-3 lg:grid-cols-6">
            <div className="flex flex-col justify-between border border-border bg-muted/10 p-3">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Default Training
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-lg font-bold">
                  {getSubScoreGrade(subScores.trainingScore)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {subScores.trainingScore}/100
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-between border border-border bg-muted/10 p-3">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Opt-Out Ease
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-lg font-bold">
                  {getSubScoreGrade(subScores.optOutScore)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {subScores.optOutScore}/100
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-between border border-border bg-muted/10 p-3">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Data Retention
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-lg font-bold">
                  {getSubScoreGrade(subScores.retentionScore)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {subScores.retentionScore}/100
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-between border border-border bg-muted/10 p-3">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Deletion Rights
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-lg font-bold">
                  {getSubScoreGrade(subScores.deletionScore)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {subScores.deletionScore}/100
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-between border border-border bg-muted/10 p-3">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Third-Party Sharing
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-lg font-bold">
                  {getSubScoreGrade(subScores.sharingScore)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {subScores.sharingScore}/100
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-between border border-border bg-muted/10 p-3">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Human Review
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-lg font-bold">
                  {getSubScoreGrade(subScores.humanReviewScore)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {subScores.humanReviewScore}/100
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Policy Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Main policy factors (Left / Middle Columns) */}
          <div className="space-y-6 md:col-span-2">
            <h2 className="mb-4 border-b border-border pb-2 text-xl font-bold text-foreground">
              Policy Details & Nuances
            </h2>

            {/* Factor 1: Model Training */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 font-bold">
                    <Database className="h-5 w-5 text-muted-foreground" />{" "}
                    Default Model Training
                  </CardTitle>
                  {renderBooleanBadge(company.trainsOnDataByDefault, true)}
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="border border-border/40 bg-muted/40 p-3.5 text-sm text-foreground">
                  {company.trainsOnDataNuance}
                </p>
              </CardContent>
            </Card>

            {/* Factor 2: Opt-Out */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 font-bold">
                    <ToggleLeft className="h-5 w-5 text-muted-foreground" />{" "}
                    Opt-Out Mechanism
                  </CardTitle>
                  {renderBooleanBadge(company.optOutAvailable)}
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="border border-border/40 bg-muted/40 p-3.5 text-sm text-foreground">
                  {company.optOutHow}
                </p>
              </CardContent>
            </Card>

            {/* Factor 3: Retention & Deletion */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-bold">
                  <Clock className="h-5 w-5 text-muted-foreground" /> Data
                  Retention & Deletion
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 pt-2 sm:grid-cols-2">
                <div className="border border-border/40 bg-muted/40 p-3.5">
                  <h4 className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Retention Period
                  </h4>
                  <p className="text-sm text-foreground">
                    {company.retentionPeriod}
                  </p>
                </div>
                <div className="border border-border/40 bg-muted/40 p-3.5">
                  <div className="mb-1 flex items-center justify-between">
                    <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                      Deletion on Request
                    </h4>
                    {renderBooleanBadge(company.dataDeletedOnRequest)}
                  </div>
                  <p className="text-sm text-foreground">
                    {company.dataDeletedOnRequestTimeframe}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Factor 4: Third Party Sharing */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-bold">
                  <Share2 className="h-5 w-5 text-muted-foreground" />{" "}
                  Third-Party Data Sharing
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="border border-border/40 bg-muted/40 p-3.5 text-sm text-foreground">
                  {company.thirdPartySharing}
                </p>
              </CardContent>
            </Card>

            {/* Factor 5: Human Review */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 font-bold">
                    <Eye className="h-5 w-5 text-muted-foreground" /> Human
                    Review of Chats
                  </CardTitle>
                  {renderBooleanBadge(company.humanReviewOfChats, true)}
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="border border-border/40 bg-muted/40 p-3.5 text-sm text-foreground">
                  {company.humanReviewConditions}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar / Demographic & Enterprise Factors (Right Column) */}
          <div className="space-y-6">
            <h2 className="mb-4 border-b border-border pb-2 text-xl font-bold text-foreground">
              Context & Variations
            </h2>

            {/* Regional Variation */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Globe className="h-4 w-4 text-primary" /> Regional Variations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {company.regionalVariation}
                </p>
              </CardContent>
            </Card>

            {/* Children policy */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <UserX className="h-4 w-4 text-primary" /> Children's Data
                  Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {company.childrenDataPolicy}
                </p>
              </CardContent>
            </Card>

            {/* Enterprise vs Consumer */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Building2 className="h-4 w-4 text-primary" /> Enterprise
                    vs. Consumer
                  </CardTitle>
                  {renderBooleanBadge(company.enterpriseVsConsumerDifference)}
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {company.enterpriseVsConsumerSummary}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
