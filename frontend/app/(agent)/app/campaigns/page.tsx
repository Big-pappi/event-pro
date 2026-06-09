'use client'

import useSWR from 'swr'
import Link from 'next/link'
import type { Campaign, EventItem } from '@/lib/types'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Send, MessageCircle, Mail, Phone } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const CHANNEL_ICON = { whatsapp: MessageCircle, email: Mail, sms: Phone } as const

export default function CampaignsPage() {
  const { data: campaigns, isLoading } = useSWR<Campaign[]>('/api/campaigns', fetcher)
  const { data: events } = useSWR<EventItem[]>('/api/events', fetcher)

  const eventName = (id: string) => events?.find((e) => e.id === id)?.title ?? 'Event'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Track delivery performance across all your invitation sends."
        action={
          <Button asChild>
            <Link href="/app/send">
              <Send className="h-4 w-4" />
              New send
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !campaigns || campaigns.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No campaigns yet"
          description="Send your first invitation campaign to see delivery analytics here."
          action={
            <Button asChild>
              <Link href="/app/send">Send invitations</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => {
            const Icon = CHANNEL_ICON[c.channel]
            const rate = c.sent ? Math.round((c.delivered / c.sent) * 100) : 0
            const openRate = c.delivered ? Math.round((c.opened / c.delivered) * 100) : 0
            return (
              <Card key={c.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {eventName(c.event_id)} · {c.channel}
                      </p>
                    </div>
                  </div>
                  <Badge tone={c.status === 'completed' ? 'success' : 'primary'}>
                    {c.status}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
                  {[
                    ['Recipients', c.total],
                    ['Sent', c.sent],
                    ['Delivered', c.delivered],
                    ['Opened', c.opened],
                    ['Failed', c.failed],
                  ].map(([label, val]) => (
                    <div key={label as string}>
                      <p className="text-lg font-semibold tabular-nums">{val as number}</p>
                      <p className="text-xs text-muted-foreground">{label as string}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Delivery rate</span>
                    <span className="tabular-nums">{rate}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Open rate</span>
                    <span className="tabular-nums">{openRate}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${openRate}%` }} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
