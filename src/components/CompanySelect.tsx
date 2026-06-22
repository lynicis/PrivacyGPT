import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={!value ? "border-destructive" : ""}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {companies.map((company) => (
            <SelectItem
              key={company.companyKey}
              value={company.companyKey}
              disabled={company.companyKey === disabledCompany}
            >
              {company.companyName} — {company.productName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
