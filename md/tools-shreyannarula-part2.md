# tools.shreyannarula.com — Part 2 Implementation Guide
### Tools 21–40: Complete Build Reference

> This is the direct continuation of Part 1. All architecture decisions, shared components (`ToolShell`, `DropZone`, `OutputPanel`, `ProcessingOverlay`), the tools registry pattern, COOP/COEP headers, and deployment setup described in Part 1 remain in force. Do not re-implement or deviate from those foundations. This document adds tools 21–40 with the same depth, code specificity, and zero ambiguity as Part 1.

---

## Context: What Was Built in Part 1

The following 20 tools are already live. Do not rebuild them:

| # | Tool | Route |
|---|---|---|
| 1 | Background Remover | `/tools/background-remover` |
| 2 | Image Compressor | `/tools/image-compressor` |
| 3 | PDF Merger & Splitter | `/tools/pdf-merger` |
| 4 | File Type Converter (Images) | `/tools/image-converter` |
| 5 | Image Resizer & Cropper | `/tools/image-resizer` |
| 6 | PDF to Image | `/tools/pdf-to-image` |
| 7 | JSON Formatter & Validator | `/tools/json-formatter` |
| 8 | Base64 Encoder / Decoder | `/tools/base64` |
| 9 | Password Generator | `/tools/password-generator` |
| 10 | Color Picker & Converter | `/tools/color-converter` |
| 11 | Word Count & Readability | `/tools/word-count` |
| 12 | Text Case Converter | `/tools/text-case` |
| 13 | QR Code Generator | `/tools/qr-code` |
| 14 | Unit Converter | `/tools/unit-converter` |
| 15 | Regex Tester | `/tools/regex-tester` |
| 16 | Markdown to HTML | `/tools/markdown-to-html` |
| 17 | CSV to JSON / JSON to CSV | `/tools/csv-json` |
| 18 | Image Color Palette Extractor | `/tools/color-palette` |
| 19 | Hash Generator | `/tools/hash-generator` |
| 20 | Diff Checker | `/tools/diff-checker` |

---

## Tools 21–40 at a Glance

| # | Tool | Route | Primary Library |
|---|---|---|---|
| 21 | Image to Text (OCR) | `/tools/image-to-text` | `tesseract.js` |
| 22 | Exif Data Viewer & Remover | `/tools/exif-viewer` | `exifr` |
| 23 | SVG Optimizer | `/tools/svg-optimizer` | `svgo` (WASM port) |
| 24 | Favicon Generator | `/tools/favicon-generator` | Canvas API |
| 25 | URL Encoder / Decoder | `/tools/url-encoder` | Built-in browser API |
| 26 | Number Base Converter | `/tools/base-converter` | Built-in `BigInt` |
| 27 | Character / Byte Counter | `/tools/char-counter` | `TextEncoder` API |
| 28 | Lorem Ipsum Generator | `/tools/lorem-ipsum` | Pure JS |
| 29 | CSS Gradient Generator | `/tools/gradient-generator` | Pure JS / Canvas |
| 30 | Color Contrast Checker | `/tools/contrast-checker` | `chroma-js` |
| 31 | JSON to CSV / CSV to JSON (Excel-aware) | `/tools/json-csv-excel` | `xlsx` + `papaparse` |
| 32 | Image Watermark Adder | `/tools/watermark` | Canvas API |
| 33 | PDF Compressor | `/tools/pdf-compressor` | `pdf-lib` + `browser-image-compression` |
| 34 | Text to Speech | `/tools/text-to-speech` | Web Speech API |
| 35 | Speech to Text | `/tools/speech-to-text` | Web Speech API |
| 36 | Pomodoro / Focus Timer | `/tools/pomodoro` | Pure JS + Web Notifications API |
| 37 | Aspect Ratio Calculator | `/tools/aspect-ratio` | Pure JS |
| 38 | HTML Entity Encoder / Decoder | `/tools/html-entities` | Pure JS |
| 39 | JWT Decoder | `/tools/jwt-decoder` | Pure JS (`atob`) |
| 40 | Timezone Converter | `/tools/timezone-converter` | `Intl.DateTimeFormat` API |

---

## Table of Contents

