'use client'

import * as React from 'react'
import { ScrollText, Info, AlertTriangle, XCircle } from 'lucide-react'
import { useApi } from '@/lib/api'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import type { LogEntry } from '@/lib/types'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'info', label: 'Info' },
  { id: 'warning', label: 'Warning' },
  { id: 'error', label: 'Error' },
]

const LEVEL = {
  info: { icon: Info, tone: 'primary' as const },
  warning: { icon: AlertTriangle, tone: 'warning' as const },
  error: { icon: XCircle, tone: 'destructive' as const },
}

export default function AdminLogsPage() {
  const [filter, setFilter] = React.useState('all')
  const { data: logs, isLoading } = useApi<LogEntry[]>(`/api/admin/logs?level=${filter}`)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit logs"
        description="Track system events, deliveries and administrative actions."
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
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !logs || logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No log entries" description="Nothing matches this filter yet." />
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-border">
            {logs.map((log) => {
              const cfg = LEVEL[log.level]
              const Icon = cfg.icon
              return (
                <li key={log.id} className="flex items-start gap-3 p-4">
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      log.level === 'info'
                        ? 'bg-primary/10 text-primary'
                        : log.level === 'warning'
                          ? 'bg-warning/12 text-warning'
                          : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
                        {log.action}
                      </code>
                      <Badge tone={cfg.tone}>{log.level}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{log.detail}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {log.actor} · {formatDateTime(log.at)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
