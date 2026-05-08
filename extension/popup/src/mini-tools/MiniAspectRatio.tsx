import { useState } from 'react'
import type { PrefillData } from '../../../types'

const PRESETS = [
  { label: '16:9', w: 16, h: 9 },
  { label: '4:3',  w: 4,  h: 3 },
  { label: '1:1',  w: 1,  h: 1 },
  { label: '21:9', w: 21, h: 9 },
  { label: '9:16', w: 9,  h: 16 },
]

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b) }

export function MiniAspectRatio({ prefillData: _ }: { prefillData?: PrefillData }) {
  const [width, setWidth] = useState(1920)
  const [height, setHeight] = useState(1080)
  const [lockRatio, setLockRatio] = useState('')
  const [copied, setCopied] = useState(false)

  const g = gcd(Math.abs(width), Math.abs(height))
  const rw = width / g
  const rh = height / g
  const ratio = `${rw}:${rh}`
  const decimal = (width / height).toFixed(4)

  function applyPreset(w: number, h: number) {
    setWidth(w * 100)
    setHeight(h * 100)
    setLockRatio(`${w}:${h}`)
  }

  function handleWidthChange(val: number) {
    setWidth(val)
    if (lockRatio) {
      const [rw, rh] = lockRatio.split(':').map(Number)
      setHeight(Math.round(val * rh / rw))
    }
  }

  function handleHeightChange(val: number) {
    setHeight(val)
    if (lockRatio) {
      const [rw, rh] = lockRatio.split(':').map(Number)
      setWidth(Math.round(val * rw / rh))
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(ratio)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mini-tool">
      <div className="checkbox-row" style={{ gap: 4 }}>
        {PRESETS.map(p => (
          <button key={p.label} className={`btn btn-sm ${lockRatio === `${p.w}:${p.h}` ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => applyPreset(p.w, p.h)}>{p.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ flex: 1 }}>
          <p className="mini-label">Width (px)</p>
          <input className="mini-input" type="number" value={width} min={1}
            onChange={e => handleWidthChange(+e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <p className="mini-label">Height (px)</p>
          <input className="mini-input" type="number" value={height} min={1}
            onChange={e => handleHeightChange(+e.target.value)} />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{ratio}</div>
          <div className="stat-label">Ratio</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{decimal}</div>
          <div className="stat-label">Decimal</div>
        </div>
      </div>

      <button className={`btn btn-full ${copied ? 'btn-success' : 'btn-secondary'}`} onClick={copy}>
        {copied ? '✓ Copied' : `Copy ratio (${ratio})`}
      </button>
    </div>
  )
}
