'use client'

import * as React from 'react'
import { Check, CreditCard } from 'lucide-react'
import { useApi } from '@/lib/api'
import { PageHeader } from '@/components/app/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Plan, User } from '@/lib/types'

export default function AdminSubscriptionsPage() {
  const { data: plans } = useApi<Plan[]>('/api/plans')
  const { data: users } = useApi<User[]>('/api/admin/users')

  const counts = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const u of users ?? []) map[u.plan_id] = (map[u.plan_id] ?? 0) + 1
    return map
  }, [users])

  const subscribers = (users ?? []).filter((u) => u.plan_id !== 'free')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        description="Review available plans and active subscriptions across the platform."
      />

      <div className="grid gap-5 md:grid-cols-3">
        {(plans ?? []).map((plan) => (
          <Card
            key={plan.id}
            className={plan.id === 'pro' ? 'border-primary p-6 ring-1 ring-primary/30' : 'p-6'}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold">{plan.name}</h3>
              {plan.id === 'pro' && <Badge tone="primary">Popular</Badge>}
            </div>
            <p className="mt-2">
              <span className="font-serif text-3xl font-semibold">${plan.price}</span>
              <span className="text-sm text-muted-foreground">/{plan.interval}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {counts[plan.id] ?? 0} active {(counts[plan.id] ?? 0) === 1 ? 'agent' : 'agents'}
            </p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-border p-5">
          <CreditCard className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Active subscriptions</h3>
          <Badge tone="muted" className="ml-auto">{subscribers.length}</Badge>
        </div>
        {subscribers.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No paid subscriptions yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {subscribers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {u.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.company || u.email}</p>
                </div>
                <Badge tone="primary">{u.plan_name ?? u.plan_id}</Badge>
                <Badge tone={u.status === 'active' ? 'success' : 'destructive'}>{u.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
