import { describe, it, expect } from 'vitest'
import { useSearch } from '../../popup/src/hooks/useSearch'
import { renderHook } from '@testing-library/react'

describe('useSearch', () => {
  it('should return empty array for empty query', () => {
    const { result } = renderHook(() => useSearch(''))
    expect(result.current).toHaveLength(0)
  })

  it('should find password generator by exact name', () => {
    const { result } = renderHook(() => useSearch('Password Generator'))
    expect(result.current[0]?.id).toBe('password-generator')
  })

  it('should find tool by partial name', () => {
    const { result } = renderHook(() => useSearch('pass'))
    const ids = result.current.map(t => t.id)
    expect(ids).toContain('password-generator')
  })

  it('should find tool by tag', () => {
    const { result } = renderHook(() => useSearch('transparent'))
    const ids = result.current.map(t => t.id)
    expect(ids).toContain('background-remover')
  })

  it('should return max 8 results', () => {
    const { result } = renderHook(() => useSearch('a'))
    expect(result.current.length).toBeLessThanOrEqual(8)
  })

  it('should rank exact match first', () => {
    const { result } = renderHook(() => useSearch('JSON Formatter'))
    expect(result.current[0]?.id).toBe('json-formatter')
  })

  it('should be case insensitive', () => {
    const { result: lower } = renderHook(() => useSearch('password generator'))
    const { result: upper } = renderHook(() => useSearch('PASSWORD GENERATOR'))
    expect(lower.current[0]?.id).toBe(upper.current[0]?.id)
  })

  it('should return empty for gibberish', () => {
    const { result } = renderHook(() => useSearch('xyzxyzxyzxyz'))
    expect(result.current).toHaveLength(0)
  })
})
