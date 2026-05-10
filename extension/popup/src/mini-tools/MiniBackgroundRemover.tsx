// MiniBackgroundRemover.tsx
// Runs @imgly/background-removal entirely in-browser via WASM.
// Works offline after first load. No data leaves the browser.
import React, { useState, useCallback, useRef } from 'react'
import type { PrefillData } from '../../../../types'

interface Props { prefillData?: PrefillData }

type Status = 'idle' | 'loading-model' | 'processing' | 'done' | 'error'

export function MiniBackgroundRemover({ prefillData }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    setStatus('loading-model')
    setProgress(0)
    setError(null)
    setResultUrl(null)
    setPreview(URL.createObjectURL(file))

    try {
      // Dynamic import — only loads when tool is used
      const { removeBackground } = await import('@imgly/background-removal')

      setStatus('processing')

      const blob = await removeBackground(file, {
        progress: (_key: string, current: number, total: number) => {
          setProgress(total > 0 ? Math.round((current / total) * 100) : 0)
        },
        // Use public model path cached by browser
        publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/',
      })

      const url = URL.createObjectURL(blob)
      setResultUrl(url)
      setStatus('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Processing failed')
      setStatus('error')
    }
  }, [])

  // Auto-process if prefillData has an image URL from context menu
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
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    if (preview) URL.revokeObjectURL(preview)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Drop zone */}
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
          <div style={{ fontSize: 10, opacity: 0.6 }}>PNG, JPG, WebP — all processing happens in your browser</div>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      )}

      {/* Loading / processing */}
      {(status === 'loading-model' || status === 'processing') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {preview && (
            <img src={preview} alt="Original" style={{ width: '100%', borderRadius: 6, maxHeight: 120, objectFit: 'contain', border: '1px solid var(--border)' }} />
          )}
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {status === 'loading-model' ? 'Loading AI model (first use only)…' : `Removing background… ${progress}%`}
          </div>
          <div style={{ background: 'var(--border)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
            <div style={{ background: 'var(--accent)', width: `${status === 'loading-model' ? 15 : progress}%`, height: '100%', transition: 'width 0.3s', borderRadius: 4 }} />
          </div>
        </div>
      )}

      {/* Result */}
      {status === 'done' && resultUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {preview && <img src={preview} alt="Before" style={{ width: '100%', borderRadius: 6, maxHeight: 100, objectFit: 'contain', border: '1px solid var(--border)' }} />}
            <div style={{ background: 'repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0/16px 16px', borderRadius: 6, overflow: 'hidden', maxHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          <button onClick={reset} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
