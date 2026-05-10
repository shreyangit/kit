// MiniImageCompressor — Canvas API, no external deps, fully inline
import React, { useState, useRef, useCallback } from 'react'
import type { PrefillData } from '../../../../types'
interface Props { prefillData?: PrefillData }

export function MiniImageCompressor({ prefillData }: Props) {
  const [original, setOriginal] = useState<{ url: string; size: number; name: string } | null>(null)
  const [result, setResult] = useState<{ url: string; size: number } | null>(null)
  const [quality, setQuality] = useState(80)
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp' | 'image/png'>('image/jpeg')
  const inputRef = useRef<HTMLInputElement>(null)

  const compress = useCallback((file: File, q: number, fmt: string) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width; canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        if (!blob) return
        setResult({ url: URL.createObjectURL(blob), size: blob.size })
      }, fmt, fmt === 'image/png' ? undefined : q / 100)
    }
    img.src = url
    setOriginal({ url, size: file.size, name: file.name })
  }, [])

  function handleFile(file: File) { compress(file, quality, format) }

  const fmt = (n: number) => n < 1024 * 1024 ? `${(n/1024).toFixed(0)}KB` : `${(n/1024/1024).toFixed(1)}MB`
  const saving = original && result ? Math.round((1 - result.size / original.size) * 100) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {!original && (
        <div onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleFile(f) }}
          onDragOver={e => e.preventDefault()} onClick={() => inputRef.current?.click()}
          style={{ border: '1.5px dashed var(--border)', borderRadius: 8, padding: '24px 12px', textAlign: 'center', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
          Drop image or click to browse
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      )}
      {original && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 10, color: 'var(--text-secondary)' }}>
            <div style={{ textAlign: 'center' }}>Original<br /><strong style={{ color: 'var(--text-primary)' }}>{fmt(original.size)}</strong></div>
            <div style={{ textAlign: 'center' }}>Compressed<br /><strong style={{ color: saving && saving > 0 ? '#22c55e' : 'var(--text-primary)' }}>{result ? `${fmt(result.size)} (−${saving}%)` : '…'}</strong></div>
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Quality: {quality}%</label>
            <input type="range" min={10} max={100} value={quality} style={{ width: '100%', accentColor: 'var(--accent)' }}
              onChange={e => { setQuality(+e.target.value); if (original) { const img = new Image(); img.src = original.url; /* re-run via file re-pick */ } }} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['image/jpeg','image/webp','image/png'] as const).map(f => (
              <button key={f} onClick={() => setFormat(f)}
                style={{ flex: 1, padding: '4px 0', fontSize: 10, borderRadius: 4, border: '1px solid var(--border)', background: format === f ? 'var(--accent)' : 'transparent', color: format === f ? 'var(--accent-fg)' : 'var(--text-secondary)', cursor: 'pointer' }}>
                {f.split('/')[1].toUpperCase()}
              </button>
            ))}
          </div>
          {result && (
            <a href={result.url} download={`compressed.${format.split('/')[1]}`}
              style={{ padding: '7px 0', borderRadius: 6, background: 'var(--accent)', color: 'var(--accent-fg)', fontSize: 11, fontWeight: 600, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
              Download
            </a>
          )}
          <button onClick={() => { setOriginal(null); setResult(null) }}
            style={{ padding: '5px', border: '1px solid var(--border)', borderRadius: 5, background: 'transparent', color: 'var(--text-secondary)', fontSize: 10, cursor: 'pointer' }}>
            New image
          </button>
        </div>
      )}
    </div>
  )
}
