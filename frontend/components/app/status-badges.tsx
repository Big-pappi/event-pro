import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import type { RsvpStatus, EventStatus } from '@/lib/types'

export function RsvpBadge({ status }: { status: RsvpStatus }) {
  const map: Record<RsvpStatus, { tone: 'success' | 'warning' | 'destructive'; label: string }> = {
    accepted: { tone: 'success', label: 'Accepted' },
    pending: { tone: 'warning', label: 'Pending' },
    declined: { tone: 'destructive', label: 'Declined' },
  }
  const cfg = map[status]
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const map: Record<EventStatus, { tone: 'primary' | 'success' | 'muted'; label: string }> = {
    draft: { tone: 'muted', label: 'Draft' },
    active: { tone: 'success', label: 'Active' },
    completed: { tone: 'primary', label: 'Completed' },
  }
  const cfg = map[status]
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>
}
