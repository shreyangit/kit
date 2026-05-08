import React from 'react'
import { useSearch } from '../hooks/useSearch'

interface Props {
  query: string
  onToolClick: (toolId: string) => void
}

export function SearchResultsView({ query, onToolClick }: Props) {
  const results = useSearch(query)

  if (!results.length) {
    return (
      <div className="search-results">
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No tools found</div>
          <div className="empty-state-sub">Try "{query.slice(0, 20)}" with different keywords</div>
        </div>
      </div>
    )
  }

  return (
    <div className="search-results">
      <p className="search-results-header">{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</p>
      <div className="tool-list">
        {results.map(tool => (
          <button key={tool.id} className="tool-card" onClick={() => onToolClick(tool.id)}>
            <div className="tool-card-icon">{tool.icon}</div>
            <div className="tool-card-info">
              <div className="tool-card-name">{tool.name}</div>
              <div className="tool-card-desc">{tool.description}</div>
            </div>
            {tool.hasInlineRunner && (
              <span className="badge badge-inline">inline</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
