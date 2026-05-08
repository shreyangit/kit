import React, { useState } from 'react'
import type { PrefillData } from '../../../types'

export function MiniJsonFormatter({ prefillData }: { prefillData?: PrefillData }) {
  const [input, setInput] = useState(prefillData?.text ?? '')
  const [indent, setIndent] = useState(2)
  const [copied, setCopied] = useState(false)

  let output = ''
  let error = ''
  if (input.trim()) {
    try {
      const parsed = JSON.parse(input)
      output = JSON.stringify(parsed, null, indent)
    } catch (e) {
      error = (e as Error).message
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(output)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mini-tool">
      <div>
        <p className="mini-label">JSON input</p>
        <textarea className="mini-textarea" rows={4} value={input}
          onChange={e => setInput(e.target.value)}
          placeholder='{"key": "value"}' />
      </div>

      {error && <div className="mini-output error">⚠ {error}</div>}

      {output && !error && (
        <>
          <div className="control-row">
            <p className="mini-label">Indent spaces</p>
            <div style={{ display: 'flex', gap: 4 }}>
              {[2, 4].map(n => (
                <button key={n} className={`btn btn-sm ${indent === n ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setIndent(n)}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mini-label">Formatted</p>
            <textarea className="mini-textarea" rows={6} value={output} readOnly />
          </div>
          <button className={`btn btn-full ${copied ? 'btn-success' : 'btn-secondary'}`} onClick={copy}>
            {copied ? '✓ Copied' : 'Copy formatted JSON'}
          </button>
        </>
      )}
    </div>
  )
}
