import { useState } from 'react'
import type { PrefillData } from '../../../types'

function analyse(text: string) {
  if (!text.trim()) return null
  const words = text.trim().split(/\s+/).filter(Boolean)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 2)
  const chars = text.length
  const charsNoSpace = text.replace(/\s/g, '').length
  const readingMinutes = words.length / 238 // avg reading speed
  const fleschScore = sentences.length && words.length
    ? 206.835
      - 1.015 * (words.length / sentences.length)
      - 84.6 * (charsNoSpace / words.length)
    : 0

  return {
    words: words.length,
    chars,
    charsNoSpace,
    sentences: sentences.length,
    paragraphs: text.split(/\n\s*\n/).filter(Boolean).length,
    readingTime: readingMinutes < 1 ? '< 1 min' : `${Math.ceil(readingMinutes)} min`,
    flesch: Math.min(100, Math.max(0, Math.round(fleschScore))),
  }
}

export function MiniWordCount({ prefillData }: { prefillData?: PrefillData }) {
  const [input, setInput] = useState(prefillData?.text ?? '')
  const stats = analyse(input)

  return (
    <div className="mini-tool">
      <div>
        <p className="mini-label">Text</p>
        <textarea className="mini-textarea" rows={5} value={input}
          onChange={e => setInput(e.target.value)} placeholder="Paste or type text here…" />
      </div>

      {stats && (
        <div className="stats-grid">
          {[
            ['Words', stats.words],
            ['Characters', stats.chars],
            ['Chars (no space)', stats.charsNoSpace],
            ['Sentences', stats.sentences],
            ['Paragraphs', stats.paragraphs],
            ['Reading time', stats.readingTime],
            ['Flesch score', stats.flesch],
          ].map(([label, value]) => (
            <div key={label as string} className="stat-card">
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
