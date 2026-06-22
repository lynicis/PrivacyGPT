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
import { useState } from "react"
import { getCompaniesFn, subscribeEmailFn } from "../lib/api"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select"

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
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  loader: async () => {
    try {
      const companiesList = await getCompaniesFn()
      return { companies: companiesList }
    } catch (error) {
      console.error("Failed to load companies in root:", error)
      return { companies: [] }
    }
  },
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
              <FooterSubscriptionWidget />
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  )
}

function FooterSubscriptionWidget() {
  const { companies } = Route.useLoaderData()
  const [email, setEmail] = useState("")
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all")
  const [status, setStatus] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setStatus(null)

    try {
      const companyId =
        selectedCompanyId === "all" ? null : Number(selectedCompanyId)
      const res = await subscribeEmailFn({ data: { email, companyId } })
      if (res.success) {
        setStatus({
          type: "success",
          message: res.message || "Subscribed successfully!",
        })
        setEmail("")
      } else {
        setStatus({
          type: "error",
          message: res.error || "Failed to subscribe.",
        })
      }
    } catch (err) {
      setStatus({ type: "error", message: "An unexpected error occurred." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-3 text-left">
      <h3 className="text-sm font-semibold text-foreground">
        Subscribe to Policy Alerts
      </h3>
      <p className="text-xs text-muted-foreground">
        Get notified instantly via email whenever a privacy policy changes.
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-9 flex-1 rounded-none border border-input bg-background px-3 text-xs"
        />
        <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
          <SelectTrigger className="h-9 w-full rounded-none bg-background text-xs sm:w-40">
            <SelectValue placeholder="All Companies" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="submit"
          disabled={loading}
          className="h-9 cursor-pointer rounded-none text-xs"
        >
          {loading ? "Subscribing..." : "Subscribe"}
        </Button>
      </form>
      {status && (
        <p
          className={`text-xs font-medium ${status.type === "success" ? "text-chart-5" : "text-destructive"}`}
        >
          {status.message}
        </p>
      )}
    </div>
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
