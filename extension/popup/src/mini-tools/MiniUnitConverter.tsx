import { useState } from 'react'
import type { PrefillData } from '../../../types'

const UNITS: Record<string, { label: string; units: { name: string; factor: number }[] }> = {
  length: {
    label: 'Length',
    units: [
      { name: 'mm', factor: 0.001 }, { name: 'cm', factor: 0.01 },
      { name: 'm', factor: 1 }, { name: 'km', factor: 1000 },
      { name: 'in', factor: 0.0254 }, { name: 'ft', factor: 0.3048 },
      { name: 'yd', factor: 0.9144 }, { name: 'mi', factor: 1609.344 },
    ],
  },
  weight: {
    label: 'Weight',
    units: [
      { name: 'mg', factor: 0.000001 }, { name: 'g', factor: 0.001 },
      { name: 'kg', factor: 1 }, { name: 't', factor: 1000 },
      { name: 'oz', factor: 0.02835 }, { name: 'lb', factor: 0.4536 },
    ],
  },
  temperature: {
    label: 'Temperature',
    units: [{ name: '°C', factor: 1 }, { name: '°F', factor: 1 }, { name: 'K', factor: 1 }],
  },
  area: {
    label: 'Area',
    units: [
      { name: 'm²', factor: 1 }, { name: 'km²', factor: 1e6 },
      { name: 'ft²', factor: 0.0929 }, { name: 'ac', factor: 4047 },
      { name: 'ha', factor: 10000 },
    ],
  },
}

function convertTemp(value: number, from: string, to: string): number {
  let celsius = value
  if (from === '°F') celsius = (value - 32) * 5 / 9
  if (from === 'K')  celsius = value - 273.15
  if (to === '°F') return celsius * 9 / 5 + 32
  if (to === 'K')  return celsius + 273.15
  return celsius
}

export function MiniUnitConverter({ prefillData: _ }: { prefillData?: PrefillData }) {
  const [category, setCategory] = useState('length')
  const [value, setValue] = useState('1')
  const [from, setFrom] = useState(UNITS.length.units[2].name)  // m
  const [to, setTo] = useState(UNITS.length.units[3].name)       // km
  const [copied, setCopied] = useState(false)

  const cat = UNITS[category]
  const numVal = parseFloat(value)
  let result = ''
  if (!isNaN(numVal)) {
    if (category === 'temperature') {
      result = convertTemp(numVal, from, to).toFixed(4).replace(/\.?0+$/, '')
    } else {
      const fromFactor = cat.units.find(u => u.name === from)?.factor ?? 1
      const toFactor   = cat.units.find(u => u.name === to)?.factor ?? 1
      result = ((numVal * fromFactor) / toFactor).toFixed(6).replace(/\.?0+$/, '')
    }
  }

  function switchCategory(c: string) {
    setCategory(c)
    setFrom(UNITS[c].units[0].name)
    setTo(UNITS[c].units[1]?.name ?? UNITS[c].units[0].name)
  }

  async function copy() {
    await navigator.clipboard.writeText(`${result} ${to}`)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mini-tool">
      <div className="checkbox-row" style={{ gap: 4 }}>
        {Object.entries(UNITS).map(([k, v]) => (
          <button key={k} className={`btn btn-sm ${category === k ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => switchCategory(k)}>{v.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <p className="mini-label">Value</p>
          <input className="mini-input" type="number" value={value}
            onChange={e => setValue(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <p className="mini-label">From</p>
          <select className="mini-select" value={from} onChange={e => setFrom(e.target.value)}>
            {cat.units.map(u => <option key={u.name}>{u.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <p className="mini-label">To</p>
          <select className="mini-select" value={to} onChange={e => setTo(e.target.value)}>
            {cat.units.map(u => <option key={u.name}>{u.name}</option>)}
          </select>
        </div>
      </div>

      {result && (
        <>
          <div className="mini-output success" style={{ textAlign: 'center', fontSize: 18, fontWeight: 700 }}>
            {result} {to}
          </div>
          <button className={`btn btn-full ${copied ? 'btn-success' : 'btn-secondary'}`} onClick={copy}>
            {copied ? '✓ Copied' : 'Copy result'}
          </button>
        </>
      )}
    </div>
  )
}
