import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { ShieldCheck } from "lucide-react"
import { ThemeProvider } from "../components/ThemeProvider"
import { ThemeToggle } from "../components/ThemeToggle"

import appCss from "../styles.css?url"

interface RouterContext {
  router?: any
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "PrivacyGPT - AI Privacy Watchdog",
      },
      {
        name: "description",
        content:
          "PrivacyGPT monitors how major AI companies handle your conversational data. Compare privacy policies, training defaults, and opt-out mechanisms across AI platforms.",
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
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
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
  return (
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <div className="flex min-h-screen flex-col bg-background font-sans text-foreground selection:bg-accent selection:text-accent-foreground">
        {/* Navbar */}
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
                activeProps={{
                  className:
                    "border-b-2 border-primary pb-1 text-sm font-semibold text-primary",
                }}
                inactiveProps={{
                  className:
                    "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                }}
                activeOptions={{ exact: true }}
              >
                Dashboard
              </Link>
              <Link
                to="/methodology"
                activeProps={{
                  className:
                    "border-b-2 border-primary pb-1 text-sm font-semibold text-primary",
                }}
                inactiveProps={{
                  className:
                    "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                }}
              >
                Methodology
              </Link>
              <Link
                to="/compare"
                activeProps={{
                  className:
                    "border-b-2 border-primary pb-1 text-sm font-semibold text-primary",
                }}
                inactiveProps={{
                  className:
                    "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                }}
              >
                Compare
              </Link>
              <Link
                to="/changelog"
                activeProps={{
                  className:
                    "border-b-2 border-primary pb-1 text-sm font-semibold text-primary",
                }}
                inactiveProps={{
                  className:
                    "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                }}
              >
                Change Log
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1">
          <Outlet />
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t border-border bg-muted/30 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span>PrivacyGPT</span>
                </div>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Verifying AI privacy commitments through transparency, custom
                  scoring weights, and automated policy change detection.
                </p>
                <p className="pt-4 text-xs text-muted-foreground">
                  © 2026 PrivacyGPT. Built as an open, verifiable watchdog.
                </p>
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
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
