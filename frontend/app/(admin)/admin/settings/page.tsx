'use client'

import * as React from 'react'
import { Settings as SettingsIcon, Plug, Shield, Save, Loader2 } from 'lucide-react'
import { useApi, apiPut, refresh } from '@/lib/api'
import { PageHeader } from '@/components/app/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import type { Settings } from '@/lib/types'

const TABS = [
  { id: 'platform', label: 'General', icon: SettingsIcon },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'security', label: 'Security', icon: Shield },
] as const

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const { data } = useApi<Settings>('/api/admin/settings')
  const [tab, setTab] = React.useState<(typeof TABS)[number]['id']>('platform')
  const [draft, setDraft] = React.useState<Settings | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (data && !draft) setDraft(data)
  }, [data, draft])

  async function save() {
    if (!draft) return
    setSaving(true)
    try {
      await apiPut('/api/admin/settings', draft)
      await refresh('/api/admin/settings')
      toast('Settings saved', 'success')
    } catch {
      toast('Could not save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!draft) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const setPlatform = (k: keyof Settings['platform'], v: string | boolean) =>
    setDraft({ ...draft, platform: { ...draft.platform, [k]: v } })
  const setSecurity = (k: keyof Settings['security'], v: number | boolean) =>
    setDraft({ ...draft, security: { ...draft.security, [k]: v } })
  const setIntegration = (key: string, enabled: boolean) =>
    setDraft({
      ...draft,
      integrations: {
        ...draft.integrations,
        [key]: { ...draft.integrations[key], enabled },
      },
    })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure platform-wide preferences, integrations and security."
        action={
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'platform' && (
        <Card className="max-w-2xl space-y-5 p-6">
          <div>
            <Label htmlFor="name">Platform name</Label>
            <Input
              id="name"
              value={draft.platform.name}
              onChange={(e) => setPlatform('name', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="support">Support email</Label>
            <Input
              id="support"
              type="email"
              value={draft.platform.support_email}
              onChange={(e) => setPlatform('support_email', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="currency">Default currency</Label>
            <Select
              id="currency"
              value={draft.platform.default_currency}
              onChange={(e) => setPlatform('default_currency', e.target.value)}
            >
              {['USD', 'EUR', 'GBP', 'NGN', 'GHS'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium">Allow new signups</p>
              <p className="text-xs text-muted-foreground">Let agents create new accounts.</p>
            </div>
            <Toggle
              label="Allow new signups"
              checked={draft.platform.signups_enabled}
              onChange={(v) => setPlatform('signups_enabled', v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium">Maintenance mode</p>
              <p className="text-xs text-muted-foreground">Temporarily disable agent access.</p>
            </div>
            <Toggle
              label="Maintenance mode"
              checked={draft.platform.maintenance_mode}
              onChange={(v) => setPlatform('maintenance_mode', v)}
            />
          </div>
        </Card>
      )}

      {tab === 'integrations' && (
        <Card className="max-w-2xl divide-y divide-border p-0">
          {Object.entries(draft.integrations).map(([key, cfg]) => (
            <div key={key} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                <p className="text-xs text-muted-foreground">
                  {cfg.provider ? `Provider: ${cfg.provider}` : 'Configure delivery provider'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={cfg.status === 'active' ? 'success' : 'muted'}>
                  {cfg.status.replace(/_/g, ' ')}
                </Badge>
                <Toggle
                  label={`Toggle ${key}`}
                  checked={cfg.enabled}
                  onChange={(v) => setIntegration(key, v)}
                />
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === 'security' && (
        <Card className="max-w-2xl space-y-5 p-6">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium">Enforce two-factor auth</p>
              <p className="text-xs text-muted-foreground">Require 2FA for all admin accounts.</p>
            </div>
            <Toggle
              label="Enforce two-factor auth"
              checked={draft.security.enforce_2fa}
              onChange={(v) => setSecurity('enforce_2fa', v)}
            />
          </div>
          <div>
            <Label htmlFor="timeout">Session timeout (minutes)</Label>
            <Input
              id="timeout"
              type="number"
              min={5}
              value={draft.security.session_timeout_minutes}
              onChange={(e) => setSecurity('session_timeout_minutes', Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="pwlen">Minimum password length</Label>
            <Input
              id="pwlen"
              type="number"
              min={6}
              max={64}
              value={draft.security.password_min_length}
              onChange={(e) => setSecurity('password_min_length', Number(e.target.value))}
            />
          </div>
        </Card>
      )}
    </div>
  )
}
