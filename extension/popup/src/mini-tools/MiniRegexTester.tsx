import React, { useState, useMemo } from 'react'
import type { PrefillData } from '../../../types'

export function MiniRegexTester({ prefillData }: { prefillData?: PrefillData }) {
  const [pattern, setPattern] = useState(prefillData?.text ?? '')
  const [flags, setFlags] = useState('g')
  const [testStr, setTestStr] = useState('')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    if (!pattern || !testStr) return null
    try {
      const rx = new RegExp(pattern, flags)
      const matches = [...testStr.matchAll(new RegExp(pattern, flags.includes('g') ? flags : flags + 'g'))]
      return { valid: true, count: matches.length, matches: matches.map(m => m[0]) }
    } catch (e) {
      return { valid: false, error: (e as Error).message }
    }
  }, [pattern, flags, testStr])

  // Highlight matches in test string
  const highlighted = useMemo(() => {
    if (!result?.valid || !result.count) return testStr
    try {
      return testStr.replace(new RegExp(pattern, flags.includes('g') ? flags : flags + 'g'),
        m => `<mark class="match-highlight">${m}</mark>`)
    } catch { return testStr }
  }, [result, testStr, pattern, flags])

  async function copy() {
    await navigator.clipboard.writeText(`/${pattern}/${flags}`)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mini-tool">
      <div>
        <p className="mini-label">Pattern</p>
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="mini-input" value={pattern} onChange={e => setPattern(e.target.value)}
            placeholder="[a-z]+" style={{ fontFamily: 'monospace', flex: 1 }} />
          <input className="mini-input" value={flags} onChange={e => setFlags(e.target.value)}
            placeholder="gim" style={{ width: 52, fontFamily: 'monospace' }} />
        </div>
      </div>

      <div>
        <p className="mini-label">Test string</p>
        <textarea className="mini-textarea" rows={3} value={testStr}
          onChange={e => setTestStr(e.target.value)} placeholder="Text to test against…" />
      </div>

      {result && (
        <div className={`mini-output ${result.valid ? 'success' : 'error'}`}>
          {result.valid
            ? result.count
              ? `✓ ${result.count} match${result.count !== 1 ? 'es' : ''}: ${result.matches.slice(0, 5).map(m => `"${m}"`).join(', ')}${result.count > 5 ? '…' : ''}`
              : '✗ No matches'
            : `⚠ ${result.error}`}
        </div>
      )}

      {result?.valid && pattern && (
        <button className={`btn btn-full ${copied ? 'btn-success' : 'btn-secondary'}`} onClick={copy}>
          {copied ? '✓ Copied' : `Copy /${pattern}/${flags}`}
        </button>
      )}
    </div>
  )
}
