import { describe, it, expect } from 'vitest'
import { getContextualTools, getContextLabel } from '../../popup/src/lib/context-detector'
import type { PageContext } from '../../types'

describe('Context Detector — Contextual Tools', () => {
  const allContexts: PageContext[] = [
    'image-page', 'pdf', 'has-images', 'text-heavy',
    'code-page', 'video-page', 'form-page', 'generic',
  ]

  it('should return 2–5 tools for every context', () => {
    allContexts.forEach(ctx => {
      const tools = getContextualTools(ctx)
      expect(tools.length, `${ctx} should return 2-5 tools`).toBeGreaterThanOrEqual(2)
      expect(tools.length, `${ctx} should return at most 5 tools`).toBeLessThanOrEqual(5)
    })
  })

  it('should never return undefined tools', () => {
    allContexts.forEach(ctx => {
      const tools = getContextualTools(ctx)
      expect(tools.every(t => t !== undefined), `${ctx} has undefined tool`).toBe(true)
    })
  })

  it('code-page should include code-formatter', () => {
    const ids = getContextualTools('code-page').map(t => t.id)
    expect(ids).toContain('code-formatter')
  })

  it('image-page should include background-remover', () => {
    const ids = getContextualTools('image-page').map(t => t.id)
    expect(ids).toContain('background-remover')
  })

  it('pdf context should include pdf-merger', () => {
    const ids = getContextualTools('pdf').map(t => t.id)
    expect(ids).toContain('pdf-merger')
  })

  it('generic context should include password-generator', () => {
    const ids = getContextualTools('generic').map(t => t.id)
    expect(ids).toContain('password-generator')
  })

  it('should return a context label for every context', () => {
    allContexts.forEach(ctx => {
      const label = getContextLabel(ctx)
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    })
  })
})
