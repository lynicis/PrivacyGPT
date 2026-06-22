import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ShieldCheck, ShieldX } from "lucide-react"
import type { companies } from "@/lib/db/schema"

type Company = typeof companies.$inferSelect

interface CompanySelectProps {
  companies: Company[]
  value: string
  onChange: (value: string) => void
  disabledCompany?: string
  label: string
  placeholder?: string
}

export function CompanySelect({
  companies,
  value,
  onChange,
  disabledCompany,
  label,
  placeholder = "Select a company",
}: CompanySelectProps) {
  const selectedCompany = companies.find((c) => c.companyKey === value)

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={`h-11 ${!value ? "border-dashed border-destructive/50" : ""}`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {companies.map((company) => (
            <SelectItem
              key={company.companyKey}
              value={company.companyKey}
              disabled={company.companyKey === disabledCompany}
            >
              <div className="flex items-center gap-2">
                {!company.trainsOnDataByDefault ? (
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <ShieldX className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {company.companyName}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {company.productName}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedCompany && (
        <p className="text-[11px] text-muted-foreground">
          {selectedCompany.trainsOnDataByDefault
            ? "Trains on data by default"
            : "Does not train on data by default"}
          {" \u00b7 "}
          {selectedCompany.optOutAvailable ? "Opt-out available" : "No opt-out"}
        </p>
      )}
    </div>
  )
}
