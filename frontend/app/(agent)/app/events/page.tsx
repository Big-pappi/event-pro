'use client'

import * as React from 'react'
import Link from 'next/link'
import { CalendarDays, Plus, MapPin, Users } from 'lucide-react'
import { useApi } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { EventStatusBadge } from '@/components/app/status-badges'
import { formatDate } from '@/lib/utils'
import type { EventItem } from '@/lib/types'

export default function EventsPage() {
  const { data: events } = useApi<EventItem[]>('/api/events')
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState('all')

  const filtered = (events ?? []).filter((e) => {
    if (status !== 'all' && e.status !== status) return false
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <PageHeader
        title="Events"
        description="Create and manage all your events in one place."
        action={
          <Link href="/app/events/new">
            <Button>
              <Plus className="h-4 w-4" /> New event
            </Button>
          </Link>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:max-w-[180px]">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="completed">Completed</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events found"
          description="Create your first event to start designing and sending invitations."
          action={
            <Link href="/app/events/new">
              <Button>
                <Plus className="h-4 w-4" /> New event
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <Link key={e.id} href={`/app/events/${e.id}`}>
              <Card className="group h-full overflow-hidden transition-shadow hover:shadow-md">
                <div
                  className="relative flex h-28 items-end p-4"
                  style={{ background: e.cover_color }}
                >
                  <span className="absolute right-3 top-3">
                    <EventStatusBadge status={e.status} />
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur">
                    {e.type}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-1 font-semibold">{e.title}</h3>
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(e.starts_at, {
                      weekday: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>
                  {e.venue && (
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{e.venue}</span>
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-medium">{e.invitee_count ?? 0}</span>
                    <span className="text-muted-foreground">invitees</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
