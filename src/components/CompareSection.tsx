import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CompareSectionProps {
  label: string
  valueA: string
  valueB: string
  booleanA?: boolean
  booleanB?: boolean
  booleanGood?: boolean
}

export function CompareSection({
  label,
  valueA,
  valueB,
  booleanA,
  booleanB,
  booleanGood = false,
}: CompareSectionProps) {
  const booleanIcon = (value: boolean, goodIs: boolean) => {
    const positive = goodIs ? value : !value
    if (positive) return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    return goodIs ? (
      <XCircle className="h-4 w-4 text-red-400" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-amber-500" />
    )
  }

  const booleanBadge = (value: boolean, goodIs: boolean) => (
    <Badge
      variant="outline"
      className={
        (goodIs ? value : !value)
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : goodIs
            ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
            : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
      }
    >
      {value ? "Yes" : "No"}
    </Badge>
  )

  return (
    <div className="overflow-hidden border border-border bg-card">
      <div className="border-b border-border bg-muted/30 px-4 py-2.5">
        <h3 className="text-sm font-bold tracking-wide text-foreground uppercase">
          {label}
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="space-y-2 border-b border-border/50 p-4 sm:border-r sm:border-b-0">
          <div className="flex items-center gap-2">
            {booleanA !== undefined && (
              <>
                {booleanIcon(booleanA, booleanGood)}
                {booleanBadge(booleanA, booleanGood)}
              </>
            )}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {valueA}
          </p>
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-center gap-2">
            {booleanB !== undefined && (
              <>
                {booleanIcon(booleanB, booleanGood)}
                {booleanBadge(booleanB, booleanGood)}
              </>
            )}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {valueB}
          </p>
        </div>
      </div>
    </div>
  )
}
