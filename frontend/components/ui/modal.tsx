'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full max-w-lg animate-fade-in rounded-2xl border border-border bg-card shadow-xl',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5 scrollbar-thin">{children}</div>
      </div>
    </div>
  )
}
