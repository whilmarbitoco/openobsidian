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
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card/30 px-6 py-12 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-border bg-card">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <p className="mb-1.5 text-sm font-medium">{title}</p>
      {description && (
        <p className="mb-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
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
