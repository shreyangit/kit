# tools.shreyannarula.com — Part 6: Final Implementation Guide
### Tools 101–110 + Feedback System + Future Vision + Complete Project Wrap-Up

> This is the final document in the series. Parts 1–5 covered the full technical implementation of 100 tools. This document covers tools 101–110, introduces the feedback and feature-request system, lays out a creative vision for where this project goes next, and provides the complete deployment runbook, monitoring setup, and project-level integration checklist. An AI agent with no prior context should be able to finish the entire project from this document combined with Parts 1–5.

---

## Table of Contents

1. [Tools 101–110 Detailed Specs](#1-tools-101110-detailed-specs)
2. [Feedback & Feature Request System](#2-feedback--feature-request-system)
3. [The Changelog & Release Notes Page](#3-the-changelog--release-notes-page)
4. [Tool Rating & Popularity System](#4-tool-rating--popularity-system)
5. [The "What Should We Build Next?" System](#5-the-what-should-we-build-next-system)
6. [Future Vision — Where This Goes](#6-future-vision--where-this-goes)
7. [Final Integration Checklist](#7-final-integration-checklist)
8. [Deployment Runbook](#8-deployment-runbook)
9. [Monitoring & Alerting](#9-monitoring--alerting)
10. [Critical Rules — Final Batch](#10-critical-rules--final-batch)

---

## 1. Tools 101–110 Detailed Specs

### New npm Dependencies (this batch)

```bash
npm install browser-fs-access speakingurl natural
```

| Package | Version | Used By | Notes |
|---|---|---|---|
| `browser-fs-access` | `^0.35.0` | Tool 102 | File System Access API wrapper with fallback |
| `speakingurl` | `^14.0.0` | Tool 104 | URL slug generation |
| `natural` | browser build via CDN | Tool 107 | Text analysis / NLP — load dynamically |

All other tools in this batch use only browser built-ins or libraries already installed.

---

### Tool 101: Binary / Hex / Octal Visualiser
**Route:** `/tools/binary-visualiser`
**Library:** Pure JS (built-in `BigInt`)
**Input:** Any number, text string, or file bytes
**Output:** Visual bit-level breakdown of the value

This tool goes deeper than the Number Base Converter (Tool 26) by visually explaining what each bit means in context — IEEE 754 float layout, UTF-8 byte sequences, ASCII tables.

```typescript
// lib/processing/binary-visualiser.ts

export type InputMode = 'number' | 'text' | 'float32' | 'float64' | 'color'

export interface BitGroup {
  label: string       // e.g. "Sign", "Exponent", "Mantissa" for floats
  bits: ('0' | '1')[]
  color: string       // for visual grouping
  value?: string      // decoded value of this group
  description: string
}

// Decode IEEE 754 float32 into its components
export function decodeFloat32(n: number): { groups: BitGroup[]; bytes: string[] } {
  const buffer = new ArrayBuffer(4)
  new Float32Array(buffer)[0] = n
  const uint32 = new Uint32Array(buffer)[0]
  const bits = uint32.toString(2).padStart(32, '0').split('') as ('0' | '1')[]

  const sign = bits[0]
  const exponentBits = bits.slice(1, 9)
  const mantissaBits = bits.slice(9, 32)

  const exponentValue = parseInt(exponentBits.join(''), 2)
  const mantissaValue = parseInt(mantissaBits.join(''), 2)
  const biasedExponent = exponentValue - 127

  const groups: BitGroup[] = [
    {
      label: 'Sign',
      bits: [sign],
      color: '#ef4444',
      value: sign === '0' ? '+' : '−',
      description: '0 = positive, 1 = negative',
    },
    {
      label: 'Exponent',
      bits: exponentBits,
      color: '#f59e0b',
      value: `${exponentValue} (bias 127 → 2^${biasedExponent})`,
      description: `Biased exponent: ${exponentValue} − 127 = ${biasedExponent}`,
    },
    {
      label: 'Mantissa',
      bits: mantissaBits,
      color: '#22c55e',
      value: `1.${mantissaValue.toString(2).padStart(23, '0')}`,
      description: 'Implicit leading 1 + fractional part',
    },
  ]

  const bytes = Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0').toUpperCase())
  return { groups, bytes }
}

// Decode a UTF-8 string into its byte sequences
export function decodeUTF8Bytes(text: string): { char: string; codePoint: number; bytes: string[]; utf8Pattern: string }[] {
  const encoder = new TextEncoder()
  const results: { char: string; codePoint: number; bytes: string[]; utf8Pattern: string }[] = []

  for (const char of text) {
    const codePoint = char.codePointAt(0)!
    const encoded = encoder.encode(char)
    const bytes = Array.from(encoded).map(b => b.toString(16).padStart(2, '0').toUpperCase())

    let pattern = ''
    if (codePoint < 0x80) pattern = '0xxxxxxx'
    else if (codePoint < 0x800) pattern = '110xxxxx 10xxxxxx'
    else if (codePoint < 0x10000) pattern = '1110xxxx 10xxxxxx 10xxxxxx'
    else pattern = '11110xxx 10xxxxxx 10xxxxxx 10xxxxxx'

    results.push({ char, codePoint, bytes, utf8Pattern: pattern })
  }

  return results
}

// Show ASCII table subset around a given character
export function getASCIIContext(charCode: number): { code: number; char: string; name: string; isControl: boolean }[] {
  const CONTROL_NAMES: Record<number, string> = {
    0: 'NUL', 1: 'SOH', 2: 'STX', 3: 'ETX', 4: 'EOT', 7: 'BEL',
    8: 'BS', 9: 'HT', 10: 'LF', 13: 'CR', 27: 'ESC', 32: 'SPC', 127: 'DEL',
  }
  const start = Math.max(0, charCode - 5)
  const end = Math.min(127, charCode + 5)
  return Array.from({ length: end - start + 1 }, (_, i) => {
    const code = start + i
    const isControl = code < 32 || code === 127
    return {
      code,
      char: isControl ? '' : String.fromCharCode(code),
      name: CONTROL_NAMES[code] ?? (isControl ? `^${String.fromCharCode(code + 64)}` : String.fromCharCode(code)),
      isControl,
    }
  })
}
```

**UI Notes:**
- Mode tabs: Number, Text, Float32, Float64, Colour (hex)
- Number mode: shows decimal → binary with bit cells (each bit is a clickable toggle to see what changes)
- Float mode: colour-coded bit groups (Sign/Exponent/Mantissa) with explanations
- Text mode: character-by-character UTF-8 byte breakdown table
- Colour mode: RGB channels shown as 3 separate 8-bit groups

---

### Tool 102: File Size Analyser & Batch Renamer
**Route:** `/tools/file-tools`
**Library:** `browser-fs-access` + Canvas API
**Input:** Multiple files (drag and drop)
**Output:** File size analysis table + renamed files as ZIP

```typescript
// lib/processing/file-tools.ts
import { fileOpen } from 'browser-fs-access'

export interface FileInfo {
  name: string
  newName?: string
  size: number
  type: string
  lastModified: number
  extension: string
}

export function analyseFiles(files: File[]): FileInfo[] {
  return files.map(f => ({
    name: f.name,
    size: f.size,
    type: f.type || 'unknown',
    lastModified: f.lastModified,
    extension: f.name.split('.').pop()?.toLowerCase() ?? '',
  }))
}

export type RenamePattern =
  | 'sequence'        // photo_001.jpg, photo_002.jpg
  | 'date-prefix'     // 2025-05-09_filename.jpg
  | 'lowercase'       // all filenames to lowercase
  | 'replace'         // find and replace in filename
  | 'strip-spaces'    // replace spaces with underscores or hyphens
  | 'add-prefix'
  | 'add-suffix'

export function applyRenamePattern(
  files: FileInfo[],
  pattern: RenamePattern,
  options: {
    sequenceName?: string
    sequencePadding?: number
    sequenceStart?: number
    findText?: string
    replaceText?: string
    prefix?: string
    suffix?: string
    spaceReplacement?: '-' | '_'
  }
): FileInfo[] {
  return files.map((f, i) => {
    const ext = f.extension ? `.${f.extension}` : ''
    const baseName = f.name.replace(new RegExp(`\\.${f.extension}$`, 'i'), '')
    let newBase = baseName

    switch (pattern) {
      case 'sequence':
        const pad = options.sequencePadding ?? 3
        const num = ((options.sequenceStart ?? 1) + i).toString().padStart(pad, '0')
        newBase = `${options.sequenceName ?? 'file'}_${num}`
        break
      case 'date-prefix':
        const date = new Date(f.lastModified).toISOString().split('T')[0]
        newBase = `${date}_${baseName}`
        break
      case 'lowercase':
        newBase = baseName.toLowerCase()
        break
      case 'replace':
        newBase = baseName.replaceAll(options.findText ?? '', options.replaceText ?? '')
        break
      case 'strip-spaces':
        newBase = baseName.replace(/\s+/g, options.spaceReplacement ?? '_')
        break
      case 'add-prefix':
        newBase = `${options.prefix ?? ''}${baseName}`
        break
      case 'add-suffix':
        newBase = `${baseName}${options.suffix ?? ''}`
        break
    }

    return { ...f, newName: `${newBase}${ext}` }
  })
}
```

**UI Notes:**
- Drop zone for multiple files (or use `fileOpen()` for directory access in supported browsers)
- File table: name, size (formatted), type, last modified
- Sortable by any column
- File size bar chart: visual comparison of sizes
- Total size summary + breakdown by file type (pie chart)
- Batch rename section: pattern selector with live preview of new names in the table
- Download renamed files as ZIP

---

### Tool 103: Morse Code Translator
**Route:** `/tools/morse-code`
**Library:** Pure JS + Web Audio API
**Input:** Text or Morse code
**Output:** Translated text or Morse + audio playback

```typescript
// lib/processing/morse-code.ts

const MORSE_MAP: Record<string, string> = {
  'A':'.-', 'B':'-...', 'C':'-.-.', 'D':'-..', 'E':'.', 'F':'..-.', 'G':'--.', 'H':'....', 'I':'..', 'J':'.---',
  'K':'-.-', 'L':'.-..', 'M':'--', 'N':'-.', 'O':'---', 'P':'.--.', 'Q':'--.-', 'R':'.-.', 'S':'...', 'T':'-',
  'U':'..-', 'V':'...-', 'W':'.--', 'X':'-..-', 'Y':'-.--', 'Z':'--..',
  '0':'-----', '1':'.----', '2':'..---', '3':'...--', '4':'....-', '5':'.....', '6':'-....', '7':'--...', '8':'---..', '9':'----.',
  '.':'.-.-.-', ',':'--..--', '?':'..--..', "'":'.----.', '!':'-.-.--', '/':'-..-.', '(':'-.--.', ')':'-.--.-',
  '&':'.-...', ':':'---...', ';':'-.-.-.', '=':'-...-', '+':'.-.-.', '-':'-....-', '_':'..--.-', '"':'.-..-.',
  '$':'...-..-', '@':'.--.-.', ' ': '/'
}

const REVERSE_MORSE_MAP = Object.fromEntries(Object.entries(MORSE_MAP).map(([k, v]) => [v, k]))

export function textToMorse(text: string): string {
  return text.toUpperCase().split('').map(char => MORSE_MAP[char] ?? '?').join(' ')
}

export function morseToText(morse: string): string {
  return morse.split(' / ').map(word =>
    word.split(' ').map(code => REVERSE_MORSE_MAP[code] ?? '?').join('')
  ).join(' ')
}

// Play Morse code using Web Audio API
export async function playMorse(
  morseString: string,
  options: { wpm?: number; frequency?: number; volume?: number } = {}
): Promise<void> {
  const audioCtx = new AudioContext()
  const { wpm = 20, frequency = 700, volume = 0.5 } = options

  // WPM calculation: standard PARIS word = 50 dot-lengths
  const dotDuration = 1.2 / wpm  // seconds
  const dashDuration = dotDuration * 3
  const symbolGap = dotDuration
  const letterGap = dotDuration * 3
  const wordGap = dotDuration * 7

  let currentTime = audioCtx.currentTime + 0.1

  const playTone = (duration: number) => {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0, currentTime)
    gain.gain.linearRampToValueAtTime(volume, currentTime + 0.005)  // 5ms attack
    gain.gain.setValueAtTime(volume, currentTime + duration - 0.005)
    gain.gain.linearRampToValueAtTime(0, currentTime + duration)    // 5ms release
    osc.start(currentTime)
    osc.stop(currentTime + duration)
    currentTime += duration + symbolGap
  }

  for (const token of morseString.split('')) {
    if (token === '.') playTone(dotDuration)
    else if (token === '-') playTone(dashDuration)
    else if (token === ' ') currentTime += letterGap - symbolGap  // already added symbolGap
    else if (token === '/') currentTime += wordGap - symbolGap
  }

  // Return a promise that resolves when playback finishes
  return new Promise(resolve => setTimeout(resolve, (currentTime - audioCtx.currentTime) * 1000))
}
```

**UI Notes:**
- Two tabs: "Text → Morse" and "Morse → Text"
- Live translation as user types
- Morse output displayed as styled dots and dashes (large, readable visual format)
- Play button: plays the Morse code audio through Web Audio API
- Speed slider: 5–40 WPM
- Frequency slider: 400–900 Hz
- Visual playback indicator: highlights the current symbol being played
- Copy Morse text + download as `.txt`

---

### Tool 104: URL Slug Generator
**Route:** `/tools/slug-generator`
**Library:** `speakingurl`
**Input:** Any text (page title, blog post name, product name)
**Output:** URL-safe slug in multiple formats

```typescript
// lib/processing/slug-generator.ts
import speakingurl from 'speakingurl'

export interface SlugOptions {
  separator: '-' | '_' | '.'
  lowercase: boolean
  truncate: number          // max slug length (0 = no limit)
  transliterate: boolean    // convert non-ASCII to ASCII equivalents
  lang: string              // language for transliteration ('en', 'de', 'fr', 'es', etc.)
}

export interface SlugResult {
  slug: string
  alternatives: {
    hyphen: string
    underscore: string
    dot: string
    camelCase: string
    pascalCase: string
  }
  length: number
  isURLSafe: boolean
  warnings: string[]
}

export function generateSlug(text: string, options: Partial<SlugOptions> = {}): SlugResult {
  const opts = {
    separator: options.separator ?? '-',
    lowercase: options.lowercase ?? true,
    truncate: options.truncate ?? 0,
    lang: options.lang ?? 'en',
  }

  const slug = speakingurl(text, {
    separator: opts.separator,
    lang: opts.lang,
    truncate: opts.truncate || undefined,
  })

  const warnings: string[] = []
  if (slug.length > 75) warnings.push('Slug is over 75 characters — consider a shorter title for SEO')
  if (slug.length < 3) warnings.push('Slug is very short — may be too generic for SEO')
  if (slug.startsWith('-') || slug.startsWith('_')) warnings.push('Slug starts with a separator — this may cause issues')
  if (/\d{4}-\d{2}-\d{2}/.test(slug)) warnings.push('Slug contains a date pattern — may look like a dated URL')

  // Build all alternative formats
  const base = speakingurl(text, { separator: '-', lang: opts.lang })
  const words = base.split('-')

  return {
    slug,
    alternatives: {
      hyphen: base,
      underscore: speakingurl(text, { separator: '_', lang: opts.lang }),
      dot: speakingurl(text, { separator: '.', lang: opts.lang }),
      camelCase: words.map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(''),
      pascalCase: words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''),
    },
    length: slug.length,
    isURLSafe: /^[a-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$/i.test(slug),
    warnings,
  }
}
```

**UI Notes:**
- Large text input with live slug generation
- Language selector: English, German, French, Spanish, Hindi (affects transliteration)
- Separator selector: Hyphen (-), Underscore (_), Dot (.)
- Max length slider: off / 50 / 60 / 75 / 100 characters
- Show all format alternatives in a table with copy buttons
- SEO tips panel: recommended slug length, avoid stop words, keyword placement
- Bulk mode: paste multiple titles (one per line) → download all slugs as CSV

---

### Tool 105: CSS Specificity Calculator
**Route:** `/tools/css-specificity`
**Library:** Pure JS
**Input:** CSS selector string
**Output:** Specificity score + visual breakdown

```typescript
// lib/processing/css-specificity.ts

export interface SpecificityScore {
  a: number   // Inline styles (always 0 for selectors, 1 for inline)
  b: number   // IDs
  c: number   // Classes, attributes, pseudo-classes
  d: number   // Elements, pseudo-elements
  total: string      // e.g. "0,1,2,3"
  totalNumeric: number  // for comparison: a*1000 + b*100 + c*10 + d
  description: string
}

export function calculateSpecificity(selector: string): SpecificityScore {
  let a = 0, b = 0, c = 0, d = 0

  // Strip pseudo-element content to avoid false positives
  let s = selector
    .replace(/::?not\(([^)]*)\)/g, '$1')  // :not() contents count
    .replace(/::?[a-z-]+/g, match => {
      // Pseudo-elements (::before, ::after, etc.)
      if (match.startsWith('::') || ['::before','::after','::first-line','::first-letter','::placeholder','::selection'].includes(match)) {
        d++
        return ''
      }
      // Pseudo-classes (:hover, :focus, etc.)
      c++
      return ''
    })

  // Count IDs
  const idMatches = s.match(/#[a-zA-Z_-][\w-]*/g)
  b += idMatches ? idMatches.length : 0
  s = s.replace(/#[a-zA-Z_-][\w-]*/g, '')

  // Count classes, attributes
  const classMatches = s.match(/\.[a-zA-Z_-][\w-]*/g)
  c += classMatches ? classMatches.length : 0
  s = s.replace(/\.[a-zA-Z_-][\w-]*/g, '')

  const attrMatches = s.match(/\[[^\]]+\]/g)
  c += attrMatches ? attrMatches.length : 0
  s = s.replace(/\[[^\]]+\]/g, '')

  // Count elements (but not universal selector *)
  const elementMatches = s.match(/[a-zA-Z][a-zA-Z0-9]*/g)
  d += elementMatches ? elementMatches.length : 0

  return {
    a, b, c, d,
    total: `${a},${b},${c},${d}`,
    totalNumeric: a * 1000 + b * 100 + c * 10 + d,
    description: buildDescription(a, b, c, d),
  }
}

function buildDescription(a: number, b: number, c: number, d: number): string {
  const parts = []
  if (a > 0) parts.push(`${a} inline style${a > 1 ? 's' : ''}`)
  if (b > 0) parts.push(`${b} ID${b > 1 ? 's' : ''}`)
  if (c > 0) parts.push(`${c} class${c > 1 ? 'es' : ''}/attribute${c > 1 ? 's' : ''}/pseudo-class${c > 1 ? 'es' : ''}`)
  if (d > 0) parts.push(`${d} element${d > 1 ? 's' : ''}/pseudo-element${d > 1 ? 's' : ''}`)
  if (parts.length === 0) return 'No specificity (universal selector or inherited)'
  return parts.join(' + ')
}

// Compare two selectors and determine which wins
export function compareSelectors(sel1: string, sel2: string): {
  winner: 1 | 2 | 'tie'
  score1: SpecificityScore
  score2: SpecificityScore
} {
  const score1 = calculateSpecificity(sel1)
  const score2 = calculateSpecificity(sel2)
  return {
    winner: score1.totalNumeric > score2.totalNumeric ? 1 : score1.totalNumeric < score2.totalNumeric ? 2 : 'tie',
    score1,
    score2,
  }
}
```

**UI Notes:**
- Single selector input with live calculation
- Specificity shown as four coloured boxes: [A] [B] [C] [D] with counts inside
- Each box labelled: A = Inline, B = ID, C = Class/Attr/Pseudo-class, D = Element/Pseudo-element
- Visual specificity bar: horizontal bar showing relative weight
- Comparison mode: two selector inputs side by side — shows which one wins with a crown icon
- Specificity guide: "Why does `!important` win? Why do IDs always beat classes?"
- Common specificity patterns table: `*` vs `div` vs `.class` vs `#id` vs inline

---

### Tool 106: JSON Schema Validator
**Route:** `/tools/json-schema`
**Library:** `ajv` (browser-compatible, already widely used)
**Input:** JSON data + JSON Schema
**Output:** Validation result with detailed errors

```bash
npm install ajv
```

```typescript
// lib/processing/json-schema-validator.ts
import Ajv, { ErrorObject } from 'ajv'
import addFormats from 'ajv-formats'

let ajvInstance: Ajv | null = null

function getAjv(): Ajv {
  if (!ajvInstance) {
    ajvInstance = new Ajv({
      allErrors: true,    // collect ALL errors, not just first
      strict: false,      // allow unknown keywords (for older schemas)
      verbose: true,
    })
    addFormats(ajvInstance)  // adds format validation: email, date, uri, etc.
  }
  return ajvInstance
}

export interface ValidationResult {
  isValid: boolean
  errors: FormattedError[]
  summary: string
}

export interface FormattedError {
  path: string           // e.g. "/user/age"
  message: string        // e.g. "must be >= 0"
  schemaPath: string     // e.g. "#/properties/user/properties/age/minimum"
  data: unknown          // the actual value that failed
  suggestion: string     // human-friendly fix
}

export function validateJSONSchema(
  data: string,
  schema: string
): ValidationResult {
  try {
    const parsedData = JSON.parse(data)
    const parsedSchema = JSON.parse(schema)

    const ajv = getAjv()
    const validate = ajv.compile(parsedSchema)
    const isValid = validate(parsedData)

    if (isValid) {
      return { isValid: true, errors: [], summary: '✓ Data is valid against the schema' }
    }

    const errors = (validate.errors ?? []).map(formatError)
    return {
      isValid: false,
      errors,
      summary: `✗ ${errors.length} validation error${errors.length > 1 ? 's' : ''} found`,
    }
  } catch (e) {
    const msg = (e as Error).message
    const isDataError = msg.includes('JSON') && !msg.includes('schema')
    return {
      isValid: false,
      errors: [{ path: '/', message: msg, schemaPath: '', data: null, suggestion: isDataError ? 'Fix your JSON data syntax' : 'Fix your JSON Schema syntax' }],
      summary: '✗ Parse error',
    }
  }
}

function formatError(error: ErrorObject): FormattedError {
  const path = error.instancePath || '/'
  const message = error.message ?? 'Validation failed'

  const suggestions: Record<string, string> = {
    'must be string':   'Change the value to a string (wrap in quotes)',
    'must be number':   'Change the value to a number (remove quotes)',
    'must be integer':  'Change the value to a whole number (no decimal)',
    'must be boolean':  'Change the value to true or false',
    'must be array':    'Wrap the value in square brackets []',
    'must be object':   'Wrap the value in curly braces {}',
    'must match format': `Value does not match the required format: ${(error.params as any)?.format ?? ''}`,
    'must have required property': `Add the missing required property: "${(error.params as any)?.missingProperty ?? ''}"`,
  }

  return {
    path,
    message,
    schemaPath: error.schemaPath,
    data: error.data,
    suggestion: suggestions[message] ?? 'Review the schema constraint at this path',
  }
}

// Generate a JSON Schema from a JSON sample (inference)
export function inferSchema(jsonData: string): string {
  try {
    const data = JSON.parse(jsonData)
    const schema = buildSchema(data, '#')
    return JSON.stringify(schema, null, 2)
  } catch {
    return '{}'
  }
}

function buildSchema(value: unknown, path: string): object {
  if (value === null) return { type: 'null' }
  if (typeof value === 'string') return { type: 'string', examples: [value] }
  if (typeof value === 'number') return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' }
  if (typeof value === 'boolean') return { type: 'boolean' }
  if (Array.isArray(value)) {
    return {
      type: 'array',
      items: value.length > 0 ? buildSchema(value[0], `${path}/items`) : {},
    }
  }
  if (typeof value === 'object') {
    const properties: Record<string, object> = {}
    const required: string[] = []
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      properties[k] = buildSchema(v, `${path}/properties/${k}`)
      if (v !== null && v !== undefined) required.push(k)
    }
    return { type: 'object', properties, required }
  }
  return {}
}
```

**Install:**
```bash
npm install ajv ajv-formats
```

**UI Notes:**
- Two side-by-side JSON editors: "Data" and "Schema"
- "Validate" button + live validation (debounce 500ms)
- Error list below with path, message, and suggestion for each error
- Click any error → highlights the corresponding path in the data editor
- "Infer Schema from Data" button: auto-generates a schema from the current data
- Schema examples dropdown: User object, Product, API Response, Address
- Copy schema + download as `.json`

---

### Tool 107: Readability Scorer (Advanced)
**Route:** `/tools/readability`
**Library:** Pure JS (all algorithms implemented from scratch — `natural` is optional for tokenisation)
**Input:** Any text (article, email, blog post)
**Output:** Multiple readability scores with grade level equivalents

```typescript
// lib/processing/readability.ts

export interface ReadabilityScores {
  fleschReadingEase: { score: number; grade: string; description: string }
  fleschKincaid: { gradeLevel: number; description: string }
  gunningFog: { index: number; gradeLevel: string }
  smog: { index: number; gradeLevel: string }
  colemanLiau: { index: number; gradeLevel: string }
  automatedReadability: { index: number; gradeLevel: string }
  daleChall: { score: number; gradeLevel: string }
  averageGradeLevel: number
  summary: {
    words: number
    sentences: number
    syllables: number
    complexWords: number      // words with 3+ syllables
    longSentences: number     // sentences > 20 words
    passiveVoiceCount: number
    avgWordLength: number
    avgSentenceLength: number
  }
  suggestions: string[]
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length <= 3) return 1
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '')
  const matches = word.match(/[aeiouy]{1,2}/g)
  return matches ? matches.length : 1
}

function isComplexWord(word: string): boolean {
  return countSyllables(word) >= 3 && !word.endsWith('ing') && !word.endsWith('es') && !word.endsWith('ed')
}

function detectPassiveVoice(sentence: string): boolean {
  return /\b(is|are|was|were|be|been|being)\s+\w+ed\b/i.test(sentence)
}

export function analyseReadability(text: string): ReadabilityScores {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const words = text.trim().split(/\s+/).filter(w => w.length > 0)
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0)
  const complexWords = words.filter(isComplexWord)
  const longSentences = sentences.filter(s => s.trim().split(/\s+/).length > 20)
  const passiveSentences = sentences.filter(detectPassiveVoice)

  const W = words.length
  const S = sentences.length
  const Syl = syllableCount
  const CW = complexWords.length
  const ASL = W / S   // avg sentence length
  const ASW = Syl / W // avg syllables per word

  // Flesch Reading Ease (0-100, higher = easier)
  const flesch = 206.835 - 1.015 * ASL - 84.6 * ASW
  const fleschGrade = flesch >= 90 ? '5th grade' : flesch >= 80 ? '6th grade' : flesch >= 70 ? '7th grade' : flesch >= 60 ? '8th–9th grade' : flesch >= 50 ? '10th–12th grade' : flesch >= 30 ? 'College' : 'Professional'
  const fleschDesc = flesch >= 70 ? 'Easy to read' : flesch >= 50 ? 'Fairly difficult' : 'Difficult'

  // Flesch-Kincaid Grade Level
  const fkgl = 0.39 * ASL + 11.8 * ASW - 15.59

  // Gunning Fog Index
  const fog = 0.4 * (ASL + 100 * CW / W)

  // SMOG Grade
  const smog = 3 + Math.sqrt(CW * (30 / S))

  // Coleman-Liau Index (uses characters, not syllables)
  const letters = words.join('').replace(/[^a-zA-Z]/g, '').length
  const L = letters / W * 100  // avg letters per 100 words
  const SS = S / W * 100       // avg sentences per 100 words
  const cli = 0.0588 * L - 0.296 * SS - 15.8

  // Automated Readability Index
  const ari = 4.71 * (letters / W) + 0.5 * ASL - 21.43

  // Average of all scores
  const avg = (fkgl + fog + smog + cli + ari) / 5

  const suggestions: string[] = []
  if (ASL > 20) suggestions.push('Average sentence length is high. Break long sentences into shorter ones.')
  if (CW / W > 0.15) suggestions.push('High proportion of complex words. Consider simpler alternatives.')
  if (passiveSentences.length / S > 0.2) suggestions.push('Over 20% of sentences use passive voice. Use active voice where possible.')
  if (flesch < 60) suggestions.push('Flesch score below 60 — text may be hard to read for general audiences.')

  const gradeLabel = (g: number) => g <= 6 ? '6th grade' : g <= 8 ? '8th grade' : g <= 10 ? '10th grade' : g <= 12 ? '12th grade' : g <= 14 ? 'College' : 'Post-graduate'

  return {
    fleschReadingEase: { score: Math.round(flesch * 10) / 10, grade: fleschGrade, description: fleschDesc },
    fleschKincaid: { gradeLevel: Math.round(fkgl * 10) / 10, description: gradeLabel(fkgl) },
    gunningFog: { index: Math.round(fog * 10) / 10, gradeLevel: gradeLabel(fog) },
    smog: { index: Math.round(smog * 10) / 10, gradeLevel: gradeLabel(smog) },
    colemanLiau: { index: Math.round(cli * 10) / 10, gradeLevel: gradeLabel(cli) },
    automatedReadability: { index: Math.round(ari * 10) / 10, gradeLevel: gradeLabel(ari) },
    daleChall: { score: 0, gradeLevel: 'N/A' },  // requires word list — omit for now
    averageGradeLevel: Math.round(avg * 10) / 10,
    summary: {
      words: W, sentences: S, syllables: Syl, complexWords: CW,
      longSentences: longSentences.length, passiveVoiceCount: passiveSentences.length,
      avgWordLength: Math.round((letters / W) * 10) / 10,
      avgSentenceLength: Math.round(ASL * 10) / 10,
    },
    suggestions,
  }
}
```

**UI Notes:**
- Large text area input
- Six readability score cards arranged in a grid — each shows score, grade level, and a colour-coded meter
- "Average grade level" shown prominently
- Summary statistics: words, sentences, syllables, complex words, long sentences, passive voice count
- Suggestions panel: bulleted improvement tips
- Target audience selector: "Writing for 5th graders?", "Writing for professionals?" — highlights which scores are within acceptable range
- Sentence-level highlight mode: colour-code sentences by length (short=green, medium=yellow, long=red)

---

### Tool 108: Text to Handwriting
**Route:** `/tools/text-to-handwriting`
**Library:** Canvas API + custom handwriting font (loaded from Google Fonts)
**Input:** Text (typed or pasted)
**Output:** PNG image of handwritten text

```typescript
// lib/processing/text-to-handwriting.ts

export interface HandwritingOptions {
  font: string           // Google Font — handwriting category
  fontSize: number       // px
  lineHeight: number     // multiplier
  color: string          // ink colour hex
  backgroundColor: string // paper colour hex
  pageStyle: 'blank' | 'lined' | 'ruled' | 'grid'
  inkVariation: number   // 0–10 — random rotation/offset per character
  tilt: number           // overall text tilt in degrees
  inkStyle: string       // 'ballpoint', 'fountain', 'marker', 'pencil'
  marginLeft: number     // px
  marginTop: number      // px
  pageWidth: number      // px
  pageHeight: number     // px
}

const HANDWRITING_FONTS = [
  'Caveat', 'Indie Flower', 'Patrick Hand', 'Shadows Into Light',
  'Kalam', 'Pangolin', 'Just Another Hand', 'Rock Salt',
  'Nothing You Could Do', 'Covered By Your Grace',
]

export async function loadHandwritingFont(fontName: string): Promise<void> {
  const existing = document.getElementById(`gf-${fontName.replace(/\s/g, '-')}`)
  if (existing) return
  await new Promise<void>(resolve => {
    const link = document.createElement('link')
    link.id = `gf-${fontName.replace(/\s/g, '-')}`
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}&display=swap`
    link.onload = () => resolve()
    document.head.appendChild(link)
  })
  // Wait for font to actually be ready
  await document.fonts.load(`24px "${fontName}"`)
}

export async function generateHandwriting(
  text: string,
  options: HandwritingOptions
): Promise<Blob> {
  await loadHandwritingFont(options.font)

  const canvas = document.createElement('canvas')
  canvas.width = options.pageWidth
  canvas.height = options.pageHeight
  const ctx = canvas.getContext('2d')!

  // Background
  ctx.fillStyle = options.backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Page lines
  if (options.pageStyle === 'lined' || options.pageStyle === 'ruled') {
    ctx.strokeStyle = '#b0c4de40'
    ctx.lineWidth = 1
    const spacing = options.fontSize * options.lineHeight
    for (let y = options.marginTop + spacing; y < canvas.height; y += spacing) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
  }

  if (options.pageStyle === 'ruled') {
    // Red margin line
    ctx.strokeStyle = '#ff000030'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(options.marginLeft - 10, 0)
    ctx.lineTo(options.marginLeft - 10, canvas.height)
    ctx.stroke()
  }

  if (options.pageStyle === 'grid') {
    ctx.strokeStyle = '#87ceeb30'
    ctx.lineWidth = 0.5
    const gridSize = options.fontSize
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
    }
  }

  // Write text with handwriting font and per-character variation
  ctx.fillStyle = options.color
  ctx.font = `${options.fontSize}px "${options.font}"`

  const maxWidth = canvas.width - options.marginLeft - 40
  const lines = wrapToLines(ctx, text, maxWidth)
  const lineHeight = options.fontSize * options.lineHeight

  lines.forEach((line, li) => {
    let x = options.marginLeft
    const baseY = options.marginTop + (li + 1) * lineHeight

    for (const char of line) {
      // Apply random per-character variation for authenticity
      const jitterX = (Math.random() - 0.5) * options.inkVariation
      const jitterY = (Math.random() - 0.5) * options.inkVariation
      const jitterAngle = (Math.random() - 0.5) * (options.inkVariation * 0.02)

      ctx.save()
      ctx.translate(x + jitterX, baseY + jitterY)
      ctx.rotate(jitterAngle + options.tilt * Math.PI / 180)
      ctx.fillText(char, 0, 0)
      ctx.restore()

      x += ctx.measureText(char).width + (Math.random() - 0.5) * options.inkVariation * 0.5
    }
  })

  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))
}

function wrapToLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split('\n')
  const lines: string[] = []
  for (const para of paragraphs) {
    const words = para.split(' ')
    let current = ''
    for (const word of words) {
      const test = current + (current ? ' ' : '') + word
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
  }
  return lines
}
```

**UI Notes:**
- Text area input
- Font selector: horizontal scrollable gallery showing previews of each handwriting font
- Page style: Blank, Lined, Ruled (with red margin line), Grid
- Ink colour picker + paper colour picker (presets: cream, white, yellow notepad, blue ink, pencil grey)
- Font size, line height, tilt, ink variation sliders
- Live preview (small canvas, renders in real-time with debounce)
- Page size: A4, Letter, Square (Instagram), custom
- Download as PNG or PDF (multi-page if text overflows one page)

---

### Tool 109: Data URL Encoder / Decoder
**Route:** `/tools/data-url`
**Library:** Pure JS (built-in `FileReader` API)
**Input:** File (encode to data URL) OR data URL string (decode to file)
**Output:** Data URL string or downloaded file

```typescript
// lib/processing/data-url.ts

export async function fileToDataURL(file: File): Promise<{ dataURL: string; mimeType: string; base64Data: string; sizeBytes: number; sizeSavings: number }> {
  const dataURL = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const [header, base64Data] = dataURL.split(',')
  const mimeType = header.match(/:(.*?);/)?.[1] ?? 'application/octet-stream'

  // Data URLs are about 33% larger than the original due to base64 encoding
  const encodedSize = dataURL.length
  const sizeSavings = Math.round(((encodedSize - file.size) / file.size) * 100)

  return { dataURL, mimeType, base64Data, sizeBytes: encodedSize, sizeSavings }
}

export interface DataURLInfo {
  isValid: boolean
  mimeType?: string
  encoding?: string      // 'base64' or ''
  dataLength?: number
  estimatedFileSize?: number
  fileExtension?: string
  previewType?: 'image' | 'text' | 'audio' | 'video' | 'other'
  error?: string
}

export function parseDataURL(dataURL: string): DataURLInfo {
  const match = dataURL.match(/^data:([^;]+)(?:;([^,]+))?,(.+)$/)
  if (!match) return { isValid: false, error: 'Not a valid data URL. Expected format: data:[mediatype][;base64],data' }

  const [, mimeType, encoding, data] = match
  const isBase64 = encoding === 'base64'
  const dataLength = data.length
  const estimatedFileSize = isBase64
    ? Math.round(dataLength * 3 / 4) - (data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0)
    : dataLength

  const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
    'image/svg+xml': 'svg', 'text/plain': 'txt', 'text/html': 'html', 'text/css': 'css',
    'application/json': 'json', 'application/pdf': 'pdf', 'audio/mpeg': 'mp3',
    'video/mp4': 'mp4', 'application/zip': 'zip',
  }

  const previewType = mimeType?.startsWith('image/') ? 'image'
    : mimeType?.startsWith('text/') ? 'text'
    : mimeType?.startsWith('audio/') ? 'audio'
    : mimeType?.startsWith('video/') ? 'video'
    : 'other'

  return {
    isValid: true,
    mimeType,
    encoding: encoding ?? 'url-encoded',
    dataLength,
    estimatedFileSize,
    fileExtension: MIME_TO_EXT[mimeType ?? ''] ?? mimeType?.split('/')[1] ?? 'bin',
    previewType,
  }
}

export function dataURLToFile(dataURL: string, filename?: string): File | null {
  const info = parseDataURL(dataURL)
  if (!info.isValid || !info.mimeType) return null

  const [, data] = dataURL.split(',')
  const byteString = info.encoding === 'base64' ? atob(data) : decodeURIComponent(data)
  const bytes = new Uint8Array(byteString.length).map((_, i) => byteString.charCodeAt(i))
  const name = filename ?? `decoded.${info.fileExtension}`

  return new File([bytes], name, { type: info.mimeType })
}
```

**UI Notes:**
- Two tabs: "File → Data URL" and "Data URL → File"
- **Encode:** Drop a file → show data URL with character count and size overhead warning
- **Decode:** Paste data URL → show parsed info (MIME type, size, encoding) + preview (image shown inline, text shown in pre block, audio with a player)
- Copy data URL button (with "Copied!" feedback)
- Download decoded file button
- Size warning if data URL > 1MB: "Large data URLs cause performance issues in HTML. Consider hosting the file separately."
- Common use cases: embedding small icons in CSS, base64 encoding email attachments

---

### Tool 110: Network Speed Test
**Route:** `/tools/speed-test`
**Library:** Pure JS + `performance.now()` + `fetch()`
**Input:** None (triggered by user)
**Output:** Download speed, upload speed, latency (ping)

```typescript
// lib/processing/speed-test.ts

export interface SpeedTestResult {
  downloadMbps: number
  uploadMbps: number
  pingMs: number
  jitterMs: number
  timestamp: number
  serverLocation: string  // inferred from Cloudflare response headers
}

// Download speed: fetch a large file from your own CDN and measure throughput
export async function measureDownloadSpeed(
  onProgress: (mbps: number, percent: number) => void
): Promise<number> {
  // Use a file served from your own Cloudflare CDN — no third-party dependency
  // Create a 10MB static file at /speed-test/10mb.bin in your public folder
  const testFileURL = '/speed-test/10mb.bin'
  const startTime = performance.now()
  let receivedBytes = 0
  const targetBytes = 10 * 1024 * 1024  // 10MB

  const response = await fetch(testFileURL, { cache: 'no-store' })
  if (!response.body) throw new Error('Streaming not supported')

  const reader = response.body.getReader()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    receivedBytes += value?.byteLength ?? 0

    const elapsed = (performance.now() - startTime) / 1000  // seconds
    const mbps = (receivedBytes * 8) / (1024 * 1024 * elapsed)
    const percent = Math.min(100, Math.round((receivedBytes / targetBytes) * 100))
    onProgress(Math.round(mbps * 10) / 10, percent)
  }

  const totalElapsed = (performance.now() - startTime) / 1000
  return Math.round((receivedBytes * 8) / (1024 * 1024 * totalElapsed) * 10) / 10
}

// Upload speed: POST random data to a worker endpoint
export async function measureUploadSpeed(
  onProgress: (mbps: number, percent: number) => void
): Promise<number> {
  const chunkSize = 256 * 1024  // 256KB chunks
  const totalChunks = 20        // 5MB total upload
  const data = new Uint8Array(chunkSize).fill(65)  // fill with 'A'

  const startTime = performance.now()
  let uploadedBytes = 0

  for (let i = 0; i < totalChunks; i++) {
    await fetch('/api/worker/speed-test-upload', {
      method: 'POST',
      body: data,
      cache: 'no-store',
    })
    uploadedBytes += chunkSize

    const elapsed = (performance.now() - startTime) / 1000
    const mbps = (uploadedBytes * 8) / (1024 * 1024 * elapsed)
    onProgress(Math.round(mbps * 10) / 10, Math.round((i + 1) / totalChunks * 100))
  }

  const totalElapsed = (performance.now() - startTime) / 1000
  return Math.round((uploadedBytes * 8) / (1024 * 1024 * totalElapsed) * 10) / 10
}

// Latency: measure round-trip time with a tiny request
export async function measureLatency(samples: number = 8): Promise<{ ping: number; jitter: number }> {
  const times: number[] = []

  for (let i = 0; i < samples; i++) {
    const start = performance.now()
    await fetch('/api/worker/speed-test-ping', { cache: 'no-store' })
    times.push(performance.now() - start)
    // Small delay between pings
    await new Promise(r => setTimeout(r, 50))
  }

  // Remove fastest and slowest (outliers)
  times.sort((a, b) => a - b)
  const trimmed = times.slice(1, -1)
  const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length
  const jitter = trimmed.reduce((max, t) => Math.max(max, Math.abs(t - avg)), 0)

  return { ping: Math.round(avg), jitter: Math.round(jitter) }
}
```

**Cloudflare Worker for upload + ping endpoint:**
```typescript
// cloudflare-workers/speed-test.ts
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const cors = { 'Access-Control-Allow-Origin': 'https://tools.shreyannarula.com' }

    if (url.pathname.endsWith('/speed-test-ping')) {
      return new Response('pong', { headers: { ...cors, 'Content-Length': '4' } })
    }

    if (url.pathname.endsWith('/speed-test-upload')) {
      // Receive and discard the uploaded data
      await request.arrayBuffer()
      return new Response('ok', { headers: cors })
    }

    return new Response('not found', { status: 404 })
  }
}
```

**UI Notes:**
- Single "Start Test" button — runs ping, download, upload sequentially
- Large gauge/dial showing current speed as it measures (live update)
- Results: Download (Mbps), Upload (Mbps), Ping (ms), Jitter (ms)
- Historical results: show last 5 test results with timestamps (stored in localStorage)
- Speed classification: "Gaming Ready", "HD Streaming", "4K Streaming", "Video Calls", "Basic Browsing"
- Share result: generates a shareable text summary "⚡ 245 Mbps down / 89 Mbps up / 12ms ping — tested at tools.shreyannarula.com"

---

## 2. Feedback & Feature Request System

This is one of the most important features of the entire project. It is not an afterthought — it is how the site grows, stays relevant, and builds loyalty. Every successful tool-based product (Excalidraw, Ray.so, Squoosh) grows through user feedback loops.

### Architecture

```
User submits feedback
       ↓