1. [New npm Dependencies](#1-new-npm-dependencies)
2. [Tools 21–40 Detailed Specs](#2-tools-2140-detailed-specs)
3. [New Shared Utilities Introduced in This Batch](#3-new-shared-utilities-introduced-in-this-batch)
4. [Extension Context Menu Additions](#4-extension-context-menu-additions)
5. [Phase Build Order for Tools 21–40](#5-phase-build-order-for-tools-2140)
6. [Critical Rules Specific to This Batch](#6-critical-rules-specific-to-this-batch)

---

## 1. New npm Dependencies

Install all of the following before beginning any tool in this batch:

```bash
npm install tesseract.js exifr svgo chroma-js xlsx papaparse
```

> **Note:** `chroma-js`, `xlsx`, and `papaparse` were already installed in Part 1. They are listed here because tools in this batch use them in new ways. Do not reinstall if already present — check `package.json` first.

> **Note:** `svgo` has a Node.js CLI version and a browser-compatible version. Import from `svgo/browser` specifically for client-side use. The standard `svgo` import will break in Next.js because it uses Node.js `fs` APIs.

Full dependency table for this batch:

| Package | Version (minimum) | Used By |
|---|---|---|
| `tesseract.js` | `^5.0.0` | Tool 21 |
| `exifr` | `^7.0.0` | Tool 22 |
| `svgo` | `^3.0.0` | Tool 23 — import from `svgo/browser` |
| `chroma-js` | `^2.4.0` | Tools 30 (already installed) |
| `xlsx` | `^0.18.0` | Tool 31 (already installed) |
| `papaparse` | `^5.4.0` | Tool 31 (already installed) |

No additional packages are needed. All other tools in this batch use browser-native APIs: `Canvas API`, `Web Speech API`, `Web Notifications API`, `Intl.DateTimeFormat`, `TextEncoder`, `BigInt`, and `atob/btoa`.

---

## 2. Tools 21–40 Detailed Specs

---

### Tool 21: Image to Text (OCR)
**Route:** `/tools/image-to-text`
**Library:** `tesseract.js`
**Input:** JPG, PNG, WebP, BMP, TIFF (max 20MB)
**Output:** Extracted plain text (copy or download as `.txt`)

**How it works:** Tesseract.js compiles the Tesseract OCR engine to WebAssembly and runs entirely in the browser. No image is ever sent to a server. The WASM binary and language data (~10MB for English) are downloaded once on first use and cached by the browser.

**Implementation:**

```typescript
// lib/processing/ocr.ts
import { createWorker, Worker } from 'tesseract.js'

let workerInstance: Worker | null = null

async function getWorker(): Promise<Worker> {
  if (workerInstance) return workerInstance
  // Create worker once, reuse across calls
  workerInstance = await createWorker('eng', 1, {
    // Serve worker and WASM from your public folder for reliability
    workerPath: '/tesseract/worker.min.js',
    langPath: '/tesseract/lang-data',
    corePath: '/tesseract/tesseract-core-simd.wasm.js',
    logger: (m) => {
      // m.status = 'loading tesseract core' | 'initializing api' | 'recognizing text'
      // m.progress = 0 to 1
      window.dispatchEvent(new CustomEvent('ocr-progress', {
        detail: { status: m.status, progress: m.progress }
      }))
    }
  })
  return workerInstance
}

export async function extractText(
  file: File,
  language: string = 'eng'
): Promise<{ text: string; confidence: number; words: OcrWord[] }> {
  const worker = await getWorker()

  // If language changed, reinitialize
  await worker.loadLanguage(language)
  await worker.initialize(language)

  const url = URL.createObjectURL(file)
  try {
    const result = await worker.recognize(url)
    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words.map(w => ({
        text: w.text,
        confidence: w.confidence,
        bbox: w.bbox,
      }))
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export interface OcrWord {
  text: string
  confidence: number  // 0–100
  bbox: { x0: number; y0: number; x1: number; y1: number }
}
```

**Serving Tesseract files locally (important for reliability):**
Download the Tesseract.js static files and serve from `public/tesseract/`:
```bash
# Run this once during project setup
npx tesseract.js-utils download-assets public/tesseract
```
This prevents CDN failures and ensures the tool works offline once files are cached.

**Supported languages to expose in the UI:**
`eng` (English), `fra` (French), `deu` (German), `spa` (Spanish), `hin` (Hindi), `chi_sim` (Chinese Simplified), `ara` (Arabic), `jpn` (Japanese), `kor` (Korean), `por` (Portuguese).

Only download the language pack when the user selects it — do not preload all languages.

**UI Notes:**
- Show a large image preview with a toggle to overlay bounding boxes around detected words
- Colour-code words by confidence: green (>85%), yellow (60–85%), red (<60%)
- Show overall document confidence percentage
- Language selector dropdown — changing language triggers re-recognition
- "Copy text" and "Download as .txt" buttons
- Display character and word count of extracted text
- Show a progress bar with status messages: "Loading OCR engine...", "Analysing image...", "Extracting text..."

---

### Tool 22: Exif Data Viewer & Remover
**Route:** `/tools/exif-viewer`
**Library:** `exifr`
**Input:** JPG, JPEG, TIFF, HEIC, WebP (max 50MB)
**Output:** Exif data as a table (viewer) OR a cleaned image file (remover)

**How it works:** `exifr` reads all embedded metadata (Exif, IPTC, XMP) directly from the image binary in the browser. Removing metadata is done by decoding the image onto a Canvas and re-encoding it — the Canvas API strips all metadata during `toBlob()`.

**Implementation — Reading Exif:**

```typescript
// lib/processing/exif.ts
import * as exifr from 'exifr'

export interface ExifData {
  // Camera info
  Make?: string
  Model?: string
  LensModel?: string
  FNumber?: number
  ExposureTime?: number
  ISO?: number
  FocalLength?: number
  Flash?: string
  // Image info
  ImageWidth?: number
  ImageHeight?: number
  ColorSpace?: string
  // Time
  DateTimeOriginal?: Date
  // GPS — CRITICAL: these are the privacy-sensitive fields
  latitude?: number
  longitude?: number
  GPSAltitude?: number
  // Software
  Software?: string
  Artist?: string
  Copyright?: string
}

export async function readExif(file: File): Promise<ExifData> {
  // Parse everything: Exif, GPS, IPTC, XMP, ICC
  const data = await exifr.parse(file, {
    exif: true,
    gps: true,
    iptc: true,
    xmp: true,
    icc: false,   // colour profile — not useful to show users
    translateKeys: true,
    translateValues: true,
    reviveValues: true,  // converts dates to Date objects, GPS to decimal degrees
  })
  return data ?? {}
}

export async function getGPSCoordinates(
  file: File
): Promise<{ latitude: number; longitude: number } | null> {
  const gps = await exifr.gps(file)
  return gps ?? null
}
```

**Implementation — Removing Metadata:**

```typescript
export async function stripMetadata(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      // canvas.toBlob strips ALL metadata — this is the key mechanism
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url)
        if (blob) resolve(blob)
        else reject(new Error('Failed to strip metadata'))
      }, file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.95)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Invalid image')) }
    img.src = url
  })
}
```

**UI Notes:**
- Two tabs: "View Metadata" and "Remove Metadata"
- **View tab:** Show metadata in a categorised table: Camera, Image, Date & Time, GPS Location, Copyright
- **GPS section:** Highlight GPS data with a red warning banner — "⚠️ This image contains your location. Latitude: 28.6139°N, Longitude: 77.2090°E". Render a small static map preview using OpenStreetMap tile URL (free, no API key): `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Remove tab:** Single button "Remove All Metadata & Download". Show before/after file size comparison (metadata removal usually saves 10–50KB).
- Show "No metadata found" state gracefully for PNG files and screenshots

---

### Tool 23: SVG Optimizer
**Route:** `/tools/svg-optimizer`
**Library:** `svgo` (import from `svgo/browser`)
**Input:** `.svg` file or paste SVG code directly (max 5MB)
**Output:** Optimised `.svg` file

**How it works:** SVGO (SVG Optimiser) is a Node.js-based tool that removes redundant elements, comments, hidden elements, default values, and collapses groups. The `svgo/browser` export strips Node.js dependencies and runs in the browser.

**Critical Import (this is the most common mistake with SVGO in Next.js):**
```typescript
// ✅ CORRECT — browser-safe import
import { optimize } from 'svgo/browser'

// ❌ WRONG — will throw "Module not found: fs" during Next.js build
import { optimize } from 'svgo'
```

**Implementation:**

```typescript
// lib/processing/svg-optimizer.ts
import { optimize, Config } from 'svgo/browser'

export interface SvgOptimizationOptions {
  removeComments: boolean
  removeMetadata: boolean
  removeTitle: boolean
  removeDesc: boolean
  removeHiddenElems: boolean
  collapseGroups: boolean
  convertColors: boolean       // converts rgb() to hex, etc.
  convertPathData: boolean     // simplifies path d="" attributes
  mergePaths: boolean
  removeUselessDefs: boolean
  cleanupIds: boolean          // shortens IDs to single characters
  minifyStyles: boolean
  removeEmptyAttrs: boolean
  removeEmptyContainers: boolean
  precision: number            // decimal precision for numbers (1–8, default 3)
}

export function optimizeSVG(
  svgString: string,
  options: SvgOptimizationOptions
): { data: string; originalSize: number; optimizedSize: number; savings: number } {
  const originalSize = new Blob([svgString]).size

  const config: Config = {
    multipass: true,  // run multiple passes until no further reduction
    plugins: [
      { name: 'removeComments', active: options.removeComments },
      { name: 'removeMetadata', active: options.removeMetadata },
      { name: 'removeTitle', active: options.removeTitle },
      { name: 'removeDesc', active: options.removeDesc },
      { name: 'removeHiddenElems', active: options.removeHiddenElems },
      { name: 'collapseGroups', active: options.collapseGroups },
      { name: 'convertColors', active: options.convertColors },
      {
        name: 'convertPathData',
        active: options.convertPathData,
        params: { floatPrecision: options.precision }
      },
      { name: 'mergePaths', active: options.mergePaths },
      { name: 'removeUselessDefs', active: options.removeUselessDefs },
      { name: 'cleanupIds', active: options.cleanupIds },
      { name: 'minifyStyles', active: options.minifyStyles },
      { name: 'removeEmptyAttrs', active: options.removeEmptyAttrs },
      { name: 'removeEmptyContainers', active: options.removeEmptyContainers },
    ],
  }

  const result = optimize(svgString, config)
  const optimizedSize = new Blob([result.data]).size

  return {
    data: result.data,
    originalSize,
    optimizedSize,
    savings: Math.round(((originalSize - optimizedSize) / originalSize) * 100),
  }
}
```

**UI Notes:**
- Three input methods: file upload, drag-and-drop, paste SVG code directly into a textarea
- Show before/after SVG rendered side-by-side (render inside `<img src="data:image/svg+xml,...">` tags)
- Show savings percentage prominently: "Reduced by 68% (48KB → 15KB)"
- Toggles for each optimisation option with clear descriptions — grouped into "Safe" and "Aggressive" presets
- Copy optimised SVG code button + Download button
- Warn if `cleanupIds` is enabled: "⚠️ This may break SVGs that reference IDs from external CSS or JavaScript"

---

### Tool 24: Favicon Generator
**Route:** `/tools/favicon-generator`
**Library:** Canvas API (built-in) + `jszip`
**Input:** Any image (PNG, JPG, SVG) — ideally square, min 512×512px
**Output:** ZIP file containing all favicon sizes and an HTML snippet

**How it works:** The source image is drawn onto multiple Canvas elements at different sizes and exported as PNG. A `.ico` file is also generated by manually constructing the ICO binary format (no library needed — the ICO format is simple enough to build from scratch). The result is a ZIP using `jszip`.

**ICO file sizes to generate:**
`16×16`, `32×32`, `48×48`, `64×64`, `128×128`, `256×256`

**PNG files to generate (for modern web):**
`192×192` (Android Chrome), `512×512` (PWA splash), `180×180` (Apple Touch Icon), `32×32`, `16×16`

**Implementation:**

```typescript
// lib/processing/favicon.ts
import JSZip from 'jszip'

async function resizeToCanvas(
  img: HTMLImageElement,
  size: number
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  // Use high-quality downscaling
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, size, size)
  return canvas
}

async function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png'): Promise<Blob> {
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), type, 1.0))
}

// Build a minimal .ico file from 16x16 and 32x32 PNG blobs
async function buildIcoFile(pngBlobs: Blob[]): Promise<Blob> {
  // ICO format: ICONDIR header + ICONDIRENTRY[] + image data
  const pngBuffers = await Promise.all(pngBlobs.map(b => b.arrayBuffer()))

  const ICONDIR_SIZE = 6
  const ICONDIRENTRY_SIZE = 16
  const headerSize = ICONDIR_SIZE + ICONDIRENTRY_SIZE * pngBuffers.length

  let offset = headerSize
  const header = new DataView(new ArrayBuffer(headerSize))

  // ICONDIR: reserved=0, type=1 (ICO), count
  header.setUint16(0, 0, true)
  header.setUint16(2, 1, true)
  header.setUint16(4, pngBuffers.length, true)

  const sizes = [16, 32]  // matches pngBlobs order
  pngBuffers.forEach((buf, i) => {
    const base = ICONDIR_SIZE + i * ICONDIRENTRY_SIZE
    const size = sizes[i]
    header.setUint8(base, size === 256 ? 0 : size)   // width (0 = 256)
    header.setUint8(base + 1, size === 256 ? 0 : size) // height
    header.setUint8(base + 2, 0)   // color count (0 = no palette)
    header.setUint8(base + 3, 0)   // reserved
    header.setUint16(base + 4, 1, true)  // color planes
    header.setUint16(base + 6, 32, true) // bits per pixel
    header.setUint32(base + 8, buf.byteLength, true)
    header.setUint32(base + 12, offset, true)
    offset += buf.byteLength
  })

  const parts = [header.buffer, ...pngBuffers]
  return new Blob(parts, { type: 'image/x-icon' })
}

export async function generateFavicons(file: File): Promise<Blob> {
  const img = new Image()
  const url = URL.createObjectURL(file)

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Invalid image'))
    img.src = url
  })

  const pngSizes = [16, 32, 48, 64, 180, 192, 512]
  const zip = new JSZip()
  const folder = zip.folder('favicons')!

  // Generate all PNGs
  for (const size of pngSizes) {
    const canvas = await resizeToCanvas(img, size)
    const blob = await canvasToBlob(canvas)
    folder.file(`favicon-${size}x${size}.png`, blob)
  }

  // Generate .ico (16 + 32 embedded)
  const ico16Canvas = await resizeToCanvas(img, 16)
  const ico32Canvas = await resizeToCanvas(img, 32)
  const ico16Blob = await canvasToBlob(ico16Canvas)
  const ico32Blob = await canvasToBlob(ico32Canvas)
  const icoBlob = await buildIcoFile([ico16Blob, ico32Blob])
  folder.file('favicon.ico', icoBlob)

  // Add HTML snippet as a text file
  const htmlSnippet = `<!-- Paste this into your <head> -->
<link rel="icon" type="image/x-icon" href="/favicons/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicons/favicon-180x180.png">
<link rel="icon" type="image/png" sizes="192x192" href="/favicons/favicon-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/favicons/favicon-512x512.png">
`
  folder.file('README-paste-in-head.html', htmlSnippet)

  URL.revokeObjectURL(url)
  return await zip.generateAsync({ type: 'blob' })
}
```

**UI Notes:**
- Show a grid preview of all generated sizes (16, 32, 48, 180, 192, 512) before downloading
- Warn if input image is smaller than 512×512: "⚠️ For best results, use an image at least 512×512 pixels"
- The download is a single ZIP file containing all sizes + HTML snippet
- Show the HTML snippet inline with a copy button so users can paste it immediately

---

### Tool 25: URL Encoder / Decoder
**Route:** `/tools/url-encoder`
**Library:** None — built-in browser APIs only
**Input:** Plain text or encoded URL string
**Output:** Encoded or decoded string

**How it works:** The browser's built-in `encodeURIComponent`, `decodeURIComponent`, `encodeURI`, and `decodeURI` functions handle all encoding. The tool also handles URL parsing to show individual query parameter components.

**Implementation:**

```typescript
// lib/processing/url-encoder.ts

export type EncodingMode = 'component' | 'full' | 'base64' | 'form'

