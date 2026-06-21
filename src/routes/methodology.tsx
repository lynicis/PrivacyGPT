import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowLeft,
  ShieldCheck,
  Scale,
  Database,
  Eye,
  Award,
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

export const Route = createFileRoute("/methodology")({
  component: MethodologyPage,
})

function MethodologyPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-accent selection:text-accent-foreground">
      {/* Header / Nav */}
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
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              to="/methodology"
              className="border-b-2 border-primary pb-1 text-sm font-semibold text-primary"
            >
              Methodology
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-8">
          <Link to="/">
            <Button
              variant="ghost"
              className="-ml-3 gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Tracker
            </Button>
          </Link>
          <h1 className="mt-4 mb-2 text-4xl font-extrabold tracking-tight text-foreground">
            Tracker Methodology
          </h1>
          <p className="text-lg text-muted-foreground">
            How we analyze, score, and verify the privacy policies of AI
            platforms.
          </p>
        </div>

        {/* Credibility section using shadcn components */}
        <Card className="relative mb-12 overflow-hidden bg-primary text-primary-foreground">
          <CardHeader className="p-6 sm:p-8">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <Award className="h-6 w-6" /> Grounded in Primary Evidence
            </CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed text-primary-foreground/80">
              PrivacyGPT is built on three core pillars:
              **falsifiability, visible citations, and strict neutrality**.
              Unlike static review blogs, we do not guess or rely on hearsay.
              Every data point in our tracker is mapped to a specific clause in
              the company's publicly available legal terms and cited with a
              clickable direct URL.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* The Fields Explained */}
        <div className="space-y-12">
          <section>
            <h2 className="mb-6 border-b border-border pb-2 text-2xl font-bold text-foreground">
              Core Assessment Fields
            </h2>

            <div className="grid gap-6">
              {/* Field 1 */}
              <Card className="flex flex-row items-start gap-4 p-6">
                <div className="shrink-0 bg-muted p-3 text-primary">
                  <Database className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Model Training by Default
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Does the platform use user conversations to train or
                    fine-tune its models by default?
                  </CardDescription>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                    <li>
                      <strong>Opt-in Default:</strong> Data is private until
                      user consents (highest rating).
                    </li>
                    <li>
                      <strong>Opt-out Default:</strong> Platform trains by
                      default, but user can disable it.
                    </li>
                    <li>
                      <strong>No Opt-out:</strong> Platform trains by default
                      with no settings to disable.
                    </li>
                  </ul>
                </div>
              </Card>

              {/* Field 2 */}
              <Card className="flex flex-row items-start gap-4 p-6">
                <div className="shrink-0 bg-muted p-3 text-primary">
                  <Scale className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Opt-Out Ease
                  </CardTitle>
                  <CardDescription className="text-sm">
                    How difficult is it for an average consumer to stop the
                    company from training on their data?
                  </CardDescription>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                    <li>
                      <strong>Excellent:</strong> A single toggle in settings
                      without losing chat history (e.g. Claude).
                    </li>
                    <li>
                      <strong>Moderate:</strong> A settings toggle but history
                      is disabled (e.g. Google), or a dedicated form.
                    </li>
                    <li>
                      <strong>Poor:</strong> Requires emailing support,
                      submitting a manual ticket, or is completely unavailable.
                    </li>
                  </ul>
                </div>
              </Card>

              {/* Field 3 */}
              <Card className="flex flex-row items-start gap-4 p-6">
                <div className="shrink-0 bg-muted p-3 text-primary">
                  <Eye className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Human Review of Chats
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Are conversations read by human annotators or trust/safety
                    moderators?
                  </CardDescription>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                    <li>
                      Human review represents a distinct threat vector for data
                      exposure (chats are cached, viewed by third-party
                      contractors).
                    </li>
                    <li>
                      Opt-out configuration: Can users request exemptions from
                      human review, or is it mandatory for safety monitoring?
                    </li>
                  </ul>
                </div>
              </Card>
            </div>
          </section>

          {/* Data Confidence Levels */}
          <section>
            <h2 className="mb-6 border-b border-border pb-2 text-2xl font-bold text-foreground">
              Confidence & Verification Ratings
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              To remain honest, we label the verification source and confidence
              levels for every entity in the tracker.
            </p>

            <div className="grid gap-6 sm:grid-cols-3">
              <Card className="bg-muted/20 p-5">
                <CardHeader className="p-0 pb-3">
                  <Badge
                    variant="outline"
                    className="w-fit bg-background text-[10px]"
                  >
                    verified_from_policy_text
                  </Badge>
                  <CardTitle className="mt-2 text-sm font-semibold text-foreground">
                    Verified
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Explicitly stated in the current public privacy policy,
                    terms of service, or official help articles with direct
                    link.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-muted/20 p-5">
                <CardHeader className="p-0 pb-3">
                  <Badge variant="secondary" className="w-fit text-[10px]">
                    inferred
                  </Badge>
                  <CardTitle className="mt-2 text-sm font-semibold text-foreground">
                    Inferred
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Logically deduced from parent company policies, technical
                    docs, or developer platforms, but not explicitly stated in
                    consumer policies.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-muted/20 p-5">
                <CardHeader className="p-0 pb-3">
                  <Badge
                    variant="outline"
                    className="w-fit border-destructive/20 bg-destructive/5 text-[10px] text-destructive"
                  >
                    needs_review
                  </Badge>
                  <CardTitle className="mt-2 text-sm font-semibold text-foreground">
                    Needs Review
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Contradictory information exists, policies have changed
                    recently without official clarification, or data requires
                    active human verification.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Privacy Score Rubric */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">
                Transparency Rubric & Weights
              </CardTitle>
              <CardDescription>
                Our upcoming scoring system (Phase 2) will calculate a
                normalized trust score (0-100) based on specific weights:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex justify-between border-b border-border pb-1 text-xs font-semibold text-foreground">
                <span>Category</span>
                <span>Proposed Weight</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Default training disabled</span>
                <span>30%</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Ease of Opt-Out</span>
                <span>20%</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Data Retention Policy</span>
                <span>15%</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Deletion rights & timeframe</span>
                <span>15%</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>No Human Review of normal chats</span>
                <span>10%</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Third Party Sharing restrictions</span>
                <span>10%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-border bg-background py-8 text-center text-xs text-muted-foreground">
        <p>© 2026 PrivacyGPT. Built as an open, verifiable watchdog.</p>
      </footer>
    </div>
  )
}