/api/feedback route (Next.js API route, edge runtime)
       ↓
Cloudflare KV (temporary buffer, 24h TTL)
       ↓
Nightly cron: KV → GitHub Issue (via GitHub API)
              KV → Notion database (optional)
              KV → Email digest to shreyan@
```

This architecture costs $0 and requires no external feedback SaaS.

### Feedback Types

```typescript
// lib/feedback/types.ts

export type FeedbackType =
  | 'bug'              // Something is broken
  | 'feature-request'  // I want a new tool / feature
  | 'improvement'      // This tool exists but could be better
  | 'praise'           // This is great — keep doing this
  | 'tool-request'     // Specific new tool request
  | 'ui-issue'         // Hard to use / confusing

export interface FeedbackSubmission {
  type: FeedbackType
  toolId?: string          // Which tool this is about (if any)
  message: string          // User's message (required, 10–2000 chars)
  email?: string           // Optional — for follow-up
  url: string              // Current page URL (auto-captured)
  userAgent: string        // Browser (auto-captured, anonymised)
  timestamp: number
  sessionId: string        // Random ID for this session (no personal ID)
  vote?: {                 // For feature requests: can upvote existing
    requestId: string
    direction: 'up'
  }
}
```

### The Feedback Widget — Per-Tool

Every tool page has a small, unobtrusive feedback widget in the bottom-right corner of `ToolShell`. It is NOT a full-page modal — it is a compact inline experience.

```tsx
// components/tool-shell/FeedbackWidget.tsx
'use client'
import { useState } from 'react'

