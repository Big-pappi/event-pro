import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({
  className,
  withWordmark = true,
  invert = false,
}: {
  className?: string
  withWordmark?: boolean
  invert?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Sparkles className="h-5 w-5" />
      </span>
      {withWordmark && (
        <span
          className={cn(
            'text-lg font-semibold tracking-tight',
            invert ? 'text-sidebar-foreground' : 'text-foreground',
          )}
        >
          Invite<span className="text-primary">Pro</span>
        </span>
      )}
    </div>
  )
}
