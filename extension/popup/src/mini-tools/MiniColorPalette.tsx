// MiniColorPalette — median-cut colour extraction from image, fully inline
import React, { useState, useRef, useCallback } from 'react'
import type { PrefillData } from '../../../types'

interface Props { prefillData?: PrefillData }

function medianCut(data: Uint8ClampedArray, maxColors: number): string[] {
  // Build array of [r,g,b] samples (skip transparent pixels)
  const pixels: [number, number, number][] = []
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    pixels.push([data[i], data[i + 1], data[i + 2]])
  }
  if (!pixels.length) return []

  function splitBucket(bucket: [number, number, number][]): [[number, number, number][], [number, number, number][]] {
    let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0
    for (const [r, g, b] of bucket) {
      rMin = Math.min(rMin, r); rMax = Math.max(rMax, r)
      gMin = Math.min(gMin, g); gMax = Math.max(gMax, g)
      bMin = Math.min(bMin, b); bMax = Math.max(bMax, b)
    }
    const rRange = rMax - rMin, gRange = gMax - gMin, bRange = bMax - bMin
    const ch = rRange >= gRange && rRange >= bRange ? 0 : gRange >= bRange ? 1 : 2
    bucket.sort((a, b) => a[ch] - b[ch])
    const mid = Math.floor(bucket.length / 2)
    return [bucket.slice(0, mid), bucket.slice(mid)]
  }

  function avgColor(bucket: [number, number, number][]): string {
    const r = Math.round(bucket.reduce((s, c) => s + c[0], 0) / bucket.length)
    const g = Math.round(bucket.reduce((s, c) => s + c[1], 0) / bucket.length)
    const b = Math.round(bucket.reduce((s, c) => s + c[2], 0) / bucket.length)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  let buckets = [pixels]
  while (buckets.length < maxColors) {
    const largest = buckets.reduce((a, b) => a.length > b.length ? a : b)
    if (largest.length <= 1) break
    buckets = buckets.filter(b => b !== largest)
    const [a, b] = splitBucket(largest)
    if (a.length) buckets.push(a)
    if (b.length) buckets.push(b)
  }

  return buckets.filter(b => b.length > 0).map(avgColor)
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${r}, ${g}, ${b})`
}

export function MiniColorPalette({ prefillData }: Props) {
  const [imgSrc, setImgSrc] = useState<string | null>(prefillData?.imageUrl ?? null)
  const [colors, setColors] = useState<string[]>([])
  const [count, setCount] = useState(8)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [processing, setProcessing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadFile = useCallback((f: File) => {
    const reader = new FileReader()
    reader.onload = e => { setImgSrc(e.target?.result as string); setColors([]) }
    reader.readAsDataURL(f)
  }, [])

  const extract = useCallback(async () => {
    if (!imgSrc) return
    setProcessing(true)
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = imgSrc })
      const canvas = document.createElement('canvas')
      // Sample at reduced size for speed
      const scale = Math.min(1, 200 / Math.max(img.naturalWidth, img.naturalHeight))
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      const palette = medianCut(data, count)
      setColors(palette)
    } finally { setProcessing(false) }
  }, [imgSrc, count])

  const copy = useCallback(async (hex: string, idx: number) => {
    await navigator.clipboard.writeText(hex)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }, [])

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {!imgSrc ? (
        <button
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadFile(f) }}
          style={{ border: '1.5px dashed var(--border)', borderRadius: '8px', padding: '32px 16px', textAlign: 'center', cursor: 'pointer', background: 'transparent', color: 'var(--muted-foreground)', fontSize: '13px' }}
        >
          Drop image or click to select
        </button>
      ) : (
        <div style={{ position: 'relative' }}>
          <img src={imgSrc} alt="source" style={{ width: '100%', maxHeight: '140px', objectFit: 'contain', borderRadius: '6px', border: '1px solid var(--border)' }} />
          <button onClick={() => { setImgSrc(null); setColors([]) }}
            style={{ position: 'absolute', top: 4, right: 4, background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '11px', color: 'var(--foreground)' }}>
            ×
          </button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '11px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
          Colours — {count}
        </label>
        <input type="range" min={4} max={16} value={count} onChange={e => setCount(+e.target.value)}
          style={{ flex: 1, accentColor: 'var(--primary)' }} />
      </div>

      <button
        disabled={!imgSrc || processing}
        onClick={extract}
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', fontWeight: 600, cursor: imgSrc ? 'pointer' : 'not-allowed', opacity: (!imgSrc || processing) ? .5 : 1 }}
      >
        {processing ? 'Extracting…' : 'Extract Palette'}
      </button>

      {colors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Swatches strip */}
          <div style={{ display: 'flex', height: '28px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            {colors.map((c, i) => (
              <div key={i} style={{ flex: 1, background: c }} />
            ))}
          </div>
          {/* Colour list */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            {colors.map((hex, i) => (
              <button
                key={i}
                onClick={() => copy(hex, i)}
                title={`Copy ${hex}`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--background)', cursor: 'pointer', transition: 'background .1s' }}
              >
                <span style={{ width: '16px', height: '16px', borderRadius: '3px', background: hex, border: '1px solid var(--border)', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--foreground)', flex: 1, textAlign: 'left' }}>{hex}</span>
                <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>{copiedIdx === i ? '✓' : 'copy'}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
