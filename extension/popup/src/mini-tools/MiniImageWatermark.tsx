// MiniImageWatermark — Canvas API watermark tool, fully inline
import React, { useState, useRef, useCallback } from 'react'
import type { PrefillData } from '../../../types'

interface Props { prefillData?: PrefillData }

export function MiniImageWatermark({ prefillData }: Props) {
  const [imgSrc, setImgSrc] = useState<string | null>(prefillData?.imageUrl ?? null)
  const [watermarkText, setWatermarkText] = useState('© kit')
  const [position, setPosition] = useState<'br' | 'bl' | 'tr' | 'tl' | 'center'>('br')
  const [opacity, setOpacity] = useState(70)
  const [fontSize, setFontSize] = useState(32)
  const [color, setColor] = useState('#ffffff')
  const [result, setResult] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadFile = useCallback((f: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      setImgSrc(e.target?.result as string)
      setResult(null)
    }
    reader.readAsDataURL(f)
  }, [])

  const apply = useCallback(async () => {
    if (!imgSrc) return
    setProcessing(true)
    try {
      const img = new Image()
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = imgSrc })
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      ctx.globalAlpha = opacity / 100
      ctx.fillStyle = color
      ctx.font = `bold ${fontSize}px system-ui, sans-serif`
      ctx.textBaseline = 'middle'
      const pad = 24
      const tw = ctx.measureText(watermarkText).width
      const th = fontSize
      const positions = {
        br: [canvas.width - tw - pad, canvas.height - th - pad],
        bl: [pad, canvas.height - th - pad],
        tr: [canvas.width - tw - pad, pad + th],
        tl: [pad, pad + th],
        center: [(canvas.width - tw) / 2, canvas.height / 2],
      }
      const [x, y] = positions[position]
      // shadow for readability
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 4
      ctx.fillText(watermarkText, x, y)
      setResult(canvas.toDataURL('image/png'))
    } finally { setProcessing(false) }
  }, [imgSrc, watermarkText, position, opacity, fontSize, color])

  const download = useCallback(() => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = 'watermarked.png'
    a.click()
  }, [result])

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
          <img src={imgSrc} alt="source" style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '6px', border: '1px solid var(--border)' }} />
          <button onClick={() => { setImgSrc(null); setResult(null) }}
            style={{ position: 'absolute', top: 4, right: 4, background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '11px', color: 'var(--foreground)' }}>
            ×
          </button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Watermark text</label>
        <input
          value={watermarkText}
          onChange={e => setWatermarkText(e.target.value)}
          placeholder="© Your Name"
          style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 8px', fontSize: '13px', background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Position</label>
          <select
            value={position}
            onChange={e => setPosition(e.target.value as typeof position)}
            style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', background: 'var(--background)', color: 'var(--foreground)' }}
          >
            <option value="br">Bottom right</option>
            <option value="bl">Bottom left</option>
            <option value="tr">Top right</option>
            <option value="tl">Top left</option>
            <option value="center">Center</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Color</label>
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            style={{ width: '100%', height: '30px', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px', cursor: 'pointer', background: 'transparent' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
          Opacity — {opacity}%
        </label>
        <input type="range" min={10} max={100} value={opacity} onChange={e => setOpacity(+e.target.value)}
          style={{ accentColor: 'var(--primary)', width: '100%' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
          Font size — {fontSize}px
        </label>
        <input type="range" min={12} max={120} step={2} value={fontSize} onChange={e => setFontSize(+e.target.value)}
          style={{ accentColor: 'var(--primary)', width: '100%' }} />
      </div>

      <button
        disabled={!imgSrc || processing}
        onClick={apply}
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', fontWeight: 600, cursor: imgSrc ? 'pointer' : 'not-allowed', opacity: (!imgSrc || processing) ? .5 : 1 }}
      >
        {processing ? 'Applying…' : 'Apply Watermark'}
      </button>

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <img src={result} alt="watermarked" style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '6px', border: '1px solid var(--border)' }} />
          <button
            onClick={download}
            style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            Download PNG
          </button>
        </div>
      )}
    </div>
  )
}
