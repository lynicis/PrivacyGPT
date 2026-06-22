import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "./ThemeProvider"
import type { Theme } from "./ThemeProvider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-8 w-[110px] border border-border bg-background/50" />
    )
  }

  return (
    <Select value={theme} onValueChange={(val) => setTheme(val as Theme)}>
      <SelectTrigger className="h-8 w-[110px] rounded-none border-border bg-background px-2 text-xs">
        <SelectValue>
          <span className="flex items-center gap-1.5 font-medium">
            {theme === "light" && (
              <Sun className="h-3.5 w-3.5 text-amber-500" />
            )}
            {theme === "dark" && <Moon className="h-3.5 w-3.5 text-blue-400" />}
            {theme === "system" && (
              <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="capitalize">{theme}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[110px] rounded-none">
        <SelectItem value="light">
          <span className="flex items-center gap-1.5">
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span>Light</span>
          </span>
        </SelectItem>
        <SelectItem value="dark">
          <span className="flex items-center gap-1.5">
            <Moon className="h-3.5 w-3.5 text-blue-400" />
            <span>Dark</span>
          </span>
        </SelectItem>
        <SelectItem value="system">
          <span className="flex items-center gap-1.5">
            <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
            <span>System</span>
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
