import React from 'react'
import { CATEGORIES, getToolsByCategory } from '../../../lib/tools-registry'
import type { ToolCategory } from '../../../lib/tools-registry'
import { ToolIcon } from './ToolIcon'

interface Props {
  categoryId: string
  onBack: () => void
  onToolClick: (toolId: string) => void
}

export function CategoryView({ categoryId, onBack, onToolClick }: Props) {
  const cat = CATEGORIES.find(c => c.id === categoryId)
  const categoryTools = getToolsByCategory(categoryId as ToolCategory)

  if (!cat) return null

  return (
    <div className="category-view">
      <div className="category-view-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h2 className="category-view-title">
          <ToolIcon name={cat.icon} size={16} />
          <span>{cat.label}</span>
        </h2>
      </div>

      <div className="tool-list">
        {categoryTools.map(tool => (
          <button
            key={tool.id}
            className="tool-card"
            onClick={() => onToolClick(tool.id)}
          >
            <div className="tool-card-icon">
              <ToolIcon name={tool.icon} size={16} />
            </div>
            <div className="tool-card-info">
              <div className="tool-card-name">{tool.name}</div>
              <div className="tool-card-desc">{tool.description}</div>
            </div>
            {tool.hasInlineRunner && (
              <span className="tool-card-badge badge badge-inline">inline</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
