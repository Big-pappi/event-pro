'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  Send,
  Pencil,
  Trash2,
  Building2,
} from 'lucide-react'
import { useApi, apiDelete, refresh } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/app/page-header'
import { EventForm } from '@/components/app/event-form'
import { EventStatusBadge } from '@/components/app/status-badges'
import { StatCard } from '@/components/app/stat-card'
import { formatDateTime } from '@/lib/utils'
import type { EventItem } from '@/lib/types'

export default function EventDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { data: event } = useApi<EventItem>(`/api/events/${params.id}`)
  const [editing, setEditing] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  async function onDelete() {
    try {
      await apiDelete(`/api/events/${params.id}`)
      await refresh('/api/events')
      toast('Event deleted.')
      router.replace('/app/events')
    } catch {
      toast('Could not delete event.', 'error')
    }
  }

  if (!event) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const rsvp = event.rsvp ?? { accepted: 0, pending: 0, declined: 0 }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/app/events"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to events
      </Link>

      <div
        className="relative mb-6 overflow-hidden rounded-[var(--radius)] p-6 text-white"
        style={{ background: event.cover_color }}
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur">
                {event.type}
              </span>
              <EventStatusBadge status={event.status} />
            </div>
            <h1 className="mt-3 font-serif text-2xl font-semibold sm:text-3xl">{event.title}</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/90">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" /> {formatDateTime(event.starts_at)}
              </span>
              {event.venue && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {event.venue}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditing(true)}
              className="bg-white/90 text-foreground hover:bg-white"
            >
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setConfirmDelete(true)}
              className="bg-white/90 text-destructive hover:bg-white"
              aria-label="Delete event"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Invitees" value={event.invitee_count ?? 0} icon={Users} tone="primary" />
        <StatCard label="Accepted" value={rsvp.accepted} icon={Users} tone="success" />
        <StatCard label="Pending" value={rsvp.pending} icon={Users} tone="warning" />
        <StatCard label="Declined" value={rsvp.declined} icon={Users} tone="accent" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>About this event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="leading-relaxed text-muted-foreground">
              {event.description || 'No description provided.'}
            </p>
            {event.address && (
              <div className="flex items-start gap-2">
                <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span>{event.address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href={`/app/invitees?event=${event.id}`}>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4" /> Manage invitees
              </Button>
            </Link>
            <Link href={`/app/send?event=${event.id}`}>
              <Button className="w-full justify-start">
                <Send className="h-4 w-4" /> Send invitations
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit event" className="max-w-2xl">
        <EventForm event={event} />
      </Modal>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete event?"
        description="This will permanently remove the event and all of its invitees."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" /> Delete event
          </Button>
        </div>
      </Modal>
    </div>
  )
}
