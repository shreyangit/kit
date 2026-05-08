import { useState } from 'react'
import type { PrefillData } from '../../../types'

type Algo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

export async function hashText(text: string, algo: Algo): Promise<string> {
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function MiniHashGenerator({ prefillData }: { prefillData?: PrefillData }) {
  const [input, setInput] = useState(prefillData?.text ?? '')
  const [algo, setAlgo] = useState<Algo>('SHA-256')
  const [hashes, setHashes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  async function generate() {
    if (!input.trim()) return
    setLoading(true)
    const algos: Algo[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']
    const results = await Promise.all(algos.map(a => hashText(input, a)))
    setHashes(Object.fromEntries(algos.map((a, i) => [a, results[i]])))
    setLoading(false)
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="mini-tool">
      <div>
        <p className="mini-label">Text to hash</p>
        <textarea className="mini-textarea" rows={3} value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && e.metaKey && generate()}
          placeholder="Enter text to hash…" />
      </div>

      <button className="btn btn-primary btn-full" onClick={generate} disabled={!input.trim() || loading}>
        {loading ? 'Hashing…' : 'Generate Hashes'}
      </button>

      {Object.entries(hashes).map(([name, hash]) => (
        <div key={name}>
          <p className="mini-label">{name}</p>
          <div className="copy-row">
            <div className="mini-output" style={{ fontSize: 10, wordBreak: 'break-all' }}>{hash}</div>
            <button className={`btn btn-sm ${copied === name ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => copy(hash, name)}>
              {copied === name ? '✓' : 'Copy'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
