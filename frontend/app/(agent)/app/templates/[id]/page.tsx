'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { apiPut } from '@/lib/api'
import type { Template } from '@/lib/types'
import { TemplateEditor } from '@/components/app/template-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function TemplateEditorPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { data, isLoading } = useSWR<Template>(`/api/templates/${params.id}`, fetcher)
  const [draft, setDraft] = React.useState<Template | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (data && !draft) setDraft(data)
  }, [data, draft])

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    try {
      await apiPut(`/api/templates/${draft.id}`, {
        name: draft.name,
        category: draft.category,
        background: draft.background,
        width: draft.width,
        height: draft.height,
        layers: draft.layers,
        thumbnail_color: draft.thumbnail_color,
        is_premium: draft.is_premium,
      })
      toast('Template saved', 'success')
    } catch {
      toast('Could not save template', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !draft) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app/templates" aria-label="Back to templates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-64 font-medium"
          />
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          >
            {['Wedding', 'Corporate', 'Birthday', 'Gala'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/app/templates')}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      <TemplateEditor template={draft} onChange={setDraft} />
    </div>
  )
}
