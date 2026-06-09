import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'primary',
}: {
  label: string
  value: React.ReactNode
  icon: LucideIcon
  hint?: string
  tone?: 'primary' | 'accent' | 'success' | 'warning'
}) {
  const tones: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/15 text-[color:var(--color-accent-foreground)]',
    success: 'bg-success/12 text-success',
    warning: 'bg-warning/12 text-warning',
  }
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 font-serif text-3xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', tones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  )
}
