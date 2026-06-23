import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowLeft,
  AlertTriangle,
  Scale,
  ShieldAlert,
  FileText,
  Copyright,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      {
        title: "Terms of Usage | PrivacyGPT",
      },
      {
        name: "description",
        content:
          "PrivacyGPT terms of usage. Informational comparison tool — not legal advice. Read our terms before using the service.",
      },
    ],
  }),
  component: TermsPage,
})

function TermsPage() {
  return (
    <>
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
            Terms of Usage
          </h1>
          <p className="text-lg text-muted-foreground">
            The ground rules for using PrivacyGPT.
          </p>
          <p className="mt-2 text-sm text-muted-foreground/60">
            Effective date: June 23, 2026
          </p>
        </div>

        <div className="space-y-12">
          {/* Purpose */}
          <section>
            <h2 className="mb-6 border-b border-border pb-2 text-2xl font-bold text-foreground">
              Purpose
            </h2>
            <Card className="flex flex-row items-start gap-4 p-6">
              <div className="shrink-0 bg-muted p-3 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold text-foreground">
                  An informational tool, not legal advice
                </CardTitle>
                <CardDescription className="text-sm">
                  PrivacyGPT is a comparison and awareness tool. It aggregates
                  publicly available privacy policy data from AI companies to
                  help users make informed decisions. Nothing on this site
                  constitutes legal advice, and no attorney-client relationship
                  is formed by using PrivacyGPT.
                </CardDescription>
              </div>
            </Card>
          </section>

          {/* Data Accuracy */}
          <section>
            <h2 className="mb-6 border-b border-border pb-2 text-2xl font-bold text-foreground">
              Data Accuracy
            </h2>
            <Card className="flex flex-row items-start gap-4 p-6">
              <div className="shrink-0 bg-muted p-3 text-primary">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Policies change — verify directly
                </CardTitle>
                <CardDescription className="text-sm">
                  AI companies update their privacy policies and terms of
                  service frequently. PrivacyGPT re-scrapes and re-verifies
                  company data daily via an automated pipeline, but there may be
                  a delay between a policy change and our updated display.{" "}
                  <strong>
                    Always consult the company's current privacy policy and
                    terms of service directly before making decisions.
                  </strong>{" "}
                  PrivacyGPT is not a substitute for reading the actual legal
                  documents.
                </CardDescription>
              </div>
            </Card>
          </section>

          {/* No Warranty */}
          <section>
            <h2 className="mb-6 border-b border-border pb-2 text-2xl font-bold text-foreground">
              No Warranty
            </h2>
            <Card className="flex flex-row items-start gap-4 p-6">
              <div className="shrink-0 bg-muted p-3 text-primary">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Provided "as is"
                </CardTitle>
                <CardDescription className="text-sm">
                  PrivacyGPT is provided on an "as is" and "as available" basis
                  without warranties of any kind, either express or implied. We
                  do not guarantee the accuracy, completeness, reliability, or
                  timeliness of any data displayed on this site.
                </CardDescription>
              </div>
            </Card>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="mb-6 border-b border-border pb-2 text-2xl font-bold text-foreground">
              Limitation of Liability
            </h2>
            <Card className="flex flex-row items-start gap-4 p-6">
              <div className="shrink-0 bg-muted p-3 text-primary">
                <Scale className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Use at your own discretion
                </CardTitle>
                <CardDescription className="text-sm">
                  In no event shall PrivacyGPT, its operator, or affiliates be
                  liable for any direct, indirect, incidental, special,
                  consequential, or punitive damages arising out of or related
                  to your use of or reliance on the information provided by this
                  service. This includes, but is not limited to, decisions made
                  based on PrivacyGPT data regarding AI platform selection,
                  privacy configurations, or data handling practices.
                </CardDescription>
              </div>
            </Card>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="mb-6 border-b border-border pb-2 text-2xl font-bold text-foreground">
              Intellectual Property
            </h2>
            <Card className="flex flex-row items-start gap-4 p-6">
              <div className="shrink-0 bg-muted p-3 text-primary">
                <Copyright className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Proprietary content
                </CardTitle>
                <CardDescription className="text-sm">
                  The site design, user interface, scoring methodology, data
                  presentation, and all original content on PrivacyGPT are
                  proprietary. Company names, logos, and trademarks referenced
                  on this site belong to their respective owners. PrivacyGPT is
                  not affiliated with, endorsed by, or connected to any AI
                  company whose data it displays.
                </CardDescription>
              </div>
            </Card>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="mb-6 border-b border-border pb-2 text-2xl font-bold text-foreground">
              Governing Law
            </h2>
            <Card className="flex flex-row items-start gap-4 p-6">
              <div className="shrink-0 bg-muted p-3 text-primary">
                <Scale className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Applicable jurisdiction
                </CardTitle>
                <CardDescription className="text-sm">
                  These terms shall be governed by and construed in accordance
                  with applicable law. Any disputes arising from these terms or
                  your use of PrivacyGPT shall be resolved in the competent
                  courts of the applicable jurisdiction.
                </CardDescription>
              </div>
            </Card>
          </section>

          {/* Contact */}
          <section>
            <h2 className="mb-6 border-b border-border pb-2 text-2xl font-bold text-foreground">
              Contact
            </h2>
            <Card className="flex flex-row items-start gap-4 p-6">
              <div className="shrink-0 bg-muted p-3 text-primary">
                <Mail className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Questions?
                </CardTitle>
                <CardDescription className="text-sm">
                  If you have questions about these terms, contact us at{" "}
                  <a
                    href="mailto:me@lynicis.dev"
                    className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    me@lynicis.dev
                  </a>
                  .
                </CardDescription>
              </div>
            </Card>
          </section>
        </div>
      </main>
    </>
  )
}
