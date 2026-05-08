import React from 'react'
import { CATEGORIES, getToolsByCategory, getTool } from '../../../lib/tools-registry'
import { getContextualTools, getContextLabel } from '../lib/context-detector'
import type { PageContext } from '../../../types'

interface Props {
  pageContext: PageContext
  recentTools: string[]
  pinnedTools: string[]
  onToolClick: (toolId: string) => void
  onCategoryClick: (categoryId: string) => void
}

export function HomeView({ pageContext, recentTools, pinnedTools, onToolClick, onCategoryClick }: Props) {
  const quickTools = getContextualTools(pageContext)

  return (
    <div className="home-view">
      {/* Quick Tools — context-aware */}
      {quickTools.length > 0 && (
        <div className="section">
          <p className="section-title">{getContextLabel(pageContext)}</p>
          <div className="quick-tools-strip">
            {quickTools.map(tool => (
              <button
                key={tool.id}
                className="quick-chip"
                onClick={() => onToolClick(tool.id)}
              >
                <span>{tool.icon}</span>
                <span>{tool.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pinned Tools */}
      {pinnedTools.length > 0 && (
        <div className="section">
          <p className="section-title">Pinned</p>
          <div className="quick-tools-strip">
            {pinnedTools.map(id => {
              const tool = getTool(id)
              return tool ? (
                <button key={id} className="quick-chip" onClick={() => onToolClick(id)}>
                  <span>{tool.icon}</span>
                  <span>{tool.name}</span>
                </button>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Recently Used */}
      {recentTools.length > 0 && (
        <div className="section">
          <p className="section-title">Recent</p>
          <div className="recent-strip">
            {recentTools.slice(0, 8).map(id => {
              const tool = getTool(id)
              return tool ? (
                <button key={id} className="recent-chip" onClick={() => onToolClick(id)}>
                  <span className="recent-chip-icon">{tool.icon}</span>
                  <span className="recent-chip-name">{tool.name}</span>
                </button>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Category Grid */}
      <div className="section">
        <p className="section-title">All Tools</p>
        <div className="category-grid">
          {CATEGORIES.map(cat => {
            const count = getToolsByCategory(cat.id as Parameters<typeof getToolsByCategory>[0]).length
            return (
              <button
                key={cat.id}
                className="category-tile"
                onClick={() => onCategoryClick(cat.id)}
              >
                <span className="category-tile-icon">{cat.icon}</span>
                <div className="category-tile-info">
                  <div className="category-tile-name">{cat.label}</div>
                  <div className="category-tile-count">{count} tools</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
