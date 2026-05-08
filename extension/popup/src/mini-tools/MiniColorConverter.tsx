import React, { useState } from 'react'
import type { PrefillData } from '../../../types'

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}
function toHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('')
}

export function MiniColorConverter({ prefillData }: { prefillData?: PrefillData }) {
  const initial = prefillData?.text ?? '#6366f1'
  const [hex, setHex] = useState(initial.startsWith('#') ? initial : '#' + initial)
  const [copied, setCopied] = useState<string | null>(null)

  const rgb = hexToRgb(hex)
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(null), 1500)
  }

  const formats = rgb && hsl ? [
    { key: 'hex', label: 'HEX', value: hex.toUpperCase() },
    { key: 'rgb', label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { key: 'hsl', label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    { key: 'css', label: 'CSS var', value: `color: ${hex.toUpperCase()};` },
  ] : []

  return (
    <div className="mini-tool">
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input type="color" value={hex} onChange={e => setHex(e.target.value)}
          style={{ width: 48, height: 48, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none', padding: 2 }} />
        <input className="mini-input" value={hex} onChange={e => setHex(e.target.value)}
          placeholder="#6366f1" style={{ fontFamily: 'monospace', flex: 1 }} />
      </div>

      {formats.map(({ key, label, value }) => (
        <div key={key}>
          <p className="mini-label">{label}</p>
          <div className="copy-row">
            <div className="mini-output" style={{ fontFamily: 'monospace' }}>{value}</div>
            <button className={`btn btn-sm ${copied === key ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => copy(value, key)}>
              {copied === key ? '✓' : 'Copy'}
            </button>
          </div>
        </div>
      ))}

      {rgb && (
        <div style={{ height: 32, borderRadius: 8, background: hex, border: '1px solid var(--border)' }} />
      )}
    </div>
  )
}