const REACTIONS = [
  { emoji: '🐛', label: 'Bug',           type: 'bug' },
  { emoji: '💡', label: 'Feature',       type: 'feature-request' },
  { emoji: '😕', label: 'Confusing',     type: 'ui-issue' },
  { emoji: '❤️', label: 'Love it',       type: 'praise' },
]

export function FeedbackWidget({ toolId }: { toolId: string }) {
  const [step, setStep] = useState<'closed' | 'reaction' | 'message' | 'submitted'>('closed')
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReaction = (type: FeedbackType) => {
    setSelectedType(type)
    if (type === 'praise') {
      submitFeedback(type, 'User clicked ❤️ Love it')
    } else {
      setStep('message')
    }
  }

  const submitFeedback = async (type: FeedbackType, msg: string) => {
    setIsSubmitting(true)
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type, toolId, message: msg, email: email || undefined,
        url: window.location.href,
        userAgent: navigator.userAgent.slice(0, 100),
        timestamp: Date.now(),
        sessionId: getOrCreateSessionId(),
      } satisfies Partial<FeedbackSubmission>),
    })
    setStep('submitted')
    setIsSubmitting(false)
  }

  if (step === 'submitted') {
    return (
      <div className="feedback-widget submitted">
        <span>✓ Thanks! Your feedback helps improve this tool.</span>
      </div>
    )
  }

  return (
    <div className="feedback-widget">
      <button
        className="feedback-trigger"
        onClick={() => setStep(step === 'closed' ? 'reaction' : 'closed')}
      >
        {step === 'closed' ? 'Feedback' : '✕'}
      </button>

      {step === 'reaction' && (
        <div className="feedback-reactions">
          <p className="feedback-prompt">How's this tool?</p>
          <div className="reaction-buttons">
            {REACTIONS.map(r => (
              <button key={r.type} onClick={() => handleReaction(r.type as FeedbackType)} className="reaction-btn">
                <span>{r.emoji}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'message' && (
        <div className="feedback-message-form">
          <p className="feedback-type-label">
            {REACTIONS.find(r => r.type === selectedType)?.emoji} {selectedType === 'bug' ? "What's broken?" : selectedType === 'feature-request' ? "What would you add?" : "What's confusing?"}
          </p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe what happened or what you'd like..."
            className="feedback-textarea"
            maxLength={2000}
            autoFocus
          />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email (optional — for follow-up)"
            className="feedback-email"
          />
          <button
            onClick={() => submitFeedback(selectedType!, message)}
            disabled={message.length < 10 || isSubmitting}
            className="feedback-submit-btn"
          >
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </button>
        </div>
      )}
    </div>
  )
}
```

### The Feature Request Voting Page

**Route:** `/roadmap`

This page is one of the most powerful user-retention and acquisition features on the site. It shows the community what's being built and lets users vote.

```typescript
// app/roadmap/page.tsx

// Roadmap items are stored in a simple JSON file in the repo
// app/roadmap/roadmap-data.ts

export interface RoadmapItem {
  id: string
  title: string
  description: string
  status: 'planned' | 'in-progress' | 'completed' | 'considering'
  votes: number          // loaded from KV at build time
  toolId?: string        // if this is a new tool
  category: string
  eta?: string           // e.g. "June 2025"
  requestedBy?: string   // e.g. "Community" or "@shreyan"
}

export const ROADMAP_ITEMS: RoadmapItem[] = [
  // These are manually curated — you add items here as feedback comes in
  // Votes come from Cloudflare KV and are fetched at runtime
]
```

**Roadmap Page UI:**
- Status columns: "Considering", "Planned", "In Progress", "Shipped" — Kanban-style
- Each card: title, description, category badge, vote count, ETA if known
- Vote button: thumbs up (stored in `localStorage` — one vote per item per browser, no account needed)
- "Suggest a tool" button: opens the feedback widget pre-set to `tool-request` type
- Filter by category (image, text, developer, etc.)
- "Recently shipped" section showing last 5 completed items with links to the tools

---

## 3. The Changelog & Release Notes Page

**Route:** `/changelog`

Every tool added or improved is logged here. This creates a reason to return — users who found the site two months ago will come back to see what's new.

```typescript
// app/changelog/changelog-data.ts

export interface ChangelogEntry {
  date: string           // ISO date "2025-06-01"
  version: string        // "2025.06" (year.month versioning — no semver needed)
  type: 'new-tool' | 'improvement' | 'fix' | 'milestone'
  title: string
  description: string
  toolId?: string        // link to the tool if relevant
  badge?: string         // emoji badge e.g. "🎉", "🔧", "⚡"
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2025-06-01',
    version: '2025.06',
    type: 'milestone',
    title: '100 tools live',
    description: 'Reached 100 working tools. Background Remover remains the most popular with 50k monthly uses.',
    badge: '🎉',
  },
  // ... add entries as you ship
]
```

**Changelog Page UI:**
- Timeline layout: entries sorted newest first, grouped by month
- Each entry: date, badge, title, short description, "Try it" link if it's a tool
- Subscribe form: "Get notified when new tools launch" → email collected, stored in Cloudflare KV, weekly digest via Resend.com (free tier: 3,000 emails/month)
- RSS feed: `/changelog/rss.xml` — auto-generated from changelog data (developers love RSS)

---

## 4. Tool Rating & Popularity System

### How It Works (No Database)

Ratings are stored in **Cloudflare KV** with a 24-hour aggregation window. No user accounts, no per-user tracking — just aggregate counts.

```typescript
// cloudflare-workers/tool-rating.ts

// KV structure:
// tool-views:{toolId}:{YYYY-MM-DD} → count (views today)
// tool-rating:{toolId}:{1-5} → count (votes per rating)
// tool-popular:weekly → JSON array of {toolId, score} sorted by popularity

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const cors = { 'Access-Control-Allow-Origin': 'https://tools.shreyannarula.com' }

    if (request.method === 'POST' && url.pathname.endsWith('/rate')) {
      const { toolId, rating } = await request.json() as { toolId: string; rating: 1 | 2 | 3 | 4 | 5 }
      if (!toolId || !rating || rating < 1 || rating > 5) {
        return new Response('Invalid', { status: 400, headers: cors })
      }
      const key = `tool-rating:${toolId}:${rating}`
      const current = parseInt(await env.KV.get(key) ?? '0')
      await env.KV.put(key, (current + 1).toString())
      return new Response('ok', { headers: cors })
    }

    if (request.method === 'POST' && url.pathname.endsWith('/view')) {
      const { toolId } = await request.json() as { toolId: string }
      const today = new Date().toISOString().split('T')[0]
      const key = `tool-views:${toolId}:${today}`
      const current = parseInt(await env.KV.get(key) ?? '0')
      await env.KV.put(key, (current + 1).toString(), { expirationTtl: 86400 * 7 })
      return new Response('ok', { headers: cors })
    }

    return new Response('not found', { status: 404, headers: cors })
  }
}
```

**On the tool page:** After a user uses a tool (downloads or copies output), show a small star rating:
```
Was this tool helpful?  ★ ★ ★ ★ ★
```

One rating per tool per browser session (tracked in `sessionStorage`). No account needed.

**Popularity dashboard at `/popular`:**
- Top 10 most used tools this week
- Most improved (biggest week-over-week gain)
- Trending (fastest growing in last 24h)
- Hidden gems (high rating, low views)

---

## 5. The "What Should We Build Next?" System

The most creative differentiator on the entire site. Instead of a boring "suggest a feature" form, make it interactive and fun.

### The Tool Idea Generator (`/suggest`)

```tsx
// app/suggest/page.tsx — a tool that helps users suggest tools

