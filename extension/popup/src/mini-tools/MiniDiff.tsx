import { useState } from 'react'
import type { PrefillData } from '../../../types'

function diffLines(a: string, b: string) {
  const aLines = a.split('\n')
  const bLines = b.split('\n')
  const result: { type: 'same' | 'removed' | 'added'; text: string }[] = []
  const maxLen = Math.max(aLines.length, bLines.length)
  for (let i = 0; i < maxLen; i++) {
    const la = aLines[i]
    const lb = bLines[i]
    if (la === lb) {
      result.push({ type: 'same', text: la ?? '' })
    } else {
      if (la !== undefined) result.push({ type: 'removed', text: la })
      if (lb !== undefined) result.push({ type: 'added', text: lb })
    }
  }
  return result
}

const LINE_COLORS = {
  same:    { bg: 'transparent', color: 'var(--text-primary)', prefix: '  ' },
  removed: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', prefix: '- ' },
  added:   { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e', prefix: '+ ' },
}

export function MiniDiff({ prefillData }: { prefillData?: PrefillData }) {
  const [left, setLeft] = useState(prefillData?.text ?? '')
  const [right, setRight] = useState('')

  const diff = left || right ? diffLines(left, right) : []
  const changes = diff.filter(d => d.type !== 'same').length

  return (
    <div className="mini-tool">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div>
          <p className="mini-label">Text A</p>
          <textarea className="mini-textarea" rows={4} value={left}
            onChange={e => setLeft(e.target.value)} placeholder="Original text…" />
        </div>
        <div>
          <p className="mini-label">Text B</p>
          <textarea className="mini-textarea" rows={4} value={right}
            onChange={e => setRight(e.target.value)} placeholder="Modified text…" />
        </div>
      </div>

      {diff.length > 0 && (
        <div>
          <p className="mini-label">{changes} change{changes !== 1 ? 's' : ''}</p>
          <div style={{ fontFamily: 'monospace', fontSize: 11, border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', overflow: 'auto', maxHeight: 140 }}>
            {diff.map((line, i) => {
              const style = LINE_COLORS[line.type]
              return (
                <div key={i} style={{ padding: '1px 8px', background: style.bg, color: style.color,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {style.prefix}{line.text || ' '}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
