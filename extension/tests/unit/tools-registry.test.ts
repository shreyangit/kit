import { describe, it, expect } from 'vitest'
import { uniqueTools, getTool, CATEGORIES } from '../../lib/tools-registry'

describe('Tools Registry', () => {
  it('should have no duplicate tool IDs', () => {
    const ids = uniqueTools.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('should have all required fields on every tool', () => {
    uniqueTools.forEach(tool => {
      expect(tool.id,          `${tool.id} missing id`).toBeTruthy()
      expect(tool.name,        `${tool.id} missing name`).toBeTruthy()
      expect(tool.description, `${tool.id} missing description`).toBeTruthy()
      expect(tool.category,    `${tool.id} missing category`).toBeTruthy()
      expect(tool.icon,        `${tool.id} missing icon`).toBeTruthy()
      expect(Array.isArray(tool.tags), `${tool.id} tags must be array`).toBe(true)
      expect(typeof tool.hasInlineRunner, `${tool.id} hasInlineRunner must be boolean`).toBe('boolean')
    })
  })

  it('should have at least 3 tags per tool', () => {
    uniqueTools.forEach(tool => {
      expect(tool.tags.length, `${tool.id} needs at least 3 tags`).toBeGreaterThanOrEqual(3)
    })
  })

  it('every tool category should be a valid category ID', () => {
    const categoryIds = CATEGORIES.map(c => c.id)
    uniqueTools.forEach(tool => {
      expect(categoryIds, `Category '${tool.category}' not in CATEGORIES`).toContain(tool.category)
    })
  })

  it('getTool should return undefined for non-existent ID', () => {
    expect(getTool('non-existent-xyz')).toBeUndefined()
  })

  it('getTool should return correct tool for valid ID', () => {
    const tool = getTool('password-generator')
    expect(tool?.name).toBe('Password Generator')
  })

  it('getTool should return correct hasInlineRunner value', () => {
    expect(getTool('password-generator')?.hasInlineRunner).toBe(true)
    expect(getTool('background-remover')?.hasInlineRunner).toBe(false)
  })

  it('should have a reasonable total tool count', () => {
    expect(uniqueTools.length).toBeGreaterThanOrEqual(50)
    expect(uniqueTools.length).toBeLessThanOrEqual(100)
  })
})
