import { useState } from 'react'
import type { PrefillData } from '../../../types'

export function MiniUrlEncoder({ prefillData }: { prefillData?: PrefillData }) {
  const [input, setInput] = useState(prefillData?.url ?? prefillData?.text ?? '')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [copied, setCopied] = useState(false)

  function process(text: string) {
    try {
      return mode === 'encode' ? encodeURIComponent(text) : decodeURIComponent(text)
    } catch {
      return '[Invalid — could not process]'
    }
  }

  const output = input ? process(input) : ''
  const isError = output.startsWith('[Invalid')

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
          placeholder={mode === 'encode' ? 'URL to encode…' : 'Encoded URL to decode…'} />
      </div>

      <div>
        <p className="mini-label">Output</p>
        <div className={`mini-output ${isError ? 'error' : input ? 'success' : ''}`}
          style={{ wordBreak: 'break-all' }}>
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