export function encodeURL(input: string, mode: EncodingMode): string {
  switch (mode) {
    case 'component':
      return encodeURIComponent(input)
    case 'full':
      return encodeURI(input)
    case 'base64':
      return btoa(unescape(encodeURIComponent(input)))
    case 'form':
      // application/x-www-form-urlencoded encoding (spaces become +)
      return encodeURIComponent(input).replace(/%20/g, '+')
  }
}

export function decodeURL(input: string, mode: EncodingMode): string {
  try {
    switch (mode) {
      case 'component':
        return decodeURIComponent(input)
      case 'full':
        return decodeURI(input)
      case 'base64':
        return decodeURIComponent(escape(atob(input)))
      case 'form':
        return decodeURIComponent(input.replace(/\+/g, ' '))
    }
  } catch {
    return '[Invalid encoding — could not decode]'
  }
}

// Parse a URL and return its components
export function parseURL(url: string): {
  protocol: string
  host: string
  pathname: string
  params: { key: string; value: string; decoded: string }[]
  hash: string
} | null {
  try {
    const parsed = new URL(url)
    const params = [...parsed.searchParams.entries()].map(([key, value]) => ({
      key,
      value,  // raw (encoded) value
      decoded: decodeURIComponent(value),
    }))
    return {
      protocol: parsed.protocol,
      host: parsed.host,
      pathname: parsed.pathname,
      params,
      hash: parsed.hash,
    }
  } catch {
    return null
  }
}
```

**UI Notes:**
- Auto-detect mode: if input contains `%20` or `%2F`, default to decode; otherwise default to encode
- Four encoding mode tabs: "URI Component" (most common), "Full URI", "Base64", "Form Encoded"
- Below the encoder/decoder, show a URL parser section: paste any URL and see a neat breakdown of protocol, host, path, and each query parameter on its own row (key → decoded value)
- "Swap" button to flip input and output

---

### Tool 26: Number Base Converter
**Route:** `/tools/base-converter`
**Library:** None — built-in `BigInt` (supports arbitrarily large numbers)
**Input:** A number and its source base
**Output:** The same number in all other bases simultaneously

**Why `BigInt` instead of `parseInt`:** `parseInt` is limited to 32-bit integers. Binary, hex, and octal numbers in real use (cryptographic keys, memory addresses, colour values) often exceed this. `BigInt` handles numbers of arbitrary size correctly.

**Implementation:**

```typescript
// lib/processing/base-converter.ts

export interface BaseConversionResult {
  binary: string       // Base 2
  octal: string        // Base 8
  decimal: string      // Base 10
  hexadecimal: string  // Base 16 (uppercase)
  base32: string       // Base 32
  base36: string       // Base 36
  base64value: string  // Base 64 (numeric, not the encoding standard)
  isNegative: boolean
}

export function convertBase(
  input: string,
  fromBase: number
): BaseConversionResult | { error: string } {
  // Sanitise input
  const clean = input.trim().replace(/\s/g, '')
  if (!clean) return { error: 'Input is empty' }

  const isNegative = clean.startsWith('-')
  const digits = isNegative ? clean.slice(1) : clean

  // Validate all characters are valid for the given base
  const validChars = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, fromBase)
  const lowerDigits = digits.toLowerCase()
  for (const char of lowerDigits) {
    if (!validChars.includes(char)) {
      return { error: `Character "${char}" is not valid in base ${fromBase}` }
    }
  }

  try {
    const value = BigInt(isNegative ? `-0x${toHex(lowerDigits, fromBase)}` : `0x${toHex(lowerDigits, fromBase)}`)
    const abs = isNegative ? -value : value
    const prefix = isNegative ? '-' : ''

    return {
      binary: prefix + abs.toString(2),
      octal: prefix + abs.toString(8),
      decimal: prefix + abs.toString(10),
      hexadecimal: prefix + abs.toString(16).toUpperCase(),
      base32: prefix + abs.toString(32).toUpperCase(),
      base36: prefix + abs.toString(36).toUpperCase(),
      base64value: prefix + abs.toString(64 as any) || encodeBase64Numeric(abs),
      isNegative,
    }
  } catch {
    return { error: 'Number is too large or invalid' }
  }
}

// Convert a number string in arbitrary base to hex string (for BigInt construction)
function toHex(digits: string, fromBase: number): string {
  let result = BigInt(0)
  const base = BigInt(fromBase)
  for (const char of digits) {
    result = result * base + BigInt(parseInt(char, fromBase))
  }
  return result.toString(16)
}
```

**UI Notes:**
- Large input field with a "Base" selector (dropdown: 2, 8, 10, 16, or custom 2–36)
- Live conversion as user types — all output fields update simultaneously
- Each output row has its own copy button
- Show common base labels: "Binary (Base 2)", "Octal (Base 8)", "Decimal (Base 10)", "Hexadecimal (Base 16)"
- Highlight grouping: format binary output in groups of 4 (e.g., `1010 1111 0011`) and hex in groups of 2 (e.g., `AF 3B`) — toggle this formatting on/off
- Common use cases section: "Colour hex to decimal", "Binary to decimal for networking"

---

### Tool 27: Character / Byte Counter
**Route:** `/tools/char-counter`
**Library:** `TextEncoder` API (built-in)
**Input:** Text typed or pasted into a textarea
**Output:** Live statistics panel

**How it works:** JavaScript strings are UTF-16 internally. `TextEncoder` converts to UTF-8 and returns the true byte count, which differs from character count for non-ASCII text (emoji, Chinese characters, Arabic, etc.). This is important for developers working with APIs, databases, and file systems.

**Implementation:**

```typescript
// lib/processing/char-counter.ts

export interface TextStats {
  characters: number           // Total chars including spaces
  charactersNoSpaces: number   // Chars excluding whitespace
  words: number
  uniqueWords: number
  sentences: number
  paragraphs: number
  lines: number
  bytesUTF8: number            // Bytes in UTF-8 encoding
  bytesUTF16: number           // Bytes in UTF-16 encoding (JS internal)
  bytesASCII: number           // Bytes if all chars are ASCII (may differ)
  longestWord: string
  mostFrequentWords: { word: string; count: number }[]
  avgWordLength: number
  readingTimeSeconds: number
  speakingTimeSeconds: number
}

export function analyzeText(text: string): TextStats {
  const encoder = new TextEncoder()  // Always UTF-8

  const words = text.trim().length === 0
    ? []
    : text.trim().split(/\s+/).filter(Boolean)

  const wordFrequency: Record<string, number> = {}
  words.forEach(w => {
    const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (clean) wordFrequency[clean] = (wordFrequency[clean] ?? 0) + 1
  })

  const sortedWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const longestWord = words.reduce(
    (longest, w) => w.length > longest.length ? w : longest, ''
  )

  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    words: words.length,
    uniqueWords: new Set(words.map(w => w.toLowerCase())).size,
    sentences: (text.match(/[.!?]+/g) ?? []).length,
    paragraphs: text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
    lines: text.split('\n').length,
    bytesUTF8: encoder.encode(text).byteLength,
    bytesUTF16: text.length * 2,  // JS uses 2 bytes per char (UTF-16)
    bytesASCII: [...text].reduce((acc, c) => acc + (c.charCodeAt(0) > 127 ? 0 : 1), 0),
    longestWord,
    mostFrequentWords: sortedWords.map(([word, count]) => ({ word, count })),
    avgWordLength: words.length === 0 ? 0 : (
      words.reduce((acc, w) => acc + w.replace(/[^a-z]/gi, '').length, 0) / words.length
    ),
    readingTimeSeconds: Math.round((words.length / 238) * 60),   // 238 wpm
    speakingTimeSeconds: Math.round((words.length / 150) * 60),  // 150 wpm
  }
}
```

**UI Notes:**
- Large textarea that fills the viewport — this is primarily a typing/pasting tool
- Stats panel to the right (desktop) or below (mobile), updates live with 100ms debounce
- Stats grouped into: "Basic" (chars, words, lines), "Advanced" (bytes, unique words), "Time" (reading, speaking), "Frequency" (top 10 words bar chart)
- Platform-specific byte limits section: show a subtle colour indicator when text approaches common limits: Twitter (280 chars), SMS (160 chars / 1120 Unicode), MySQL TEXT (65,535 bytes), PostgreSQL varchar(255)

---

### Tool 28: Lorem Ipsum Generator
**Route:** `/tools/lorem-ipsum`
**Library:** None — pure JS with pre-loaded word bank
**Input:** Configuration options (count, type, format)
**Output:** Generated placeholder text

**How it works:** A curated word bank of ~200 lorem ipsum words is hardcoded. Words are selected using `crypto.getRandomValues()` (cryptographically random, not `Math.random()`) to ensure non-repeating, natural-looking output. Sentence and paragraph structures follow realistic length distributions.

**Implementation:**

```typescript
// lib/processing/lorem-ipsum.ts

const WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'est', 'laborum', 'perspiciatis', 'unde', 'omnis',
  'iste', 'natus', 'error', 'voluptatem', 'accusantium', 'doloremque', 'laudantium',
  'totam', 'rem', 'aperiam', 'eaque', 'ipsa', 'quae', 'ab', 'illo', 'inventore',
  'veritatis', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta', 'explicabo',
]

function secureRandom(max: number): number {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0] % max
}

function randomInRange(min: number, max: number): number {
  return min + secureRandom(max - min + 1)
}

function generateSentence(wordCount: number): string {
  const words = Array.from({ length: wordCount }, () => WORDS[secureRandom(WORDS.length)])
  // Capitalise first word
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1)
  // Randomly add a comma mid-sentence
  if (wordCount > 6 && secureRandom(3) === 0) {
    const commaPos = randomInRange(3, wordCount - 3)
    words[commaPos] = words[commaPos] + ','
  }
  return words.join(' ') + '.'
}

function generateParagraph(sentenceCount: number): string {
  return Array.from({ length: sentenceCount }, () => {
    const wordCount = randomInRange(8, 20)
    return generateSentence(wordCount)
  }).join(' ')
}

export type LoremOutputType = 'paragraphs' | 'sentences' | 'words' | 'bytes'
export type LoremFormat = 'plain' | 'html' | 'markdown'

