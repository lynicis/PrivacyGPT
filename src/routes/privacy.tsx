import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowLeft,
  Shield,
  Eye,
  Globe,
  Clock,
  Server,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      {
        title: "Privacy Policy | PrivacyGPT",
      },
      {
        name: "description",
        content:
          "PrivacyGPT's privacy policy. We collect no cookies, no analytics, no personally identifiable information. Open, transparent, privacy-first.",
      },
    ],
  }),
  component: PrivacyPage,
})

function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground">
            How we handle your data — and why there's almost nothing to handle.
          </p>
          <p className="mt-2 text-sm text-muted-foreground/60">
            Effective date: June 23, 2026
          </p>
        </div>

        <div className="space-y-12">
          {/* What We Collect */}
          <section>
            <h2 className="mb-6 border-b border-border pb-2 text-2xl font-bold text-foreground">
              What We Collect
            </h2>
            <Card className="flex flex-row items-start gap-4 p-6">
              <div className="shrink-0 bg-muted p-3 text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Nothing personal.
                </CardTitle>
                <CardDescription className="text-sm">
                  PrivacyGPT has no user accounts, no login system, and no
                  analytics tracking. We do not collect cookies, IP addresses,
                  browser fingerprints, or any personally identifiable
                  information. There is simply no mechanism on this site to
                  gather or store data about you.
                </CardDescription>
              </div>
            </Card>
          </section>

          {/* Hosting */}
          <section>
            <h2 className="mb-6 border-b border-border pb-2 text-2xl font-bold text-foreground">
              Hosting & Infrastructure
            </h2>
            <Card className="flex flex-row items-start gap-4 p-6">
              <div className="shrink-0 bg-muted p-3 text-primary">
                <Server className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Cloudflare Workers
                </CardTitle>
                <CardDescription className="text-sm">
                  This site is hosted on Cloudflare Workers. Cloudflare may
                  retain standard CDN-level request logs (e.g., timestamps,
                  requested URLs) for operational and security purposes. These
                  logs are not used for tracking, profiling, or advertising and
                  are not linked to any personal identity.
                </CardDescription>
              </div>
            </Card>
          </section>

          {/* Data Sourcing */}
          <section>
            <h2 className="mb-6 border-b border-border pb-2 text-2xl font-bold text-foreground">
              How We Source Our Data
            </h2>
            <Card className="flex flex-row items-start gap-4 p-6">
              <div className="shrink-0 bg-muted p-3 text-primary">
                <Globe className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Public policies only
                </CardTitle>
                <CardDescription className="text-sm">
                  All company data displayed on PrivacyGPT is sourced from
                  publicly available privacy policies, terms of service, and
                  official help documentation. We use automated tools to scrape
                  and parse these public documents. No proprietary,
                  confidential, or non-public data is ever collected or stored.
                </CardDescription>
              </div>
            </Card>
          </section>

          {/* Data Freshness */}
          <section>
            <h2 className="mb-6 border-b border-border pb-2 text-2xl font-bold text-foreground">
              Data Freshness
            </h2>
            <Card className="flex flex-row items-start gap-4 p-6">
              <div className="shrink-0 bg-muted p-3 text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Verified daily, but not实时
                </CardTitle>
                <CardDescription className="text-sm">
                  Company profiles are re-verified and re-scraped daily via an
                  automated watchdog pipeline. However, AI companies may update
                  their policies at any time. PrivacyGPT may not reflect the
                  most recent changes immediately.{" "}
                  <strong>
                    Always consult the company's current privacy policy directly
                    before making decisions.
                  </strong>
                </CardDescription>
              </div>
            </Card>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="mb-6 border-b border-border pb-2 text-2xl font-bold text-foreground">
              Third-Party Services
            </h2>
            <Card className="flex flex-row items-start gap-4 p-6">
              <div className="shrink-0 bg-muted p-3 text-primary">
                <Eye className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold text-foreground">
                  No ads. No trackers. No analytics.
                </CardTitle>
                <CardDescription className="text-sm">
                  PrivacyGPT does not integrate with any advertising networks,
                  analytics providers, or data brokers. The only third-party
                  infrastructure used is Cloudflare for hosting and content
                  delivery.
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
                  If you have questions about this privacy policy or how
                  PrivacyGPT handles data, contact us at{" "}
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
