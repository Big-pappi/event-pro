'use client'

import * as React from 'react'
import useSWR from 'swr'
import { apiPost } from '@/lib/api'
import type { Campaign, EventItem, Invitee, Template } from '@/lib/types'
import { PageHeader } from '@/components/app/page-header'
import { TemplatePreview } from '@/components/app/template-renderer'
import { RsvpBadge } from '@/components/app/status-badges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import {
  Check,
  MessageCircle,
  Mail,
  Phone,
  Calendar,
  Users,
  Send,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, desc: 'Rich media, highest open rate' },
  { id: 'email', label: 'Email', icon: Mail, desc: 'Best for formal invitations' },
  { id: 'sms', label: 'SMS', icon: Phone, desc: 'Universal reach, text only' },
] as const

const STEPS = ['Event', 'Template', 'Channel', 'Recipients', 'Review']

export default function SendPage() {
  const { toast } = useToast()
  const { data: events } = useSWR<EventItem[]>('/api/events', fetcher)
  const { data: templates } = useSWR<Template[]>('/api/templates', fetcher)

  const [step, setStep] = React.useState(0)
  const [eventId, setEventId] = React.useState<string>('')
  const [templateId, setTemplateId] = React.useState<string>('')
  const [channel, setChannel] = React.useState<string>('whatsapp')
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [campaignName, setCampaignName] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [result, setResult] = React.useState<Campaign | null>(null)
  const [progress, setProgress] = React.useState(0)

  const { data: invitees } = useSWR<Invitee[]>(
    eventId ? `/api/invitees?event_id=${eventId}` : null,
    fetcher,
  )

  const selectedEvent = events?.find((e) => e.id === eventId)
  const selectedTemplate = templates?.find((t) => t.id === templateId)

  React.useEffect(() => {
    if (invitees) setSelected(new Set(invitees.map((i) => i.id)))
  }, [invitees])

  React.useEffect(() => {
    if (selectedEvent && !campaignName) {
      setCampaignName(`${selectedEvent.title} — Invitations`)
    }
  }, [selectedEvent, campaignName])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const canNext =
    (step === 0 && eventId) ||
    (step === 1 && templateId) ||
    step === 2 ||
    (step === 3 && selected.size > 0) ||
    step === 4

  async function handleSend() {
    setSending(true)
    try {
      const campaign = await apiPost<Campaign>('/api/campaigns', {
        event_id: eventId,
        template_id: templateId,
        name: campaignName || 'Untitled Campaign',
        channel,
        invitee_ids: Array.from(selected),
      })
      // simulate live delivery progress
      const total = campaign.total || selected.size
      for (let i = 1; i <= total; i++) {
        await new Promise((r) => setTimeout(r, Math.min(120, 1400 / total)))
        setProgress(Math.round((i / total) * 100))
      }
      await apiPost(`/api/campaigns/${campaign.id}/advance`, {})
      setResult({ ...campaign, status: 'completed' })
      toast('Invitations sent successfully', 'success')
    } catch {
      toast('Sending failed. Please try again.', 'error')
      setSending(false)
    }
  }

  // Success screen
  if (result) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/12">
          <CheckCircle2 className="h-9 w-9 text-success" />
        </div>
        <h2 className="mt-6 font-serif text-2xl font-semibold">Invitations on their way</h2>
        <p className="mt-2 text-muted-foreground">
          {result.name} was delivered via {channel}.
        </p>
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            ['Sent', result.sent],
            ['Delivered', result.delivered],
            ['Failed', result.failed],
          ].map(([label, val]) => (
            <Card key={label as string} className="p-4">
              <p className="text-2xl font-semibold tabular-nums">{val as number}</p>
              <p className="text-xs text-muted-foreground">{label as string}</p>
            </Card>
          ))}
        </div>
        <div className="mt-8 flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setResult(null)
              setStep(0)
              setEventId('')
              setTemplateId('')
              setSelected(new Set())
              setProgress(0)
              setSending(false)
              setCampaignName('')
            }}
          >
            Send another
          </Button>
          <Button asChild>
            <a href="/app/campaigns">View campaigns</a>
          </Button>
        </div>
      </div>
    )
  }

  // Sending progress screen
  if (sending) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
        <h2 className="mt-6 font-serif text-2xl font-semibold">Sending invitations…</h2>
        <p className="mt-2 text-muted-foreground">
          Personalizing each design and dispatching via {channel}.
        </p>
        <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-sm tabular-nums text-muted-foreground">{progress}%</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Send invitations"
        description="Personalize a template and dispatch invitations to your guests."
      />

      {/* Stepper */}
      <div className="flex items-center">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                  i < step
                    ? 'bg-primary text-primary-foreground'
                    : i === step
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  'hidden text-sm font-medium sm:block',
                  i === step ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('mx-2 h-px flex-1', i < step ? 'bg-primary' : 'bg-border')} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <Card className="p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Choose an event</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {events?.map((evt) => (
                <button
                  key={evt.id}
                  onClick={() => setEventId(evt.id)}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                    eventId === evt.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  <span
                    className="mt-0.5 h-10 w-10 shrink-0 rounded-md"
                    style={{ background: evt.cover_color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{evt.title}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" /> {evt.invitee_count ?? 0} invitees · {evt.type}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium">Choose a template</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {templates?.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setTemplateId(tpl.id)}
                  className={cn(
                    'overflow-hidden rounded-lg border-2 p-2 transition-colors',
                    templateId === tpl.id ? 'border-primary' : 'border-transparent hover:border-border',
                  )}
                >
                  <div className="flex justify-center overflow-hidden rounded bg-muted/40 p-2">
                    <TemplatePreview
                      template={tpl}
                      maxWidth={140}
                      vars={{ guest_name: 'Dear Guest', event_date: 'Dec 14', venue: 'Venue' }}
                    />
                  </div>
                  <p className="mt-2 truncate text-xs font-medium">{tpl.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-medium">Choose a channel</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setChannel(ch.id)}
                  className={cn(
                    'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors',
                    channel === ch.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  <ch.icon className="h-6 w-6 text-primary" />
                  <p className="font-medium">{ch.label}</p>
                  <p className="text-xs text-muted-foreground">{ch.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Select recipients</h3>
              <div className="flex gap-2 text-sm">
                <button
                  className="text-primary hover:underline"
                  onClick={() => setSelected(new Set(invitees?.map((i) => i.id)))}
                >
                  Select all
                </button>
                <span className="text-muted-foreground">·</span>
                <button
                  className="text-muted-foreground hover:underline"
                  onClick={() => setSelected(new Set())}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="max-h-80 divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {invitees?.map((inv) => (
                <label
                  key={inv.id}
                  className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-muted/40"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(inv.id)}
                    onChange={() => toggle(inv.id)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{inv.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {channel === 'email' ? inv.email : inv.phone}
                    </p>
                  </div>
                  <RsvpBadge status={inv.rsvp} />
                </label>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{selected.size} selected</p>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-medium">Review &amp; confirm</h3>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Campaign name</label>
                <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
              </div>
              <dl className="space-y-3 rounded-lg border border-border p-4 text-sm">
                <Row icon={Calendar} label="Event" value={selectedEvent?.title ?? '—'} />
                <Row icon={Send} label="Template" value={selectedTemplate?.name ?? '—'} />
                <Row
                  icon={CHANNELS.find((c) => c.id === channel)?.icon ?? Send}
                  label="Channel"
                  value={CHANNELS.find((c) => c.id === channel)?.label ?? channel}
                />
                <Row icon={Users} label="Recipients" value={`${selected.size} guests`} />
              </dl>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg bg-muted/40 p-4">
              {selectedTemplate && (
                <TemplatePreview
                  template={selectedTemplate}
                  maxWidth={200}
                  vars={{
                    guest_name: invitees?.[0]?.name ?? 'Dear Guest',
                    event_date: selectedEvent
                      ? new Date(selectedEvent.starts_at).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '',
                    venue: selectedEvent?.venue ?? '',
                  }}
                />
              )}
              <Badge className="mt-3" tone="primary">
                Live preview for {invitees?.[0]?.name ?? 'guest'}
              </Badge>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <Button onClick={handleSend} disabled={selected.size === 0}>
            <Send className="h-4 w-4" />
            Send to {selected.size} guests
          </Button>
        )}
      </div>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </dt>
      <dd className="truncate text-right font-medium">{value}</dd>
    </div>
  )
}