export function generateLorem(
  count: number,
  type: LoremOutputType,
  format: LoremFormat,
  startWithLorem: boolean
): string {
  let result: string

  switch (type) {
    case 'paragraphs': {
      const paragraphs = Array.from({ length: count }, (_, i) => {
        const sentenceCount = randomInRange(3, 7)
        let para = generateParagraph(sentenceCount)
        if (i === 0 && startWithLorem) {
          para = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + para
        }
        return para
      })
      if (format === 'html') result = paragraphs.map(p => `<p>${p}</p>`).join('\n')
      else if (format === 'markdown') result = paragraphs.join('\n\n')
      else result = paragraphs.join('\n\n')
      break
    }
    case 'sentences': {
      const sentences = Array.from({ length: count }, (_, i) => {
        const wordCount = randomInRange(8, 20)
        const sentence = generateSentence(wordCount)
        return (i === 0 && startWithLorem) ? 'Lorem ipsum dolor sit amet. ' + sentence : sentence
      })
      result = sentences.join(' ')
      break
    }
    case 'words': {
      const words = Array.from({ length: count }, () => WORDS[secureRandom(WORDS.length)])
      if (startWithLorem) { words[0] = 'lorem'; words[1] = 'ipsum' }
      result = words.join(' ')
      break
    }
    case 'bytes': {
      // Generate text until we reach target byte count
      let text = ''
      const encoder = new TextEncoder()
      while (encoder.encode(text).byteLength < count) {
        text += generateParagraph(randomInRange(3, 6)) + '\n\n'
      }
      result = text.slice(0, count)  // approximate trim
      break
    }
  }

  return result!
}
```

**UI Notes:**
- Count input + type selector (paragraphs / sentences / words / bytes)
- Format selector (Plain Text / HTML `<p>` tags / Markdown)
- "Start with Lorem ipsum" toggle
- Output in a scrollable textarea
- Copy and Download buttons
- Live character and word count of generated text
- Quick presets: "1 paragraph", "5 paragraphs", "100 words", "500 words"

---

### Tool 29: CSS Gradient Generator
**Route:** `/tools/gradient-generator`
**Library:** None — pure JS + Canvas API
**Input:** Colour stops, angle, gradient type (UI controls)
**Output:** CSS gradient string + PNG preview

**Implementation:**

```typescript
// lib/processing/gradient.ts

export type GradientType = 'linear' | 'radial' | 'conic'

export interface ColorStop {
  id: string       // unique id for React key
  color: string    // hex colour e.g. "#ff6b6b"
  position: number // 0–100 (percentage)
}

export interface GradientConfig {
  type: GradientType
  stops: ColorStop[]
  angle: number             // degrees, used for linear and conic
  radialShape?: 'circle' | 'ellipse'
  radialPosition?: { x: number; y: number }  // 0–100 percent
  repeating: boolean
}

export function generateCSSGradient(config: GradientConfig): string {
  const stopStrings = config.stops
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(s => `${s.color} ${s.position}%`)
    .join(', ')

  const prefix = config.repeating ? 'repeating-' : ''

  switch (config.type) {
    case 'linear':
      return `${prefix}linear-gradient(${config.angle}deg, ${stopStrings})`
    case 'radial': {
      const shape = config.radialShape ?? 'ellipse'
      const pos = config.radialPosition ?? { x: 50, y: 50 }
      return `${prefix}radial-gradient(${shape} at ${pos.x}% ${pos.y}%, ${stopStrings})`
    }
    case 'conic':
      return `${prefix}conic-gradient(from ${config.angle}deg, ${stopStrings})`
  }
}

// Generate multiple CSS variations (for copy convenience)
export function generateCSSVariations(config: GradientConfig): {
  background: string
  backgroundImage: string
  tailwind: string
} {
  const gradient = generateCSSGradient(config)
  return {
    background: `background: ${gradient};`,
    backgroundImage: `background-image: ${gradient};`,
    tailwind: `[Note: Tailwind doesn't support arbitrary gradients natively. Use inline style or extend tailwind.config.js]`,
  }
}
```

**UI Notes:**
- Full-viewport gradient preview panel (left or top half)
- Gradient type tabs: Linear / Radial / Conic
- Angle slider (0–360°) with degree input — rotates in real-time
- Colour stop bar: visual draggable stops along a gradient track
  - Click the track to add a new stop
  - Click a stop to edit its colour (native `<input type="color">`)
  - Drag stops to reposition
  - Delete button on each stop (minimum 2 stops enforced)
- CSS output box with syntax highlighting, copy button
- Presets gallery: "Sunset", "Ocean", "Forest", "Fire", "Midnight", "Cotton Candy" (10 presets)
- "Randomise" button generates a random aesthetically pleasing gradient using a curated hue spacing algorithm

---

### Tool 30: Color Contrast Checker
**Route:** `/tools/contrast-checker`
**Library:** `chroma-js` (already installed from Part 1)
**Input:** Two hex/RGB/HSL colour values
**Output:** Contrast ratio + WCAG compliance ratings

**How it works:** WCAG (Web Content Accessibility Guidelines) contrast ratios are calculated using relative luminance values. The formula is standardised: `(L1 + 0.05) / (L2 + 0.05)` where L1 is the lighter luminance.

**Implementation:**

```typescript
// lib/processing/contrast-checker.ts
import chroma from 'chroma-js'

export interface ContrastResult {
  ratio: number          // e.g. 7.42 (higher = more contrast)
  ratioString: string    // e.g. "7.42:1"

  // WCAG 2.1 ratings (current standard)
  wcagAA_normal: 'pass' | 'fail'     // requires 4.5:1
  wcagAA_large: 'pass' | 'fail'      // requires 3:1 (18pt+ or 14pt+ bold)
  wcagAAA_normal: 'pass' | 'fail'    // requires 7:1
  wcagAAA_large: 'pass' | 'fail'     // requires 4.5:1

  // WCAG 3.0 / APCA (emerging standard, informational only)
  apca: number   // APCA Lc value (0–106)

  // Visual simulation
  foregroundLuminance: number
  backgroundLuminance: number
  isLightOnDark: boolean
}

export function checkContrast(foreground: string, background: string): ContrastResult {
  const fg = chroma(foreground)
  const bg = chroma(background)

  const ratio = chroma.contrast(fg, bg)
  const fgLum = fg.luminance()
  const bgLum = bg.luminance()

  return {
    ratio,
    ratioString: `${ratio.toFixed(2)}:1`,
    wcagAA_normal: ratio >= 4.5 ? 'pass' : 'fail',
    wcagAA_large: ratio >= 3.0 ? 'pass' : 'fail',
    wcagAAA_normal: ratio >= 7.0 ? 'pass' : 'fail',
    wcagAAA_large: ratio >= 4.5 ? 'pass' : 'fail',
    apca: calculateAPCA(fgLum, bgLum),
    foregroundLuminance: fgLum,
    backgroundLuminance: bgLum,
    isLightOnDark: bgLum < fgLum,
  }
}

// Simplified APCA calculation (informational — not a replacement for WCAG)
function calculateAPCA(fgLum: number, bgLum: number): number {
  const sapc = (bgLum > fgLum)
    ? 1.14 * (Math.pow(bgLum, 0.56) - Math.pow(fgLum, 0.57))
    : 1.14 * (Math.pow(bgLum, 0.65) - Math.pow(fgLum, 0.62))
  return Math.abs(sapc) * 100
}

// Find the closest accessible colour to a given foreground
export function findAccessibleAlternative(
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): string {
  const fg = chroma(foreground)
  const bg = chroma(background)
  const bgLum = bg.luminance()

  // Darken or lighten the foreground until contrast is met
  let adjusted = fg
  for (let i = 0; i <= 100; i++) {
    const ratio = chroma.contrast(adjusted, bg)
    if (ratio >= targetRatio) return adjusted.hex()
    adjusted = bgLum < 0.5
      ? chroma.mix(adjusted, 'white', 0.02)  // lighten for dark bg
      : chroma.mix(adjusted, 'black', 0.02)  // darken for light bg
  }
  return adjusted.hex()
}
```

**UI Notes:**
- Two large colour pickers (foreground + background) with live preview
- Big preview area showing sample text at normal size (16px), large size (24px), and bold (14px bold) on the chosen colours
- Results grid showing AA/AAA pass/fail badges for normal and large text
- Colour swap button (flip foreground/background)
- "Fix Contrast" button: when failing, suggests the nearest colour that passes AA — shows the adjusted colour and how much it differs
- Real-world preview: show the colours as a fake button, a fake link, and a fake card UI element
- "Blindness Simulation" toggle: simulate how the colour pair looks for Deuteranopia, Protanopia, Tritanopia (use CSS filter approximations)

---

### Tool 31: JSON to Excel / Excel to JSON
**Route:** `/tools/json-excel`
**Library:** `xlsx` (SheetJS) — already installed
**Input:** JSON array (→ Excel) or `.xlsx`/`.xls`/`.csv` file (→ JSON)
**Output:** `.xlsx` file or JSON string

**Note:** This is distinct from Tool 17 (CSV↔JSON). This tool handles binary Excel files and multi-sheet workbooks, which CSV cannot represent.

**Implementation:**

```typescript
// lib/processing/excel.ts
import * as XLSX from 'xlsx'

// JSON array → Excel workbook
export function jsonToExcel(
  data: object[],
  sheetName: string = 'Sheet1',
  filename: string = 'export.xlsx'
): Blob {
  if (data.length === 0) throw new Error('Input JSON array is empty')

  const worksheet = XLSX.utils.json_to_sheet(data, {
    header: Object.keys(data[0]),  // use first object's keys as column headers
  })

  // Auto-fit column widths based on content
  const colWidths = Object.keys(data[0]).map(key => ({
    wch: Math.max(
      key.length,
      ...data.map(row => String((row as Record<string, unknown>)[key] ?? '').length)
    ) + 2  // +2 padding
  }))
  worksheet['!cols'] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
}

// Multiple JSON arrays → multi-sheet Excel
export function jsonToMultiSheetExcel(
  sheets: { name: string; data: object[] }[]
): Blob {
  const workbook = XLSX.utils.book_new()
  sheets.forEach(({ name, data }) => {
    const worksheet = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(workbook, worksheet, name)
  })
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
}

