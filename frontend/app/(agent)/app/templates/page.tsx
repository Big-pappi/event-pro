'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useApi, apiPost, apiDelete, refresh } from '@/lib/api'
import type { Template } from '@/lib/types'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { TemplatePreview } from '@/components/app/template-renderer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { LayoutTemplate, Plus, Copy, Trash2, Crown, Pencil } from 'lucide-react'

const CATEGORIES = ['All', 'Wedding', 'Corporate', 'Birthday', 'Gala']

const PREVIEW_VARS = {
  guest_name: 'Dear Guest',
  event_date: 'Sat, Dec 14 · 6:00 PM',
  venue: 'The Grand Atrium',
}

export default function TemplatesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [category, setCategory] = React.useState('All')
  const { data: templates, isLoading } = useApi<Template[]>(
    `/api/templates?category=${category}`,
  )
  const [busy, setBusy] = React.useState<string | null>(null)

  async function handleDuplicate(tpl: Template) {
    setBusy(tpl.id)
    try {
      await apiPost('/api/templates', {
        name: `${tpl.name} (Copy)`,
        category: tpl.category,
        background: tpl.background,
        width: tpl.width,
        height: tpl.height,
        layers: tpl.layers,
        thumbnail_color: tpl.thumbnail_color,
        is_premium: false,
      })
      await refresh(`/api/templates?category=${category}`)
      toast('Template duplicated', 'success')
    } catch {
      toast('Could not duplicate template', 'error')
    } finally {
      setBusy(null)
    }
  }

  async function handleDelete(tpl: Template) {
    if (tpl.owner_id === 'system') {
      toast('System templates cannot be deleted', 'error')
      return
    }
    setBusy(tpl.id)
    try {
      await apiDelete(`/api/templates/${tpl.id}`)
      await refresh(`/api/templates?category=${category}`)
      toast('Template deleted', 'success')
    } catch {
      toast('Could not delete template', 'error')
    } finally {
      setBusy(null)
    }
  }

  async function handleCreateBlank() {
    setBusy('new')
    try {
      const tpl = await apiPost<Template>('/api/templates', {
        name: 'Untitled Design',
        category: 'Wedding',
        background: '#ffffff',
        width: 600,
        height: 800,
        layers: [
          {
            id: Math.random().toString(36).slice(2, 10),
            type: 'text',
            text: 'You Are Invited',
            x: 100,
            y: 320,
            w: 400,
            h: 80,
            rotation: 0,
            fontSize: 44,
            fontFamily: 'serif',
            color: '#1f2937',
            align: 'center',
            weight: '700',
          },
        ],
        thumbnail_color: '#7c3aed',
        is_premium: false,
      })
      router.push(`/app/templates/${tpl.id}`)
    } catch {
      toast('Could not create template', 'error')
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates"
        description="Design and manage invitation templates with the drag-and-drop editor."
        action={
          <Button onClick={handleCreateBlank} disabled={busy === 'new'}>
            <Plus className="h-4 w-4" />
            New design
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              category === c
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !templates || templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No templates yet"
          description="Create your first invitation design to get started."
          action={<Button onClick={handleCreateBlank}>Create design</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((tpl) => (
            <Card
              key={tpl.id}
              className="group overflow-hidden p-0 transition-shadow hover:shadow-lg"
            >
              <div className="relative flex items-center justify-center overflow-hidden bg-muted/40 p-4">
                <TemplatePreview template={tpl} vars={PREVIEW_VARS} maxWidth={220} />
                {tpl.is_premium && (
                  <Badge tone="accent" className="absolute right-3 top-3 gap-1">
                    <Crown className="h-3 w-3" /> Premium
                  </Badge>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-foreground/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="sm" onClick={() => router.push(`/app/templates/${tpl.id}`)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground">{tpl.category}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={busy === tpl.id}
                    onClick={() => handleDuplicate(tpl)}
                    aria-label="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={busy === tpl.id || tpl.owner_id === 'system'}
                    onClick={() => handleDelete(tpl)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
