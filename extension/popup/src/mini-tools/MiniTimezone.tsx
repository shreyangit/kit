import React, { useState, useEffect } from 'react'
import type { PrefillData } from '../../../types'

const ZONES = [
  { name: 'UTC',            tz: 'UTC' },
  { name: 'New York',       tz: 'America/New_York' },
  { name: 'London',         tz: 'Europe/London' },
  { name: 'Paris',          tz: 'Europe/Paris' },
  { name: 'Dubai',          tz: 'Asia/Dubai' },
  { name: 'India (IST)',    tz: 'Asia/Kolkata' },
  { name: 'Singapore',      tz: 'Asia/Singapore' },
  { name: 'Tokyo',          tz: 'Asia/Tokyo' },
  { name: 'Sydney',         tz: 'Australia/Sydney' },
  { name: 'Los Angeles',    tz: 'America/Los_Angeles' },
]

function formatTZ(tz: string, date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).format(date)
}

export function MiniTimezone({ prefillData: _ }: { prefillData?: PrefillData }) {
  const [now, setNow] = useState(new Date())
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="mini-tool">
      <p className="mini-label" style={{ marginBottom: 4 }}>Current time worldwide (live)</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {ZONES.map(({ name, tz }) => {
          const timeStr = formatTZ(tz, now)
          return (
            <div key={tz} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 90 }}>{name}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 12, flex: 1, textAlign: 'center' }}>{timeStr}</span>
              <button className={`btn btn-sm ${copied === tz ? 'btn-success' : 'btn-secondary'}`}
                onClick={() => copy(timeStr, tz)}>
                {copied === tz ? '✓' : 'Copy'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