// Excel → JSON (reads first sheet by default)
export async function excelToJSON(
  file: File,
  sheetIndex: number = 0
): Promise<{ data: object[]; sheets: string[] }> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,    // parse dates as Date objects, not serial numbers
    cellNF: false,
    cellText: false,
  })

  const sheetNames = workbook.SheetNames
  const worksheet = workbook.Sheets[sheetNames[sheetIndex]]
  const data = XLSX.utils.sheet_to_json(worksheet, {
    defval: null,       // use null for empty cells, not undefined
    raw: false,         // format dates as strings
  })

  return { data: data as object[], sheets: sheetNames }
}
```

**UI Notes:**
- Two tabs: "JSON → Excel" and "Excel → JSON"
- **JSON → Excel tab:** Textarea for JSON input (validates in real-time), sheet name input, Download `.xlsx` button. Show a table preview of the first 10 rows.
- **Excel → JSON tab:** File upload, sheet selector dropdown (populated after file is read), output JSON in a formatted code block. Copy and Download as `.json` buttons.
- Handle malformed JSON with a clear inline error message pointing to the approximate error location

---

### Tool 32: Image Watermark Adder
**Route:** `/tools/watermark`
**Library:** Canvas API (built-in)
**Input:** Image file + watermark text or watermark image
**Output:** Watermarked image (same format as input)

**Implementation:**

```typescript
// lib/processing/watermark.ts

export type WatermarkPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'tile'  // repeat across entire image

export interface TextWatermarkOptions {
  type: 'text'
  text: string
  fontFamily: string       // e.g. "Arial"
  fontSize: number         // px, relative to image width
  color: string            // hex
  opacity: number          // 0–1
  rotation: number         // degrees
  position: WatermarkPosition
  padding: number          // px from edge
}

export interface ImageWatermarkOptions {
  type: 'image'
  watermarkFile: File
  opacity: number
  scale: number            // 0.05–0.5 (fraction of base image width)
  position: WatermarkPosition
  padding: number
}

export type WatermarkOptions = TextWatermarkOptions | ImageWatermarkOptions

function getPositionCoords(
  position: WatermarkPosition,
  canvasW: number,
  canvasH: number,
  markW: number,
  markH: number,
  padding: number
): { x: number; y: number } {
  const positions: Record<Exclude<WatermarkPosition, 'tile'>, { x: number; y: number }> = {
    'top-left':      { x: padding, y: padding },
    'top-center':    { x: (canvasW - markW) / 2, y: padding },
    'top-right':     { x: canvasW - markW - padding, y: padding },
    'center-left':   { x: padding, y: (canvasH - markH) / 2 },
    'center':        { x: (canvasW - markW) / 2, y: (canvasH - markH) / 2 },
    'center-right':  { x: canvasW - markW - padding, y: (canvasH - markH) / 2 },
    'bottom-left':   { x: padding, y: canvasH - markH - padding },
    'bottom-center': { x: (canvasW - markW) / 2, y: canvasH - markH - padding },
    'bottom-right':  { x: canvasW - markW - padding, y: canvasH - markH - padding },
  }
  return positions[position as Exclude<WatermarkPosition, 'tile'>] ?? positions['bottom-right']
}

export async function addWatermark(
  baseFile: File,
  options: WatermarkOptions
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    const baseImg = new Image()
    const baseUrl = URL.createObjectURL(baseFile)
    baseImg.onload = async () => {
      canvas.width = baseImg.naturalWidth
      canvas.height = baseImg.naturalHeight
      ctx.drawImage(baseImg, 0, 0)
      URL.revokeObjectURL(baseUrl)

      ctx.globalAlpha = options.opacity

      if (options.type === 'text') {
        const fontSize = Math.round(canvas.width * (options.fontSize / 100))
        ctx.font = `${fontSize}px ${options.fontFamily}`
        ctx.fillStyle = options.color

        const metrics = ctx.measureText(options.text)
        const textW = metrics.width
        const textH = fontSize  // approximation

        if (options.position === 'tile') {
          // Tile diagonally across the image
          ctx.save()
          const step = Math.max(textW, textH) * 2.5
          for (let y = -canvas.height; y < canvas.height * 2; y += step) {
            for (let x = -canvas.width; x < canvas.width * 2; x += step) {
              ctx.save()
              ctx.translate(x + textW / 2, y + textH / 2)
              ctx.rotate((options.rotation * Math.PI) / 180)
              ctx.fillText(options.text, -textW / 2, 0)
              ctx.restore()
            }
          }
          ctx.restore()
        } else {
          const { x, y } = getPositionCoords(
            options.position, canvas.width, canvas.height, textW, textH, options.padding
          )
          ctx.save()
          ctx.translate(x + textW / 2, y + textH / 2)
          ctx.rotate((options.rotation * Math.PI) / 180)
          ctx.fillText(options.text, -textW / 2, 0)
          ctx.restore()
        }
      }

      ctx.globalAlpha = 1.0
      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to apply watermark'))
      }, baseFile.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.95)
    }
    baseImg.onerror = () => reject(new Error('Invalid image'))
    baseImg.src = baseUrl
  })
}
```

**UI Notes:**
- Two watermark type tabs: "Text" and "Image"
- **Text tab:** Text input, font family dropdown (web-safe fonts), font size slider (1–15% of image width), colour picker, opacity slider, rotation slider (-90° to +90°)
- **Image tab:** Upload a second image (logo/signature) to use as the watermark, with opacity and scale controls
- 3×3 position grid selector (visual grid of 9 clickable positions + "Tile" option)
- Live preview: show watermarked result in real-time as settings change (debounce 300ms for performance)
- Batch mode: accept multiple base images, apply same watermark settings to all, download as ZIP

---

### Tool 33: PDF Compressor
**Route:** `/tools/pdf-compressor`
**Library:** `pdf-lib` + `browser-image-compression`
**Input:** PDF file (max 100MB)
**Output:** Compressed PDF file

**How it works:** True PDF compression at the byte level (like Ghostscript) is not possible in a browser. Instead, use a highly effective approximation: extract each page as an image using `pdfjs-dist`, compress the images using `browser-image-compression`, then reassemble them into a new PDF using `pdf-lib`. This results in 40–80% size reduction for typical scanned PDFs and image-heavy documents.

**Important caveat:** This approach converts PDF pages to rasterised images and reassembles. Text in the output PDF will not be selectable/searchable. Warn the user clearly.

**Implementation:**

```typescript
// lib/processing/pdf-compressor.ts
import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import imageCompression from 'browser-image-compression'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

export type CompressionLevel = 'low' | 'medium' | 'high'

const COMPRESSION_SETTINGS: Record<CompressionLevel, { dpi: number; quality: number }> = {
  low:    { dpi: 150, quality: 0.85 },  // Good quality, moderate compression
  medium: { dpi: 120, quality: 0.70 },  // Balanced
  high:   { dpi: 96,  quality: 0.50 },  // Max compression, lower quality
}

export async function compressPDF(
  file: File,
  level: CompressionLevel,
  onProgress: (current: number, total: number) => void
): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const totalPages = pdf.numPages
  const { dpi, quality } = COMPRESSION_SETTINGS[level]
  const scale = dpi / 72

  const outputPdf = await PDFDocument.create()

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress(pageNum - 1, totalPages)
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale })

    // Render page to canvas
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, viewport }).promise

    // Canvas → Blob → Compress
    const originalBlob = await new Promise<Blob>(resolve =>
      canvas.toBlob(b => resolve(b!), 'image/jpeg', 1.0)
    )

    const compressedFile = await imageCompression(
      new File([originalBlob], 'page.jpg', { type: 'image/jpeg' }),
      { maxSizeMB: 0.5, useWebWorker: true, initialQuality: quality }
    )

    const compressedBytes = new Uint8Array(await compressedFile.arrayBuffer())
    const image = await outputPdf.embedJpg(compressedBytes)

    // Use original page dimensions for the PDF page
    const originalViewport = page.getViewport({ scale: 1 })
    const pdfPage = outputPdf.addPage([originalViewport.width, originalViewport.height])
    pdfPage.drawImage(image, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    })
  }

  onProgress(totalPages, totalPages)
  return await outputPdf.save()
}
```

**UI Notes:**
- Three compression level buttons: "Low (Best Quality)", "Medium (Balanced)", "High (Smallest File)"
- Show estimated output size next to each level (based on original size × compression factor approximation)
- Show page-by-page progress bar during compression
- **Prominent warning banner:** "⚠️ Compression converts pages to images. Text will no longer be selectable in the output PDF. Use this for scanned documents or image-heavy PDFs."
- Show before/after file sizes and percentage reduction after completion

---

### Tool 34: Text to Speech
**Route:** `/tools/text-to-speech`
**Library:** Web Speech API — `SpeechSynthesis` (built-in, zero cost)
**Input:** Text (typed or pasted, max ~32,000 chars)
**Output:** Audio playback in browser (not downloadable — browser limitation)

**Browser Support Note:** `SpeechSynthesis` is supported in Chrome, Edge, Safari, and Firefox. It is NOT available in some mobile browsers. Detect and show a warning if unavailable.

**Implementation:**

```typescript
// lib/processing/text-to-speech.ts

export interface SpeechOptions {
  voice: SpeechSynthesisVoice
  rate: number   // 0.1–10 (1 = normal)
  pitch: number  // 0–2 (1 = normal)
  volume: number // 0–1
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  return window.speechSynthesis.getVoices()
}

// Voices load asynchronously — use this to wait for them
export function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise(resolve => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) { resolve(voices); return }
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices())
    }
  })
}

let currentUtterance: SpeechSynthesisUtterance | null = null

export function speak(
  text: string,
  options: SpeechOptions,
  callbacks: {
    onStart?: () => void
    onEnd?: () => void
    onError?: (error: string) => void
    onBoundary?: (charIndex: number) => void  // for word highlighting
  }
): void {
  // Chrome bug: speech synthesis stops after ~15 seconds on long texts
  // Workaround: split into chunks and queue them
  const CHUNK_SIZE = 200  // characters
  const chunks = splitIntoChunks(text, CHUNK_SIZE)

  stopSpeaking()
  let currentChunk = 0

  function speakNextChunk() {
    if (currentChunk >= chunks.length) {
      callbacks.onEnd?.()
      return
    }

    const utterance = new SpeechSynthesisUtterance(chunks[currentChunk])
    utterance.voice = options.voice
    utterance.rate = options.rate
    utterance.pitch = options.pitch
    utterance.volume = options.volume

    if (currentChunk === 0) utterance.onstart = () => callbacks.onStart?.()
    utterance.onend = () => { currentChunk++; speakNextChunk() }
    utterance.onerror = (e) => callbacks.onError?.(e.error)
    utterance.onboundary = (e) => callbacks.onBoundary?.(e.charIndex)

    currentUtterance = utterance
    window.speechSynthesis.speak(utterance)
  }

  speakNextChunk()
}

