'use client'

import * as React from 'react'
import {
  Users,
  CalendarDays,
  Send,
  DollarSign,
  Clock,
  TrendingUp,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import Link from 'next/link'
import { useApi } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/app/stat-card'
import { PageHeader } from '@/components/app/page-header'
import type { AdminStats } from '@/lib/types'

const PLAN_COLORS = ['#9b8fc7', '#6d3bf5', '#d9a441']

export default function AdminOverviewPage() {
  const { data: stats } = useApi<AdminStats>('/api/admin/stats')

  return (
    <div>
      <PageHeader
        title="Platform overview"
        description="Monitor growth, revenue and operational health across InvitePro."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total agents"
          value={stats?.users_total ?? '—'}
          hint={`${stats?.users_active ?? 0} active`}
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Monthly revenue"
          value={stats ? `$${stats.mrr.toLocaleString()}` : '—'}
          hint="recurring"
          icon={DollarSign}
          tone="success"
        />
        <StatCard
          label="Events created"
          value={stats?.events_total ?? '—'}
          hint="all agents"
          icon={CalendarDays}
          tone="accent"
        />
        <StatCard
          label="Pending payments"
          value={stats?.pending_payments ?? '—'}
          hint="awaiting review"
          icon={Clock}
          tone="warning"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.revenue_trend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e3f5" vertical={false} />
                  <XAxis dataKey="month" stroke="#6b6685" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b6685" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f3f1fb' }}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e7e3f5', fontSize: 13 }}
                  />
                  <Bar dataKey="mrr" fill="#6d3bf5" radius={[6, 6, 0, 0]} name="MRR ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.plan_distribution ?? []}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {(stats?.plan_distribution ?? []).map((_, i) => (
                      <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e7e3f5', fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-2">
              {(stats?.plan_distribution ?? []).map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: PLAN_COLORS[i % PLAN_COLORS.length] }}
                    />
                    {p.name}
                  </span>
                  <span className="font-medium">{p.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Send className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Messages delivered</p>
              <p className="font-serif text-2xl font-semibold">
                {stats?.messages_total?.toLocaleString() ?? '—'}
              </p>
            </div>
          </div>
        </Card>
        <Link href="/admin/payments">
          <Card className="p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/12 text-warning">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Payments to review</p>
                <p className="font-serif text-2xl font-semibold">
                  {stats?.pending_payments ?? '—'}
                </p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/admin/users">
          <Card className="p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/12 text-success">
                <TrendingUp className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Active agents</p>
                <p className="font-serif text-2xl font-semibold">
                  {stats?.users_active ?? '—'}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}
