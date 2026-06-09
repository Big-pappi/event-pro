'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { apiPost, apiPut, refresh } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select, Label } from '@/components/ui/input'
import type { EventItem } from '@/lib/types'

const TYPES = ['Wedding', 'Birthday', 'Corporate', 'Gala', 'Anniversary', 'Conference', 'Party', 'Other']
const COLORS = ['#6d3bf5', '#0d9488', '#d97706', '#db2777', '#1f2937', '#65a30d', '#2563eb']

function toLocalInput(iso?: string) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const off = d.getTimezoneOffset()
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
  } catch {
    return ''
  }
}

export function EventForm({ event }: { event?: EventItem }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [form, setForm] = React.useState({
    title: event?.title ?? '',
    type: event?.type ?? 'Wedding',
    description: event?.description ?? '',
    venue: event?.venue ?? '',
    address: event?.address ?? '',
    starts_at: toLocalInput(event?.starts_at),
    status: event?.status ?? 'active',
    cover_color: event?.cover_color ?? '#6d3bf5',
  })

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ...form,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : undefined,
    }
    try {
      if (event) {
        await apiPut(`/api/events/${event.id}`, payload)
        await refresh(`/api/events/${event.id}`)
        toast('Event updated.')
      } else {
        const created = await apiPost<EventItem>('/api/events', payload)
        toast('Event created.')
        await refresh('/api/events')
        router.replace(`/app/events/${created.id}`)
        return
      }
      await refresh('/api/events')
      router.push(`/app/events/${event.id}`)
    } catch {
      toast('Something went wrong. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardContent className="grid gap-5 pt-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Event title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Amara & Tunde — Wedding Celebration"
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Event type</Label>
            <Select id="type" value={form.type} onChange={(e) => set('type', e.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select id="status" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="starts_at">Date & time</Label>
            <Input
              id="starts_at"
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => set('starts_at', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="venue">Venue</Label>
            <Input
              id="venue"
              value={form.venue}
              onChange={(e) => set('venue', e.target.value)}
              placeholder="The Grand Atrium"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="12 Marina Road, Lagos Island"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Tell guests what to expect..."
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Cover color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('cover_color', c)}
                  className={`h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-card transition ${
                    form.cover_color === c ? 'ring-foreground' : 'ring-transparent'
                  }`}
                  style={{ background: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-5 flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {event ? 'Save changes' : 'Create event'}
        </Button>
      </div>
    </form>
  )
}