export function stopSpeaking(): void {
  window.speechSynthesis.cancel()
  currentUtterance = null
}

export function pauseSpeaking(): void {
  window.speechSynthesis.pause()
}

export function resumeSpeaking(): void {
  window.speechSynthesis.resume()
}

function splitIntoChunks(text: string, maxLength: number): string[] {
  // Split at sentence boundaries, not mid-word
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text]
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength) {
      if (current) chunks.push(current.trim())
      current = sentence
    } else {
      current += sentence
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}
```

**UI Notes:**
- Large textarea for text input
- Voice selector dropdown — group voices by language
- Three sliders: Rate (0.5×–2×), Pitch (0.5–2), Volume (0%–100%)
- Play / Pause / Stop buttons with keyboard shortcuts (Space = pause/resume)
- **Word highlighting:** As speech progresses, highlight the currently spoken word in the textarea using the `onboundary` callback and `charIndex`
- Show "Not supported in this browser" error state if `window.speechSynthesis` is undefined
- Character counter with a note: "Very long texts may have gaps between chunks on some browsers"

---

### Tool 35: Speech to Text
**Route:** `/tools/speech-to-text`
**Library:** Web Speech API — `SpeechRecognition` (built-in, zero cost)
**Input:** Microphone (real-time) or audio file (via `<audio>` element workaround)
**Output:** Transcribed text (copy or download as `.txt`)

**Browser Support Note:** `SpeechRecognition` requires Chrome or Edge. It does NOT work in Firefox or Safari. Show a clear browser requirement warning on page load if in an unsupported browser.

**Implementation:**

```typescript
// lib/processing/speech-to-text.ts

// Chrome uses webkit-prefixed version
const SpeechRecognition =
  (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition

export function isSpeechRecognitionSupported(): boolean {
  return typeof SpeechRecognition !== 'undefined'
}

export interface RecognitionOptions {
  language: string          // BCP-47 language tag e.g. "en-US", "hi-IN"
  continuous: boolean       // keep listening after pauses
  interimResults: boolean   // show unconfirmed results in real-time
}

let recognition: any = null

export function startRecognition(
  options: RecognitionOptions,
  callbacks: {
    onResult: (text: string, isFinal: boolean) => void
    onError: (error: string) => void
    onEnd: () => void
  }
): void {
  if (!isSpeechRecognitionSupported()) {
    callbacks.onError('Speech recognition is not supported in this browser. Use Chrome or Edge.')
    return
  }

  recognition = new SpeechRecognition()
  recognition.lang = options.language
  recognition.continuous = options.continuous
  recognition.interimResults = options.interimResults

  recognition.onresult = (event: any) => {
    let finalText = ''
    let interimText = ''

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        finalText += transcript + ' '
      } else {
        interimText += transcript
      }
    }

    if (finalText) callbacks.onResult(finalText, true)
    if (interimText) callbacks.onResult(interimText, false)
  }

  recognition.onerror = (event: any) => {
    const errorMessages: Record<string, string> = {
      'network': 'Network error. Check your internet connection.',
      'not-allowed': 'Microphone access denied. Please allow microphone permissions.',
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'No microphone found on this device.',
    }
    callbacks.onError(errorMessages[event.error] ?? `Error: ${event.error}`)
  }

  recognition.onend = () => {
    // If continuous mode is on and recognition stops unexpectedly, restart
    if (options.continuous) {
      recognition?.start()
    } else {
      callbacks.onEnd()
    }
  }

  recognition.start()
}

export function stopRecognition(): void {
  recognition?.stop()
  recognition = null
}
```

**UI Notes:**
- Language selector (30+ languages with BCP-47 tags)
- Large microphone button (red when recording)
- Two text areas: "Live (unconfirmed)" shown in grey italic, "Final transcript" shown in solid black
- Both areas are editable — user can fix mistakes manually
- "Clear", "Copy", "Download .txt" buttons
- Word and character count of final transcript
- Show an "Only works in Chrome/Edge" banner with a link to download Chrome, if in unsupported browser

---

### Tool 36: Pomodoro / Focus Timer
**Route:** `/tools/pomodoro`
**Library:** None — pure JS + Web Notifications API + Web Audio API
**Input:** Timer configuration (UI controls)
**Output:** Visual timer + audio/desktop notifications

**Implementation:**

```typescript
// lib/processing/pomodoro.ts

export interface PomodoroConfig {
  workMinutes: number         // default: 25
  shortBreakMinutes: number   // default: 5
  longBreakMinutes: number    // default: 15
  sessionsUntilLongBreak: number  // default: 4
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  soundEnabled: boolean
  notificationsEnabled: boolean
}

export type TimerPhase = 'work' | 'short-break' | 'long-break'

export interface TimerState {
  phase: TimerPhase
  secondsRemaining: number
  totalSeconds: number
  completedSessions: number  // work sessions completed
  isRunning: boolean
}

// Audio: generate a simple bell tone using Web Audio API
export function playBellSound(): void {
  const ctx = new AudioContext()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.frequency.setValueAtTime(830, ctx.currentTime)           // bell frequency
  oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.5)
  gainNode.gain.setValueAtTime(0.8, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + 1.5)
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function sendNotification(title: string, body: string): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icons/pomodoro-icon.png',  // your site icon
      badge: '/icons/pomodoro-icon.png',
    })
  }
}

// Update the browser tab title with countdown
export function updateTabTitle(seconds: number, phase: TimerPhase): void {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')
  const phaseLabel = phase === 'work' ? '🍅' : phase === 'short-break' ? '☕' : '🌿'
  document.title = `${phaseLabel} ${mins}:${secs} — Pomodoro | tools.shreyannarula.com`
}

// Reset title when leaving
export function resetTabTitle(): void {
  document.title = 'Pomodoro Timer — tools.shreyannarula.com'
}
```

**The timer tick logic lives in the React component using `useEffect` + `setInterval`. Do not implement timer state in the lib file — keep it in the component.**

**UI Notes:**
- Large circular progress ring (SVG) showing time remaining visually
- Three phase tabs: Work / Short Break / Long Break — highlight current phase
- Session dots (e.g., 🍅🍅🍅🍅) showing progress toward long break
- Settings panel: customise all duration values, auto-start toggles
- Keyboard shortcut: `Space` = start/pause, `R` = reset
- Show today's total focus time at the bottom: "Total focus today: 1h 45m"
- Task input: user can type what they're working on, shown above the timer
- The tab title updates with countdown (e.g., "🍅 23:45 — Pomodoro") so users can see it from other tabs

---

### Tool 37: Aspect Ratio Calculator
**Route:** `/tools/aspect-ratio`
**Library:** None — pure JS
**Input:** Width and height (or a common preset)
**Output:** Simplified ratio, equivalent dimensions

**Implementation:**

```typescript
// lib/processing/aspect-ratio.ts

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

export interface AspectRatioResult {
  simplifiedRatio: string        // e.g. "16:9"
  decimal: number                // e.g. 1.778
  equivalents: { width: number; height: number }[]  // common sizes with this ratio
  closestNamedRatio: string | null  // e.g. "16:9 (HD Video)"
}

const NAMED_RATIOS: { ratio: string; name: string; decimal: number }[] = [
  { ratio: '1:1',   name: 'Square',           decimal: 1.000 },
  { ratio: '4:3',   name: 'Standard SD',      decimal: 1.333 },
  { ratio: '16:9',  name: 'HD Video / Widescreen', decimal: 1.778 },
  { ratio: '16:10', name: 'MacBook Widescreen', decimal: 1.600 },
  { ratio: '21:9',  name: 'Ultrawide Cinema',  decimal: 2.333 },
  { ratio: '3:2',   name: 'DSLR / 35mm Film',  decimal: 1.500 },
  { ratio: '2:3',   name: 'Portrait Photo',     decimal: 0.667 },
  { ratio: '9:16',  name: 'Mobile / Stories',   decimal: 0.563 },
  { ratio: '4:5',   name: 'Instagram Portrait', decimal: 0.800 },
  { ratio: '1.85:1','name': 'US Cinema',         decimal: 1.850 },
  { ratio: '2.39:1','name': 'Scope Cinema',      decimal: 2.390 },
  { ratio: '5:4',   name: 'Old Monitor',         decimal: 1.250 },
  { ratio: '3:4',   name: 'iPad Portrait',       decimal: 0.750 },
]

export function calculateAspectRatio(width: number, height: number): AspectRatioResult {
  if (width <= 0 || height <= 0) throw new Error('Width and height must be positive')

  const divisor = gcd(Math.round(width), Math.round(height))
  const ratioW = Math.round(width) / divisor
  const ratioH = Math.round(height) / divisor
  const decimal = width / height

  // Generate common equivalent dimensions
  const equivalents = [
    360, 480, 640, 720, 800, 1024, 1280, 1366, 1440, 1600, 1920, 2560, 3840
  ]
    .map(w => ({ width: w, height: Math.round(w / decimal) }))
    .filter(d => d.height > 0 && d.height <= 4320)

  // Find closest named ratio
  let closestNamedRatio: string | null = null
  let smallestDiff = Infinity
  for (const named of NAMED_RATIOS) {
    const diff = Math.abs(named.decimal - decimal)
    if (diff < smallestDiff && diff < 0.05) {
      smallestDiff = diff
      closestNamedRatio = `${named.ratio} — ${named.name}`
    }
  }

  return {
    simplifiedRatio: `${ratioW}:${ratioH}`,
    decimal: Math.round(decimal * 1000) / 1000,
    equivalents,
    closestNamedRatio,
  }
}

