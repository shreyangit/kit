import React, { useState } from 'react'
import type { PrefillData } from '../../../types'

type Base = 2 | 8 | 10 | 16

function convert(value: string, from: Base): Record<Base, string> {
  try {
    const decimal = parseInt(value.trim(), from)
    if (isNaN(decimal)) return { 2: '', 8: '', 10: '', 16: '' }
    return {
      2:  decimal.toString(2),
      8:  decimal.toString(8),
      10: decimal.toString(10),
      16: decimal.toString(16).toUpperCase(),
    }
  } catch {
    return { 2: '', 8: '', 10: '', 16: '' }
  }
}

export function MiniNumberBase({ prefillData }: { prefillData?: PrefillData }) {
  const [input, setInput] = useState(prefillData?.text?.trim() ?? '255')
  const [fromBase, setFromBase] = useState<Base>(10)
  const [copied, setCopied] = useState<string | null>(null)

  const results = convert(input, fromBase)

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(null), 1500)
  }

  const bases: { base: Base; label: string; prefix: string }[] = [
    { base: 2,  label: 'Binary (2)',    prefix: '0b' },
    { base: 8,  label: 'Octal (8)',     prefix: '0o' },
    { base: 10, label: 'Decimal (10)',  prefix: '' },
    { base: 16, label: 'Hex (16)',      prefix: '0x' },
  ]

  return (
    <div className="mini-tool">
      <div>
        <p className="mini-label">Input base</p>
        <div className="checkbox-row" style={{ gap: 4 }}>
          {bases.map(({ base, label }) => (
            <button key={base} className={`btn btn-sm ${fromBase === base ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFromBase(base)}>{label}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="mini-label">Value</p>
        <input className="mini-input" value={input} onChange={e => setInput(e.target.value)}
          style={{ fontFamily: 'monospace' }} placeholder="Enter number…" />
      </div>

      {bases.map(({ base, label, prefix }) => results[base] && (
        <div key={base}>
          <p className="mini-label">{label}</p>
          <div className="copy-row">
            <div className="mini-output" style={{ fontFamily: 'monospace' }}>
              {prefix}{results[base]}
            </div>
            <button className={`btn btn-sm ${copied === String(base) ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => copy(prefix + results[base], String(base))}>
              {copied === String(base) ? '✓' : 'Copy'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
