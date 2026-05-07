# tools.shreyannarula.com — Complete Implementation Guide
> A zero-to-production reference document for building a 110-tool personal utility website with a Chrome extension, seamless UX integrations, and near-zero infrastructure cost. Written for an AI agent with no prior context — follow this document top to bottom without deviation.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Rationale](#2-tech-stack--rationale)
3. [Repository Structure](#3-repository-structure)
4. [Infrastructure & Deployment](#4-infrastructure--deployment)
5. [Core Architecture Decisions](#5-core-architecture-decisions)
6. [The 20 Priority Tools — Detailed Specs](#6-the-20-priority-tools--detailed-specs)
7. [Shared Component System](#7-shared-component-system)
8. [Chrome Extension — Full Spec](#8-chrome-extension--full-spec)
9. [Seamless UX Integration Points](#9-seamless-ux-integration-points)
10. [Phase-Wise Build Plan](#10-phase-wise-build-plan)
11. [Cost Architecture](#11-cost-architecture)
12. [SEO, Discoverability & Growth](#12-seo-discoverability--growth)
13. [Monetisation Strategy](#13-monetisation-strategy)
14. [Critical Rules & Gotchas](#14-critical-rules--gotchas)

---

## 1. Project Overview

**Domain:** `tools.shreyannarula.com`
**Purpose:** A personal toolkit of 110 browser-based utility tools, all running client-side with zero per-use cost, accessible via a web dashboard and a Chrome extension.

**Core Philosophy:**
- Every tool runs in the user's browser. The server exists only for CORS-blocked operations.
- No external paid APIs. All processing uses open-source libraries bundled into the app.
- The Chrome extension makes tools accessible anywhere — via right-click, popup, or page detection.
- Infrastructure cost stays under $15/month at 1 million monthly users.

**The 20 tools to build first (in order of usefulness and traffic potential):**
1. Background Remover
2. Image Compressor
3. PDF Merger & Splitter
4. File Type Converter (Image formats)
5. Image Resizer & Cropper
6. PDF to Image Converter
7. JSON Formatter & Validator
8. Base64 Encoder / Decoder
9. Password Generator
10. Color Picker & Converter (HEX / RGB / HSL)
11. Word Count & Readability Analyzer
12. Text Case Converter
13. QR Code Generator
14. Unit Converter
15. Regex Tester
16. Markdown to HTML Converter
17. CSV to JSON / JSON to CSV
18. Image Color Palette Extractor
19. Hash Generator (MD5, SHA-256, SHA-512)
20. Diff Checker (compare two texts)

---

## 2. Tech Stack & Rationale

### Frontend
| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | File-based routing per tool, SSG for fast loads, Vercel-native |
| Language | TypeScript | Type safety across 110 tools prevents silent bugs |
| Styling | Tailwind CSS | Utility-first, no runtime cost, consistent design tokens |
| Component Library | shadcn/ui | Unstyled, accessible, copy-paste components you own |
| Icons | Lucide React | Lightweight, consistent, tree-shakeable |
| Animations | Framer Motion | Smooth page transitions and micro-interactions |

### Processing Libraries (all client-side, zero API cost)
| Tool Category | Library | npm Package |
|---|---|---|
| Background removal | WASM ML model | `@imgly/background-removal` |
| Image compression | Browser-native | `browser-image-compression` |
| Image processing | Canvas API | Built-in browser API |
| PDF manipulation | Pure JS PDF lib | `pdf-lib` |
| PDF reading | Mozilla's PDF engine | `pdfjs-dist` |
| Audio/Video | FFmpeg compiled to WASM | `@ffmpeg/ffmpeg` + `@ffmpeg/util` |
| OCR | Tesseract compiled to WASM | `tesseract.js` |
| Excel/CSV | SheetJS | `xlsx` |
| DOCX reading | | `mammoth` |
| QR Codes | | `qrcode` |
| Hashing | Web Crypto API | Built-in browser API |
| Colour science | | `chroma-js` |
| Diff comparison | | `diff` |
| Markdown parsing | | `marked` + `dompurify` |
| ZIP handling | | `jszip` |
| Barcode | | `jsbarcode` |

### Backend (minimal — Cloudflare Workers only)
Only used for tools that require outbound network calls (CORS-blocked in browsers):
- DNS Lookup
- SSL Certificate Checker
- Broken Link Checker
- Webpage Screenshot (uses Puppeteer on Cloudflare Browser Rendering)

### Hosting
| Service | Role | Cost |
|---|---|---|
| Vercel | Next.js hosting, CI/CD | Free tier |
| Cloudflare | DNS, CDN, Workers | Free tier |
| GitHub | Source control | Free |
| Chrome Web Store | Extension distribution | $5 one-time |

---

## 3. Repository Structure

```
tools-shreyannarula/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with nav, theme, analytics
│   ├── page.tsx                  # Homepage dashboard — search + category grid
│   ├── tools/
│   │   ├── background-remover/
│   │   │   └── page.tsx
│   │   ├── image-compressor/
│   │   │   └── page.tsx
│   │   ├── pdf-merger/
│   │   │   └── page.tsx
│   │   └── [... 17 more tool folders]
│   └── api/                      # Next.js API routes (only for CORS-blocked ops)
│       ├── dns-lookup/
│       │   └── route.ts
│       └── ssl-check/
│           └── route.ts
│
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── tool-shell/               # Shared wrapper every tool uses
│   │   ├── ToolShell.tsx         # Title, description, breadcrumb, share
│   │   ├── DropZone.tsx          # Reusable drag-and-drop file input
│   │   ├── OutputPanel.tsx       # Download button + preview area
│   │   └── ProcessingOverlay.tsx # Loading state with progress
│   ├── dashboard/
│   │   ├── SearchBar.tsx
│   │   ├── CategoryGrid.tsx
│   │   ├── ToolCard.tsx
│   │   └── RecentTools.tsx       # localStorage-persisted recently used
│   └── layout/
│       ├── Navbar.tsx
│       └── Footer.tsx
│
├── lib/
│   ├── tools-registry.ts         # Single source of truth: all 110 tools metadata
│   ├── processing/               # Core processing logic per tool
│   │   ├── background-removal.ts
│   │   ├── image-compression.ts
│   │   ├── pdf-operations.ts
│   │   └── [... one file per complex tool]
│   └── utils/
│       ├── file-utils.ts         # MIME type detection, file size formatting
│       ├── download.ts           # Trigger browser download from Blob/URL
│       └── analytics.ts          # Lightweight, privacy-first event tracking
│
├── extension/                    # Chrome extension (separate build)
│   ├── manifest.json
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.tsx
│   │   └── popup.css
│   ├── background/
│   │   └── service-worker.ts     # Context menu registration
│   ├── content/
│   │   └── content-script.ts     # Page analysis + floating widget
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
│
├── public/
│   ├── models/                   # WASM model files (background removal)
│   └── workers/                  # Web Worker scripts
│
├── styles/
│   └── globals.css               # Tailwind base + CSS variables
│
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 4. Infrastructure & Deployment

### DNS Setup (Cloudflare)
1. Add `tools.shreyannarula.com` as a subdomain in Cloudflare DNS
2. Create a CNAME record: `tools` → `cname.vercel-dns.com`
3. Enable Cloudflare proxy (orange cloud) for CDN and DDoS protection
4. Set SSL/TLS mode to "Full (strict)"

### Vercel Setup
1. Connect GitHub repo to Vercel
2. Set custom domain to `tools.shreyannarula.com`
3. Framework preset: Next.js
4. Build command: `next build`
5. Output directory: `.next`
6. No environment variables needed for Phase 1 (all client-side)

### Cloudflare Workers (for CORS-blocked tools)
```javascript
// wrangler.toml
name = "tools-shreyannarula-workers"
main = "src/worker.ts"
compatibility_date = "2024-01-01"

[[routes]]
pattern = "tools.shreyannarula.com/api/worker/*"
zone_name = "shreyannarula.com"
```

Deploy with: `npx wrangler deploy`

### Headers Configuration (next.config.js)
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Required for SharedArrayBuffer (used by FFmpeg WASM)
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ]
  },
}
module.exports = nextConfig
```

> **CRITICAL:** `COOP` and `COEP` headers are mandatory for `SharedArrayBuffer`, which FFmpeg WASM requires. Without them, video/audio tools will crash silently.

---

## 5. Core Architecture Decisions

### Decision 1: Web Workers for Heavy Processing
All WASM-based tools (background remover, FFmpeg, Tesseract) must run inside a **Web Worker**, not the main thread. This prevents the UI from freezing during processing.

Pattern to use in every heavy tool:
```typescript
// lib/processing/background-removal.ts
export async function removeBackground(file: File): Promise<Blob> {
  // @imgly/background-removal runs in a worker internally
  const { removeBackground } = await import('@imgly/background-removal')
  return await removeBackground(file, {
    publicPath: '/models/', // serve WASM models from public/models/
    progress: (key, current, total) => {
      // emit progress event for UI
      window.dispatchEvent(new CustomEvent('bg-removal-progress', {
        detail: { progress: current / total }
      }))
    }
  })
}
```

### Decision 2: Tools Registry as Single Source of Truth
Every tool is defined once in `lib/tools-registry.ts`. The dashboard, search, sitemap, and extension all read from this file. Never hardcode tool names anywhere else.

```typescript
// lib/tools-registry.ts
export interface Tool {
  id: string           // URL slug: "background-remover"
  name: string         // Display name: "Background Remover"
  description: string  // One-line description for cards and SEO meta
  category: ToolCategory
  icon: string         // Lucide icon name
  tags: string[]       // For search: ["image", "remove", "transparent", "png"]
  isNew?: boolean      // Shows "New" badge
  isPro?: boolean      // Future: gates behind Pro plan
}

export type ToolCategory =
  | 'image'
  | 'document'
  | 'audio-video'
  | 'text-code'
  | 'productivity'
  | 'privacy-security'
  | 'design'
  | 'data'
  | 'web-seo'
  | 'writing'

export const tools: Tool[] = [
  {
    id: 'background-remover',
    name: 'Background Remover',
    description: 'Remove image backgrounds instantly in your browser. No uploads to any server.',
    category: 'image',
    icon: 'Scissors',
    tags: ['background', 'remove', 'transparent', 'png', 'photo', 'cutout'],
  },
  // ... all 110 tools defined here
]
```

### Decision 3: ToolShell Wrapper
Every tool page uses `<ToolShell>` as its outer container. This provides:
- Consistent page title, description, breadcrumb
- Share button (Web Share API)
- "Recently used" tracking via localStorage
- Feedback button (links to GitHub Issues)

```typescript
// app/tools/background-remover/page.tsx
import { ToolShell } from '@/components/tool-shell/ToolShell'
import { BackgroundRemoverTool } from './BackgroundRemoverTool'

export const metadata = {
  title: 'Background Remover — tools.shreyannarula.com',
  description: 'Remove image backgrounds instantly in your browser. 100% private, no server uploads.',
}

export default function BackgroundRemoverPage() {
  return (
    <ToolShell toolId="background-remover">
      <BackgroundRemoverTool />
    </ToolShell>
  )
}
```

### Decision 4: File Handling Pattern
All tools that accept file input must follow this exact pattern:

```typescript
// Standard file input flow
1. User drops file onto <DropZone /> or clicks to select
2. Validate: check file.type against allowed MIME types, check file.size <= limit
3. Show preview (image thumbnail, file name + size for others)
4. User clicks "Process" button
5. Show <ProcessingOverlay /> with progress percentage
6. On completion: show <OutputPanel /> with preview + download button
7. Download triggers: URL.createObjectURL(resultBlob) + programmatic <a> click
8. Cleanup: URL.revokeObjectURL() after 60 seconds to free memory
```

---

## 6. The 20 Priority Tools — Detailed Specs

### Tool 1: Background Remover
**Route:** `/tools/background-remover`
**Library:** `@imgly/background-removal`
**Input:** JPG, PNG, WebP (max 10MB)
**Output:** PNG with transparent background

**Implementation:**
```bash
npm install @imgly/background-removal
```

```typescript
// The library downloads WASM model on first use (~40MB, cached by browser)
// Subsequent uses are instant
import { removeBackground } from '@imgly/background-removal'

async function processImage(file: File): Promise<Blob> {
  const blob = await removeBackground(file, {
    publicPath: `${window.location.origin}/models/`,
  })
  return blob // PNG with alpha channel
}
```

**UI Notes:**
- Show before/after slider comparison after processing
- Offer download as PNG (transparent) or JPG (white background)
- Display model download progress on first use: "Downloading AI model (one-time, 40MB)..."
- Cache model in IndexedDB automatically (library handles this)

---

### Tool 2: Image Compressor
**Route:** `/tools/image-compressor`
**Library:** `browser-image-compression`
**Input:** JPG, PNG, WebP (max 50MB)
**Output:** Compressed version of same format

```bash
npm install browser-image-compression
```

```typescript
import imageCompression from 'browser-image-compression'

async function compressImage(file: File, quality: number): Promise<File> {
  return await imageCompression(file, {
    maxSizeMB: quality,           // Target size in MB
    maxWidthOrHeight: 1920,       // Maintain aspect ratio
    useWebWorker: true,           // Non-blocking
    fileType: file.type,          // Preserve format
    onProgress: (progress) => {
      // Update UI progress bar
    }
  })
}
```

**UI Notes:**
- Show original vs compressed size comparison
- Slider for quality (10% – 100%)
- Live preview of compressed image
- Show percentage size reduction prominently ("Reduced by 74%")

---

### Tool 3: PDF Merger & Splitter
**Route:** `/tools/pdf-merger`
**Library:** `pdf-lib` + `pdfjs-dist`
**Input:** Multiple PDFs (merge) or one PDF (split)
**Output:** PDF file(s)

```bash
npm install pdf-lib pdfjs-dist
```

```typescript
import { PDFDocument } from 'pdf-lib'

// Merge
async function mergePDFs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create()
  for (const file of files) {
    const bytes = await file.arrayBuffer()
    const pdf = await PDFDocument.load(bytes)
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
    pages.forEach(page => mergedPdf.addPage(page))
  }
  return await mergedPdf.save()
}

// Split: extract pages N to M
async function splitPDF(file: File, from: number, to: number): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer()
  const originalPdf = await PDFDocument.load(bytes)
  const newPdf = await PDFDocument.create()
  const pageIndices = Array.from({ length: to - from + 1 }, (_, i) => from + i - 1)
  const pages = await newPdf.copyPages(originalPdf, pageIndices)
  pages.forEach(page => newPdf.addPage(page))
  return await newPdf.save()
}
```

**UI Notes:**
- Drag to reorder PDFs before merging (use `@dnd-kit/core`)
- Show page count per uploaded PDF
- Split mode: input "Pages 3-7" or select individual pages visually

---

### Tool 4: File Type Converter (Images)
**Route:** `/tools/image-converter`
**Library:** Canvas API (built-in) + `browser-image-compression`
**Input:** JPG, PNG, WebP, AVIF, GIF, BMP, TIFF
**Output:** Any of the above formats

```typescript
async function convertImage(file: File, targetFormat: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      // Fill white background for formats that don't support transparency
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url)
        if (blob) resolve(blob)
        else reject(new Error('Conversion failed'))
      }, targetFormat, 0.92)
    }
    img.src = url
  })
}
```

**UI Notes:**
- Simple format selection dropdown
- Batch conversion: accept multiple files
- Show output file size estimate before downloading

---

### Tool 5: Image Resizer & Cropper
**Route:** `/tools/image-resizer`
**Library:** `react-image-crop` + Canvas API

```bash
npm install react-image-crop
```

**Features:**
- Resize by pixel dimensions or percentage
- Lock/unlock aspect ratio
- Crop with visual drag handles
- Preset sizes: 1:1, 16:9, 4:3, 9:16, Twitter header, LinkedIn banner, etc.

```typescript
// Resize
function resizeImage(canvas: HTMLCanvasElement, width: number, height: number): Promise<Blob> {
  const offscreen = document.createElement('canvas')
  offscreen.width = width
  offscreen.height = height
  const ctx = offscreen.getContext('2d')!
  ctx.drawImage(canvas, 0, 0, width, height)
  return new Promise(resolve => offscreen.toBlob(b => resolve(b!), 'image/png'))
}
```

---

### Tool 6: PDF to Image Converter
**Route:** `/tools/pdf-to-image`
**Library:** `pdfjs-dist`

```typescript
import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

async function pdfPageToImage(file: File, pageNumber: number, dpi: number = 150): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const page = await pdf.getPage(pageNumber)
  const scale = dpi / 72  // PDF points to pixels
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))
}
```

**UI Notes:**
- Show page thumbnails, let user select which pages to export
- DPI selector: 72 (screen), 150 (standard), 300 (print quality)
- Batch download all pages as ZIP using `jszip`

---

### Tool 7: JSON Formatter & Validator
**Route:** `/tools/json-formatter`
**Library:** None — built-in `JSON.parse` + `JSON.stringify`

```typescript
function formatJSON(input: string, indent: number = 2): { result?: string; error?: string } {
  try {
    const parsed = JSON.parse(input)
    return { result: JSON.stringify(parsed, null, indent) }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

function minifyJSON(input: string): { result?: string; error?: string } {
  try {
    return { result: JSON.stringify(JSON.parse(input)) }
  } catch (e) {
    return { error: (e as Error).message }
  }
}
```

**UI Notes:**
- Syntax-highlighted editor using `@uiw/react-codemirror` with JSON mode
- Real-time validation as user types (debounced 300ms)
- Error highlighting with line number
- Tree view toggle to explore JSON structure
- Copy to clipboard button

---

### Tool 8: Base64 Encoder / Decoder
**Route:** `/tools/base64`
**Library:** None — Web Crypto API built-in

```typescript
// Text encoding
const encode = (text: string): string => btoa(unescape(encodeURIComponent(text)))
const decode = (b64: string): string => decodeURIComponent(escape(atob(b64)))

// File encoding (image to base64 data URL)
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
```

**UI Notes:**
- Two tabs: "Text" and "File"
- Auto-detect mode (if input looks like base64, default to decode)
- For images: show decoded image preview inline

---

### Tool 9: Password Generator
**Route:** `/tools/password-generator`
**Library:** Web Crypto API (built-in, cryptographically secure)

```typescript
function generatePassword(options: {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
  excludeAmbiguous: boolean  // removes 0, O, l, 1, I
}): string {
  let chars = ''
  if (options.uppercase) chars += options.excludeAmbiguous ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (options.lowercase) chars += options.excludeAmbiguous ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz'
  if (options.numbers) chars += options.excludeAmbiguous ? '23456789' : '0123456789'
  if (options.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'

  const array = new Uint32Array(options.length)
  crypto.getRandomValues(array)  // cryptographically secure
  return Array.from(array, n => chars[n % chars.length]).join('')
}
```

**UI Notes:**
- Live strength meter (entropy calculation)
- Generate multiple passwords at once
- Copy individual passwords with one click
- Passphrase mode (random words, e.g., "correct-horse-battery-staple")

---

### Tool 10: Color Picker & Converter
**Route:** `/tools/color-converter`
**Library:** `chroma-js`

```bash
npm install chroma-js
```

```typescript
import chroma from 'chroma-js'

function convertColor(input: string) {
  const c = chroma(input)
  return {
    hex: c.hex(),
    rgb: c.rgb(),                      // [255, 128, 0]
    hsl: c.hsl(),                      // [30, 1, 0.5]
    hsv: c.hsv(),
    cmyk: c.cmyk(),
    lab: c.lab(),
    lch: c.lch(),
    css: c.css(),                      // "rgb(255,128,0)"
    luminance: c.luminance(),
    contrastWithWhite: chroma.contrast(c, 'white'),
    contrastWithBlack: chroma.contrast(c, 'black'),
  }
}
```

**UI Notes:**
- Visual color picker wheel (use `react-colorful`)
- Large colour swatch that updates live
- Shows WCAG accessibility rating for text contrast
- Colour palette generator (analogous, complementary, triadic, shades)

---

### Tool 11: Word Count & Readability Analyzer
**Route:** `/tools/word-count`
**Library:** None — pure JS computation

```typescript
function analyzeText(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const syllables = words.reduce((acc, word) => acc + countSyllables(word), 0)
  const avgSyllablesPerWord = syllables / words.length
  const avgWordsPerSentence = words.length / sentences.length

  // Flesch Reading Ease: 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
  const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)

  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    words: words.length,
    sentences: sentences.length,
    paragraphs: text.split(/\n\n+/).filter(Boolean).length,
    readingTime: `${Math.ceil(words.length / 238)} min`,  // avg 238 wpm
    speakingTime: `${Math.ceil(words.length / 150)} min`, // avg 150 wpm
    fleschScore: Math.round(fleschScore),
    gradeLevel: fleschKincaidGrade(avgWordsPerSentence, avgSyllablesPerWord),
  }
}
```

---

### Tool 12: Text Case Converter
**Route:** `/tools/text-case`
**Library:** None — pure JS

```typescript
const cases = {
  uppercase: (t: string) => t.toUpperCase(),
  lowercase: (t: string) => t.toLowerCase(),
  titleCase: (t: string) => t.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase()),
  sentenceCase: (t: string) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase(),
  camelCase: (t: string) => t.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (m, i) => i === 0 ? m.toLowerCase() : m.toUpperCase()).replace(/\s+/g, ''),
  pascalCase: (t: string) => t.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, m => m.toUpperCase()).replace(/\s+/g, ''),
  snakeCase: (t: string) => t.toLowerCase().replace(/\s+/g, '_'),
  kebabCase: (t: string) => t.toLowerCase().replace(/\s+/g, '-'),
  constantCase: (t: string) => t.toUpperCase().replace(/\s+/g, '_'),
  dotCase: (t: string) => t.toLowerCase().replace(/\s+/g, '.'),
}
```

---

### Tool 13: QR Code Generator
**Route:** `/tools/qr-code`
**Library:** `qrcode`

```bash
npm install qrcode
```

```typescript
import QRCode from 'qrcode'

async function generateQR(text: string, options: {
  size: number
  errorCorrection: 'L' | 'M' | 'Q' | 'H'
  foreground: string
  background: string
}): Promise<string> {
  return await QRCode.toDataURL(text, {
    width: options.size,
    errorCorrectionLevel: options.errorCorrection,
    color: { dark: options.foreground, light: options.background },
  })
}
```

**UI Notes:**
- Tabs for: URL, Text, Email, Phone, WiFi, VCard
- Colour customisation for foreground and background
- Download as PNG or SVG
- Live preview updates as user types

---

### Tool 14: Unit Converter
**Route:** `/tools/unit-converter`
**Library:** None — pure JS conversion factors

**Categories:** Length, Weight, Temperature, Area, Volume, Speed, Data (bytes), Time, Pressure, Energy
```typescript
// Example: all in SI base unit, conversion factors
const length: Record<string, number> = {
  meter: 1, kilometer: 1000, centimeter: 0.01, millimeter: 0.001,
  inch: 0.0254, foot: 0.3048, yard: 0.9144, mile: 1609.344,
  nauticalMile: 1852, lightyear: 9.461e15,
}

function convert(value: number, from: string, to: string, category: 'length'): number {
  // Temperature is special case (non-linear)
  if (category === 'temperature') return convertTemperature(value, from, to)
  const factors = { length }[category]
  return (value * factors[from]) / factors[to]
}
```

---

### Tool 15: Regex Tester
**Route:** `/tools/regex-tester`
**Library:** None — built-in JS RegExp

```typescript
function testRegex(pattern: string, flags: string, testString: string) {
  try {
    const regex = new RegExp(pattern, flags)
    const matches = [...testString.matchAll(new RegExp(pattern, flags + (flags.includes('g') ? '' : 'g')))]
    return {
      isValid: true,
      matchCount: matches.length,
      matches: matches.map(m => ({
        match: m[0],
        index: m.index,
        groups: m.groups,
        captured: m.slice(1),
      })),
      highlighted: highlightMatches(testString, matches),
    }
  } catch (e) {
    return { isValid: false, error: (e as Error).message }
  }
}
```

**UI Notes:**
- Syntax-highlighted regex input
- Highlight all matches inline in test string
- Show capture groups in a table
- Common regex library (email, URL, phone, date, IP) with one-click insert

---

### Tool 16: Markdown to HTML
**Route:** `/tools/markdown-to-html`
**Library:** `marked` + `dompurify`

```bash
npm install marked dompurify
```

```typescript
import { marked } from 'marked'
import DOMPurify from 'dompurify'

function convertMarkdown(md: string): string {
  const rawHTML = marked.parse(md)
  return DOMPurify.sanitize(rawHTML)  // ALWAYS sanitize before rendering
}
```

**UI Notes:**
- Split-pane editor: Markdown input left, HTML preview right
- Toggle: raw HTML view vs rendered preview
- Copy HTML button
- Download as `.html` file with basic styling embedded

---

### Tool 17: CSV to JSON / JSON to CSV
**Route:** `/tools/csv-json`
**Library:** `papaparse`

```bash
npm install papaparse
```

```typescript
import Papa from 'papaparse'

function csvToJSON(csvString: string): object[] {
  const result = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,  // auto-convert numbers and booleans
  })
  return result.data as object[]
}

function jsonToCSV(data: object[]): string {
  return Papa.unparse(data)
}
```

---

### Tool 18: Image Color Palette Extractor
**Route:** `/tools/color-palette`
**Library:** `color-thief-browser`

```bash
npm install colorthief
```

```typescript
import ColorThief from 'colorthief'

async function extractPalette(file: File, colorCount: number = 8): Promise<number[][]> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const thief = new ColorThief()
      resolve(thief.getPalette(img, colorCount))
    }
    img.src = URL.createObjectURL(file)
  })
}
// Returns: [[255, 128, 0], [30, 60, 90], ...]
```

**UI Notes:**
- Show colour swatches with HEX, RGB, HSL values
- Copy any colour to clipboard with one click
- Generate a full CSS colour variables snippet from the palette

---

### Tool 19: Hash Generator
**Route:** `/tools/hash-generator`
**Library:** Web Crypto API (built-in — zero cost, cryptographically secure)

```typescript
async function hashText(text: string, algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest(algorithm, data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// MD5 is NOT in Web Crypto (it's insecure), use a pure-JS implementation
import SparkMD5 from 'spark-md5'
const md5Hash = SparkMD5.hash(text)
```

---

### Tool 20: Diff Checker
**Route:** `/tools/diff-checker`
**Library:** `diff`

```bash
npm install diff
```

```typescript
import * as Diff from 'diff'

function diffTexts(original: string, modified: string, mode: 'words' | 'lines' | 'chars') {
  const diffFn = {
    words: Diff.diffWords,
    lines: Diff.diffLines,
    chars: Diff.diffChars,
  }[mode]

  return diffFn(original, modified).map(part => ({
    value: part.value,
    added: part.added ?? false,
    removed: part.removed ?? false,
    unchanged: !part.added && !part.removed,
  }))
}
```

**UI Notes:**
- Side-by-side view AND unified view (toggle)
- Line-by-line, word-by-word, character-by-character modes
- Show stats: X lines added, Y lines removed, Z unchanged

---

## 7. Shared Component System

### DropZone Component
Used by every file-based tool. Handles drag-and-drop, click-to-select, and validation.

```typescript
// components/tool-shell/DropZone.tsx
interface DropZoneProps {
  accept: string[]         // MIME types: ['image/jpeg', 'image/png']
  maxSizeMB: number
  multiple?: boolean
  onFiles: (files: File[]) => void
}
```

Styling: large dashed border area, changes colour on drag-over, shows file type icons.

### OutputPanel Component
```typescript
// components/tool-shell/OutputPanel.tsx
interface OutputPanelProps {
  result: Blob | string | null
  filename: string          // suggested download filename
  previewType: 'image' | 'text' | 'pdf' | 'none'
  onReset: () => void
}
```

### ProcessingOverlay Component
Shows during any async operation. Prevents user interaction and displays progress.
```typescript
interface ProcessingOverlayProps {
  isVisible: boolean
  progress?: number         // 0–100, undefined = indeterminate spinner
  message?: string          // "Removing background..." 
}
```

---

## 8. Chrome Extension — Full Spec

### Manifest (manifest.json)
```json
{
  "manifest_version": 3,
  "name": "Shreyan's Tools",
  "version": "1.0.0",
  "description": "Access 110 browser tools instantly. Right-click any image, text, or file.",
  "permissions": [
    "contextMenus",
    "activeTab",
    "storage",
    "scripting"
  ],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background/service-worker.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content-script.js"]
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### Service Worker (background/service-worker.ts)
Registers context menus based on what the user right-clicked.

```typescript
chrome.runtime.onInstalled.addListener(() => {
  // Menu for images
  chrome.contextMenus.create({
    id: 'image-tools',
    title: 'Shreyan\'s Tools',
    contexts: ['image'],
  })
  chrome.contextMenus.create({
    id: 'remove-background',
    parentId: 'image-tools',
    title: '🖼️ Remove Background',
    contexts: ['image'],
  })
  chrome.contextMenus.create({
    id: 'compress-image',
    parentId: 'image-tools',
    title: '📦 Compress Image',
    contexts: ['image'],
  })
  chrome.contextMenus.create({
    id: 'extract-palette',
    parentId: 'image-tools',
    title: '🎨 Extract Colour Palette',
    contexts: ['image'],
  })

  // Menu for selected text
  chrome.contextMenus.create({
    id: 'text-tools',
    title: 'Shreyan\'s Tools',
    contexts: ['selection'],
  })
  chrome.contextMenus.create({
    id: 'word-count',
    parentId: 'text-tools',
    title: '📊 Word Count',
    contexts: ['selection'],
  })
  chrome.contextMenus.create({
    id: 'convert-case',
    parentId: 'text-tools',
    title: '🔤 Convert Case',
    contexts: ['selection'],
  })
  chrome.contextMenus.create({
    id: 'hash-text',
    parentId: 'text-tools',
    title: '#️⃣ Generate Hash',
    contexts: ['selection'],
  })
  chrome.contextMenus.create({
    id: 'encode-base64',
    parentId: 'text-tools',
    title: '🔐 Encode Base64',
    contexts: ['selection'],
  })

  // Menu for links
  chrome.contextMenus.create({
    id: 'link-tools',
    title: 'Shreyan\'s Tools',
    contexts: ['link'],
  })
  chrome.contextMenus.create({
    id: 'qr-from-link',
    parentId: 'link-tools',
    title: '📱 Generate QR Code',
    contexts: ['link'],
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const toolRoutes: Record<string, string> = {
    'remove-background': '/tools/background-remover',
    'compress-image': '/tools/image-compressor',
    'extract-palette': '/tools/color-palette',
    'word-count': '/tools/word-count',
    'convert-case': '/tools/text-case',
    'hash-text': '/tools/hash-generator',
    'encode-base64': '/tools/base64',
    'qr-from-link': '/tools/qr-code',
  }

  const route = toolRoutes[info.menuItemId as string]
  if (!route) return

  // Pass context data via URL params or chrome.storage.session
  const baseUrl = 'https://tools.shreyannarula.com'
  const params = new URLSearchParams()

  if (info.srcUrl) params.set('imageUrl', info.srcUrl)
  if (info.selectionText) params.set('text', info.selectionText)
  if (info.linkUrl) params.set('url', info.linkUrl)

  chrome.tabs.create({ url: `${baseUrl}${route}?${params.toString()}` })
})
```

### Popup (popup/popup.tsx)
A mini search interface showing recent tools and a search box. Opens tool pages in a new tab. Keep popup width at 380px, height at 500px.

### Content Script
Detects page context and injects a subtle floating button in the corner when on relevant pages:
- Page has downloadable files → show file converter suggestion
- Page is a PDF → show PDF tools
- Page has images → show image tools (on hover)

---

## 9. Seamless UX Integration Points

### URL Parameter Pre-population
Every tool reads URL params on load to pre-fill inputs. This is what makes the extension flow seamless:

```typescript
// app/tools/qr-code/page.tsx
'use client'
import { useSearchParams } from 'next/navigation'

export default function QRCodeTool() {
  const params = useSearchParams()
  const [input, setInput] = useState(params.get('url') ?? params.get('text') ?? '')
  // Tool auto-generates QR code if input is pre-filled
}
```

### Progressive Web App (PWA)
Add `manifest.json` and a service worker to make the site installable on mobile. Users can then use "Share" from any app (photos, browser) to send files directly to your tools.

```json
// public/manifest.json
{
  "name": "Shreyan's Tools",
  "short_name": "Tools",
  "start_url": "/",
  "display": "standalone",
  "share_target": {
    "action": "/tools/background-remover",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": { "files": [{ "name": "file", "accept": ["image/*"] }] }
  }
}
```

### Keyboard Shortcuts
On each tool page, register shortcuts for power users:
- `Ctrl/Cmd + V` → paste image from clipboard directly into tool
- `Ctrl/Cmd + Enter` → trigger processing
- `Ctrl/Cmd + S` → download result
- `Escape` → reset tool

### Clipboard Paste Support
```typescript
document.addEventListener('paste', (e) => {
  const items = Array.from(e.clipboardData?.items ?? [])
  const imageItem = items.find(item => item.type.startsWith('image/'))
  if (imageItem) {
    const file = imageItem.getAsFile()
    if (file) handleFile(file)
  }
})
```

### "Recently Used" Persistence
```typescript
// lib/utils/recently-used.ts
const MAX_RECENT = 5

export function trackToolUsage(toolId: string) {
  const recent: string[] = JSON.parse(localStorage.getItem('recentTools') ?? '[]')
  const updated = [toolId, ...recent.filter(id => id !== toolId)].slice(0, MAX_RECENT)
  localStorage.setItem('recentTools', JSON.stringify(updated))
}
```

---

## 10. Phase-Wise Build Plan

### Phase 0: Foundation (Days 1–3)
- [ ] Create Next.js 14 project with TypeScript, Tailwind, shadcn/ui
- [ ] Set up GitHub repo
- [ ] Configure Vercel deployment
- [ ] Set up DNS on Cloudflare (`tools.shreyannarula.com`)
- [ ] Build `lib/tools-registry.ts` with all 110 tools defined (metadata only)
- [ ] Build homepage dashboard: search, category grid, tool cards
- [ ] Build `ToolShell`, `DropZone`, `OutputPanel`, `ProcessingOverlay` components
- [ ] Set COOP/COEP headers in `next.config.js`
- [ ] Add `public/manifest.json` for PWA

**Deliverable:** Empty dashboard at `tools.shreyannarula.com` with all 110 tools listed (linking to "coming soon" pages)

---

### Phase 1: First 10 Tools (Days 4–14)
Build tools in this order (prioritised by traffic and complexity):
- [ ] Tool 7: JSON Formatter (no dependencies, 2 hours)
- [ ] Tool 12: Text Case Converter (no dependencies, 1 hour)
- [ ] Tool 20: Diff Checker (`diff` library, 3 hours)
- [ ] Tool 11: Word Count (no dependencies, 2 hours)
- [ ] Tool 9: Password Generator (Web Crypto, 2 hours)
- [ ] Tool 19: Hash Generator (Web Crypto, 2 hours)
- [ ] Tool 8: Base64 (built-in, 2 hours)
- [ ] Tool 15: Regex Tester (built-in, 4 hours)
- [ ] Tool 14: Unit Converter (pure JS, 4 hours)
- [ ] Tool 13: QR Code Generator (`qrcode`, 3 hours)

**Deliverable:** 10 fully working tools live on the site

---

### Phase 2: Image & PDF Tools (Days 15–28)
- [ ] Tool 4: Image Format Converter (Canvas API)
- [ ] Tool 5: Image Resizer & Cropper (`react-image-crop`)
- [ ] Tool 2: Image Compressor (`browser-image-compression`)
- [ ] Tool 10: Color Picker & Converter (`chroma-js`)
- [ ] Tool 18: Color Palette Extractor (`colorthief`)
- [ ] Tool 6: PDF to Image (`pdfjs-dist`)
- [ ] Tool 3: PDF Merger & Splitter (`pdf-lib`)
- [ ] Tool 16: Markdown to HTML (`marked`)
- [ ] Tool 17: CSV to JSON (`papaparse`)

**Deliverable:** 19 tools live. **Ship to Product Hunt.**

---

### Phase 3: Heavy WASM Tools (Days 29–42)
- [ ] Tool 1: Background Remover (`@imgly/background-removal`) — most complex, most traffic
- [ ] Serve WASM model files from `public/models/`
- [ ] Test on slow connections (model downloads)
- [ ] Add model caching confirmation UI

**Deliverable:** All 20 priority tools live.

---

### Phase 4: Chrome Extension (Days 43–56)
- [ ] Build extension project structure
- [ ] Implement popup with search
- [ ] Implement context menus for image, text, link contexts
- [ ] Implement URL parameter pre-population on tool pages
- [ ] Test on Chrome and Edge
- [ ] Submit to Chrome Web Store (review takes 2–5 days)

---

### Phase 5: PWA & Mobile (Days 57–63)
- [ ] Complete `manifest.json` with Share Target API
- [ ] Add service worker for offline support (cache tool pages)
- [ ] Test on iOS Safari and Android Chrome
- [ ] Add "Install App" prompt nudge

---

### Phase 6: Tools 21–110 (Ongoing, ~1-2 tools/day)
- Build remaining 90 tools in batches of 10
- Release batch notes on Twitter/X for each drop
- Track which tools get the most traffic in Vercel Analytics

---

## 11. Cost Architecture

### Monthly Cost at Various Traffic Levels
| Users/Month | Vercel | Cloudflare | Hetzner | Total |
|---|---|---|---|---|
| 0 – 80k | Free | Free | None | **$0** |
| 80k – 300k | $20 (Pro) | Free | None | **$20** |
| 300k – 1M | $0 (migrate) | Free | €3.29 | **~$4** |
| 1M+ | $0 | $5 Workers | €6 | **~$12** |

### Why Costs Stay Near Zero
- **No compute cost:** All heavy processing (FFmpeg, background removal, OCR) runs on the user's CPU via WASM. You pay nothing per operation.
- **No storage cost:** No files are ever stored server-side. Files are processed in-memory and immediately returned.
- **No database cost:** User preferences stored in `localStorage`. No backend DB needed.
- **CDN is free:** Cloudflare caches all static assets (JS, CSS, WASM models). Once a model is cached globally, Cloudflare serves it — Vercel never sees that traffic.

### Migration Path at Scale
When Vercel bandwidth limits are hit (~80k users):
1. Add Hetzner CAX11 (ARM, €3.29/mo) as origin server
2. Run `next start` on Hetzner
3. Point Cloudflare proxy to Hetzner IP
4. Set Cloudflare cache rules to cache everything for 1 hour
5. Vercel now only used for preview deployments, not production

---

## 12. SEO, Discoverability & Growth

### Per-Tool SEO
Each tool page must have:
```typescript
export const metadata: Metadata = {
  title: `${tool.name} — Free Online Tool | tools.shreyannarula.com`,
  description: tool.description,
  openGraph: {
    title: tool.name,
    description: tool.description,
    url: `https://tools.shreyannarula.com/tools/${tool.id}`,
    siteName: "Shreyan's Tools",
    type: 'website',
  },
  alternates: {
    canonical: `https://tools.shreyannarula.com/tools/${tool.id}`,
  },
}
```

### Sitemap
Auto-generate from the tools registry:
```typescript
// app/sitemap.ts
import { tools } from '@/lib/tools-registry'
export default function sitemap() {
  return tools.map(tool => ({
    url: `https://tools.shreyannarula.com/tools/${tool.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))
}
```

### Growth Channels
- **Product Hunt:** Launch when 20 tools are live. One tool = one feature, pitch it as "110 tools, zero uploads, all private"
- **Twitter/X:** Tweet a demo GIF of the background remover. Visual tools go viral.
- **GitHub:** Open-source the non-proprietary parts. Developers star repos.
- **SEO:** Each tool targets a long-tail keyword. "remove background online free no upload" is 10k+ searches/month.

---

## 13. Monetisation Strategy

### Free Forever (Core)
All 110 tools remain free forever, unlimited use. This is the trust builder.

### Pro Plan ($4.99/month)
- Batch processing (process 100 images at once instead of 1)
- History (see last 50 processed files, re-download)
- No "by Shreyan's Tools" watermark on generated QR codes
- Early access to new tools

### API Access ($9/month for developers)
Expose the same processing via a REST API. Developers pay for convenience of not self-hosting.
```
POST https://api.tools.shreyannarula.com/v1/background-remove
Authorization: Bearer sk-...
Content-Type: multipart/form-data
```

### Implementation: Auth with Clerk (free up to 10k MAU)
```bash
npm install @clerk/nextjs
```

---

## 14. Critical Rules & Gotchas

### Never Break These Rules
1. **COOP/COEP headers are mandatory.** Without them, `SharedArrayBuffer` is unavailable, and FFmpeg WASM breaks silently. Set them in `next.config.js`, not just in the Cloudflare dashboard.

2. **Always revoke Object URLs.** After calling `URL.createObjectURL()`, always call `URL.revokeObjectURL()` after the download or within 60 seconds. Memory leaks will crash tabs on mobile.

3. **Sanitise all HTML output.** The Markdown tool renders user-controlled HTML. Always pass through `DOMPurify.sanitize()` before `dangerouslySetInnerHTML`. Never skip this.

4. **Validate file types by MIME, not extension.** Users rename files. Check `file.type`, not `file.name.endsWith('.jpg')`.

5. **WASM models must be served from `public/` with correct MIME type.** Serve `.wasm` files with `Content-Type: application/wasm`. Vercel does this automatically for files in `/public`.

6. **Never store user files anywhere.** Not localStorage, not your server, not anywhere. Process in memory and discard. This is your privacy USP — never compromise it.

7. **Test FFmpeg on Safari.** Safari's `SharedArrayBuffer` support requires COOP/COEP and has had quirks. Test audio/video tools on Safari before shipping.

8. **Extension content scripts must be minimal.** Never run heavy logic in the content script — it executes on every page the user visits. Keep it under 50 lines. Open the tool site in a new tab for actual processing.

9. **All tool pages must work without JavaScript for SEO.** Use Next.js SSG for the static shell (title, description, UI). Only the processing logic requires JS.

10. **Mobile-first UI for every tool.** 40%+ of traffic will be mobile. DropZone must work with tap-to-select. No hover-only interactions.

---

*Last updated: April 2026. Built for tools.shreyannarula.com by Shreyan Narula.*
