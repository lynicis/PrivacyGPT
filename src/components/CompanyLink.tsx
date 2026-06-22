import { Link } from "@tanstack/react-router"
import { Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface CompanyLinkProps {
  name: string
  children?: React.ReactNode
  className?: string
  showIcon?: boolean
}

export function CompanyLink({
  name,
  children,
  className,
  showIcon = false,
}: CompanyLinkProps) {
  const displayText = children || name

  return (
    <Link
      to="/company/$companyKey"
      params={{ companyKey: name }}
      className={cn(
        "inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline",
        className
      )}
    >
      {showIcon && <Shield className="h-3.5 w-3.5" />}
      {displayText}
    </Link>
  )
}
