import { Badge } from "@/components/ui/badge"

interface CompareSectionProps {
  label: string
  valueA: string
  valueB: string
  booleanA?: boolean
  booleanB?: boolean
}

export function CompareSection({
  label,
  valueA,
  valueB,
  booleanA,
  booleanB,
}: CompareSectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="border-b pb-2 text-lg font-semibold">{label}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {booleanA !== undefined && (
            <Badge variant={booleanA ? "destructive" : "default"}>
              {booleanA ? "Yes" : "No"}
            </Badge>
          )}
          <p className="text-sm text-muted-foreground">{valueA}</p>
        </div>
        <div className="space-y-2">
          {booleanB !== undefined && (
            <Badge variant={booleanB ? "destructive" : "default"}>
              {booleanB ? "Yes" : "No"}
            </Badge>
          )}
          <p className="text-sm text-muted-foreground">{valueB}</p>
        </div>
      </div>
    </div>
  )
}
