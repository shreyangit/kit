import React, { useState } from 'react'
import type { PrefillData } from '../../../types'

// Lightweight code formatter using basic indentation logic
// For full Prettier support, the full tab version should be used.
function formatCode(code: string, lang: string): string {
  if (!code.trim()) return ''
  if (lang === 'json') {
    try { return JSON.stringify(JSON.parse(code), null, 2) } catch { return code }
  }
  // Basic JS/CSS: re-indent with 2 spaces
  let depth = 0
  const lines = code.split('\n').map(line => {
    const trimmed = line.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) depth = Math.max(0, depth - 1)
    const result = '  '.repeat(depth) + trimmed
    if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) depth++
    return result
  })
  return lines.join('\n').replace(/\n{3,}/g, '\n\n')
}

const LANGS = ['json', 'javascript', 'typescript', 'css', 'html']

export function MiniCodeFormatter({ prefillData }: { prefillData?: PrefillData }) {
  const [input, setInput] = useState(prefillData?.text ?? '')
  const [lang, setLang] = useState('json')
  const [copied, setCopied] = useState(false)

  const output = formatCode(input, lang)

  async function copy() {
    await navigator.clipboard.writeText(output)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mini-tool">
      <div>
        <p className="mini-label">Language</p>
        <select className="mini-select" value={lang} onChange={e => setLang(e.target.value)}>
          {LANGS.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
        </select>
      </div>

      <div>
        <p className="mini-label">Input code</p>
        <textarea className="mini-textarea" rows={4} value={input}
          onChange={e => setInput(e.target.value)} placeholder="Paste code to format…" />
      </div>

      {output && (
        <>
          <div>
            <div className="control-row" style={{ marginBottom: 4 }}>
              <p className="mini-label">Formatted</p>
              <button className={`btn btn-sm ${copied ? 'btn-success' : 'btn-secondary'}`} onClick={copy}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <textarea className="mini-textarea" rows={5} value={output} readOnly />
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-disabled)', textAlign: 'center' }}>
            ↗ Open full tab for Prettier formatting
          </p>
        </>
      )}
    </div>
  )
}
