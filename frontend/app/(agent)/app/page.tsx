'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  Users,
  Send,
  CheckCircle2,
  Plus,
  ArrowRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/app/stat-card'
import { PageHeader } from '@/components/app/page-header'
import { EventStatusBadge } from '@/components/app/status-badges'
import { formatDate } from '@/lib/utils'
import type { AgentStats, EventItem } from '@/lib/types'

const CHANNEL_COLORS = ['#6d3bf5', '#0d9488', '#d9a441']

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: stats } = useApi<AgentStats>('/api/dashboard/stats')
  const { data: events } = useApi<EventItem[]>('/api/events')

  const rsvp = stats?.rsvp
  const totalRsvp = rsvp ? rsvp.accepted + rsvp.pending + rsvp.declined : 0

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'there'}`}
        description="Here's what's happening across your events."
        action={
          <Link href="/app/events/new">
            <Button>
              <Plus className="h-4 w-4" /> New event
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total events"
          value={stats?.events_total ?? '—'}
          hint={`${stats?.events_active ?? 0} active`}
          icon={CalendarDays}
          tone="primary"
        />
        <StatCard
          label="Invitees"
          value={stats?.invitees_total ?? '—'}
          hint={`${rsvp?.accepted ?? 0} accepted`}
          icon={Users}
          tone="accent"
        />
        <StatCard
          label="Messages sent"
          value={stats?.messages_sent ?? '—'}
          hint={`${stats?.messages_delivered ?? 0} delivered`}
          icon={Send}
          tone="success"
        />
        <StatCard
          label="Delivery rate"
          value={stats ? `${stats.delivery_rate}%` : '—'}
          hint="last 30 days"
          icon={CheckCircle2}
          tone="warning"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Delivery activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.activity ?? []}>
                  <defs>
                    <linearGradient id="sent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6d3bf5" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6d3bf5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="opened" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e3f5" vertical={false} />
                  <XAxis dataKey="day" stroke="#6b6685" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b6685" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e7e3f5',
                      fontSize: 13,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sent"
                    stroke="#6d3bf5"
                    strokeWidth={2}
                    fill="url(#sent)"
                    name="Sent"
                  />
                  <Area
                    type="monotone"
                    dataKey="opened"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fill="url(#opened)"
                    name="Opened"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Channel mix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.channels ?? []}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {(stats?.channels ?? []).map((_, i) => (
                      <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e7e3f5', fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-2">
              {(stats?.channels ?? []).map((c, i) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }}
                    />
                    {c.name}
                  </span>
                  <span className="font-medium">{c.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent events</CardTitle>
            <Link href="/app/events" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {(events ?? []).slice(0, 4).map((e) => (
              <Link
                key={e.id}
                href={`/app/events/${e.id}`}
                className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-muted"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
                  style={{ background: e.cover_color }}
                >
                  {e.title.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(e.starts_at)} · {e.invitee_count ?? 0} invitees
                  </p>
                </div>
                <EventStatusBadge status={e.status} />
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            {events && events.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No events yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RSVP breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Accepted', value: rsvp?.accepted ?? 0, color: '#15a06a' },
              { label: 'Pending', value: rsvp?.pending ?? 0, color: '#d97706' },
              { label: 'Declined', value: rsvp?.declined ?? 0, color: '#e0245e' },
            ].map((r) => {
              const pct = totalRsvp ? Math.round((r.value / totalRsvp) * 100) : 0
              return (
                <div key={r.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-medium">
                      {r.value} ({pct}%)
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: r.color }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
