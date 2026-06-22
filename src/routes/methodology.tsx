import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Scale, Database, Eye, Award } from "lucide-react"
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
  head: () => ({
    meta: [
      {
        title: "AI Privacy Scoring Methodology & Rubric | PrivacyGPT",
      },
      {
        name: "description",
        content:
          "Understand how PrivacyGPT scores AI companies on data privacy. Our rubric covers model training, opt-out ease, retention, deletion rights, third-party sharing, and human review — all cited to primary sources.",
      },
    ],
  }),
  component: MethodologyPage,
})

function MethodologyPage() {
  return (
    <>
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
              PrivacyGPT is built on three core pillars: **falsifiability,
              visible citations, and strict neutrality**. Unlike static review
              blogs, we do not guess or rely on hearsay. Every data point in our
              tracker is mapped to a specific clause in the company's publicly
              available legal terms and cited with a clickable direct URL.
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
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="w-fit border-border bg-muted/30 text-[10px] font-semibold"
                    >
                      Verified
                    </Badge>
                  </div>
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
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge
                      variant="secondary"
                      className="w-fit text-[10px] font-semibold"
                    >
                      Inferred
                    </Badge>
                  </div>
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
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="w-fit border-destructive/30 bg-destructive/5 text-[10px] font-semibold text-destructive"
                    >
                      Review Needed
                    </Badge>
                  </div>
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
                Transparency Rubric & Point System
              </CardTitle>
              <CardDescription>
                We compute a normalized score (0–100) based on weighted category
                scores:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Weights Table */}
              <div>
                <h3 className="mb-2 text-sm font-semibold">Default Weights</h3>
                <div className="space-y-2 border border-border bg-background p-3">
                  <div className="flex justify-between border-b border-border pb-1 text-xs font-semibold text-foreground">
                    <span>Category</span>
                    <span>Default Weight</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Default Model Training Disabled</span>
                    <span>30%</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Ease of Opt-Out</span>
                    <span>20%</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Data Retention Period</span>
                    <span>15%</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Deletion Rights (chats & account)</span>
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
                </div>
              </div>

              {/* Point Allocation Rules */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">
                  Category Scoring Rules
                </h3>

                <div className="space-y-3 text-xs text-muted-foreground">
                  <div>
                    <strong className="text-foreground">
                      1. Model Training by Default
                    </strong>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                      <li>
                        100 pts: Private by default (no training on user chats).
                      </li>
                      <li>0 pts: Trains by default (requires opt-out).</li>
                    </ul>
                  </div>

                  <div>
                    <strong className="text-foreground">2. Opt-Out Ease</strong>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                      <li>100 pts: Settings toggle or already private.</li>
                      <li>
                        40 pts: Requires manual form submission or is restricted
                        to EU/UK.
                      </li>
                      <li>0 pts: No opt-out available.</li>
                    </ul>
                  </div>

                  <div>
                    <strong className="text-foreground">
                      3. Data Retention Period
                    </strong>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                      <li>
                        100 pts: Zero retention (chats deleted immediately).
                      </li>
                      <li>
                        80 pts: Short retention (under 30 days, e.g., when
                        history is off).
                      </li>
                      <li>50 pts: Medium retention (30 days to 18 months).</li>
                      <li>
                        0 pts: Long, indefinite, or 5-year research retention.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <strong className="text-foreground">
                      4. Deletion Rights
                    </strong>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                      <li>
                        100 pts: Full account & thread deletion processed within
                        30 days.
                      </li>
                      <li>
                        50 pts: Partial deletion (e.g., chats are deleted but
                        model-ingested training posts cannot be purged).
                      </li>
                      <li>0 pts: No deletion requests honored.</li>
                    </ul>
                  </div>

                  <div>
                    <strong className="text-foreground">
                      5. Third-Party Sharing
                    </strong>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                      <li>
                        100 pts: Stored in isolated customer VPC, zero
                        third-party sharing.
                      </li>
                      <li>
                        85 pts: Shared with infrastructure/model providers under
                        strict non-training, security contracts.
                      </li>
                      <li>
                        20 pts: Shared for targeted advertising or across
                        general consumer platforms.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <strong className="text-foreground">
                      6. Human Review of Chats
                    </strong>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                      <li>100 pts: No human review.</li>
                      <li>
                        80 pts: Human review is restricted to abuse/security
                        flags or safety reports.
                      </li>
                      <li>
                        30 pts: Chats are sampled and reviewed for model
                        annotation/improvement.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Formula */}
              <div className="border-t border-border pt-3 text-xs">
                <span className="mb-1 block font-semibold">
                  Calculation Formula:
                </span>
                <code className="block overflow-x-auto border border-border bg-background p-2 text-center text-[11px]">
                  Total Score = (Σ (Category Score * Category Weight)) / (Σ
                  Weights)
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
