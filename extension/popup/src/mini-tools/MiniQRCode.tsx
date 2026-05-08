import React, { useState, useEffect, useRef } from 'react'
import type { PrefillData } from '../../../types'

export function MiniQRCode({ prefillData }: { prefillData?: PrefillData }) {
  const [input, setInput] = useState(prefillData?.url ?? prefillData?.text ?? '')
  const [size, setSize] = useState(180)
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!input.trim()) return
    setError('')
    import('qrcode').then(QRCode => {
      QRCode.toCanvas(canvasRef.current!, input, {
        width: size,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      }).catch(err => setError(err.message))
    })
  }, [input, size])

  function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'qr-code.png'
    a.click()
  }

  return (
    <div className="mini-tool">
      <div>
        <p className="mini-label">URL or text</p>
        <input className="mini-input" value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="https://example.com" />
      </div>

      <div>
        <div className="control-row">
          <p className="mini-label">Size: {size}px</p>
        </div>
        <input type="range" className="mini-slider" min={100} max={300} step={20} value={size}
          onChange={e => setSize(+e.target.value)} />
      </div>

      {error && <div className="mini-output error">{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <canvas ref={canvasRef} style={{ borderRadius: 8, display: input ? 'block' : 'none' }} />
        {input && (
          <button className="btn btn-secondary" onClick={download}>⬇ Download PNG</button>
        )}
      </div>
    </div>
  )
}
