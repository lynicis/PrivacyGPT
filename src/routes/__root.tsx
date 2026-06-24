import { useState } from "react"
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router"
import { ThemeProvider } from "../components/ThemeProvider"
import { ThemeToggle } from "../components/ThemeToggle"

import appCss from "../styles.css?url"

import type { QueryClient } from "@tanstack/react-query"

const APP_URL = process.env.APP_URL || "https://privacygpt.lynicis.dev"

interface RouterContext {
  router?: any
  queryClient?: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      {
        name: "theme-color",
        content: "#09090b",
      },
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "default",
      },
      {
        title: "PrivacyGPT - AI Privacy Watchdog",
      },
      {
        name: "description",
        content:
          "Compare how major AI companies handle your data. See who trains on your chats, who deletes on request, and who shares with third parties.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:site_name",
        content: "PrivacyGPT",
      },
      {
        property: "og:title",
        content: "PrivacyGPT - AI Privacy Watchdog",
      },
      {
        property: "og:description",
        content:
          "PrivacyGPT monitors how major AI companies handle your conversational data. Compare privacy policies, training defaults, and opt-out mechanisms across AI platforms.",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        property: "og:image",
        content: `${APP_URL}/og-image.png`,
      },
      {
        property: "og:image:width",
        content: "1200",
      },
      {
        property: "og:image:height",
        content: "630",
      },
      {
        property: "og:url",
        content: APP_URL,
      },
      {
        name: "twitter:title",
        content: "PrivacyGPT - AI Privacy Watchdog",
      },
      {
        name: "twitter:description",
        content:
          "PrivacyGPT monitors how major AI companies handle your conversational data. Compare privacy policies, training defaults, and opt-out mechanisms across AI platforms.",
      },
      {
        name: "twitter:image",
        content: `${APP_URL}/og-image.png`,
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
        sizes: "any",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon-180x180.png",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "canonical",
        href: APP_URL,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "PrivacyGPT",
          url: APP_URL,
          description:
            "Compare how major AI companies handle your data. See who trains on your chats, who deletes on request, and who shares with third parties.",
          potentialAction: {
            "@type": "SearchAction",
            target: `${APP_URL}/?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }),
      },
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "PrivacyGPT",
          url: APP_URL,
          logo: `${APP_URL}/og-image.png`,
        }),
      },
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Which AI companies train on your conversations by default?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "OpenAI (ChatGPT), Google (Gemini), Anthropic (Claude), Meta (Llama), and Perplexity all have opt-out mechanisms but train on your data unless you turn them off. Apple and Mistral do not train on user data by default.",
              },
            },
            {
              "@type": "Question",
              name: "Can you delete your AI conversation history?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Most major AI companies let you request deletion. OpenAI, Anthropic, Google, and Meta all offer deletion options. How long they keep your data before deleting varies, though, from about 30 days to 3 years depending on the company.",
              },
            },
            {
              "@type": "Question",
              name: "Which AI chatbots share data with third parties?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "We track third-party sharing across 30+ AI platforms. OpenAI, Google, and Microsoft all share data with service providers, while Mistral and Apple have stricter policies around who gets access to your conversations.",
              },
            },
            {
              "@type": "Question",
              name: "What is PrivacyGPT and how does it work?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "PrivacyGPT monitors how major AI companies handle your conversations. It covers training defaults, opt-out options, data retention, deletion rights, and third-party sharing, all pulled from the companies' own privacy policies and documentation.",
              },
            },
          ],
        }),
      },
    ],
  }),
  loader: async () => {},
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  component: RootLayout,
  shellComponent: RootDocument,
})

function RootLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { to: "/", label: "Dashboard", exact: true },
    { to: "/methodology", label: "Methodology" },
    { to: "/compare", label: "Compare" },
    { to: "/changelog", label: "Change Log" },
    { to: "/faq", label: "FAQ" },
    { to: "/blog", label: "Blog" },
  ]

  return (
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <div className="flex min-h-screen flex-col bg-background font-sans text-foreground selection:bg-accent selection:text-accent-foreground">
        {/* Navbar */}
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md transition-all duration-300">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="PrivacyGPT" className="h-12 w-12" />
              <Link
                to="/"
                className="text-lg leading-none font-bold tracking-tight text-foreground"
              >
                PrivacyGPT
              </Link>
            </div>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-6 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  activeProps={{
                    className:
                      "border-b-2 border-primary pb-1 text-sm font-semibold text-primary",
                  }}
                  inactiveProps={{
                    className:
                      "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  }}
                  activeOptions={{ exact: link.exact }}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href="https://github.com/lynicis/PrivacyGPT"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label="GitHub repository"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              </a>
              <ThemeToggle />
            </nav>

            {/* Mobile controls */}
            <div className="flex items-center gap-3 md:hidden">
              <a
                href="https://github.com/lynicis/PrivacyGPT"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label="GitHub repository"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              </a>
              <ThemeToggle />
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <nav className="border-t border-border bg-background/95 backdrop-blur-md md:hidden">
              <div className="space-y-1 px-4 py-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    activeProps={{
                      className:
                        "block rounded-md bg-accent/50 px-3 py-2 text-sm font-semibold text-primary",
                    }}
                    inactiveProps={{
                      className:
                        "block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground",
                    }}
                    activeOptions={{ exact: link.exact }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </header>

        {/* Page Content */}
        <div className="flex-1">
          <Outlet />
        </div>

        {/* Footer */}
        <footer className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-12 md:gap-8">
              {/* Brand */}
              <div className="sm:col-span-2 md:col-span-4">
                <Link to="/" className="group inline-flex items-center gap-2">
                  <img
                    src="/logo.png"
                    alt="PrivacyGPT"
                    className="h-12 w-12 transition-transform duration-200 group-hover:scale-105"
                  />
                  <span className="text-lg leading-none font-bold tracking-tight text-foreground">
                    PrivacyGPT
                  </span>
                </Link>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  Monitoring how major AI companies handle your conversational
                  data. Open, verifiable, community-driven.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>
                    Privacy-first &middot; No tracking &middot; No cookies
                  </span>
                </div>
              </div>

              {/* Product Links */}
              <div className="md:col-span-3 md:col-start-6">
                <h3 className="text-xs font-semibold tracking-widest text-muted-foreground/60 uppercase">
                  Product
                </h3>
                <ul className="mt-3.5 space-y-2.5">
                  {[
                    { to: "/", label: "Dashboard" },
                    { to: "/compare", label: "Compare" },
                    { to: "/methodology", label: "Methodology" },
                    { to: "/changelog", label: "Change Log" },
                    { to: "/faq", label: "FAQ" },
                    { to: "/blog", label: "Blog" },
                  ].map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* About */}
              <div className="md:col-span-2 md:col-start-9">
                <h3 className="text-xs font-semibold tracking-widest text-muted-foreground/60 uppercase">
                  About
                </h3>
                <ul className="mt-3.5 space-y-2.5">
                  <li>
                    <span className="text-sm text-muted-foreground">
                      Data sourced from public privacy policies
                    </span>
                  </li>
                  <li>
                    <span className="text-sm text-muted-foreground">
                      Not affiliated with any AI company
                    </span>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div className="md:col-span-3 md:col-start-11">
                <h3 className="text-xs font-semibold tracking-widest text-muted-foreground/60 uppercase">
                  Legal
                </h3>
                <ul className="mt-3.5 space-y-2.5">
                  {[
                    { to: "/privacy", label: "Privacy Policy" },
                    { to: "/terms", label: "Terms of Usage" },
                  ].map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-10 flex flex-col items-center gap-3 border-t border-border/60 pt-6 sm:flex-row sm:justify-between">
              <p className="text-xs text-muted-foreground/60">
                &copy; {new Date().getFullYear()} PrivacyGPT
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground/60">
                <span className="hidden sm:inline">
                  Built as an open, verifiable watchdog for AI privacy
                  <span className="mx-2 text-border/40">|</span>
                </span>
                <span className="sm:hidden">Open watchdog for AI privacy</span>
                <a
                  href="https://github.com/lynicis/PrivacyGPT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-muted-foreground/80 underline decoration-border/40 underline-offset-2 transition-colors duration-150 hover:text-foreground"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  Source Code
                </a>
                <span>
                  Built by{" "}
                  <a
                    href="https://lynicis.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground/80 underline decoration-border/40 underline-offset-2 transition-colors duration-150 hover:text-foreground"
                  >
                    lynicis
                  </a>
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'system';
                if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
