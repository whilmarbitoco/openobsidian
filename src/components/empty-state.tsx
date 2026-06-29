import { type LucideIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  actionOnClick?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  actionOnClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-8 text-center">
      <Icon className="mb-3 size-12 text-muted-foreground/40" />
      <p className="mb-1 text-sm font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="mb-4 max-w-sm text-xs text-muted-foreground/60">
          {description}
        </p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button variant="outline" size="sm">
            {actionLabel}
          </Button>
        </Link>
      )}
      {actionLabel && actionOnClick && !actionHref && (
        <Button variant="outline" size="sm" onClick={actionOnClick}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
