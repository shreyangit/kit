import { useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (query: string) => void
  autoFocus?: boolean
}

export function SearchBar({ value, onChange, autoFocus }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) {
      // Small delay to let popup render first
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [autoFocus])

  return (
    <div className="search-bar">
      <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        ref={inputRef}
        className="search-input"
        type="search"
        placeholder="Search 90 tools…"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Escape') { onChange(''); inputRef.current?.blur() }
        }}
        aria-label="Search tools"
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button className="search-clear" onClick={() => onChange('')} aria-label="Clear search">
          ✕
        </button>
      )}
    </div>
  )
}
