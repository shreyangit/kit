// MiniBackgroundRemover.tsx
// Runs @imgly/background-removal entirely in-browser via WASM, or uses the API mode.
import React, { useState, useCallback, useRef } from 'react'
import type { PrefillData } from '../../../types'

interface Props { prefillData?: PrefillData }

type Status = 'idle' | 'loading-model' | 'processing' | 'done' | 'error'
type Mode = 'browser' | 'api'

const BG_API_URL = "https://shreyangit-kit-bg-api.hf.space/remove-bg";

export function MiniBackgroundRemover({ prefillData }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('browser')
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    setStatus('loading-model')
    setProgress(0)
    setError(null)
    setResultUrl(null)
    setPreview(URL.createObjectURL(file))
    setProgressText('Initializing...')

    try {
      if (mode === 'api') {
        setStatus('processing')
        setProgressText('Uploading to API...')
        setProgress(20)
        
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch(BG_API_URL, { method: 'POST', body: formData })
        if (!res.ok) throw new Error(await res.text())
        
        setProgress(90)
        setProgressText('Receiving result...')
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setResultUrl(url)
        setStatus('done')
      } else {
        const { removeBackground } = await import('@imgly/background-removal')
        setStatus('processing')
        const blob = await removeBackground(file, {
          progress: (key: string, current: number, total: number) => {
            if (total > 0) {
              const pct = Math.round((current / total) * 100)
              setProgress(pct)
              if (key.includes("fetch")) setProgressText(`Downloading AI model… ${pct}%`)
              else if (key.includes("infer")) setProgressText(`Processing… ${pct}%`)
              else setProgressText(`${key} ${pct}%`)
            }
          },
          publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/',
        })

        const url = URL.createObjectURL(blob)
        setResultUrl(url)
        setStatus('done')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Processing failed'
      setError(msg.includes('fetch') ? 'Network error. Try again.' : msg)
      setStatus('error')
    }
  }, [mode])

  React.useEffect(() => {
    if (prefillData?.imageUrl && status === 'idle') {
      fetch(prefillData.imageUrl)
        .then(r => r.blob())
        .then(blob => {
          const ext = prefillData.imageUrl!.split('.').pop()?.split('?')[0] ?? 'png'
          processFile(new File([blob], `image.${ext}`, { type: blob.type || 'image/png' }))
        })
        .catch(() => setError('Could not load image. Try dragging it onto the tool.'))
    }
  }, [prefillData, processFile, status])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) processFile(file)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function reset() {
    setStatus('idle')
    setResultUrl(null)
    setPreview(null)
    setError(null)
    setProgress(0)
    setProgressText('')
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    if (preview) URL.revokeObjectURL(preview)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {status === 'idle' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: 6, fontSize: 11 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Processing Mode</span>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-tertiary)', padding: 2, borderRadius: 4 }}>
            <button 
              onClick={() => setMode('browser')}
              style={{ padding: '4px 8px', borderRadius: 4, border: 'none', background: mode === 'browser' ? 'var(--border)' : 'transparent', color: mode === 'browser' ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: 10, cursor: 'pointer' }}>
              Private
            </button>
            <button 
              onClick={() => setMode('api')}
              style={{ padding: '4px 8px', borderRadius: 4, border: 'none', background: mode === 'api' ? 'var(--border)' : 'transparent', color: mode === 'api' ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: 10, cursor: 'pointer' }}>
              High Quality
            </button>
          </div>
        </div>
      )}

      {status === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{
            border: '1.5px dashed var(--border)',
            borderRadius: 8,
            padding: '24px 12px',
            textAlign: 'center',
            cursor: 'pointer',
            fontSize: 12,
            color: 'var(--text-secondary)',
            transition: 'border-color 0.15s',
          }}
        >
          <div style={{ marginBottom: 6, fontSize: 11 }}>Drop an image here or click to browse</div>
          <div style={{ fontSize: 10, opacity: 0.6 }}>PNG, JPG, WebP</div>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      )}

      {(status === 'loading-model' || status === 'processing') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {preview && (
            <img src={preview} alt="Original" style={{ width: '100%', borderRadius: 6, maxHeight: 120, objectFit: 'contain', border: '1px solid var(--border)', opacity: 0.5 }} />
          )}
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{progressText}</span>
            <span>{progress}%</span>
          </div>
          <div style={{ background: 'var(--border)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
            <div style={{ background: 'var(--accent)', width: `${progress}%`, height: '100%', transition: 'width 0.3s', borderRadius: 4 }} />
          </div>
        </div>
      )}

      {status === 'done' && resultUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {preview && <img src={preview} alt="Before" style={{ width: '100%', borderRadius: 6, maxHeight: 100, objectFit: 'contain', border: '1px solid var(--border)' }} />}
            <div style={{ background: 'var(--border) repeating-conic-gradient(#555 0% 25%, #333 0% 25% 50%) 0 0/16px 16px', borderRadius: 6, overflow: 'hidden', maxHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={resultUrl} alt="After" style={{ maxWidth: '100%', maxHeight: 100, objectFit: 'contain' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <a href={resultUrl} download="background-removed.png"
              style={{ flex: 1, padding: '6px 0', borderRadius: 6, background: 'var(--accent)', color: 'var(--accent-fg)', fontSize: 11, fontWeight: 600, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
              Download PNG
            </a>
            <button onClick={reset} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer' }}>
              New Image
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, color: '#ef4444', padding: '8px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
          <button onClick={() => { setStatus('idle'); setError(null); }} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