// Three input sections:
// 1. "I waste time on..." (what manual task do they do repeatedly?)
// 2. "My job/workflow is..." (context — developer, designer, writer, etc.)
// 3. "I currently use [X] for this but it's annoying because..." (pain point)

// AI-powered suggestions (using Claude Sonnet via the Anthropic API pattern
// established in prior parts — this is "Claude in Claude"):
// After user fills these in, call the API and generate 3 tool ideas
// that could solve their problem, with implementation complexity estimates.

// User can then vote on which one they want most.
```

**Why this works:**
- It gives users a fun, gamified way to suggest features
- It pre-validates ideas before you build them
- It creates a database of user problems, not just tool requests
- The AI-generated suggestions often surprise users and make them share

### The Weekly Poll

Every Monday, a banner at the top of the homepage:
```
🗳️ This week's poll: Which tool should we build next?
[CSV Merger] [PDF Password Remover] [JSON Diff Viewer]
[Your suggestion →]
```

Results shown live. The winning tool gets built that week and announced in the changelog.

---

## 6. Future Vision — Where This Goes

### Phase 1: The Platform (Months 1–6)
110 tools, stable, fast, polished. The Chrome extension is live. 5k+ monthly active users. Feedback system running. First changelog entries.

### Phase 2: The API (Months 7–12)
Open the tool processing functions as a REST API. Developers pay $9/month for:
- API key access
- 10,000 operations/month
- Webhook support (upload file, get callback when done)
- Priority queue for heavy operations (FFmpeg, background removal)

This requires almost no new code — the same processing functions used by the website are wrapped in API routes. The infrastructure is already there.

### Phase 3: The Desktop App (Months 12–18)
Wrap the web app in **Tauri** (not Electron — Tauri is 10× smaller, Rust-based). A native macOS and Windows desktop app that:
- Runs all tools without internet (full offline)
- Integrates with the OS share menu (right-click any file in Finder/Explorer)
- Supports drag-and-drop directly from the desktop
- Shows a menubar icon with quick-access tools
- Processes files in batch from a folder (watch mode)

Tauri builds to a ~5MB installer. Electron would be 200MB. The choice matters.

### Phase 4: The Workflow Builder (Months 18–24)
The most ambitious feature. A visual "pipeline" builder where users chain tools together:

```
[Upload Image] → [Remove Background] → [Add Watermark] → [Compress to 80%] → [Download]
```

Save workflows. Share workflows. Automate with a single click. This is where the product becomes irreplaceable — no competitor has this at zero cost.

```typescript
// Workflow definition
export interface Workflow {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  isPublic: boolean
  authorName: string   // no accounts — just a display name
}

