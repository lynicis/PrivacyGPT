import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowLeft,
  HelpCircle,
  Shield,
  Trash2,
  Share2,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

const faqs = [
  {
    icon: Shield,
    question: "Which AI companies train on your conversations by default?",
    answer:
      "OpenAI (ChatGPT), Google (Gemini), Anthropic (Claude), Meta (Llama), and Perplexity all have opt-out mechanisms but train on your data unless you turn them off. Apple and Mistral do not train on user data by default.",
    link: "/",
    linkText: "View all companies",
  },
  {
    icon: Trash2,
    question: "Can you delete your AI conversation history?",
    answer:
      "Most major AI companies let you request deletion. OpenAI, Anthropic, Google, and Meta all offer deletion options. How long they keep your data before deleting varies, though, from about 30 days to 3 years depending on the company.",
    link: "/methodology",
    linkText: "See scoring criteria",
  },
  {
    icon: Share2,
    question: "Which AI chatbots share data with third parties?",
    answer:
      "We track third-party sharing across 30+ AI platforms. OpenAI, Google, and Microsoft all share data with service providers, while Mistral and Apple have stricter policies around who gets access to your conversations.",
    link: "/compare",
    linkText: "Compare companies",
  },
  {
    icon: Info,
    question: "What is PrivacyGPT and how does it work?",
    answer:
      "PrivacyGPT monitors how major AI companies handle your conversations. It covers training defaults, opt-out options, data retention, deletion rights, and third-party sharing, all pulled from the companies' own privacy policies and documentation.",
    link: "/methodology",
    linkText: "Read methodology",
  },
]

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      {
        title: "Frequently Asked Questions — PrivacyGPT",
      },
      {
        name: "description",
        content:
          "Get answers about AI data privacy. Learn which AI companies train on your conversations, how to delete your data, and which chatbots share data with third parties.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:title",
        content: "Frequently Asked Questions — PrivacyGPT",
      },
      {
        property: "og:description",
        content:
          "Get answers about AI data privacy. Learn which AI companies train on your conversations, how to delete your data, and which chatbots share data with third parties.",
      },
      {
        property: "og:url",
        content: "https://privacygpt.lynicis.dev/faq",
      },
      {
        property: "og:image",
        content: "https://privacygpt.lynicis.dev/og-image.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Frequently Asked Questions — PrivacyGPT",
      },
      {
        name: "twitter:description",
        content:
          "Get answers about AI data privacy. Learn which AI companies train on your conversations, how to delete your data, and which chatbots share data with third parties.",
      },
      {
        name: "twitter:image",
        content: "https://privacygpt.lynicis.dev/og-image.png",
      },
    ],
  }),
  component: FAQPage,
})

function FAQPage() {
  return (
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
        <div className="mt-4 flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              Frequently Asked Questions
            </h1>
            <p className="mt-1 text-lg text-muted-foreground">
              Get answers about AI data privacy and how PrivacyGPT works.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {faqs.map((faq, index) => {
          const Icon = faq.icon
          return (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="h-5 w-5 text-primary" />
                  {faq.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-base leading-relaxed text-muted-foreground">
                  {faq.answer}
                </CardDescription>
                <Link to={faq.link}>
                  <Button variant="link" className="h-auto p-0 text-primary">
                    {faq.linkText} →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 rounded-lg border border-border bg-muted/40 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Have more questions? Check our{" "}
          <Link to="/methodology" className="text-primary hover:underline">
            methodology
          </Link>{" "}
          or{" "}
          <Link to="/" className="text-primary hover:underline">
            explore the dashboard
          </Link>{" "}
          to see detailed privacy data for 30+ AI platforms.
        </p>
      </div>
    </main>
  )
}
