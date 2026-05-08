import { useState, useEffect, useRef } from 'react'
import type { PrefillData } from '../../../types'

export function MiniTimestamp({ prefillData }: { prefillData?: PrefillData }) {
  const [unix, setUnix] = useState(() => {
    if (prefillData?.text && /^\d+$/.test(prefillData.text.trim())) return prefillData.text.trim()
    return String(Math.floor(Date.now() / 1000))
  })
  const [dateInput, setDateInput] = useState('')
  const [liveMode, setLiveMode] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    if (liveMode) {
      intervalRef.current = setInterval(() => {
        setUnix(String(Math.floor(Date.now() / 1000)))
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [liveMode])

  const ts = parseInt(unix)
  const date = isNaN(ts) ? null : new Date(ts * 1000)
  const iso  = date ? date.toISOString() : ''
  const local = date ? date.toLocaleString() : ''

  function fromDate(value: string) {
    const d = new Date(value)
    if (!isNaN(d.getTime())) {
      setUnix(String(Math.floor(d.getTime() / 1000)))
      setLiveMode(false)
    }
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="mini-tool">
      <div className="control-row">
        <p className="mini-label">Unix timestamp</p>
        <label className="checkbox-label" style={{ gap: 4 }}>
          <input type="checkbox" checked={liveMode} onChange={e => setLiveMode(e.target.checked)} />
          Live
        </label>
      </div>
      <input className="mini-input" value={unix} onChange={e => { setUnix(e.target.value); setLiveMode(false) }}
        style={{ fontFamily: 'monospace' }} placeholder="Unix timestamp" />

      <div>
        <p className="mini-label">From date/time</p>
        <input type="datetime-local" className="mini-input" value={dateInput}
          onChange={e => { setDateInput(e.target.value); fromDate(e.target.value) }} />
      </div>

      {date && !isNaN(date.getTime()) && (
        <>
          {[['ISO 8601', iso, 'iso'], ['Local', local, 'local']].map(([label, value, key]) => (
            <div key={key as string}>
              <p className="mini-label">{label}</p>
              <div className="copy-row">
                <div className="mini-output">{value}</div>
                <button className={`btn btn-sm ${copied === key ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => copy(value as string, key as string)}>
                  {copied === key ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