export interface WorkflowStep {
  toolId: string
  config: Record<string, unknown>   // tool-specific configuration
  inputFrom: 'upload' | string      // 'upload' = user uploads, or step ID
}

// Workflows are shareable via URL:
// tools.shreyannarula.com/workflow/bg-remove-watermark-compress
// Anyone can open this link and run the workflow with their own files
```

### Phase 5: The Community Layer (Months 24+)
Workflows created by users are shared in a gallery at `/workflows`. The best ones are curated by Shreyan and featured. A community emerges around the tool ecosystem.

Monetisation at this stage:
- Free: run any workflow manually
- Pro ($6/month): automated workflows (schedule a workflow to run on a folder)
- Teams ($29/month): shared workflows, team presets, collaborative tool configs

The project goes from "a tool site" to "an automation platform." The foundation for all of this is laid in tools 1–110.

---

## 7. Final Integration Checklist

Before calling the project complete, verify every item below.

### Tools & Processing
- [ ] All 110 tools are live on `tools.shreyannarula.com`
- [ ] Every tool listed in `lib/tools-registry.ts` with all required fields
- [ ] Every tool has a `metadata` export for SEO (title, description, canonical URL)
- [ ] Every tool generates a sitemap entry (auto, via `generateStaticParams`)
- [ ] COOP/COEP headers verified in `next.config.js` (FFmpeg/WASM works)
- [ ] All WASM files served from `public/` with correct MIME types
- [ ] Object URL cleanup (`URL.revokeObjectURL`) verified in all file-processing tools
- [ ] Mobile responsive verified on iOS Safari and Android Chrome
- [ ] Clipboard paste (`Ctrl+V`) works on all file-input tools
- [ ] URL parameter pre-population works for all tools (for extension integration)

### Chrome Extension
- [ ] All 110 tools in `tools-registry.ts` (synced with website)
- [ ] Context menus registered for all applicable tool types
- [ ] Popup renders in < 100ms
- [ ] Mini tool runners work for all 20 inline tools
- [ ] FAB uses Shadow DOM (no CSS bleed)
- [ ] Tested on Chrome, Edge, Brave
- [ ] Tested at 100%, 125%, 150% display scaling
- [ ] All unit tests passing (`npm test` in extension directory)
- [ ] Extension ZIP under 128MB
- [ ] Privacy policy page live at `tools.shreyannarula.com/privacy`
- [ ] Store listing copy + 4 screenshots prepared
- [ ] Submitted to Chrome Web Store

### Infrastructure
- [ ] DNS: `tools.shreyannarula.com` CNAME → Vercel, Cloudflare proxy enabled
- [ ] SSL: Cloudflare "Full (strict)" mode
- [ ] Cloudflare Workers deployed (OG preview, IP lookup, screenshot, speed test, rating)
- [ ] Cloudflare KV created and bound to Workers
- [ ] Speed test 10MB binary file at `/speed-test/10mb.bin` in `public/`
- [ ] Vercel Analytics enabled (free)
- [ ] Error monitoring set up (see Section 9)

### Feedback System
- [ ] Feedback widget in `ToolShell` on every tool page
- [ ] `/api/feedback` route deployed and tested
- [ ] Roadmap page live at `/roadmap` with at least 5 items
- [ ] Changelog page live at `/changelog` with at least 3 entries
- [ ] RSS feed at `/changelog/rss.xml`
- [ ] Newsletter subscribe form working
- [ ] `/suggest` page live
- [ ] Weekly poll system ready for first poll

### SEO
- [ ] `sitemap.xml` auto-generated and submitted to Google Search Console
- [ ] `robots.txt` at root (allow all, point to sitemap)
- [ ] Open Graph image (1200×630) for the homepage and each tool page
- [ ] Static pages generated for HTTP status codes (`/tools/http-status/[code]`)
- [ ] Static pages generated for keyboard shortcut sets
- [ ] All tool pages have unique `<title>` and `<meta name="description">`
- [ ] Schema.org `WebApplication` structured data on tool pages

---

## 8. Deployment Runbook

### Initial Deployment (One Time)

```bash
# 1. Clone and install
git clone https://github.com/shreyannarula/tools-shreyannarula
cd tools-shreyannarula
npm install

