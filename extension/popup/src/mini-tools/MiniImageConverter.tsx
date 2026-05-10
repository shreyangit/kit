// MiniImageConverter — Canvas API, inline format conversion
import React, { useState, useRef } from 'react'
import type { PrefillData } from '../../../../types'
interface Props { prefillData?: PrefillData }

export function MiniImageConverter({ prefillData }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<{ url: string; size: number; format: string } | null>(null)
  const [origName, setOrigName] = useState('image')
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/webp')
  const [quality, setQuality] = useState(90)
  const inputRef = useRef<HTMLInputElement>(null)

  function convert(file: File, fmt: string, q: number) {
    setOrigName(file.name.replace(/\.[^.]+$/, ''))
    const url = URL.createObjectURL(file)
    setPreview(url)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width; canvas.height = img.height
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        if (!blob) return
        setResult({ url: URL.createObjectURL(blob), size: blob.size, format: fmt.split('/')[1] })
      }, fmt, fmt === 'image/png' ? undefined : q / 100)
    }
    img.src = url
  }

  function handleFile(file: File) { convert(file, format, quality) }
  const fmt = (n: number) => n < 1024 * 1024 ? `${(n/1024).toFixed(0)} KB` : `${(n/1024/1024).toFixed(1)} MB`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {!preview ? (
        <div onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleFile(f) }}
          onDragOver={e => e.preventDefault()} onClick={() => inputRef.current?.click()}
          style={{ border: '1.5px dashed var(--border)', borderRadius: 8, padding: '24px 12px', textAlign: 'center', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
          Drop image or click to browse
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: 100, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--border)' }} />
          <div style={{ display: 'flex', gap: 4 }}>
            {(['image/png','image/jpeg','image/webp'] as const).map(f => (
              <button key={f} onClick={() => { setFormat(f); if (preview) { const img = document.querySelector('img') as HTMLImageElement; /* handled by inputRef re-run */ } }}
                style={{ flex: 1, padding: '4px 0', fontSize: 10, borderRadius: 4, border: '1px solid var(--border)', background: format === f ? 'var(--accent)' : 'transparent', color: format === f ? 'var(--accent-fg)' : 'var(--text-secondary)', cursor: 'pointer' }}>
                {f.split('/')[1].toUpperCase()}
              </button>
            ))}
          </div>
          {format !== 'image/png' && (
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Quality: {quality}%</label>
              <input type="range" min={10} max={100} value={quality} style={{ width: '100%', accentColor: 'var(--accent)' }} onChange={e => setQuality(+e.target.value)} />
            </div>
          )}
          {result && (
            <>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center' }}>
                Output: <strong style={{ color: 'var(--text-primary)' }}>{fmt(result.size)}</strong>
              </div>
              <a href={result.url} download={`${origName}.${result.format}`}
                style={{ padding: '7px 0', borderRadius: 6, background: 'var(--accent)', color: 'var(--accent-fg)', fontSize: 11, fontWeight: 600, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                Download {result.format.toUpperCase()}
              </a>
            </>
          )}
          <button onClick={() => { setPreview(null); setResult(null) }}
            style={{ padding: '5px', border: '1px solid var(--border)', borderRadius: 5, background: 'transparent', color: 'var(--text-secondary)', fontSize: 10, cursor: 'pointer' }}>
            New image
          </button>
        </div>
      )}
    </div>
  )
}
