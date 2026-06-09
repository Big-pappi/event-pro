'use client'

import * as React from 'react'
import { Users, Search, MoreVertical, Building2 } from 'lucide-react'
import { useApi, apiPut, refresh } from '@/lib/api'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { formatDate } from '@/lib/utils'
import type { User } from '@/lib/types'

const PLANS = [
  { id: 'free', name: 'Free' },
  { id: 'pro', name: 'Pro' },
  { id: 'business', name: 'Business' },
]

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [search, setSearch] = React.useState('')
  const { data: users, isLoading } = useApi<User[]>(
    `/api/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`,
  )
  const [editing, setEditing] = React.useState<User | null>(null)
  const [draftPlan, setDraftPlan] = React.useState('free')
  const [draftStatus, setDraftStatus] = React.useState('active')
  const [saving, setSaving] = React.useState(false)

  function openEdit(u: User) {
    setEditing(u)
    setDraftPlan(u.plan_id)
    setDraftStatus(u.status)
  }

  async function save() {
    if (!editing) return
    setSaving(true)
    try {
      await apiPut(`/api/admin/users/${editing.id}`, {
        plan_id: draftPlan,
        status: draftStatus,
      })
      await refresh(
        `/api/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      )
      toast('User updated', 'success')
      setEditing(null)
    } catch {
      toast('Could not update user', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage agent accounts, plans and access across the platform."
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !users || users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try a different search term." />
      ) : (
        <Card className="overflow-hidden p-0">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Agent</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Events</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {u.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={u.plan_id === 'free' ? 'muted' : 'primary'}>
                        {u.plan_name ?? u.plan_id}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={u.status === 'active' ? 'success' : 'destructive'}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 tabular-nums">{u.events ?? 0}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)} aria-label="Manage user">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-border md:hidden">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {u.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge tone={u.plan_id === 'free' ? 'muted' : 'primary'}>{u.plan_name}</Badge>
                    <Badge tone={u.status === 'active' ? 'success' : 'destructive'}>{u.status}</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => openEdit(u)} aria-label="Manage user">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Manage user"
        description={editing?.email}
      >
        {editing && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Company:</span>
              <span className="font-medium">{editing.company || '—'}</span>
            </div>
            <div>
              <Label htmlFor="plan">Plan</Label>
              <Select id="plan" value={draftPlan} onChange={(e) => setDraftPlan(e.target.value)}>
                {PLANS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Account status</Label>
              <Select id="status" value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
