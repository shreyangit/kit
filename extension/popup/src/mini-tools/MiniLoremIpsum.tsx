import React, { useState } from 'react'
import type { PrefillData } from '../../../types'

const WORDS = ['lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do','eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim','ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi','aliquip','commodo','consequat','duis','aute','irure','reprehenderit','voluptate','velit','esse','cillum','eu','fugiat','nulla','pariatur','excepteur','sint','occaecat','cupidatat','non','proident','culpa','qui','officia','deserunt','mollit','anim','est','laborum']

function generateWords(n: number) {
  const arr = Array.from({ length: n }, (_, i) => WORDS[i % WORDS.length])
  arr[0] = arr[0].charAt(0).toUpperCase() + arr[0].slice(1)
  return arr.join(' ')
}

function generateSentences(n: number) {
  return Array.from({ length: n }, (_, i) => generateWords(8 + (i % 5)) + '.').join(' ')
}

function generateParagraphs(n: number) {
  return Array.from({ length: n }, (_, i) => generateSentences(3 + (i % 3))).join('\n\n')
}

export function MiniLoremIpsum({ prefillData: _ }: { prefillData?: PrefillData }) {
  const [type, setType] = useState<'words' | 'sentences' | 'paragraphs'>('paragraphs')
  const [count, setCount] = useState(2)
  const [copied, setCopied] = useState(false)

  const output = type === 'words' ? generateWords(count)
    : type === 'sentences' ? generateSentences(count)
    : generateParagraphs(count)

  async function copy() {
    await navigator.clipboard.writeText(output)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mini-tool">
      <div style={{ display: 'flex', gap: 6 }}>
        {(['words', 'sentences', 'paragraphs'] as const).map(t => (
          <button key={t} className={`btn btn-sm ${type === t ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setType(t)} style={{ flex: 1, textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>

      <div>
        <div className="control-row">
          <p className="mini-label">Count: {count}</p>
        </div>
        <input type="range" className="mini-slider"
          min={type === 'words' ? 5 : 1}
          max={type === 'words' ? 100 : type === 'sentences' ? 10 : 5}
          value={count} onChange={e => setCount(+e.target.value)} />
      </div>

      <div>
        <p className="mini-label">Generated text</p>
        <textarea className="mini-textarea" rows={5} value={output} readOnly />
      </div>

      <button className={`btn btn-full ${copied ? 'btn-success' : 'btn-secondary'}`} onClick={copy}>
        {copied ? '✓ Copied' : 'Copy text'}
      </button>
    </div>
  )
}
