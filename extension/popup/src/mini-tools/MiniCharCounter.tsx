import { useState } from 'react'
import type { PrefillData } from '../../../types'

const LIMITS = [
  { name: 'Twitter/X', max: 280, color: '#1DA1F2' },
  { name: 'LinkedIn',  max: 3000, color: '#0077B5' },
  { name: 'Instagram', max: 2200, color: '#E1306C' },
  { name: 'SMS',       max: 160, color: '#22c55e' },
]

export function MiniCharCounter({ prefillData }: { prefillData?: PrefillData }) {
  const [input, setInput] = useState(prefillData?.text ?? '')

  const chars = input.length
  const words = input.trim() ? input.trim().split(/\s+/).length : 0
  const lines = input.split('\n').length

  return (
    <div className="mini-tool">
      <div>
        <p className="mini-label">Text</p>
        <textarea className="mini-textarea" rows={4} value={input}
          onChange={e => setInput(e.target.value)} placeholder="Type or paste text…" />
      </div>

      <div className="stats-grid">
        {[['Chars', chars], ['Words', words], ['Lines', lines]].map(([label, val]) => (
          <div key={label as string} className="stat-card">
            <div className="stat-value">{val}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {LIMITS.map(({ name, max, color }) => {
        const pct = Math.min(100, (chars / max) * 100)
        const over = chars > max
        return (
          <div key={name}>
            <div className="control-row" style={{ marginBottom: 3 }}>
              <p className="mini-label" style={{ color }}>{name}</p>
              <span style={{ fontSize: 11, color: over ? 'var(--error)' : 'var(--text-secondary)' }}>
                {chars}/{max} {over ? `(+${chars - max})` : ''}
              </span>
            </div>
            <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: over ? 'var(--error)' : color,
                borderRadius: 2, transition: 'width 150ms' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
