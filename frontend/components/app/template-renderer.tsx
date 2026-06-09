'use client'

import * as React from 'react'
import type { Layer, Template } from '@/lib/types'

export type VariableMap = Record<string, string>

export function applyVariables(text: string, vars: VariableMap): string {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) =>
    vars[key] !== undefined ? vars[key] : `{{${key}}}`,
  )
}

function LayerView({ layer, vars }: { layer: Layer; vars: VariableMap }) {
  const base: React.CSSProperties = {
    position: 'absolute',
    left: layer.x,
    top: layer.y,
    width: layer.w,
    height: layer.h,
    transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
  }

  if (layer.type === 'text' || layer.type === 'variable') {
    return (
      <div
        style={{
          ...base,
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            layer.align === 'left'
              ? 'flex-start'
              : layer.align === 'right'
                ? 'flex-end'
                : 'center',
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
        }}
      >
        {applyVariables(layer.text ?? '', vars)}
      </div>
    )
  }

  if (layer.type === 'shape') {
    return (
      <div
        style={{
          ...base,
          backgroundColor: layer.fill === 'transparent' ? 'transparent' : layer.fill,
          border: layer.stroke
            ? `${layer.strokeWidth ?? 1}px solid ${layer.stroke}`
            : undefined,
          borderRadius: layer.shape === 'circle' ? '9999px' : 8,
        }}
      />
    )
  }

  if (layer.type === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={layer.src || '/placeholder.svg?height=200&width=200&query=invitation%20photo'}
        alt=""
        style={{ ...base, objectFit: 'cover', borderRadius: 8 }}
        crossOrigin="anonymous"
      />
    )
  }

  if (layer.type === 'qr') {
    const token = vars['qr_token'] || 'preview'
    return (
      <div style={{ ...base }} className="overflow-hidden rounded-md bg-white p-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/qr/${token}`}
          alt="Invitation QR code"
          className="h-full w-full object-contain"
          crossOrigin="anonymous"
        />
      </div>
    )
  }

  return null
}

export function TemplateRenderer({
  template,
  vars = {},
  className,
}: {
  template: Pick<Template, 'width' | 'height' | 'background' | 'layers'>
  vars?: VariableMap
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: template.width,
        height: template.height,
        background: template.background,
        overflow: 'hidden',
      }}
    >
      {template.layers.map((l) => (
        <LayerView key={l.id} layer={l} vars={vars} />
      ))}
    </div>
  )
}

/** Scaled thumbnail/preview wrapper that keeps the design's aspect ratio. */
export function TemplatePreview({
  template,
  vars,
  maxWidth = 280,
  className,
}: {
  template: Pick<Template, 'width' | 'height' | 'background' | 'layers'>
  vars?: VariableMap
  maxWidth?: number
  className?: string
}) {
  const scale = maxWidth / template.width
  return (
    <div
      className={className}
      style={{
        width: maxWidth,
        height: template.height * scale,
        position: 'relative',
      }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <TemplateRenderer template={template} vars={vars} />
      </div>
    </div>
  )
}
