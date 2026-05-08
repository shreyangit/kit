import { describe, it, expect } from 'vitest'
import { generatePassword } from '../../popup/src/mini-tools/MiniPasswordGenerator'
import { encodeBase64, decodeBase64 } from '../../popup/src/mini-tools/MiniBase64'
import { hashText } from '../../popup/src/mini-tools/MiniHashGenerator'

// ── Password Generator ────────────────────────────────────────────────────

describe('Password Generator', () => {
  const base = { uppercase: true, lowercase: true, numbers: true, symbols: false, excludeAmbiguous: false }

  it('should generate password of correct length', () => {
    expect(generatePassword({ ...base, length: 16 }).length).toBe(16)
    expect(generatePassword({ ...base, length: 32 }).length).toBe(32)
  })

  it('should not contain symbols when symbols=false', () => {
    const pw = generatePassword({ ...base, length: 100, symbols: false })
    expect(/[!@#$%^&*]/.test(pw)).toBe(false)
  })

  it('should not contain ambiguous chars when excludeAmbiguous=true', () => {
    const pw = generatePassword({ ...base, length: 200, excludeAmbiguous: true })
    expect(/[0OlI1]/.test(pw)).toBe(false)
  })

  it('should throw when no character sets selected', () => {
    expect(() => generatePassword({ length: 16, uppercase: false, lowercase: false, numbers: false, symbols: false, excludeAmbiguous: false }))
      .toThrow()
  })

  it('should generate different passwords each time', () => {
    const opts = { length: 24, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: false }
    const passwords = new Set(Array.from({ length: 50 }, () => generatePassword(opts)))
    expect(passwords.size).toBeGreaterThan(45)
  })
})

// ── Base64 ────────────────────────────────────────────────────────────────

describe('Base64', () => {
  it('should correctly encode ASCII text', () => {
    expect(encodeBase64('Hello, World!')).toBe('SGVsbG8sIFdvcmxkIQ==')
  })

  it('should correctly decode base64', () => {
    expect(decodeBase64('SGVsbG8sIFdvcmxkIQ==')).toBe('Hello, World!')
  })

  it('should handle Unicode characters round-trip', () => {
    const original = 'Hello 世界 🌍'
    expect(decodeBase64(encodeBase64(original))).toBe(original)
  })

  it('should return error message for invalid base64', () => {
    const result = decodeBase64('this is definitely not valid base64!!!')
    expect(result).toContain('[Invalid')
  })

  it('should handle empty string', () => {
    expect(encodeBase64('')).toBe('')
    expect(decodeBase64('')).toBe('')
  })
})

// ── Hash Generator ────────────────────────────────────────────────────────

describe('Hash Generator', () => {
  it('should generate correct SHA-256 for "hello"', async () => {
    const hash = await hashText('hello', 'SHA-256')
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
  })

  it('should generate correct SHA-1 for "hello"', async () => {
    const hash = await hashText('hello', 'SHA-1')
    expect(hash).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d')
  })

  it('should return lowercase hex', async () => {
    const hash = await hashText('test', 'SHA-256')
    expect(hash).toMatch(/^[0-9a-f]+$/)
  })

  it('should be deterministic', async () => {
    const [a, b] = await Promise.all([hashText('same', 'SHA-256'), hashText('same', 'SHA-256')])
    expect(a).toBe(b)
  })

  it('should produce different hashes for different inputs', async () => {
    const [a, b] = await Promise.all([hashText('hello', 'SHA-256'), hashText('world', 'SHA-256')])
    expect(a).not.toBe(b)
  })
})