// Given one dimension and a target ratio, calculate the missing dimension
export function calculateMissingDimension(
  known: number,
  knownSide: 'width' | 'height',
  ratioW: number,
  ratioH: number
): number {
  if (knownSide === 'width') return Math.round((known * ratioH) / ratioW)
  return Math.round((known * ratioW) / ratioH)
}
```

**UI Notes:**
- Two input fields (Width × Height) with live calculation
- Preset buttons for common ratios: 16:9, 4:3, 1:1, 9:16, 3:2, 21:9
- Show simplified ratio prominently: "16 : 9"
- Show decimal value: "1.778"
- "Closest named ratio" match with context: "Matches 16:9 — HD Video / Widescreen"
- Equivalent dimensions table with common resolutions using this ratio
- "Find missing dimension" mode: enter one dimension + a target ratio → get the other dimension
- Visual preview: a rectangle rendered in correct proportions

---

### Tool 38: HTML Entity Encoder / Decoder
**Route:** `/tools/html-entities`
**Library:** None — pure JS + DOM API
**Input:** Raw text or HTML with entities
**Output:** Encoded or decoded HTML

**Implementation:**

```typescript
// lib/processing/html-entities.ts

// Encode: convert special characters to HTML entities
export function encodeHTMLEntities(text: string): string {
  const div = document.createElement('div')
  div.appendChild(document.createTextNode(text))
  return div.innerHTML
}

// Decode: convert HTML entities back to plain text
export function decodeHTMLEntities(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent ?? ''
}

// Encode all non-ASCII characters to numeric entities (&#xxx;)
export function encodeToNumericEntities(text: string): string {
  return [...text].map(char => {
    const code = char.codePointAt(0)!
    return code > 127 ? `&#${code};` : char
  }).join('')
}

// Encode to named entities where possible
export function encodeToNamedEntities(text: string): string {
  const namedEntities: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
    "'": '&apos;', '©': '&copy;', '®': '&reg;', '™': '&trade;',
    '€': '&euro;', '£': '&pound;', '¥': '&yen;', '¢': '&cent;',
    '°': '&deg;', '±': '&plusmn;', '×': '&times;', '÷': '&divide;',
    '→': '&rarr;', '←': '&larr;', '↑': '&uarr;', '↓': '&darr;',
    '•': '&bull;', '…': '&hellip;', '–': '&ndash;', '—': '&mdash;',
    '"': '&ldquo;', '"': '&rdquo;', '\u00a0': '&nbsp;',
  }
  return [...text].map(char => namedEntities[char] ?? char).join('')
}

// Find all entities in a string and list them
export function findEntities(html: string): { entity: string; decoded: string; position: number }[] {
  const entityRegex = /&(?:#\d+|#x[\da-fA-F]+|[a-zA-Z]+);/g
  const results: { entity: string; decoded: string; position: number }[] = []
  let match: RegExpExecArray | null
  while ((match = entityRegex.exec(html)) !== null) {
    const div = document.createElement('div')
    div.innerHTML = match[0]
    results.push({
      entity: match[0],
      decoded: div.textContent ?? '',
      position: match.index,
    })
  }
  return results
}
```

**UI Notes:**
- Two tabs: "Encode" and "Decode"
- Encoding mode selector: "Basic HTML (`<>&`)", "All Named Entities", "Numeric Entities (&#xxx;)"
- Input and output side by side with a swap button
- Entity reference table below: searchable table of common HTML entities (name, character, code)
- "Find entities" mode: paste HTML and see all entities highlighted and listed in a table with their decoded equivalents

---

### Tool 39: JWT Decoder
**Route:** `/tools/jwt-decoder`
**Library:** None — pure JS using `atob` + `JSON.parse`
**Input:** A JWT string (paste into textarea)
**Output:** Decoded header, payload, and signature info

**Security Note:** This tool ONLY decodes — it does not verify signatures. Display a clear disclaimer that decoded tokens should never be treated as verified without server-side validation.

**Implementation:**

```typescript
// lib/processing/jwt-decoder.ts

export interface JWTDecoded {
  header: {
    alg: string       // e.g. "HS256", "RS256"
    typ: string       // e.g. "JWT"
    kid?: string      // key ID
    [key: string]: unknown
  }
  payload: {
    sub?: string       // subject
    iss?: string       // issuer
    aud?: string | string[]  // audience
    exp?: number       // expiry (Unix timestamp)
    iat?: number       // issued at (Unix timestamp)
    nbf?: number       // not before (Unix timestamp)
    jti?: string       // JWT ID
    [key: string]: unknown
  }
  signature: string    // base64url encoded signature (not verified)
  isExpired: boolean
  expiresAt: Date | null
  issuedAt: Date | null
  timeUntilExpiry: string | null  // e.g. "Expires in 2h 15m" or "Expired 3 days ago"
  rawParts: { header: string; payload: string; signature: string }
}

export function decodeJWT(token: string): JWTDecoded | { error: string } {
  const trimmed = token.trim()

  // JWT must have exactly 3 parts separated by dots
  const parts = trimmed.split('.')
  if (parts.length !== 3) {
    return { error: `Invalid JWT: expected 3 parts separated by ".", got ${parts.length}` }
  }

  const [headerB64, payloadB64, signature] = parts

  function base64UrlDecode(str: string): string {
    // Convert base64url to standard base64
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    // Pad to multiple of 4
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
    try {
      return decodeURIComponent(
        atob(padded).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
      )
    } catch {
      throw new Error('Failed to decode base64url segment')
    }
  }

  try {
    const header = JSON.parse(base64UrlDecode(headerB64))
    const payload = JSON.parse(base64UrlDecode(payloadB64))

    const now = Math.floor(Date.now() / 1000)
    const exp = payload.exp as number | undefined
    const iat = payload.iat as number | undefined
    const isExpired = exp !== undefined ? now > exp : false

    let timeUntilExpiry: string | null = null
    if (exp !== undefined) {
      const diff = exp - now
      if (diff < 0) {
        timeUntilExpiry = `Expired ${formatDuration(-diff)} ago`
      } else {
        timeUntilExpiry = `Expires in ${formatDuration(diff)}`
      }
    }

    return {
      header,
      payload,
      signature,
      isExpired,
      expiresAt: exp ? new Date(exp * 1000) : null,
      issuedAt: iat ? new Date(iat * 1000) : null,
      timeUntilExpiry,
      rawParts: { header: headerB64, payload: payloadB64, signature },
    }
  } catch (e) {
    return { error: `Failed to parse JWT: ${(e as Error).message}` }
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
}
```

**UI Notes:**
- Single textarea for JWT input — parses automatically on change (debounce 200ms)
- Three coloured sections below (matches JWT standard visualisation): Red = Header, Purple = Payload, Blue = Signature
- Each section shows decoded JSON with syntax highlighting
- Expiry status badge: green "Valid", yellow "Expiring soon (<1h)", red "Expired"
- Human-readable timestamp for `exp`, `iat`, `nbf` fields
- **Prominent disclaimer banner:** "🔒 This tool only decodes — it does NOT verify the signature. Never trust decoded JWT claims without server-side verification."
- "Copy Payload" and "Copy Header" buttons
- Show algorithm type and warn for weak algorithms: "⚠️ HS256 uses a shared secret — ensure it is long and random"

---

### Tool 40: Timezone Converter
**Route:** `/tools/timezone-converter`
**Library:** `Intl.DateTimeFormat` API (built-in — zero cost, always up-to-date with DST rules)
**Input:** A date/time and source timezone
**Output:** The same moment expressed in multiple selected timezones

**Why `Intl` API instead of a library:** `Intl.DateTimeFormat` is built into every modern browser, natively uses the OS timezone database (always current with DST changes), and requires zero bundle size. No library (`moment-timezone`, `date-fns-tz`, `luxon`) is needed.

**Implementation:**

```typescript
// lib/processing/timezone-converter.ts

// Get all IANA timezone names supported by this browser
export function getAllTimezones(): string[] {
  // Intl.supportedValuesOf is available in modern browsers
  try {
    return (Intl as any).supportedValuesOf('timeZone') as string[]
  } catch {
    // Fallback for older browsers: hardcoded common list
    return FALLBACK_TIMEZONES
  }
}

export interface ConvertedTime {
  timezone: string          // IANA name e.g. "America/New_York"
  label: string             // Display label e.g. "New York (EST)"
  formatted: string         // e.g. "Friday, 9 May 2025, 14:30:00"
  offset: string            // e.g. "UTC-5:00"
  isDST: boolean
  date: Date
}

export function convertToTimezones(
  isoDateString: string,     // ISO 8601 e.g. "2025-05-09T14:30:00"
  sourceTimezone: string,    // IANA timezone of the input
  targetTimezones: string[]  // IANA timezones to convert to
): ConvertedTime[] {
  // Parse the input date in the source timezone
  // Strategy: create a UTC date adjusted for the source offset
  const sourceDate = zonedTimeToUTC(isoDateString, sourceTimezone)

  return targetTimezones.map(tz => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    })

    const offsetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'longOffset',
    })

    const parts = offsetFormatter.formatToParts(sourceDate)
    const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value ?? 'UTC'

    return {
      timezone: tz,
      label: tz.replace(/_/g, ' '),
      formatted: formatter.format(sourceDate),
      offset: offsetPart,
      isDST: checkIsDST(sourceDate, tz),
      date: sourceDate,
    }
  })
}

// Convert a local time string in a given timezone to a UTC Date object
function zonedTimeToUTC(localTimeString: string, timezone: string): Date {
  // Use Intl to find the UTC offset at that moment in that timezone
  const testDate = new Date(localTimeString)  // treat as if UTC first
  const localFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
  const localString = localFormatter.format(testDate)
  const utcEquivalent = new Date(localString + 'Z')
  const offset = testDate.getTime() - utcEquivalent.getTime()
  return new Date(testDate.getTime() + offset)
}

function checkIsDST(date: Date, timezone: string): boolean {
  const jan = new Date(date.getFullYear(), 0, 1)
  const jul = new Date(date.getFullYear(), 6, 1)
  const getOffset = (d: Date) => {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'shortOffset' })
    return f.formatToParts(d).find(p => p.type === 'timeZoneName')?.value ?? ''
  }
  return getOffset(jan) !== getOffset(jul) && getOffset(date) === getOffset(jul)
}

