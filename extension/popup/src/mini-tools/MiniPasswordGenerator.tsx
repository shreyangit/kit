import { useState, useCallback, useEffect } from 'react'
import type { PrefillData } from '../../../types'

interface Options {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
  excludeAmbiguous: boolean
}

export function generatePassword(opts: Options): string {
  const { length, uppercase, lowercase, numbers, symbols, excludeAmbiguous } = opts
  let chars = ''
  if (uppercase) chars += excludeAmbiguous ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (lowercase) chars += excludeAmbiguous ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz'
  if (numbers)   chars += excludeAmbiguous ? '23456789' : '0123456789'
  if (symbols)   chars += '!@#$%^&*()-_=+[]{}|;:,.<>?'
  if (!chars) throw new Error('At least one character set must be selected')

  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr, n => chars[n % chars.length]).join('')
}

export function MiniPasswordGenerator({ prefillData: _ }: { prefillData?: PrefillData }) {
  const [length, setLength] = useState(16)
  const [opts, setOpts] = useState({ uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: false })
  const [passwords, setPasswords] = useState<string[]>([])
  const [copied, setCopied] = useState<number | null>(null)

  const generate = useCallback(() => {
    try {
      setPasswords(Array.from({ length: 5 }, () => generatePassword({ length, ...opts })))
    } catch { /* no char set selected */ }
  }, [length, opts])

  useEffect(() => { generate() }, [generate])

  const copy = async (pw: string, i: number) => {
    await navigator.clipboard.writeText(pw)
    setCopied(i); setTimeout(() => setCopied(null), 1500)
  }

  const toggleOpt = (k: keyof typeof opts) =>
    setOpts(prev => ({ ...prev, [k]: !prev[k] }))

  return (
    <div className="mini-tool">
      <div>
        <div className="control-row" style={{ marginBottom: 6 }}>
          <label className="mini-label">Length: {length}</label>
        </div>
        <input type="range" className="mini-slider" min={8} max={64} value={length}
          onChange={e => setLength(+e.target.value)} />
      </div>

      <div className="checkbox-row">
        {(['uppercase', 'lowercase', 'numbers', 'symbols', 'excludeAmbiguous'] as const).map(k => (
          <label key={k} className="checkbox-label">
            <input type="checkbox" checked={opts[k]} onChange={() => toggleOpt(k)} />
            {k === 'excludeAmbiguous' ? 'No ambiguous' : k.charAt(0).toUpperCase() + k.slice(1)}
          </label>
        ))}
      </div>

      <div className="output-list">
        {passwords.map((pw, i) => (
          <div key={i} className="output-item">
            <span className="output-item-text">{pw}</span>
            <button className={`btn btn-sm ${copied === i ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => copy(pw, i)}>
              {copied === i ? '✓' : 'Copy'}
            </button>
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-full" onClick={generate}>↻ Regenerate</button>
    </div>
  )
}