# 2. Copy FFmpeg WASM to public (postinstall should handle this, verify manually)
ls public/ffmpeg/  # should contain ffmpeg-core.js and ffmpeg-core.wasm

# 3. Download Tesseract assets
npx tesseract.js-utils download-assets public/tesseract

# 4. Create 10MB test file for speed test
dd if=/dev/urandom of=public/speed-test/10mb.bin bs=1048576 count=10

# 5. Deploy Cloudflare Workers
cd cloudflare-workers
npm install
npx wrangler deploy

# 6. Create KV namespaces
npx wrangler kv:namespace create "TOOL_DATA"
# Copy the ID to wrangler.toml's [[kv_namespaces]] binding

# 7. Deploy main site to Vercel
cd ..
vercel --prod

# 8. Set custom domain in Vercel dashboard
# tools.shreyannarula.com → add to Vercel project domains

# 9. Submit sitemap
# Google Search Console → tools.shreyannarula.com → Sitemaps → Add sitemap.xml
```

### Ongoing Deployment (Every Feature)

```bash
# Development
npm run dev              # local dev server at localhost:3000

# Before committing
npm test                 # run all unit tests
npm run build            # verify build passes

# Deploy (automatic via GitHub → Vercel CI/CD)
git push origin main     # triggers Vercel deployment automatically

