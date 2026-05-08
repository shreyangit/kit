import { describe, it, expect } from 'vitest'
import { CONTEXT_MENU_TOOL_MAP } from '../../service-worker/context-menus'
import { uniqueTools } from '../../lib/tools-registry'

describe('Context Menu Tool Map', () => {
  it('every context menu entry should map to an existing tool ID', () => {
    const toolIds = new Set(uniqueTools.map(t => t.id))
    Object.entries(CONTEXT_MENU_TOOL_MAP).forEach(([menuId, toolId]) => {
      expect(toolIds, `Menu '${menuId}' maps to non-existent tool '${toolId}'`).toContain(toolId)
    })
  })

  it('should have no duplicate menu IDs', () => {
    const ids = Object.keys(CONTEXT_MENU_TOOL_MAP)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('should map background-remover for img-remove-bg', () => {
    expect(CONTEXT_MENU_TOOL_MAP['img-remove-bg']).toBe('background-remover')
  })

  it('should map jwt-decoder for text-jwt', () => {
    expect(CONTEXT_MENU_TOOL_MAP['text-jwt']).toBe('jwt-decoder')
  })

  it('should have at least 20 menu entries', () => {
    expect(Object.keys(CONTEXT_MENU_TOOL_MAP).length).toBeGreaterThanOrEqual(20)
  })
})
