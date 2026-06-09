'use client'

import * as React from 'react'
import { Receipt, Check, X, FileText } from 'lucide-react'
import { useApi, apiPost, refresh } from '@/lib/api'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { formatDate } from '@/lib/utils'
import type { Payment } from '@/lib/types'

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
]

const STATUS_TONE = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
} as const

export default function AdminPaymentsPage() {
  const { toast } = useToast()
  const [filter, setFilter] = React.useState('pending')
  const key = `/api/admin/payments?status_filter=${filter}`
  const { data: payments, isLoading } = useApi<Payment[]>(key)
  const [busy, setBusy] = React.useState<string | null>(null)

  async function decide(payment: Payment, decision: 'approved' | 'rejected') {
    setBusy(payment.id)
    try {
      await apiPost(`/api/admin/payments/${payment.id}/decision`, { decision })
      await refresh(key)
      toast(
        decision === 'approved'
          ? `Approved payment for ${payment.user_name}`
          : `Rejected payment for ${payment.user_name}`,
        decision === 'approved' ? 'success' : 'info',
      )
    } catch {
      toast('Could not update payment', 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Review and approve manual subscription payments from agents."
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !payments || payments.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No payments here"
          description="There are no payments matching this filter."
        />
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium">{p.user_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.plan_name ?? p.plan_id} plan · {p.method}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Ref {p.reference} · {formatDate(p.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-serif text-xl font-semibold tabular-nums">
                    ${p.amount} {p.currency}
                  </p>
                  <Badge tone={STATUS_TONE[p.status]} className="mt-1">
                    {p.status}
                  </Badge>
                </div>
              </div>

              {p.status === 'pending' && (
                <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy === p.id}
                    onClick={() => decide(p, 'rejected')}
                  >
                    <X className="h-4 w-4" /> Reject
                  </Button>
                  <Button size="sm" disabled={busy === p.id} onClick={() => decide(p, 'approved')}>
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
