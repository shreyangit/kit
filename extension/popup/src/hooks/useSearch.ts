import { useMemo } from 'react'
import { uniqueTools } from '../../../lib/tools-registry'
import type { Tool } from '../../../lib/tools-registry'

function fuzzyMatch(query: string, target: string): boolean {
  let qi = 0
  for (let i = 0; i < target.length && qi < query.length; i++) {
    if (target[i] === query[qi]) qi++
  }
  return qi === query.length
}

export function useSearch(query: string): Tool[] {
  return useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return []

    const scored = uniqueTools.map(tool => {
      let score = 0
      const name = tool.name.toLowerCase()
      const desc = tool.description.toLowerCase()

      if (name === q)                   score += 100
      else if (name.startsWith(q))      score += 80
      else if (name.includes(q))        score += 60
      else if (tool.tags.some(t => t === q)) score += 55
      else if (tool.tags.some(t => t.includes(q))) score += 50
      else if (desc.includes(q))        score += 40
      else if (fuzzyMatch(q, name))     score += 20

      return { tool, score }
    })

    return scored
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ tool }) => tool)
  }, [query])
}