# Update Cloudflare Workers (only when worker code changes)
cd cloudflare-workers && npx wrangler deploy

# Update Chrome Extension (when extension code changes)
cd extension
npm run build
npm run package          # creates dist/extension.zip
# Upload dist/extension.zip to Chrome Web Store dashboard manually
# or use the CWS Publish API for automation
```

### Environment Variables

```bash
# Vercel environment variables (set in dashboard)
NEXT_PUBLIC_SITE_URL=https://tools.shreyannarula.com
NEXT_PUBLIC_CF_WORKER_URL=https://tools.shreyannarula.com/api/worker

# Cloudflare Workers secrets (set via wrangler)
npx wrangler secret put FEEDBACK_EMAIL_TOKEN  # for Resend.com email
npx wrangler secret put GITHUB_TOKEN          # for creating GitHub issues from feedback
```

---

## 9. Monitoring & Alerting

### What to Monitor

| Metric | Tool | Alert Threshold |
|---|---|---|
| Error rate | Vercel Analytics | > 1% of requests |
| Core Web Vitals (LCP) | Vercel Analytics | > 2.5s |
| Cloudflare Worker errors | Cloudflare Dashboard | > 5 errors/hour |
| FFmpeg WASM load failures | Custom error boundary | Any failure |
| Tool processing failures | Custom error boundary | > 3% of uses |

### Lightweight Error Tracking (Free)

```typescript
// lib/utils/error-tracker.ts
// No Sentry needed — send errors to a Cloudflare Worker that logs to KV

