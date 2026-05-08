import { useState } from 'react'
import type { PrefillData } from '../../../types'

const CASES = [
  { label: 'UPPER', fn: (s: string) => s.toUpperCase() },
  { label: 'lower', fn: (s: string) => s.toLowerCase() },
  { label: 'Title', fn: (s: string) => s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase()) },
  { label: 'Sentence', fn: (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() },
  { label: 'camelCase', fn: (s: string) => s.toLowerCase().replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase()) },
  { label: 'PascalCase', fn: (s: string) => s.toLowerCase().replace(/(^|[-_\s]+)(.)/g, (_, __, c) => c.toUpperCase()) },
  { label: 'snake_case', fn: (s: string) => s.trim().replace(/[\s-]+/g, '_').toLowerCase() },
  { label: 'kebab-case', fn: (s: string) => s.trim().replace(/[\s_]+/g, '-').toLowerCase() },
  { label: 'SCREAMING_SNAKE', fn: (s: string) => s.trim().replace(/[\s-]+/g, '_').toUpperCase() },
]

export function MiniTextCase({ prefillData }: { prefillData?: PrefillData }) {
  const [input, setInput] = useState(prefillData?.text ?? '')
  const [selected, setSelected] = useState(0)
  const [copied, setCopied] = useState(false)

  const output = input ? CASES[selected].fn(input) : ''

  async function copy() {
    await navigator.clipboard.writeText(output)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mini-tool">
      <div>
        <p className="mini-label">Input text</p>
        <textarea className="mini-textarea" rows={3} value={input}
          onChange={e => setInput(e.target.value)} placeholder="Enter text to convert…" />
      </div>

      <div>
        <p className="mini-label">Case type</p>
        <div className="checkbox-row" style={{ gap: 4 }}>
          {CASES.map((c, i) => (
            <button key={c.label}
              className={`btn btn-sm ${selected === i ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelected(i)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {output && (
        <>
          <div>
            <p className="mini-label">Result</p>
            <div className="mini-output">{output}</div>
          </div>
          <button className={`btn btn-full ${copied ? 'btn-success' : 'btn-secondary'}`} onClick={copy}>
            {copied ? '✓ Copied' : 'Copy result'}
          </button>
        </>
      )}
    </div>
  )
}
