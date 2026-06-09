'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Users,
  Plus,
  Upload,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  Download,
  Loader2,
} from 'lucide-react'
import { useApi, apiPost, apiPut, apiDelete, refresh } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select, Label } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { RsvpBadge } from '@/components/app/status-badges'
import type { EventItem, Invitee } from '@/lib/types'

const GROUPS = ['Family', 'Friends', 'VIP', 'Colleagues', 'Plus One']
const empty = { name: '', email: '', phone: '', group: 'Friends', rsvp: 'pending', guests: 1 }

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  return lines.slice(1).map((line) => {
    const cells = line.split(',')
    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? '').trim()
    })
    return row
  })
}

export default function InviteesPage() {
  const searchParams = useSearchParams()
  const initialEvent = searchParams.get('event') ?? ''
  const { toast } = useToast()

  const { data: events } = useApi<EventItem[]>('/api/events')
  const [eventId, setEventId] = React.useState(initialEvent)

  React.useEffect(() => {
    if (!eventId && events && events.length) setEventId(events[0].id)
  }, [events, eventId])

  const [search, setSearch] = React.useState('')
  const [rsvpFilter, setRsvpFilter] = React.useState('all')
  const key = eventId
    ? `/api/invitees?event_id=${eventId}&rsvp=${rsvpFilter}${search ? `&search=${encodeURIComponent(search)}` : ''}`
    : null
  const { data: invitees } = useApi<Invitee[]>(key)

  const [addOpen, setAddOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Invitee | null>(null)
  const [importOpen, setImportOpen] = React.useState(false)
  const [form, setForm] = React.useState(empty)
  const [saving, setSaving] = React.useState(false)

  const setField = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  function openAdd() {
    setForm(empty)
    setEditing(null)
    setAddOpen(true)
  }

  function openEdit(inv: Invitee) {
    setEditing(inv)
    setForm({
      name: inv.name,
      email: inv.email,
      phone: inv.phone,
      group: inv.group,
      rsvp: inv.rsvp,
      guests: inv.guests,
    })
    setAddOpen(true)
  }

  async function saveInvitee(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await apiPut(`/api/invitees/${editing.id}`, form)
        toast('Invitee updated.')
      } else {
        await apiPost('/api/invitees', { ...form, event_id: eventId })
        toast('Invitee added.')
      }
      await refresh(key)
      setAddOpen(false)
    } catch {
      toast('Could not save invitee.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function removeInvitee(id: string) {
    try {
      await apiDelete(`/api/invitees/${id}`)
      await refresh(key)
      toast('Invitee removed.')
    } catch {
      toast('Could not remove invitee.', 'error')
    }
  }

  async function toggleCheckIn(inv: Invitee) {
    await apiPut(`/api/invitees/${inv.id}`, { checked_in: !inv.checked_in })
    await refresh(key)
  }

  const list = invitees ?? []
  const accepted = list.filter((i) => i.rsvp === 'accepted').length

  return (
    <div>
      <PageHeader
        title="Invitees"
        description="Manage your guest list, RSVPs and check-ins."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)} disabled={!eventId}>
              <Upload className="h-4 w-4" /> Import CSV
            </Button>
            <Button onClick={openAdd} disabled={!eventId}>
              <Plus className="h-4 w-4" /> Add invitee
            </Button>
          </div>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="lg:max-w-xs"
        >
          {(events ?? []).map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </Select>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={rsvpFilter}
          onChange={(e) => setRsvpFilter(e.target.value)}
          className="lg:max-w-[160px]"
        >
          <option value="all">All RSVPs</option>
          <option value="accepted">Accepted</option>
          <option value="pending">Pending</option>
          <option value="declined">Declined</option>
        </Select>
      </div>

      {eventId && (
        <p className="mb-3 text-sm text-muted-foreground">
          {list.length} invitees · {accepted} accepted
        </p>
      )}

      {list.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No invitees yet"
          description="Add guests manually or import a CSV to get started."
          action={
            <Button onClick={openAdd} disabled={!eventId}>
              <Plus className="h-4 w-4" /> Add invitee
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Group</th>
                  <th className="px-4 py-3 font-medium">Guests</th>
                  <th className="px-4 py-3 font-medium">RSVP</th>
                  <th className="px-4 py-3 font-medium">Check-in</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{inv.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{inv.email || '—'}</div>
                      <div className="text-xs">{inv.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="muted">{inv.group}</Badge>
                    </td>
                    <td className="px-4 py-3">{inv.guests}</td>
                    <td className="px-4 py-3">
                      <RsvpBadge status={inv.rsvp} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleCheckIn(inv)}
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          inv.checked_in ? 'text-success' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {inv.checked_in ? 'Checked in' : 'Check in'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(inv)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInvitee(inv.id)}
                          aria-label="Delete"
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add / edit modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={editing ? 'Edit invitee' : 'Add invitee'}
      >
        <form onSubmit={saveInvitee} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="iname">Full name</Label>
            <Input
              id="iname"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="iemail">Email</Label>
            <Input
              id="iemail"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="iphone">Phone</Label>
            <Input
              id="iphone"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="+15551234567"
            />
          </div>
          <div>
            <Label htmlFor="igroup">Group</Label>
            <Select id="igroup" value={form.group} onChange={(e) => setField('group', e.target.value)}>
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="iguests">Guests (incl. invitee)</Label>
            <Input
              id="iguests"
              type="number"
              min={1}
              value={form.guests}
              onChange={(e) => setField('guests', Number(e.target.value))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="irsvp">RSVP status</Label>
            <Select id="irsvp" value={form.rsvp} onChange={(e) => setField('rsvp', e.target.value)}>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
            </Select>
          </div>
          <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save changes' : 'Add invitee'}
            </Button>
          </div>
        </form>
      </Modal>

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        eventId={eventId}
        onDone={() => refresh(key)}
      />
    </div>
  )
}

function ImportModal({
  open,
  onClose,
  eventId,
  onDone,
}: {
  open: boolean
  onClose: () => void
  eventId: string
  onDone: () => void
}) {
  const { toast } = useToast()
  const [rows, setRows] = React.useState<Record<string, string>[]>([])
  const [fileName, setFileName] = React.useState('')
  const [importing, setImporting] = React.useState(false)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result))
      setRows(parsed)
      if (parsed.length === 0) toast('No rows found. Check your CSV headers.', 'error')
    }
    reader.readAsText(file)
  }

  async function doImport() {
    if (!rows.length) return
    setImporting(true)
    try {
      const invitees = rows.map((r) => ({
        name: r.name || r['full name'] || 'Guest',
        email: r.email || '',
        phone: r.phone || r.mobile || '',
        group: r.group || r.tag || 'Friends',
        guests: Number(r.guests || 1) || 1,
      }))
      const res = await apiPost<{ created: number }>('/api/invitees/bulk', {
        event_id: eventId,
        invitees,
      })
      toast(`Imported ${res.created} invitees.`)
      onDone()
      setRows([])
      setFileName('')
      onClose()
    } catch {
      toast('Import failed. Please try again.', 'error')
    } finally {
      setImporting(false)
    }
  }

  function downloadTemplate() {
    const csv = 'name,email,phone,group,guests\nJane Doe,jane@example.com,+15551234567,Family,2\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'invitees-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal open={open} onClose={onClose} title="Import invitees" description="Upload a CSV file with your guest list.">
      <div className="space-y-4">
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Download className="h-4 w-4" /> Download CSV template
        </button>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-border bg-muted/40 px-6 py-10 text-center hover:bg-muted">
          <Upload className="h-7 w-7 text-muted-foreground" />
          <span className="mt-2 text-sm font-medium">
            {fileName || 'Click to choose a CSV file'}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            Columns: name, email, phone, group, guests
          </span>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
        </label>

        {rows.length > 0 && (
          <div className="rounded-[var(--radius)] border border-border">
            <div className="border-b border-border bg-muted/50 px-4 py-2 text-sm font-medium">
              Preview — {rows.length} rows
            </div>
            <div className="max-h-48 overflow-y-auto scrollbar-thin">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {rows.slice(0, 8).map((r, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 font-medium">{r.name || r['full name'] || 'Guest'}</td>
                      <td className="px-4 py-2 text-muted-foreground">{r.email || '—'}</td>
                      <td className="px-4 py-2 text-muted-foreground">{r.phone || r.mobile || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={doImport} disabled={!rows.length || importing}>
            {importing && <Loader2 className="h-4 w-4 animate-spin" />}
            Import {rows.length || ''} invitees
          </Button>
        </div>
      </div>
    </Modal>
  )
}
