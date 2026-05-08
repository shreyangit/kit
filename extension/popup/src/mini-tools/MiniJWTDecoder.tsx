import React, { useState } from 'react'
import type { PrefillData } from '../../../types'

function decodeJWT(token: string) {
  const parts = token.trim().split('.')
  if (parts.length !== 3) throw new Error('JWT must have exactly 3 parts (header.payload.signature)')
  const decode = (part: string) => JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))
  return { header: decode(parts[0]), payload: decode(parts[1]), signature: parts[2] }
}

export function MiniJWTDecoder({ prefillData }: { prefillData?: PrefillData }) {
  const [input, setInput] = useState(prefillData?.text ?? '')
  const [copied, setCopied] = useState<string | null>(null)

  let decoded: { header: Record<string, unknown>; payload: Record<string, unknown>; signature: string } | null = null
  let error = ''
  if (input.trim()) {
    try { decoded = decodeJWT(input) } catch (e) { error = (e as Error).message }
  }

  const now = Math.floor(Date.now() / 1000)
  const exp = decoded?.payload.exp as number | undefined
  const expired = exp ? exp < now : false
  const expiresIn = exp ? exp - now : null

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="mini-tool">
      <div>
        <p className="mini-label">JWT token</p>
        <textarea className="mini-textarea" rows={3} value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
          style={{ fontSize: 11 }} />
      </div>

      {error && <div className="mini-output error">⚠ {error}</div>}

      {decoded && (
        <>
          {exp && (
            <div className={`mini-output ${expired ? 'error' : 'success'}`} style={{ fontSize: 12 }}>
              {expired
                ? `⚠ Token expired ${Math.abs(expiresIn!)}s ago`
                : `✓ Valid — expires in ${expiresIn}s`}
            </div>
          )}

          {[
            { key: 'header', label: 'Header', data: decoded.header },
            { key: 'payload', label: 'Payload', data: decoded.payload },
          ].map(({ key, label, data }) => {
            const json = JSON.stringify(data, null, 2)
            return (
              <div key={key}>
                <div className="control-row" style={{ marginBottom: 4 }}>
                  <p className="mini-label">{label}</p>
                  <button className={`btn btn-sm ${copied === key ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => copy(json, key)}>
                    {copied === key ? '✓' : 'Copy'}
                  </button>
                </div>
                <pre style={{ fontFamily: 'monospace', fontSize: 10, padding: '8px', background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', overflow: 'auto',
                  maxHeight: 100, margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                  {json}
                </pre>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
