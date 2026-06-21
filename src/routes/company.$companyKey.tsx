import { createFileRoute, Link } from "@tanstack/react-router"
import { getCompanyByKeyFn } from "../lib/api"
import {
  ArrowLeft,
  ShieldCheck,
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
  loader: ({ params }) => getCompanyByKeyFn({ data: params.companyKey }),
  component: CompanyDetailPage,
})

function CompanyDetailPage() {
  const company = Route.useLoaderData()

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <Card className="max-w-md p-8 text-center">
          <CardHeader>
            <div className="mx-auto mb-2 w-fit rounded-none bg-destructive/10 p-3 text-destructive">
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

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent selection:text-accent-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
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
            <Link to="/" className="text-sm font-semibold text-primary">
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
        <Card className="relative mb-8 overflow-hidden bg-muted/20">
          <CardHeader className="p-6 sm:p-8">
            <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
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

              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
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
          </CardHeader>
        </Card>

        {/* Detailed Policy Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Main policy factors (Left / Middle Columns) */}
          <div className="space-y-6 md:col-span-2">
            <h2 className="mb-4 border-b border-border pb-2 text-xl font-bold text-foreground">
              Policy Breakdown
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

      {/* Footer */}
      <footer className="mt-20 border-t border-border bg-background py-8 text-center text-xs text-muted-foreground">
        <p>© 2026 PrivacyGPT. All claims cited from primary sources.</p>
      </footer>
    </div>
  )
}