const FALLBACK_TIMEZONES = [
  'Pacific/Honolulu', 'America/Anchorage', 'America/Los_Angeles', 'America/Denver',
  'America/Chicago', 'America/New_York', 'America/Sao_Paulo', 'Europe/London',
  'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow', 'Asia/Dubai', 'Asia/Kolkata',
  'Asia/Dhaka', 'Asia/Bangkok', 'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney',
  'Pacific/Auckland',
]
```

**UI Notes:**
- Date/time picker input + source timezone selector
- "Use my current time" button (auto-fills with `new Date()` and local timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`)
- Pre-selected target timezones: user's local zone + UTC + 5 common global cities
- Add/remove target timezone chips
- Results displayed as a list of timezone cards showing: city name, local time (large), date, UTC offset, "DST active" badge when relevant
- Highlight if a target time is on a different date than the source ("⚠️ Next day")
- Preset timezone groups: "Major Cities", "US Time Zones", "European Time Zones", "Asian Time Zones"

---

## 3. New Shared Utilities Introduced in This Batch

### `lib/utils/zip-download.ts`
Used by Tools 24 (Favicon Generator) and 32 (Watermark batch mode). Centralise the JSZip download pattern here rather than duplicating it.

```typescript
import JSZip from 'jszip'

export async function downloadAsZip(
  files: { name: string; blob: Blob }[],
  zipFilename: string
): Promise<void> {
  const zip = new JSZip()
  files.forEach(({ name, blob }) => zip.file(name, blob))
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },  // balanced speed vs size
  })
  triggerDownload(zipBlob, zipFilename)
}
```

### `lib/utils/browser-support.ts`
Centralise browser feature detection. Used by Tools 34 and 35.

```typescript
export const browserSupport = {
  speechSynthesis: typeof window !== 'undefined' && 'speechSynthesis' in window,
  speechRecognition: typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  ),
  notifications: typeof window !== 'undefined' && 'Notification' in window,
  audioContext: typeof window !== 'undefined' && (
    'AudioContext' in window || 'webkitAudioContext' in window
  ),
  intlSupportedValues: typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl,
  sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
}
```

### `lib/utils/format-duration.ts`
Used by Tools 36 (Pomodoro) and 39 (JWT Decoder). Do not duplicate this logic.

```typescript
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatReadableTime(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minute${Math.round(seconds / 60) !== 1 ? 's' : ''}`
  return `${Math.round(seconds / 3600)} hour${Math.round(seconds / 3600) !== 1 ? 's' : ''}`
}
```

---

## 4. Extension Context Menu Additions

Add the following context menu items to the service worker from Part 1. Do not replace existing menus — append to them.

```typescript
// In background/service-worker.ts — add inside the onInstalled listener

// Additional image tools (Tool 22)
chrome.contextMenus.create({
  id: 'view-exif',
  parentId: 'image-tools',
  title: '📋 View & Remove EXIF Data',
  contexts: ['image'],
})

// Additional text tools (Tools 35, 38, 39)
chrome.contextMenus.create({
  id: 'speech-from-selection',
  parentId: 'text-tools',
  title: '🔊 Read Aloud',
  contexts: ['selection'],
})
chrome.contextMenus.create({
  id: 'encode-html-entities',
  parentId: 'text-tools',
  title: '🔣 Encode HTML Entities',
  contexts: ['selection'],
})
chrome.contextMenus.create({
  id: 'decode-jwt',
  parentId: 'text-tools',
  title: '🔐 Decode JWT',
  contexts: ['selection'],
})

// Add to toolRoutes map
const additionalRoutes: Record<string, string> = {
  'view-exif':            '/tools/exif-viewer',
  'speech-from-selection': '/tools/text-to-speech',
  'encode-html-entities': '/tools/html-entities',
  'decode-jwt':           '/tools/jwt-decoder',
}
```

**URL parameter pre-population for new tools (add to each tool page's `useSearchParams` hook):**

| Tool | URL Param | Source |
|---|---|---|
| Text to Speech | `?text=` | Selection text from right-click |
| HTML Entities | `?text=` | Selection text from right-click |
| JWT Decoder | `?token=` | Selection text from right-click |
| EXIF Viewer | `?imageUrl=` | Image src from right-click |

---

## 5. Phase Build Order for Tools 21–40

Build in this exact order. Earlier tools have no dependencies on later ones. Each tool can be shipped independently as it's completed.

### Week 1 (Days 1–7): Zero-dependency tools first
These use only browser built-ins — ship in 1–2 hours each:

- [ ] **Tool 25:** URL Encoder / Decoder — `encodeURIComponent` only. ~1.5 hours.
- [ ] **Tool 26:** Number Base Converter — `BigInt` only. ~2 hours.
- [ ] **Tool 27:** Character / Byte Counter — `TextEncoder` only. ~2 hours.
- [ ] **Tool 28:** Lorem Ipsum Generator — pure JS. ~1.5 hours.
- [ ] **Tool 37:** Aspect Ratio Calculator — pure JS. ~2 hours.
- [ ] **Tool 38:** HTML Entity Encoder / Decoder — DOM API only. ~1.5 hours.

**End of Week 1:** 6 tools live. Zero new npm packages installed.

---

### Week 2 (Days 8–14): Library-based tools
These require npm packages already in `package.json`:

- [ ] **Tool 29:** CSS Gradient Generator — Canvas API. ~3 hours.
- [ ] **Tool 30:** Color Contrast Checker — `chroma-js`. ~3 hours.
- [ ] **Tool 31:** JSON to Excel / Excel to JSON — `xlsx`. ~3 hours.
- [ ] **Tool 39:** JWT Decoder — `atob` + JSON. ~2 hours.
- [ ] **Tool 40:** Timezone Converter — `Intl` API. ~3 hours.

**End of Week 2:** 11 tools live.

---

### Week 3 (Days 15–21): New library tools
Install `tesseract.js` and `exifr` first:

- [ ] **Tool 22:** Exif Data Viewer & Remover — `exifr`. ~3 hours.
- [ ] **Tool 23:** SVG Optimizer — `svgo/browser`. ~3 hours. (**Remember:** import from `svgo/browser`, not `svgo`.)
- [ ] **Tool 24:** Favicon Generator — Canvas + `jszip`. ~4 hours.
- [ ] **Tool 32:** Image Watermark Adder — Canvas API. ~4 hours.

**End of Week 3:** 15 tools live.

---

### Week 4 (Days 22–28): Complex / WASM tools
These require the most testing across browsers:

- [ ] **Tool 21:** Image to Text (OCR) — `tesseract.js` WASM. ~5 hours. Test on slow connections.
- [ ] **Tool 33:** PDF Compressor — `pdf-lib` + `pdfjs-dist` + `browser-image-compression`. ~5 hours.

**End of Week 4:** 17 tools live.

---

### Week 5 (Days 29–35): Browser API tools
These require careful browser compatibility testing:

- [ ] **Tool 34:** Text to Speech — `SpeechSynthesis` API. ~3 hours. Test Chrome bug fix (chunking).
- [ ] **Tool 35:** Speech to Text — `SpeechRecognition` API. ~3 hours. Chrome/Edge only — handle gracefully in others.
- [ ] **Tool 36:** Pomodoro Timer — Web Notifications + Web Audio. ~4 hours. Test notifications permission flow.

**End of Week 5:** All 20 tools in this batch are live. You now have 40 working tools total.

---

## 6. Critical Rules Specific to This Batch

These are in addition to the 10 rules from Part 1. All Part 1 rules remain in effect.

**Rule 11 — Import SVGO from `svgo/browser`, never from `svgo`.**
The standard `svgo` package imports Node.js `fs` and `path` modules. These do not exist in the browser. The Next.js build will succeed but the page will throw a runtime error. Always:
```typescript
import { optimize } from 'svgo/browser'  // ✅
import { optimize } from 'svgo'          // ❌ breaks in browser
```

**Rule 12 — Tesseract.js worker files must be served locally.**
If you reference the CDN worker path, the tool will fail for users with ad blockers or in restricted networks. Copy WASM and worker files to `public/tesseract/` and reference them with absolute paths from `window.location.origin`.

**Rule 13 — The Chrome SpeechSynthesis 15-second bug is real and must be fixed.**
Chrome's `SpeechSynthesis` silently stops speaking after approximately 15 seconds of audio output. The fix is to split text into chunks of ~200 characters at sentence boundaries and queue them sequentially via the `onend` callback. Do not skip this fix — the tool will appear broken for any text over ~3 sentences.

**Rule 14 — SpeechRecognition only works in Chrome and Edge. Display this clearly.**
Do not silently fail. On page load, check `isSpeechRecognitionSupported()` and if false, immediately show a full-page warning with browser download links. Do not show the microphone UI to unsupported browser users.

**Rule 15 — PDF Compressor output text is not selectable. Warn users BEFORE they compress.**
The rasterisation approach (pdfjs → canvas → pdf-lib) converts all content to images. The warning must appear prominently BEFORE the user clicks compress, not only in the result. Place it in a yellow banner above the upload zone.

**Rule 16 — JWT Decoder must never claim to verify tokens.**
The disclaimer is not optional UI polish — it is a security requirement. Every part of the UI that shows decoded payload data must be accompanied by the verification disclaimer. Do not let users believe a decoded JWT is an authenticated JWT.

**Rule 17 — Exif GPS data must be treated as sensitive and highlighted.**
When GPS coordinates are present in Exif data, show a red/orange warning banner above the metadata table. The coordinates expose the user's physical location — treat this with the same emphasis as a password warning, not as a neutral data field.

**Rule 18 — `Intl.supportedValuesOf('timeZone')` may not be available in older browsers.**
Always wrap it in a try/catch and fall back to the `FALLBACK_TIMEZONES` list. Do not assume this method exists.

**Rule 19 — `BigInt.prototype.toString(base)` only supports bases 2–36.**
Base 64 numeric conversion (not the encoding standard) is not natively supported by `BigInt`. For base 64 numeric output, implement a manual conversion using a custom digit alphabet. Do not call `.toString(64)` — it will throw a `RangeError`.

**Rule 20 — Canvas-based metadata stripping (Tool 22) re-encodes the image.**
This means: (a) file size will change even for PNG → PNG conversion, and (b) for JPEGs, some quality loss occurs because the image is decoded and re-encoded. Warn users: "The cleaned image is re-encoded — file size and JPEG quality may differ slightly from the original."

---

*Part 2 complete. Tools 21–40 documented. You now have 40 tools fully specified.*
*Part 3 will cover Tools 41–60.*
*Last updated: May 2026. For tools.shreyannarula.com.*
