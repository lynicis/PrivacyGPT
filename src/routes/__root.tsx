import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
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
        rel: "icon",
        href: "/favicon.ico",
        sizes: "any",
      },
      {
        rel: "apple-touch-icon",
        href: "/logo.png",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  loader: async () => { },
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
              <img src="/logo.png" alt="PrivacyGPT" className="h-10 w-10" />
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
        <footer className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-12 md:gap-8">
              {/* Brand */}
              <div className="sm:col-span-2 md:col-span-5">
                <Link to="/" className="group inline-flex items-center gap-2.5">
                  <img
                    src="/logo.png"
                    alt="PrivacyGPT"
                    className="h-7 w-7 transition-transform duration-200 group-hover:scale-105"
                  />
                  <span className="text-base font-bold tracking-tight text-foreground">
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
              <div className="md:col-span-3 md:col-start-7">
                <h3 className="text-xs font-semibold tracking-widest text-muted-foreground/60 uppercase">
                  Product
                </h3>
                <ul className="mt-3.5 space-y-2.5">
                  {[
                    { to: "/", label: "Dashboard" },
                    { to: "/compare", label: "Compare" },
                    { to: "/methodology", label: "Methodology" },
                    { to: "/changelog", label: "Change Log" },
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
              <div className="md:col-span-3">
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
            </div>

            {/* Bottom bar */}
            <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 sm:flex-row">
              <p className="text-xs text-muted-foreground/60">
                &copy; {new Date().getFullYear()} PrivacyGPT
              </p>
              <p className="text-xs text-muted-foreground/60">
                Built as an open, verifiable watchdog for AI privacy
              </p>
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
