import React, { useState } from 'react'
import type { PrefillData } from '../../../types'

export function encodeBase64(text: string): string {
  if (!text) return ''
  try {
    return btoa(unescape(encodeURIComponent(text)))
  } catch {
    return '[Encoding error]'
  }
}

export function decodeBase64(text: string): string {
  if (!text) return ''
  try {
    return decodeURIComponent(escape(atob(text.trim())))
  } catch {
    return '[Invalid base64 — could not decode]'
  }
}

function detectMode(text: string): 'encode' | 'decode' {
  try { atob(text.replace(/\s/g, '')); return 'decode' } catch { return 'encode' }
}

export function MiniBase64({ prefillData }: { prefillData?: PrefillData }) {
  const initial = prefillData?.text ?? ''
  const [input, setInput] = useState(initial)
  const [mode, setMode] = useState<'encode' | 'decode'>(detectMode(initial))
  const [copied, setCopied] = useState(false)

  const output = mode === 'encode' ? encodeBase64(input) : decodeBase64(input)
  const isError = output.startsWith('[Invalid') || output.startsWith('[Encoding')

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
          placeholder={mode === 'encode' ? 'Text to encode…' : 'Base64 to decode…'} />
      </div>

      <div>
        <p className="mini-label">Output</p>
        <div className={`mini-output ${isError ? 'error' : input ? 'success' : ''}`}>
          {output || <span style={{ opacity: 0.4 }}>Result appears here</span>}
        </div>
      </div>

      {output && !isError && (
        <button className={`btn btn-full ${copied ? 'btn-success' : 'btn-secondary'}`} onClick={copy}>
          {copied ? '✓ Copied' : 'Copy result'}
        </button>
      )}
    </div>
  )
}
