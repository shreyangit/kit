import React, { useState } from 'react'
import type { PrefillData } from '../../../types'

const ENTITIES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  '©': '&copy;', '®': '&reg;', '™': '&trade;', '€': '&euro;',
  '£': '&pound;', '¥': '&yen;', '°': '&deg;', '×': '&times;', '÷': '&divide;',
}
const REVERSE = Object.fromEntries(Object.entries(ENTITIES).map(([k, v]) => [v, k]))

function encodeEntities(text: string): string {
  return text.replace(/[&<>"'©®™€£¥°×÷]/g, c => ENTITIES[c] ?? c)
}

function decodeEntities(text: string): string {
  return text
    .replace(/&[a-zA-Z]+;/g, e => REVERSE[e] ?? e)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

export function MiniHTMLEntities({ prefillData }: { prefillData?: PrefillData }) {
  const [input, setInput] = useState(prefillData?.text ?? '')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [copied, setCopied] = useState(false)

  const output = input ? (mode === 'encode' ? encodeEntities(input) : decodeEntities(input)) : ''

  async function copy() {
    await navigator.clipboard.writeText(output)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mini-tool">
      <div style={{ display: 'flex', gap: 6 }}>
        {(['encode', 'decode'] as const).map(m => (
          <button key={m} className={`btn ${mode === m ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode(m)} style={{ flex: 1 }}>
            {m === 'encode' ? 'Encode' : 'Decode'}
          </button>
        ))}
      </div>

      <div>
        <p className="mini-label">Input</p>
        <textarea className="mini-textarea" rows={3} value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={mode === 'encode' ? 'HTML with special chars…' : 'Encoded HTML entities…'} />
      </div>

      <div>
        <p className="mini-label">Output</p>
        <textarea className="mini-textarea" rows={3} value={output} readOnly />
      </div>

      {output && (
        <button className={`btn btn-full ${copied ? 'btn-success' : 'btn-secondary'}`} onClick={copy}>
          {copied ? '✓ Copied' : 'Copy result'}
        </button>
      )}
    </div>
  )
}