export function trackError(error: Error, context: {
  toolId?: string
  action?: string
  userAgent?: string
}) {
  if (process.env.NODE_ENV !== 'production') return

  // Fire-and-forget — don't await this
  fetch('/api/worker/error-track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: error.message,
      stack: error.stack?.slice(0, 500),
      toolId: context.toolId,
      action: context.action,
      timestamp: Date.now(),
    }),
  }).catch(() => {})  // silently fail — never crash the app for error tracking
}
```

### Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'ok',
    tools: 110,
    timestamp: Date.now(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
  })
}
```

Set up an uptime monitor at UptimeRobot (free): ping `https://tools.shreyannarula.com/api/health` every 5 minutes. Email alert if it returns non-200.

---

## 10. Critical Rules — Final Batch

In addition to all 50 rules from Parts 1–5:

**Rule 51 — The feedback widget must never interrupt the tool workflow.** It sits in the corner, collapsed by default. It never auto-opens, never shows a modal overlay, never asks for feedback before the user has finished using the tool. Respect the user's intent — they came to use a tool, not give feedback.

**Rule 52 — Votes on the roadmap are stored per-browser, not per-account.** Use `localStorage` with key `roadmap-votes:{itemId}` to prevent voting twice. Never track across devices — this protects privacy and keeps the system simple. A power user will accept that they can only vote once per device.

**Rule 53 — The changelog is hand-curated, not auto-generated.** Never auto-generate changelog entries from Git commits. Write human-readable release notes that explain why a feature matters, not just what changed. "Added FFmpeg WASM" is bad. "You can now convert 7 audio formats in your browser — no uploads needed" is good.

**Rule 54 — The speed test files must be served from your own infrastructure.** Never use a third-party CDN for speed test data — the results will measure CDN speed, not your server speed. The 10MB binary file must be at `tools.shreyannarula.com/speed-test/10mb.bin`, served by your Vercel/Cloudflare setup.

**Rule 55 — The Workflow Builder (Phase 4) must be designed from day one, even if not built.** The tools registry `Tool` type must include a `workflowConfig` field from the start:
```typescript
interface Tool {
  // ... existing fields
  workflowConfig?: {
    acceptsInput: string[]     // MIME types this tool can accept from previous step
    producesOutput: string[]   // MIME types this tool produces
    requiredConfig: string[]   // config fields the user must set for workflow use
  }
}
```
Adding this field retroactively to 110 tools is painful. Add it now, leave it undefined for most tools, and fill it in as you build the workflow feature.

**Rule 56 — Every tool page must have an Open Graph image.** Not the same generic image — each tool's OG image should show the tool name and a visual hint of what it does. Generate them statically using Next.js `@vercel/og` (built-in, free). A tool with a proper OG image gets 3–5× more clicks when shared on social media.

**Rule 57 — Ship a newsletter from day one, not day 100.** The "New tools every week" newsletter subscriber list is the most valuable asset the project will ever have. Add the subscribe form in the changelog page and the homepage footer from launch. Even 50 subscribers is worth more than 5,000 anonymous visitors — they come back.

**Rule 58 — The `/popular` page must load tool view counts at runtime, not build time.** View counts change every minute. Use `next: { revalidate: 300 }` (5-minute ISR cache) when fetching from Cloudflare KV — don't statically generate this page or counts will be perpetually stale.

**Rule 59 — Never use `Math.random()` in any user-facing tool output.** Password generators, UUID generators, fake data generators, colour generators — all must use `crypto.getRandomValues()`. `Math.random()` is deterministic and can be predicted. For tools that generate security-sensitive values (passwords, tokens), this is not optional.

**Rule 60 — The project is never finished.** The last tool built is not tool 110. Every week, one new tool is added. Every month, the most-used tools are reviewed and improved. Every quarter, one ambitious feature from the roadmap is shipped. A tool site that stops growing starts dying. The changelog is the proof that it's alive.

---

## Closing Note

You now have the complete specification for 110 tools, a Chrome extension that makes them accessible everywhere, a feedback and voting system that makes users feel ownership, a changelog that makes them come back, and a vision that makes this something more than a tools site.

The technical work is fully specified. What remains is execution, consistency, and a bias toward shipping rather than perfecting.

Ship tool 1 on day 1. Ship tool 110 on day 110. Let users tell you which 10 of those 110 they actually love. Double down on those 10. Build 10 more around them. Repeat.

That's the whole playbook.

*tools.shreyannarula.com — built from scratch, owned completely, costs almost nothing, serves everyone.*

*Part 6 of 6. Complete. Last updated: May 2026.*
