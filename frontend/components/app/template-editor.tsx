'use client'

import * as React from 'react'
import type { Layer, Template } from '@/lib/types'
import { applyVariables } from '@/components/app/template-renderer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Type,
  Square,
  Circle,
  QrCode,
  Variable,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react'

const CANVAS_VARS = {
  guest_name: 'Dear Guest',
  event_date: 'Sat, Dec 14 · 6:00 PM',
  venue: 'The Grand Atrium',
  qr_token: 'preview',
}

const FONT_FAMILIES = [
  { label: 'Sans', value: 'sans' },
  { label: 'Serif', value: 'serif' },
]

const WEIGHTS = ['400', '500', '600', '700']

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

type DragState =
  | { mode: 'move'; id: string; startX: number; startY: number; origX: number; origY: number }
  | {
      mode: 'resize'
      id: string
      startX: number
      startY: number
      origW: number
      origH: number
    }
  | null

export function TemplateEditor({
  template,
  onChange,
}: {
  template: Template
  onChange: (next: Template) => void
}) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const dragRef = React.useRef<DragState>(null)
  const canvasRef = React.useRef<HTMLDivElement>(null)
  const [scale, setScale] = React.useState(0.7)

  const selected = template.layers.find((l) => l.id === selectedId) ?? null

  // Fit scale to available width
  React.useEffect(() => {
    function fit() {
      if (!canvasRef.current) return
      const avail = canvasRef.current.clientWidth - 48
      setScale(Math.min(0.85, Math.max(0.3, avail / template.width)))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [template.width])

  function updateLayer(id: string, patch: Partial<Layer>) {
    onChange({
      ...template,
      layers: template.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    })
  }

  function addLayer(type: Layer['type']) {
    const cx = template.width / 2 - 120
    const cy = template.height / 2 - 30
    const base: Layer = { id: uid(), type, x: cx, y: cy, w: 240, h: 60, rotation: 0 }
    let layer: Layer = base
    if (type === 'text') {
      layer = { ...base, text: 'New text', fontSize: 28, fontFamily: 'sans', color: '#1f2937', align: 'center', weight: '500' }
    } else if (type === 'variable') {
      layer = { ...base, text: '{{guest_name}}', fontSize: 22, fontFamily: 'sans', color: '#7c3aed', align: 'center', weight: '600' }
    } else if (type === 'shape') {
      layer = { ...base, h: 120, shape: 'rect', fill: '#7c3aed' }
    } else if (type === 'qr') {
      layer = { ...base, w: 120, h: 120 }
    } else if (type === 'image') {
      layer = { ...base, w: 200, h: 200, src: '' }
    }
    onChange({ ...template, layers: [...template.layers, layer] })
    setSelectedId(layer.id)
  }

  function removeLayer(id: string) {
    onChange({ ...template, layers: template.layers.filter((l) => l.id !== id) })
    setSelectedId(null)
  }

  function duplicateLayer(id: string) {
    const l = template.layers.find((x) => x.id === id)
    if (!l) return
    const copy = { ...l, id: uid(), x: l.x + 20, y: l.y + 20 }
    onChange({ ...template, layers: [...template.layers, copy] })
    setSelectedId(copy.id)
  }

  function reorder(id: string, dir: 'up' | 'down') {
    const idx = template.layers.findIndex((l) => l.id === id)
    if (idx === -1) return
    const target = dir === 'up' ? idx + 1 : idx - 1
    if (target < 0 || target >= template.layers.length) return
    const next = [...template.layers]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange({ ...template, layers: next })
  }

  function onPointerDownLayer(e: React.PointerEvent, layer: Layer) {
    e.stopPropagation()
    setSelectedId(layer.id)
    if (layer.locked) return
    dragRef.current = {
      mode: 'move',
      id: layer.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: layer.x,
      origY: layer.y,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerDownResize(e: React.PointerEvent, layer: Layer) {
    e.stopPropagation()
    dragRef.current = {
      mode: 'resize',
      id: layer.id,
      startX: e.clientX,
      startY: e.clientY,
      origW: layer.w,
      origH: layer.h,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d) return
    const dx = (e.clientX - d.startX) / scale
    const dy = (e.clientY - d.startY) / scale
    if (d.mode === 'move') {
      updateLayer(d.id, {
        x: Math.round(d.origX + dx),
        y: Math.round(d.origY + dy),
      })
    } else {
      updateLayer(d.id, {
        w: Math.max(24, Math.round(d.origW + dx)),
        h: Math.max(24, Math.round(d.origH + dy)),
      })
    }
  }

  function onPointerUp() {
    dragRef.current = null
  }

  const tools: { type: Layer['type']; icon: typeof Type; label: string }[] = [
    { type: 'text', icon: Type, label: 'Text' },
    { type: 'variable', icon: Variable, label: 'Variable' },
    { type: 'shape', icon: Square, label: 'Shape' },
    { type: 'qr', icon: QrCode, label: 'QR code' },
    { type: 'image', icon: ImageIcon, label: 'Image' },
  ]

  return (
    <div className="flex flex-1 overflow-hidden rounded-xl border border-border bg-card">
      {/* Left toolbar */}
      <div className="flex w-20 shrink-0 flex-col items-center gap-1 border-r border-border bg-muted/30 py-3">
        {tools.map((t) => (
          <button
            key={t.type}
            onClick={() => addLayer(t.type)}
            className="flex w-16 flex-col items-center gap-1 rounded-lg py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <t.icon className="h-5 w-5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative flex flex-1 items-start justify-center overflow-auto bg-[radial-gradient(circle,theme(colors.border)_1px,transparent_1px)] [background-size:18px_18px] p-6"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerDown={() => setSelectedId(null)}
      >
        <div
          style={{
            width: template.width * scale,
            height: template.height * scale,
          }}
        >
          <div
            style={{
              width: template.width,
              height: template.height,
              background: template.background,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              position: 'relative',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            }}
          >
            {template.layers.map((layer) => {
              const isSel = layer.id === selectedId
              return (
                <div
                  key={layer.id}
                  onPointerDown={(e) => onPointerDownLayer(e, layer)}
                  style={{
                    position: 'absolute',
                    left: layer.x,
                    top: layer.y,
                    width: layer.w,
                    height: layer.h,
                    transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
                    cursor: 'move',
                    outline: isSel ? '2px solid #7c3aed' : 'none',
                    outlineOffset: 2,
                  }}
                >
                  <LayerContent layer={layer} />
                  {isSel && !layer.locked && (
                    <div
                      onPointerDown={(e) => onPointerDownResize(e, layer)}
                      style={{
                        position: 'absolute',
                        right: -7,
                        bottom: -7,
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        background: '#7c3aed',
                        border: '2px solid white',
                        cursor: 'nwse-resize',
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs shadow-sm">
          <button onClick={() => setScale((s) => Math.max(0.2, s - 0.1))} className="text-muted-foreground hover:text-foreground">
            −
          </button>
          <span className="w-10 text-center tabular-nums text-foreground">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.min(1, s + 0.1))} className="text-muted-foreground hover:text-foreground">
            +
          </button>
        </div>
      </div>

      {/* Right properties panel */}
      <div className="w-72 shrink-0 overflow-y-auto border-l border-border bg-card p-4">
        {!selected ? (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Canvas</h3>
            <Field label="Background">
              <ColorInput
                value={template.background}
                onChange={(v) => onChange({ ...template, background: v })}
              />
            </Field>
            <Field label="Width">
              <Input
                type="number"
                value={template.width}
                onChange={(e) => onChange({ ...template, width: Number(e.target.value) || 600 })}
              />
            </Field>
            <Field label="Height">
              <Input
                type="number"
                value={template.height}
                onChange={(e) => onChange({ ...template, height: Number(e.target.value) || 800 })}
              />
            </Field>
            <p className="pt-2 text-xs text-muted-foreground">
              Select a layer on the canvas to edit its properties. Use the tools on the left to add
              elements. Insert variables like {'{{guest_name}}'} that get replaced per invitee.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold capitalize text-foreground">{selected.type} layer</h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => reorder(selected.id, 'up')} aria-label="Bring forward">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => reorder(selected.id, 'down')} aria-label="Send backward">
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => duplicateLayer(selected.id)} aria-label="Duplicate">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => removeLayer(selected.id)} aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {(selected.type === 'text' || selected.type === 'variable') && (
              <>
                <Field label="Text">
                  <textarea
                    className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                    value={selected.text ?? ''}
                    onChange={(e) => updateLayer(selected.id, { text: e.target.value })}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Font">
                    <select
                      className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
                      value={selected.fontFamily ?? 'sans'}
                      onChange={(e) => updateLayer(selected.id, { fontFamily: e.target.value as Layer['fontFamily'] })}
                    >
                      {FONT_FAMILIES.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Weight">
                    <select
                      className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
                      value={selected.weight ?? '400'}
                      onChange={(e) => updateLayer(selected.id, { weight: e.target.value })}
                    >
                      {WEIGHTS.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Size">
                    <Input
                      type="number"
                      value={selected.fontSize ?? 16}
                      onChange={(e) => updateLayer(selected.id, { fontSize: Number(e.target.value) || 16 })}
                    />
                  </Field>
                  <Field label="Color">
                    <ColorInput value={selected.color ?? '#000000'} onChange={(v) => updateLayer(selected.id, { color: v })} />
                  </Field>
                </div>
                <Field label="Align">
                  <div className="flex gap-1">
                    {([
                      ['left', AlignLeft],
                      ['center', AlignCenter],
                      ['right', AlignRight],
                    ] as const).map(([val, Icon]) => (
                      <button
                        key={val}
                        onClick={() => updateLayer(selected.id, { align: val })}
                        className={`flex flex-1 items-center justify-center rounded-md border py-2 ${
                          (selected.align ?? 'center') === val
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </Field>
              </>
            )}

            {selected.type === 'shape' && (
              <>
                <Field label="Shape">
                  <div className="flex gap-1">
                    {([
                      ['rect', Square],
                      ['circle', Circle],
                    ] as const).map(([val, Icon]) => (
                      <button
                        key={val}
                        onClick={() => updateLayer(selected.id, { shape: val })}
                        className={`flex flex-1 items-center justify-center rounded-md border py-2 ${
                          (selected.shape ?? 'rect') === val
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Fill">
                  <ColorInput value={selected.fill ?? '#7c3aed'} onChange={(v) => updateLayer(selected.id, { fill: v })} />
                </Field>
                <Field label="Border color">
                  <ColorInput value={selected.stroke ?? '#000000'} onChange={(v) => updateLayer(selected.id, { stroke: v })} />
                </Field>
                <Field label="Border width">
                  <Input
                    type="number"
                    value={selected.strokeWidth ?? 0}
                    onChange={(e) => updateLayer(selected.id, { strokeWidth: Number(e.target.value) || 0 })}
                  />
                </Field>
              </>
            )}

            {selected.type === 'image' && (
              <Field label="Image URL">
                <Input
                  value={selected.src ?? ''}
                  placeholder="https://..."
                  onChange={(e) => updateLayer(selected.id, { src: e.target.value })}
                />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
              <Field label="X">
                <Input type="number" value={Math.round(selected.x)} onChange={(e) => updateLayer(selected.id, { x: Number(e.target.value) || 0 })} />
              </Field>
              <Field label="Y">
                <Input type="number" value={Math.round(selected.y)} onChange={(e) => updateLayer(selected.id, { y: Number(e.target.value) || 0 })} />
              </Field>
              <Field label="W">
                <Input type="number" value={Math.round(selected.w)} onChange={(e) => updateLayer(selected.id, { w: Number(e.target.value) || 1 })} />
              </Field>
              <Field label="H">
                <Input type="number" value={Math.round(selected.h)} onChange={(e) => updateLayer(selected.id, { h: Number(e.target.value) || 1 })} />
              </Field>
              <Field label="Rotation">
                <Input type="number" value={selected.rotation} onChange={(e) => updateLayer(selected.id, { rotation: Number(e.target.value) || 0 })} />
              </Field>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LayerContent({ layer }: { layer: Layer }) {
  if (layer.type === 'text' || layer.type === 'variable') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            layer.align === 'left' ? 'flex-start' : layer.align === 'right' ? 'flex-end' : 'center',
          textAlign: layer.align ?? 'center',
          fontSize: layer.fontSize,
          fontWeight: layer.weight as React.CSSProperties['fontWeight'],
          color: layer.color,
          letterSpacing: layer.letterSpacing,
          fontFamily:
            layer.fontFamily === 'serif'
              ? 'var(--font-fraunces), Georgia, serif'
              : 'var(--font-inter), system-ui, sans-serif',
          lineHeight: 1.1,
          whiteSpace: 'pre-line',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {applyVariables(layer.text ?? '', CANVAS_VARS)}
      </div>
    )
  }
  if (layer.type === 'shape') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: layer.fill === 'transparent' ? 'transparent' : layer.fill,
          border: layer.stroke && layer.strokeWidth ? `${layer.strokeWidth}px solid ${layer.stroke}` : undefined,
          borderRadius: layer.shape === 'circle' ? '9999px' : 8,
          pointerEvents: 'none',
        }}
      />
    )
  }
  if (layer.type === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={layer.src || '/placeholder.svg?height=200&width=200'}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, pointerEvents: 'none' }}
        crossOrigin="anonymous"
      />
    )
  }
  if (layer.type === 'qr') {
    return (
      <div className="h-full w-full rounded-md bg-white p-1" style={{ pointerEvents: 'none' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/api/qr/preview" alt="QR" className="h-full w-full object-contain" crossOrigin="anonymous" />
      </div>
    )
  }
  return null
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value === 'transparent' ? '#ffffff' : value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-background"
      />
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1" />
    </div>
  )
}
