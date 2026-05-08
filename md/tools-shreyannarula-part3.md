# tools.shreyannarula.com — Part 3 Implementation Guide
### Tools 41–60: Complete Build Reference

> This is the direct continuation of Parts 1 and 2. All architecture decisions, shared components (`ToolShell`, `DropZone`, `OutputPanel`, `ProcessingOverlay`), the tools registry pattern, COOP/COEP headers, deployment setup, and all 20 critical rules from Parts 1 and 2 remain in force. This document adds tools 41–60 with the same depth, code specificity, and zero ambiguity. Do not re-implement anything from Parts 1 or 2.

---

## Context: What Was Built in Parts 1 & 2

**40 tools are already live.** Do not rebuild them. Full list in Parts 1 and 2. This document starts at Tool 41.

---

## Tools 41–60 at a Glance

| # | Tool | Route | Primary Library / API |
|---|---|---|---|
| 41 | Audio Format Converter | `/tools/audio-converter` | `@ffmpeg/ffmpeg` (WASM) |
| 42 | Video to GIF Converter | `/tools/video-to-gif` | `@ffmpeg/ffmpeg` (WASM) |
| 43 | Audio Trimmer | `/tools/audio-trimmer` | `@ffmpeg/ffmpeg` (WASM) |
| 44 | Image to PDF | `/tools/image-to-pdf` | `pdf-lib` |
| 45 | Barcode Generator | `/tools/barcode-generator` | `jsbarcode` |
| 46 | Fake Data Generator | `/tools/fake-data-generator` | Pure JS |
| 47 | JSON Web Token Generator | `/tools/jwt-generator` | `jose` |
| 48 | Cron Expression Builder | `/tools/cron-builder` | `cronstrue` + Pure JS |
| 49 | CSS Box Shadow Generator | `/tools/box-shadow` | Pure JS |
| 50 | CSS Border Radius Visualiser | `/tools/border-radius` | Pure JS |
| 51 | Meta Tag Generator | `/tools/meta-tag-generator` | Pure JS |
| 52 | Open Graph Preview | `/tools/og-preview` | `web_fetch` via Cloudflare Worker |
| 53 | Sitemap Generator | `/tools/sitemap-generator` | Pure JS (XML) |
| 54 | robots.txt Generator | `/tools/robots-txt` | Pure JS |
| 55 | Image EXIF GPS Map | `/tools/gps-map` | `exifr` + Leaflet.js |
| 56 | Markdown Table Generator | `/tools/markdown-table` | Pure JS |
| 57 | Unix Timestamp Converter | `/tools/unix-timestamp` | `Intl.DateTimeFormat` (built-in) |
| 58 | IP Address Lookup | `/tools/ip-lookup` | Cloudflare Worker + `ipapi.co` |
| 59 | Random Colour Generator | `/tools/random-color` | `chroma-js` |
| 60 | Code Formatter / Beautifier | `/tools/code-formatter` | `prettier` (browser build) |

---

## Table of Contents

1. [New npm Dependencies](#1-new-npm-dependencies)
2. [Tools 41–60 Detailed Specs](#2-tools-4160-detailed-specs)
3. [New Cloudflare Worker Routes](#3-new-cloudflare-worker-routes)
4. [New Shared Utilities](#4-new-shared-utilities)
5. [Extension Context Menu Additions](#5-extension-context-menu-additions)
6. [Phase Build Order for Tools 41–60](#6-phase-build-order-for-tools-4160)
7. [Critical Rules Specific to This Batch](#7-critical-rules-specific-to-this-batch)

---

## 1. New npm Dependencies

```bash
npm install @ffmpeg/ffmpeg @ffmpeg/util jsbarcode cronstrue jose
```

Additionally, load `prettier` and `leaflet` via CDN inside the tool components (do not bundle them — they are too large):

```typescript
// For prettier — load dynamically only when code-formatter tool is used
const prettier = await import('https://unpkg.com/prettier@3/standalone.js')
const parserBabel = await import('https://unpkg.com/prettier@3/plugins/babel.js')

// For Leaflet (GPS Map tool) — load dynamically
// Add to <head> only on the gps-map page:
// <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
// <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

**Check `package.json` before installing** — `@ffmpeg/ffmpeg`, `pdf-lib`, `exifr`, `chroma-js`, and `papaparse` may already be present from earlier parts.

Full dependency table for this batch:

| Package | Version (minimum) | Used By | Notes |
|---|---|---|---|
| `@ffmpeg/ffmpeg` | `^0.12.0` | Tools 41, 42, 43 | Already installed in Part 1 if audio/video work started |
| `@ffmpeg/util` | `^0.12.0` | Tools 41, 42, 43 | Companion to ffmpeg package |
| `jsbarcode` | `^3.11.0` | Tool 45 | Generates SVG/Canvas barcodes |
| `cronstrue` | `^2.0.0` | Tool 48 | Human-readable cron descriptions |
| `jose` | `^5.0.0` | Tool 47 | JWT signing/verification — Web Crypto based |
| `leaflet` | via CDN | Tool 55 | Loaded dynamically, not bundled |
| `prettier` | via CDN | Tool 60 | Loaded dynamically, not bundled |

---

## 2. Tools 41–60 Detailed Specs

---

### Tool 41: Audio Format Converter
**Route:** `/tools/audio-converter`
**Library:** `@ffmpeg/ffmpeg` + `@ffmpeg/util`
**Input:** MP3, WAV, OGG, FLAC, AAC, M4A, OPUS, WebM (max 200MB)
**Output:** Any of the above formats

**Critical Prerequisites:**
- COOP/COEP headers MUST be set (from Part 1 `next.config.js`). FFmpeg WASM requires `SharedArrayBuffer`. Without these headers, this tool will crash silently.
- FFmpeg WASM binary (~31MB) is downloaded once on first use and cached by the browser. Show a clear one-time download notice.

**Implementation:**

```typescript
// lib/processing/audio-converter.ts
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpegInstance: FFmpeg | null = null
let isLoaded = false

async function getFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
  if (ffmpegInstance && isLoaded) return ffmpegInstance

  ffmpegInstance = new FFmpeg()

  ffmpegInstance.on('progress', ({ progress }) => {
    onProgress?.(Math.round(progress * 100))
  })

  ffmpegInstance.on('log', ({ message }) => {
    // Uncomment for debugging: console.log('[FFmpeg]', message)
  })

  // Serve WASM from your own domain to avoid CORS and CDN reliability issues
  const baseURL = '/ffmpeg'  // serve from public/ffmpeg/
  await ffmpegInstance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  isLoaded = true
  return ffmpegInstance
}

export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac' | 'aac' | 'm4a' | 'opus'

const FORMAT_SETTINGS: Record<AudioFormat, { codec: string; mimeType: string; ext: string }> = {
  mp3:  { codec: '-c:a libmp3lame -q:a 2', mimeType: 'audio/mpeg', ext: 'mp3' },
  wav:  { codec: '-c:a pcm_s16le', mimeType: 'audio/wav', ext: 'wav' },
  ogg:  { codec: '-c:a libvorbis -q:a 4', mimeType: 'audio/ogg', ext: 'ogg' },
  flac: { codec: '-c:a flac', mimeType: 'audio/flac', ext: 'flac' },
  aac:  { codec: '-c:a aac -b:a 192k', mimeType: 'audio/aac', ext: 'aac' },
  m4a:  { codec: '-c:a aac -b:a 192k', mimeType: 'audio/mp4', ext: 'm4a' },
  opus: { codec: '-c:a libopus -b:a 128k', mimeType: 'audio/opus', ext: 'opus' },
}

export async function convertAudio(
  file: File,
  targetFormat: AudioFormat,
  onProgress: (progress: number) => void
): Promise<{ blob: Blob; filename: string }> {
  const ffmpeg = await getFFmpeg(onProgress)

  const inputExt = file.name.split('.').pop() ?? 'audio'
  const inputName = `input.${inputExt}`
  const { ext, mimeType, codec } = FORMAT_SETTINGS[targetFormat]
  const outputName = `output.${ext}`

  // Write input file to FFmpeg's in-memory filesystem
  await ffmpeg.writeFile(inputName, await fetchFile(file))

  // Run conversion
  const codecArgs = codec.split(' ')
  await ffmpeg.exec(['-i', inputName, ...codecArgs, outputName])

  // Read output
  const outputData = await ffmpeg.readFile(outputName)
  const blob = new Blob([outputData], { type: mimeType })

  // Cleanup FFmpeg filesystem
  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)

  const baseName = file.name.replace(/\.[^.]+$/, '')
  return { blob, filename: `${baseName}.${ext}` }
}
```

**Serving FFmpeg WASM files locally:**
```bash
# Run once during project setup — copies WASM to public/ffmpeg/
node -e "
const fs = require('fs');
const src = 'node_modules/@ffmpeg/core/dist/umd';
fs.mkdirSync('public/ffmpeg', { recursive: true });
fs.copyFileSync(src + '/ffmpeg-core.js', 'public/ffmpeg/ffmpeg-core.js');
fs.copyFileSync(src + '/ffmpeg-core.wasm', 'public/ffmpeg/ffmpeg-core.wasm');
"
```

Add this script to `package.json` under `scripts`:
```json
"postinstall": "node scripts/copy-ffmpeg-wasm.js"
```

**UI Notes:**
- Show one-time download notice: "First use downloads FFmpeg engine (~31MB). This is cached and never repeated."
- Format selector: visual button grid (MP3, WAV, FLAC, OGG, AAC, M4A, OPUS)
- Quality selector for lossy formats (MP3/AAC/OGG): Low / Medium / High / Lossless
- Conversion progress bar (0–100% from FFmpeg `progress` event)
- Show original vs output file size after conversion
- Batch mode: accept up to 20 files, convert all with same settings, download as ZIP

---

### Tool 42: Video to GIF Converter
**Route:** `/tools/video-to-gif`
**Library:** `@ffmpeg/ffmpeg` + `@ffmpeg/util`
**Input:** MP4, MOV, WebM, AVI (max 500MB)
**Output:** Animated GIF or WebP

**Why this tool is high-traffic:** GIFs are ubiquitous in communication. This is consistently one of the most searched "free online" tools.

**Implementation:**

```typescript
// lib/processing/video-to-gif.ts
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

// Reuse the same getFFmpeg() from audio-converter.ts
// Import and call it — DO NOT duplicate the FFmpeg initialisation logic

export interface GifOptions {
  startTime: number    // seconds — where to start the clip
  duration: number     // seconds — how long to capture (max 30s recommended)
  fps: number          // frames per second (8–24 — higher = larger file)
  width: number        // output width in pixels (height auto-calculated)
  quality: 'draft' | 'good' | 'best'  // affects dithering and palette generation
  format: 'gif' | 'webp'
}

export async function convertVideoToGif(
  file: File,
  options: GifOptions,
  onProgress: (progress: number) => void
): Promise<{ blob: Blob; filename: string }> {
  const ffmpeg = await getFFmpeg(onProgress)

  const inputExt = file.name.split('.').pop() ?? 'mp4'
  const inputName = `input.${inputExt}`
  const outputName = `output.${options.format}`

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  if (options.format === 'gif') {
    // Two-pass GIF generation: first generate optimal palette, then use it
    // This is CRITICAL for high-quality GIFs — single-pass GIFs look washed out

    // Pass 1: Generate palette
    await ffmpeg.exec([
      '-ss', options.startTime.toString(),
      '-t', options.duration.toString(),
      '-i', inputName,
      '-vf', `fps=${options.fps},scale=${options.width}:-1:flags=lanczos,palettegen=stats_mode=diff`,
      'palette.png'
    ])

    // Pass 2: Apply palette
    const ditherMode = {
      draft: 'bayer:bayer_scale=3',
      good: 'bayer:bayer_scale=5',
      best: 'floyd_steinberg',
    }[options.quality]

    await ffmpeg.exec([
      '-ss', options.startTime.toString(),
      '-t', options.duration.toString(),
      '-i', inputName,
      '-i', 'palette.png',
      '-filter_complex', `fps=${options.fps},scale=${options.width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=${ditherMode}`,
      outputName
    ])

    await ffmpeg.deleteFile('palette.png')
  } else {
    // WebP animated — single pass, smaller and higher quality than GIF
    await ffmpeg.exec([
      '-ss', options.startTime.toString(),
      '-t', options.duration.toString(),
      '-i', inputName,
      '-vf', `fps=${options.fps},scale=${options.width}:-1:flags=lanczos`,
      '-c:v', 'libwebp_anim',
      '-quality', options.quality === 'best' ? '90' : options.quality === 'good' ? '75' : '60',
      '-loop', '0',
      outputName
    ])
  }

  const outputData = await ffmpeg.readFile(outputName)
  const mimeType = options.format === 'gif' ? 'image/gif' : 'image/webp'
  const blob = new Blob([outputData], { type: mimeType })

  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)

  const baseName = file.name.replace(/\.[^.]+$/, '')
  return { blob, filename: `${baseName}.${options.format}` }
}
```

**UI Notes:**
- Video preview player with a range selector to pick start and end points (drag handles on a timeline)
- Show video duration — if >60 seconds, show warning: "GIFs longer than 10s become very large. We recommend 3–8 seconds."
- FPS slider: 8 (smallest) – 24 (smoothest). Show estimated file size next to slider.
- Width presets: 320px, 480px, 640px, 800px, custom
- GIF vs WebP toggle with explanation: "WebP is 30–70% smaller with better quality but not supported everywhere"
- Show frame count estimate: `duration × fps` frames
- Preview generated GIF/WebP before downloading

---

### Tool 43: Audio Trimmer
**Route:** `/tools/audio-trimmer`
**Library:** `@ffmpeg/ffmpeg` + Web Audio API (for waveform visualisation)
**Input:** MP3, WAV, OGG, FLAC, AAC (max 200MB)
**Output:** Trimmed audio in the same format

**Implementation:**

```typescript
// lib/processing/audio-trimmer.ts
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

export async function trimAudio(
  file: File,
  startSeconds: number,
  endSeconds: number,
  onProgress: (progress: number) => void
): Promise<{ blob: Blob; filename: string }> {
  const ffmpeg = await getFFmpeg(onProgress)

  const ext = file.name.split('.').pop() ?? 'mp3'
  const mimeMap: Record<string, string> = {
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
    flac: 'audio/flac', aac: 'audio/aac', m4a: 'audio/mp4',
  }

  const inputName = `input.${ext}`
  const outputName = `output.${ext}`
  const duration = endSeconds - startSeconds

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  // -ss before -i for fast seeking (key frame aligned)
  // -t specifies duration from start point
  // -c copy avoids re-encoding (lossless trim, instant)
  await ffmpeg.exec([
    '-ss', startSeconds.toFixed(3),
    '-i', inputName,
    '-t', duration.toFixed(3),
    '-c', 'copy',   // copy codec — no quality loss, near-instant
    outputName
  ])

  const outputData = await ffmpeg.readFile(outputName)
  const blob = new Blob([outputData], { type: mimeMap[ext] ?? 'audio/mpeg' })

  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)

  const baseName = file.name.replace(/\.[^.]+$/, '')
  return { blob, filename: `${baseName}-trimmed.${ext}` }
}

// Generate waveform data for visualisation using Web Audio API
export async function generateWaveform(
  file: File,
  samples: number = 800
): Promise<Float32Array> {
  const audioCtx = new AudioContext()
  const buffer = await file.arrayBuffer()
  const audioBuffer = await audioCtx.decodeAudioData(buffer)
  const channelData = audioBuffer.getChannelData(0)  // use left channel

  const blockSize = Math.floor(channelData.length / samples)
  const waveform = new Float32Array(samples)

  for (let i = 0; i < samples; i++) {
    const start = i * blockSize
    let max = 0
    for (let j = 0; j < blockSize; j++) {
      const abs = Math.abs(channelData[start + j])
      if (abs > max) max = abs
    }
    waveform[i] = max
  }

  await audioCtx.close()
  return waveform
}
```

**UI Notes:**
- Upload audio → show waveform visualisation (render `Float32Array` from `generateWaveform()` as an SVG path or Canvas bars)
- Two draggable handles on the waveform to set start and end trim points
- Show audio player with the trimmed region highlighted
- Play button plays ONLY the selected region (use `AudioContext` with `start(offset, duration)`)
- Time inputs (start/end) that sync bidirectionally with the drag handles
- "Trim & Download" button — trims with FFmpeg (no re-encoding via `-c copy`)
- Show trimmed duration: "Result: 0:23 / Original: 3:47"

---

### Tool 44: Image to PDF
**Route:** `/tools/image-to-pdf`
**Library:** `pdf-lib` (already installed)
**Input:** JPG, PNG, WebP images (multiple, max 50MB each)
**Output:** Single PDF containing all images

**Implementation:**

```typescript
// lib/processing/image-to-pdf.ts
import { PDFDocument, PageSizes } from 'pdf-lib'

export type PageSize = 'A4' | 'Letter' | 'fit-to-image' | 'A3' | 'Legal'
export type PageOrientation = 'portrait' | 'landscape' | 'auto'
export type ImageFit = 'fit' | 'fill' | 'stretch'

const PAGE_SIZES: Record<Exclude<PageSize, 'fit-to-image'>, [number, number]> = {
  A4:     PageSizes.A4,
  A3:     PageSizes.A3,
  Letter: PageSizes.Letter,
  Legal:  PageSizes.Legal,
}

export interface ImageToPdfOptions {
  pageSize: PageSize
  orientation: PageOrientation
  imageFit: ImageFit
  margin: number   // points (1 point = 1/72 inch), e.g., 36 = 0.5 inch
}

export async function imagesToPDF(
  files: File[],
  options: ImageToPdfOptions,
  onProgress: (current: number, total: number) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()

  for (let i = 0; i < files.length; i++) {
    onProgress(i, files.length)
    const file = files[i]
    const bytes = new Uint8Array(await file.arrayBuffer())

    // Embed image based on type
    let image
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(bytes)
    } else if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(bytes)
    } else {
      // Convert WebP/other formats to PNG first via canvas
      const blob = await convertToPng(file)
      const pngBytes = new Uint8Array(await blob.arrayBuffer())
      image = await pdfDoc.embedPng(pngBytes)
    }

    const imgDims = image.size()

    // Determine page dimensions
    let pageWidth: number
    let pageHeight: number

    if (options.pageSize === 'fit-to-image') {
      pageWidth = imgDims.width
      pageHeight = imgDims.height
    } else {
      const [w, h] = PAGE_SIZES[options.pageSize]
      const orient = options.orientation === 'auto'
        ? (imgDims.width > imgDims.height ? 'landscape' : 'portrait')
        : options.orientation
      pageWidth = orient === 'landscape' ? h : w
      pageHeight = orient === 'landscape' ? w : h
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight])
    const margin = options.pageSize === 'fit-to-image' ? 0 : options.margin
    const availW = pageWidth - margin * 2
    const availH = pageHeight - margin * 2

    // Calculate draw dimensions based on imageFit option
    let drawWidth: number
    let drawHeight: number

    if (options.imageFit === 'stretch') {
      drawWidth = availW
      drawHeight = availH
    } else {
      const imgAspect = imgDims.width / imgDims.height
      const pageAspect = availW / availH

      if (options.imageFit === 'fit') {
        // Fit: scale down to fit within page, maintain aspect ratio
        if (imgAspect > pageAspect) {
          drawWidth = availW
          drawHeight = availW / imgAspect
        } else {
          drawHeight = availH
          drawWidth = availH * imgAspect
        }
      } else {
        // Fill: scale up to fill page, maintain aspect ratio, crop edges
        if (imgAspect > pageAspect) {
          drawHeight = availH
          drawWidth = availH * imgAspect
        } else {
          drawWidth = availW
          drawHeight = availW / imgAspect
        }
      }
    }

    // Centre the image on the page
    const x = margin + (availW - drawWidth) / 2
    const y = margin + (availH - drawHeight) / 2

    page.drawImage(image, { x, y, width: drawWidth, height: drawHeight })
  }

  onProgress(files.length, files.length)
  return await pdfDoc.save()
}

async function convertToPng(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      canvas.toBlob(b => { URL.revokeObjectURL(url); resolve(b!) }, 'image/png')
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Invalid image')) }
    img.src = url
  })
}
```

**UI Notes:**
- Multi-file drag-and-drop with `@dnd-kit/core` to reorder images before converting
- Show thumbnail grid with drag handles and delete buttons per image
- Page size selector: A4, Letter, A3, Legal, Fit to Image
- Orientation: Portrait, Landscape, Auto (based on each image's aspect ratio)
- Image fit: Fit (letterboxed), Fill (cropped), Stretch
- Margin slider: 0 to 72pt (1 inch)
- Progress bar during conversion
- Download single PDF

---

### Tool 45: Barcode Generator
**Route:** `/tools/barcode-generator`
**Library:** `jsbarcode`
**Input:** Text/number string
**Output:** SVG or PNG barcode image

**Supported Formats:** CODE128 (auto-detects content), CODE39, EAN-13, EAN-8, UPC-A, UPC-E, ITF-14, MSI, Pharmacode

**Implementation:**

```typescript
// lib/processing/barcode.ts
import JsBarcode from 'jsbarcode'

export type BarcodeFormat =
  | 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8'
  | 'UPCA' | 'UPCE' | 'ITF14' | 'MSI' | 'pharmacode'

export interface BarcodeOptions {
  format: BarcodeFormat
  value: string
  width: number        // bar width (1–4, default 2)
  height: number       // bar height in px (40–200, default 100)
  displayValue: boolean  // show human-readable text below barcode
  fontSize: number
  textAlign: 'left' | 'center' | 'right'
  textPosition: 'bottom' | 'top'
  textMargin: number
  background: string   // hex colour
  lineColor: string    // hex colour
  margin: number       // quiet zone in px
}

export function generateBarcode(options: BarcodeOptions): {
  svgString: string
  isValid: boolean
  error?: string
} {
  // JsBarcode renders to an SVG element
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

  try {
    JsBarcode(svgEl, options.value, {
      format: options.format,
      width: options.width,
      height: options.height,
      displayValue: options.displayValue,
      fontSize: options.fontSize,
      textAlign: options.textAlign,
      textPosition: options.textPosition,
      textMargin: options.textMargin,
      background: options.background,
      lineColor: options.lineColor,
      margin: options.margin,
      valid: () => {},  // called with true/false — handle via try/catch instead
    })

    const serialiser = new XMLSerializer()
    return { svgString: serialiser.serializeToString(svgEl), isValid: true }
  } catch (e) {
    return {
      svgString: '',
      isValid: false,
      error: (e as Error).message || 'Invalid value for selected barcode format',
    }
  }
}

// Convert SVG barcode to PNG (for download)
export async function barcodeSVGtoPNG(svgString: string, scale: number = 2): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth * scale
      canvas.height = img.naturalHeight * scale
      const ctx = canvas.getContext('2d')!
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url)
        resolve(blob!)
      }, 'image/png')
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG render failed')) }
    img.src = url
  })
}
```

**Validation rules per format (show inline errors):**
- `EAN13`: exactly 12 digits (13th is check digit, auto-calculated)
- `EAN8`: exactly 7 digits
- `UPCA`: exactly 11 digits
- `UPCE`: exactly 6 digits
- `CODE39`: only `A-Z`, `0-9`, and `-.$/+%` and space
- `ITF14`: exactly 13 digits

**UI Notes:**
- Live barcode preview that updates as user types (debounce 200ms)
- Format selector with descriptions: "CODE128 — Most versatile, all characters", "EAN-13 — Retail products", etc.
- Customisation: bar width, height, colours, show/hide text
- Download as SVG (vector) or PNG (raster, 2× scale for print quality)
- Common use-case presets: Retail Product (EAN-13), Book (ISBN-13 via EAN-13), Inventory (CODE128)
- Validation feedback inline: "EAN-13 requires exactly 12 digits (check digit is auto-added)"

---

### Tool 46: Fake Data Generator
**Route:** `/tools/fake-data-generator`
**Library:** None — pure JS with curated data banks
**Input:** Configuration (field types, row count, output format)
**Output:** JSON, CSV, or SQL INSERT statements

**Why no library (e.g., Faker.js):** Faker.js is 2.8MB+ bundled. The curated approach below covers all common use cases in <50KB total.

**Implementation:**

```typescript
// lib/processing/fake-data.ts

// Curated data banks — kept intentionally small (50–200 entries each)
const FIRST_NAMES = ['Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry',
  'Isabella', 'James', 'Kate', 'Liam', 'Mia', 'Noah', 'Olivia', 'Peter', 'Quinn',
  'Rachel', 'Sam', 'Tara', 'Uma', 'Victor', 'Wendy', 'Xander', 'Yara', 'Zoe',
  'Arjun', 'Priya', 'Raj', 'Ananya', 'Wei', 'Mei', 'Hiroshi', 'Sakura', 'Carlos',
  'Maria', 'Ahmed', 'Fatima', 'Lars', 'Ingrid']

const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson',
  'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez',
  'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Tanaka', 'Sato', 'Nakamura']

const DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'company.com',
  'example.org', 'test.io', 'mail.net', 'web.co', 'inbox.dev']

const STREET_NAMES = ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Elm St', 'Park Blvd',
  'Lake Rd', 'Hill St', 'River Rd', 'Forest Ave', 'Sunrise Blvd', 'Garden Way',
  'Valley Dr', 'Mountain Rd', 'Sunset Blvd', 'Harbor View', 'Meadow Ln']

const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Mumbai', 'Delhi', 'Bangalore',
  'London', 'Paris', 'Berlin', 'Tokyo', 'Sydney', 'Toronto', 'Dubai']

const COUNTRIES = ['United States', 'India', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Japan', 'Brazil', 'Mexico']

const COMPANIES = ['Acme Corp', 'Globex', 'Initech', 'Umbrella Corp', 'Cyberdyne Systems',
  'Tyrell Corp', 'Soylent Corp', 'Massive Dynamic', 'Veridian Dynamics', 'Stark Industries',
  'Wayne Enterprises', 'Oscorp', 'LexCorp', 'Pied Piper', 'Hooli', 'Dunder Mifflin']

const JOB_TITLES = ['Software Engineer', 'Product Manager', 'Designer', 'Data Analyst',
  'DevOps Engineer', 'Marketing Manager', 'Sales Representative', 'HR Manager',
  'Financial Analyst', 'Customer Success Manager', 'QA Engineer', 'CTO', 'CEO', 'COO',
  'Business Analyst', 'Cloud Architect', 'Security Engineer', 'Frontend Developer']

function secureRandom(max: number): number {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return arr[0] % max
}

function pick<T>(arr: T[]): T {
  return arr[secureRandom(arr.length)]
}

function randomInt(min: number, max: number): number {
  return min + secureRandom(max - min + 1)
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((min + (max - min) * (secureRandom(10000) / 10000)).toFixed(decimals))
}

export type FieldType =
  | 'firstName' | 'lastName' | 'fullName' | 'email' | 'phone' | 'age'
  | 'address' | 'city' | 'country' | 'zipCode' | 'company' | 'jobTitle'
  | 'uuid' | 'boolean' | 'integer' | 'float' | 'date' | 'url' | 'ipv4'
  | 'creditCard' | 'hex' | 'paragraph' | 'sentence' | 'username' | 'password'

export interface FieldDefinition {
  name: string         // column name
  type: FieldType
  options?: {
    min?: number       // for integer, float, age
    max?: number
    dateFrom?: string  // ISO date string
    dateTo?: string
  }
}

export function generateValue(field: FieldDefinition): string | number | boolean {
  switch (field.type) {
    case 'firstName': return pick(FIRST_NAMES)
    case 'lastName': return pick(LAST_NAMES)
    case 'fullName': return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
    case 'email': {
      const fn = pick(FIRST_NAMES).toLowerCase()
      const ln = pick(LAST_NAMES).toLowerCase()
      return `${fn}.${ln}${randomInt(1, 99)}@${pick(DOMAINS)}`
    }
    case 'phone': return `+1-${randomInt(200, 999)}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`
    case 'age': return randomInt(field.options?.min ?? 18, field.options?.max ?? 80)
    case 'address': return `${randomInt(1, 9999)} ${pick(STREET_NAMES)}, Apt ${randomInt(1, 100)}`
    case 'city': return pick(CITIES)
    case 'country': return pick(COUNTRIES)
    case 'zipCode': return randomInt(10000, 99999).toString().padStart(5, '0')
    case 'company': return pick(COMPANIES)
    case 'jobTitle': return pick(JOB_TITLES)
    case 'uuid': {
      // RFC 4122 UUID v4
      const hex = () => randomInt(0, 15).toString(16)
      return `${hex()}${hex()}${hex()}${hex()}-${hex()}${hex()}-4${hex()}${hex()}-${(8 + secureRandom(4)).toString(16)}${hex()}${hex()}-${hex()}${hex()}${hex()}${hex()}${hex()}${hex()}`
    }
    case 'boolean': return secureRandom(2) === 0
    case 'integer': return randomInt(field.options?.min ?? 0, field.options?.max ?? 1000)
    case 'float': return randomFloat(field.options?.min ?? 0, field.options?.max ?? 1000)
    case 'date': {
      const from = new Date(field.options?.dateFrom ?? '2000-01-01').getTime()
      const to = new Date(field.options?.dateTo ?? new Date().toISOString()).getTime()
      return new Date(from + secureRandom(to - from)).toISOString().split('T')[0]
    }
    case 'url': return `https://www.${pick(['example', 'test', 'demo', 'sample'])}.${pick(['com', 'io', 'org', 'net'])}`
    case 'ipv4': return `${randomInt(1, 254)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`
    case 'creditCard': return `${randomInt(4000, 4999)}-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`
    case 'hex': return '#' + Array.from({ length: 6 }, () => randomInt(0, 15).toString(16)).join('')
    case 'username': {
      const fn = pick(FIRST_NAMES).toLowerCase()
      return `${fn}${randomInt(10, 9999)}`
    }
    case 'password': {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%'
      return Array.from({ length: randomInt(12, 20) }, () => chars[secureRandom(chars.length)]).join('')
    }
    case 'paragraph': return generateLoremSentences(randomInt(3, 7))
    case 'sentence': return generateLoremSentences(1)
    default: return ''
  }
}

function generateLoremSentences(count: number): string {
  const words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing',
    'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'labore', 'dolore', 'magna']
  const sentence = () => {
    const len = randomInt(6, 15)
    const ws = Array.from({ length: len }, () => words[secureRandom(words.length)])
    ws[0] = ws[0].charAt(0).toUpperCase() + ws[0].slice(1)
    return ws.join(' ') + '.'
  }
  return Array.from({ length: count }, sentence).join(' ')
}

export type OutputFormat = 'json' | 'csv' | 'sql' | 'typescript'

export function generateFakeData(
  fields: FieldDefinition[],
  rowCount: number,
  format: OutputFormat,
  tableName: string = 'users'
): string {
  const rows = Array.from({ length: rowCount }, () => {
    const row: Record<string, unknown> = {}
    fields.forEach(f => { row[f.name] = generateValue(f) })
    return row
  })

  switch (format) {
    case 'json': return JSON.stringify(rows, null, 2)
    case 'csv': {
      const headers = fields.map(f => f.name).join(',')
      const dataRows = rows.map(row =>
        fields.map(f => {
          const val = row[f.name]
          const str = String(val)
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
        }).join(',')
      )
      return [headers, ...dataRows].join('\n')
    }
    case 'sql': {
      const cols = fields.map(f => f.name).join(', ')
      const valueRows = rows.map(row => {
        const vals = fields.map(f => {
          const val = row[f.name]
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
          if (typeof val === 'number') return val
          return `'${String(val).replace(/'/g, "''")}'`
        }).join(', ')
        return `(${vals})`
      })
      return `INSERT INTO ${tableName} (${cols}) VALUES\n${valueRows.join(',\n')};`
    }
    case 'typescript': {
      const typeMap: Record<FieldType, string> = {
        firstName: 'string', lastName: 'string', fullName: 'string', email: 'string',
        phone: 'string', age: 'number', address: 'string', city: 'string',
        country: 'string', zipCode: 'string', company: 'string', jobTitle: 'string',
        uuid: 'string', boolean: 'boolean', integer: 'number', float: 'number',
        date: 'string', url: 'string', ipv4: 'string', creditCard: 'string',
        hex: 'string', paragraph: 'string', sentence: 'string', username: 'string',
        password: 'string',
      }
      const iface = `interface ${tableName.charAt(0).toUpperCase() + tableName.slice(1)} {\n` +
        fields.map(f => `  ${f.name}: ${typeMap[f.type]};`).join('\n') + '\n}\n\n'
      return iface + `const data: ${tableName.charAt(0).toUpperCase() + tableName.slice(1)}[] = ` +
        JSON.stringify(rows, null, 2) + ';'
    }
  }
}
```

**UI Notes:**
- Drag-and-drop field builder: add/remove/reorder fields
- Each field row: field name input + type dropdown + optional range inputs
- Row count input (1–10,000; >1000 shows file size warning)
- Output format tabs: JSON, CSV, SQL, TypeScript
- Table name input (for SQL and TypeScript)
- Live preview of first 5 rows in a table
- "Regenerate" button to reshuffle with same config
- Copy and Download buttons

---

### Tool 47: JWT Generator
**Route:** `/tools/jwt-generator`
**Library:** `jose`
**Input:** Payload JSON, algorithm, secret/key
**Output:** Signed JWT string

**Implementation:**

```typescript
// lib/processing/jwt-generator.ts
import { SignJWT, importPKCS8, generateKeyPair } from 'jose'

export type JWTAlgorithm = 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512'

export interface JWTGeneratorOptions {
  algorithm: JWTAlgorithm
  secret?: string                // For HS* algorithms
  privateKey?: string            // PEM format, for RS* algorithms
  payload: Record<string, unknown>
  expiresIn?: string             // e.g. "1h", "7d", "30m"
  issuer?: string
  audience?: string
  subject?: string
}

export async function generateJWT(options: JWTGeneratorOptions): Promise<string> {
  let signingKey: CryptoKey | Uint8Array

  if (options.algorithm.startsWith('HS')) {
    // HMAC: use secret as Uint8Array
    const encoder = new TextEncoder()
    signingKey = encoder.encode(options.secret ?? '')
  } else {
    // RSA: import PEM private key
    if (!options.privateKey) {
      throw new Error('Private key is required for RS* algorithms')
    }
    signingKey = await importPKCS8(options.privateKey, options.algorithm)
  }

  let builder = new SignJWT(options.payload)
    .setProtectedHeader({ alg: options.algorithm })
    .setIssuedAt()

  if (options.expiresIn) {
    const durationMap: Record<string, number> = {
      m: 60, h: 3600, d: 86400, w: 604800
    }
    const match = options.expiresIn.match(/^(\d+)([mhdw])$/)
    if (match) {
      const seconds = parseInt(match[1]) * (durationMap[match[2]] ?? 1)
      builder = builder.setExpirationTime(Math.floor(Date.now() / 1000) + seconds)
    }
  }

  if (options.issuer) builder = builder.setIssuer(options.issuer)
  if (options.audience) builder = builder.setAudience(options.audience)
  if (options.subject) builder = builder.setSubject(options.subject)

  return await builder.sign(signingKey)
}

// Generate a new RSA key pair in PEM format (for RS* algorithms)
export async function generateRSAKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const { publicKey, privateKey } = await generateKeyPair('RS256', {
    modulusLength: 2048,
    extractable: true,
  })

  const { exportJWK, fromJWK } = await import('jose')

  // Export as PEM-like string
  const pubJWK = await exportJWK(publicKey)
  const privJWK = await exportJWK(privateKey)

  return {
    publicKey: JSON.stringify(pubJWK, null, 2),
    privateKey: JSON.stringify(privJWK, null, 2),
  }
}
```

**UI Notes:**
- Payload editor: JSON textarea with syntax highlighting and real-time validation
- Algorithm selector: HS256 / HS384 / HS512 / RS256
- For HS*: Secret input (text) with strength indicator
- For RS*: Private key textarea (PEM) + "Generate Key Pair" button
- Standard claims section: expiry dropdown (15m, 1h, 24h, 7d, 30d, custom), issuer, audience, subject
- Generated JWT shown in colour-coded parts (header.payload.signature)
- Copy JWT button + "Test in JWT.io" link (prefills the jwt.io debugger URL)
- "Verify" tab: paste a token + secret to verify and decode in one step

---

### Tool 48: Cron Expression Builder
**Route:** `/tools/cron-builder`
**Library:** `cronstrue` (human-readable descriptions) + Pure JS (expression generation)
**Input:** Visual UI controls OR raw cron expression string
**Output:** Cron expression string + human-readable description

**Implementation:**

```typescript
// lib/processing/cron-builder.ts
import cronstrue from 'cronstrue'

export interface CronParts {
  minute: string      // e.g. "0", "*/5", "0,30", "0-30"
  hour: string        // e.g. "9", "9-17", "*"
  dayOfMonth: string  // e.g. "1", "15", "L" (last day), "*"
  month: string       // e.g. "1", "JAN", "*"
  dayOfWeek: string   // e.g. "1-5", "MON-FRI", "*"
}

export function buildCronExpression(parts: CronParts): string {
  return `${parts.minute} ${parts.hour} ${parts.dayOfMonth} ${parts.month} ${parts.dayOfWeek}`
}

export function describeCronExpression(expression: string): {
  description: string
  isValid: boolean
  error?: string
  nextRuns: Date[]
} {
  try {
    const description = cronstrue.toString(expression, {
      throwExceptionOnParseError: true,
      verbose: true,
    })

    return {
      description,
      isValid: true,
      nextRuns: calculateNextRuns(expression, 5),
    }
  } catch (e) {
    return {
      description: '',
      isValid: false,
      error: (e as Error).message,
      nextRuns: [],
    }
  }
}

function calculateNextRuns(expression: string, count: number): Date[] {
  // Simple next-run calculator for common patterns
  // For production accuracy, would use a full cron parser library
  // This approximation is sufficient for the UI preview
  const parts = expression.split(' ')
  if (parts.length !== 5) return []

  const results: Date[] = []
  const now = new Date()
  let candidate = new Date(now.getTime() + 60000)  // start 1 minute from now
  candidate.setSeconds(0, 0)

  let iterations = 0
  while (results.length < count && iterations < 100000) {
    if (matchesCron(candidate, parts)) {
      results.push(new Date(candidate))
    }
    candidate = new Date(candidate.getTime() + 60000)
    iterations++
  }

  return results
}

function matchesCron(date: Date, parts: string[]): boolean {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
  return (
    matchField(date.getMinutes(), minute, 0, 59) &&
    matchField(date.getHours(), hour, 0, 23) &&
    matchField(date.getDate(), dayOfMonth, 1, 31) &&
    matchField(date.getMonth() + 1, month, 1, 12) &&
    matchField(date.getDay(), dayOfWeek, 0, 6)
  )
}

function matchField(value: number, field: string, min: number, max: number): boolean {
  if (field === '*') return true
  if (field.includes('/')) {
    const [, step] = field.split('/')
    return value % parseInt(step) === 0
  }
  if (field.includes('-')) {
    const [start, end] = field.split('-').map(Number)
    return value >= start && value <= end
  }
  if (field.includes(',')) {
    return field.split(',').map(Number).includes(value)
  }
  return parseInt(field) === value
}

// Common preset schedules
export const CRON_PRESETS = [
  { label: 'Every minute',          expression: '* * * * *' },
  { label: 'Every 5 minutes',       expression: '*/5 * * * *' },
  { label: 'Every 15 minutes',      expression: '*/15 * * * *' },
  { label: 'Every 30 minutes',      expression: '*/30 * * * *' },
  { label: 'Every hour',            expression: '0 * * * *' },
  { label: 'Every 6 hours',         expression: '0 */6 * * *' },
  { label: 'Every day at midnight', expression: '0 0 * * *' },
  { label: 'Every day at 9am',      expression: '0 9 * * *' },
  { label: 'Every weekday at 9am',  expression: '0 9 * * 1-5' },
  { label: 'Every Monday at 9am',   expression: '0 9 * * 1' },
  { label: 'Every week (Sunday)',   expression: '0 0 * * 0' },
  { label: 'First of every month',  expression: '0 0 1 * *' },
  { label: 'Every January 1st',     expression: '0 0 1 1 *' },
]
```

**UI Notes:**
- Two input modes: "Visual Builder" (dropdowns/sliders) and "Manual" (raw expression input)
- Visual builder: 5 rows — Minute, Hour, Day of Month, Month, Day of Week
  - Each row has: "Every X" radio, "Specific values" multi-select, "Range" from/to inputs
- Human-readable description updates live: "Every weekday at 9:00 AM"
- Next 5 scheduled runs shown as a list
- Presets dropdown for common schedules
- Platform selector: Standard Unix, AWS EventBridge (6 fields), Quartz (7 fields) — adjust field count
- Copy expression button
- Validation badge: green "Valid" / red "Invalid" with error message

---

### Tool 49: CSS Box Shadow Generator
**Route:** `/tools/box-shadow`
**Library:** None — pure JS + CSS
**Input:** Visual UI controls
**Output:** CSS `box-shadow` property string

**Implementation:**

```typescript
// lib/processing/box-shadow.ts

export interface ShadowLayer {
  id: string
  inset: boolean
  offsetX: number    // px
  offsetY: number    // px
  blur: number       // px
  spread: number     // px
  color: string      // hex or rgba
  opacity: number    // 0–1 (applied to color)
}

export function shadowLayerToCSS(layer: ShadowLayer): string {
  const hex = layer.color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const color = `rgba(${r}, ${g}, ${b}, ${layer.opacity.toFixed(2)})`
  const inset = layer.inset ? 'inset ' : ''
  return `${inset}${layer.offsetX}px ${layer.offsetY}px ${layer.blur}px ${layer.spread}px ${color}`
}

export function generateBoxShadowCSS(layers: ShadowLayer[]): {
  css: string
  tailwind: string
  full: string
} {
  const value = layers.map(shadowLayerToCSS).join(', ')
  return {
    css: `box-shadow: ${value};`,
    tailwind: `[box-shadow:${value}]`,  // Tailwind arbitrary value
    full: `.element {\n  box-shadow: ${value};\n}`,
  }
}

// Presets
export const BOX_SHADOW_PRESETS: { label: string; layers: Omit<ShadowLayer, 'id'>[] }[] = [
  { label: 'None',        layers: [] },
  { label: 'Subtle',      layers: [{ inset: false, offsetX: 0, offsetY: 1, blur: 3, spread: 0, color: '#000000', opacity: 0.08 }] },
  { label: 'Small',       layers: [{ inset: false, offsetX: 0, offsetY: 2, blur: 4, spread: 0, color: '#000000', opacity: 0.12 }] },
  { label: 'Medium',      layers: [{ inset: false, offsetX: 0, offsetY: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.16 }] },
  { label: 'Large',       layers: [{ inset: false, offsetX: 0, offsetY: 8, blur: 24, spread: -4, color: '#000000', opacity: 0.20 }] },
  { label: 'Extra Large', layers: [{ inset: false, offsetX: 0, offsetY: 16, blur: 48, spread: -8, color: '#000000', opacity: 0.24 }] },
  { label: 'Glow Blue',   layers: [{ inset: false, offsetX: 0, offsetY: 0, blur: 20, spread: 0, color: '#3B82F6', opacity: 0.50 }] },
  { label: 'Glow Purple', layers: [{ inset: false, offsetX: 0, offsetY: 0, blur: 20, spread: 0, color: '#8B5CF6', opacity: 0.50 }] },
  { label: 'Inset',       layers: [{ inset: true, offsetX: 0, offsetY: 2, blur: 4, spread: 0, color: '#000000', opacity: 0.15 }] },
  { label: 'Layered',     layers: [
    { inset: false, offsetX: 0, offsetY: 1, blur: 2, spread: 0, color: '#000000', opacity: 0.05 },
    { inset: false, offsetX: 0, offsetY: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.10 },
    { inset: false, offsetX: 0, offsetY: 16, blur: 32, spread: 0, color: '#000000', opacity: 0.10 },
  ]},
]
```

**UI Notes:**
- Large preview box (white card on grey background) that updates live
- Shadow layer list: add up to 8 layers, drag to reorder, toggle visibility per layer
- Per-layer controls: Inset toggle, X Offset, Y Offset, Blur, Spread sliders, Colour picker, Opacity slider
- Presets gallery — click to apply
- Preview box colour, border-radius, and size controls (so user can see shadows on their actual element shape)
- Output section: CSS, Tailwind arbitrary value — copy buttons for each

---

### Tool 50: CSS Border Radius Visualiser
**Route:** `/tools/border-radius`
**Library:** None — pure JS + CSS
**Input:** Visual UI controls (8 independent corner values)
**Output:** CSS `border-radius` property string

**Implementation:**

```typescript
// lib/processing/border-radius.ts

export interface BorderRadiusValues {
  // CSS border-radius shorthand supports 8 values:
  // top-left-horizontal / top-right-horizontal / bottom-right-horizontal / bottom-left-horizontal
  // / top-left-vertical / top-right-vertical / bottom-right-vertical / bottom-left-vertical
  topLeftH: number
  topRightH: number
  bottomRightH: number
  bottomLeftH: number
  topLeftV: number
  topRightV: number
  bottomRightV: number
  bottomLeftV: number
  unit: 'px' | '%'
}

export function generateBorderRadiusCSS(values: BorderRadiusValues): {
  css: string
  shorthand: string
  individual: string
  isSymmetric: boolean
} {
  const u = values.unit

  // Check if horizontal and vertical values are equal (symmetric)
  const isSymmetric = (
    values.topLeftH === values.topLeftV &&
    values.topRightH === values.topRightV &&
    values.bottomRightH === values.bottomRightV &&
    values.bottomLeftH === values.bottomLeftV
  )

  let shorthand: string
  if (isSymmetric) {
    const tl = values.topLeftH, tr = values.topRightH
    const br = values.bottomRightH, bl = values.bottomLeftH
    // Further simplify: CSS border-radius accepts 1-4 values
    if (tl === tr && tr === br && br === bl) {
      shorthand = `${tl}${u}`
    } else if (tl === br && tr === bl) {
      shorthand = `${tl}${u} ${tr}${u}`
    } else if (tr === bl) {
      shorthand = `${tl}${u} ${tr}${u} ${br}${u}`
    } else {
      shorthand = `${tl}${u} ${tr}${u} ${br}${u} ${bl}${u}`
    }
  } else {
    // Full 8-value syntax
    shorthand = `${values.topLeftH}${u} ${values.topRightH}${u} ${values.bottomRightH}${u} ${values.bottomLeftH}${u} / ${values.topLeftV}${u} ${values.topRightV}${u} ${values.bottomRightV}${u} ${values.bottomLeftV}${u}`
  }

  const individual = [
    `border-top-left-radius: ${values.topLeftH}${u}${!isSymmetric ? ` ${values.topLeftV}${u}` : ''};`,
    `border-top-right-radius: ${values.topRightH}${u}${!isSymmetric ? ` ${values.topRightV}${u}` : ''};`,
    `border-bottom-right-radius: ${values.bottomRightH}${u}${!isSymmetric ? ` ${values.bottomRightV}${u}` : ''};`,
    `border-bottom-left-radius: ${values.bottomLeftH}${u}${!isSymmetric ? ` ${values.bottomLeftV}${u}` : ''};`,
  ].join('\n')

  return {
    css: `border-radius: ${shorthand};`,
    shorthand,
    individual,
    isSymmetric,
  }
}

export const BORDER_RADIUS_PRESETS: { label: string; values: Partial<BorderRadiusValues> }[] = [
  { label: 'None',       values: { topLeftH: 0, topRightH: 0, bottomRightH: 0, bottomLeftH: 0 } },
  { label: 'Subtle',     values: { topLeftH: 4, topRightH: 4, bottomRightH: 4, bottomLeftH: 4 } },
  { label: 'Rounded',    values: { topLeftH: 8, topRightH: 8, bottomRightH: 8, bottomLeftH: 8 } },
  { label: 'Pill',       values: { topLeftH: 9999, topRightH: 9999, bottomRightH: 9999, bottomLeftH: 9999 } },
  { label: 'Circle',     values: { topLeftH: 50, topRightH: 50, bottomRightH: 50, bottomLeftH: 50, unit: '%' } },
  { label: 'Ticket',     values: { topLeftH: 0, topRightH: 50, bottomRightH: 50, bottomLeftH: 0 } },
  { label: 'Blob',       values: { topLeftH: 30, topRightH: 70, bottomRightH: 30, bottomLeftH: 70, topLeftV: 70, topRightV: 30, bottomRightV: 70, bottomLeftV: 30, unit: '%' } },
]
```

**UI Notes:**
- Large preview box that updates live showing the shape
- 8 sliders (or 4 in linked mode) for each corner's horizontal and vertical radius
- "Link corners" toggle: all four corners move together
- "Link H/V" toggle: horizontal and vertical values stay equal
- Unit toggle: px / %
- Presets gallery with shape labels and visual thumbnails
- Output: CSS shorthand + individual properties + copy buttons
- "Animate" button: shows the shape morphing between blob presets (CSS animation demo)

---

### Tool 51: Meta Tag Generator
**Route:** `/tools/meta-tag-generator`
**Library:** None — pure JS string generation
**Input:** Form fields (title, description, URL, image, etc.)
**Output:** Complete `<head>` HTML snippet

**Implementation:**

```typescript
// lib/processing/meta-tags.ts

export interface MetaTagInput {
  // Basic SEO
  title: string              // max 60 chars recommended
  description: string        // max 160 chars recommended
  keywords?: string          // comma-separated (less important now)
  author?: string
  canonicalUrl?: string
  noIndex?: boolean
  noFollow?: boolean

  // Open Graph (Facebook, LinkedIn, WhatsApp)
  ogTitle?: string           // defaults to title
  ogDescription?: string     // defaults to description
  ogImage?: string           // URL, min 1200x630px recommended
  ogImageAlt?: string
  ogType?: 'website' | 'article' | 'product' | 'profile'
  ogUrl?: string             // defaults to canonicalUrl
  ogSiteName?: string

  // Twitter Card
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  twitterSite?: string       // @username
  twitterCreator?: string    // @username
  twitterTitle?: string      // defaults to ogTitle
  twitterDescription?: string // defaults to ogDescription
  twitterImage?: string      // defaults to ogImage

  // Technical
  charset?: 'UTF-8'          // always UTF-8
  viewport?: string          // default: 'width=device-width, initial-scale=1'
  themeColor?: string        // hex colour for browser chrome
  language?: string          // e.g. 'en'
}

export function generateMetaTags(input: MetaTagInput): string {
  const tags: string[] = []
  const indent = '  '

  // Essential meta tags (always include)
  tags.push(`<meta charset="${input.charset ?? 'UTF-8'}">`)
  tags.push(`<meta name="viewport" content="${input.viewport ?? 'width=device-width, initial-scale=1'}">`)

  if (input.themeColor) {
    tags.push(`<meta name="theme-color" content="${input.themeColor}">`)
  }

  // Basic SEO
  tags.push(`<title>${escapeHTML(input.title)}</title>`)
  tags.push(`<meta name="description" content="${escapeHTML(input.description)}">`)

  if (input.keywords) {
    tags.push(`<meta name="keywords" content="${escapeHTML(input.keywords)}">`)
  }
  if (input.author) {
    tags.push(`<meta name="author" content="${escapeHTML(input.author)}">`)
  }

  const robotsContent = [
    input.noIndex ? 'noindex' : 'index',
    input.noFollow ? 'nofollow' : 'follow',
  ].join(', ')
  tags.push(`<meta name="robots" content="${robotsContent}">`)

  if (input.canonicalUrl) {
    tags.push(`<link rel="canonical" href="${input.canonicalUrl}">`)
  }

  if (input.language) {
    tags.push(`<meta http-equiv="content-language" content="${input.language}">`)
  }

  // Open Graph
  tags.push('')  // blank line separator
  tags.push(`<!-- Open Graph / Social Media -->`)
  tags.push(`<meta property="og:type" content="${input.ogType ?? 'website'}">`)
  tags.push(`<meta property="og:title" content="${escapeHTML(input.ogTitle ?? input.title)}">`)
  tags.push(`<meta property="og:description" content="${escapeHTML(input.ogDescription ?? input.description)}">`)

  if (input.ogUrl ?? input.canonicalUrl) {
    tags.push(`<meta property="og:url" content="${input.ogUrl ?? input.canonicalUrl}">`)
  }
  if (input.ogSiteName) {
    tags.push(`<meta property="og:site_name" content="${escapeHTML(input.ogSiteName)}">`)
  }
  if (input.ogImage) {
    tags.push(`<meta property="og:image" content="${input.ogImage}">`)
    tags.push(`<meta property="og:image:width" content="1200">`)
    tags.push(`<meta property="og:image:height" content="630">`)
    if (input.ogImageAlt) {
      tags.push(`<meta property="og:image:alt" content="${escapeHTML(input.ogImageAlt)}">`)
    }
  }

  // Twitter Card
  tags.push('')
  tags.push(`<!-- Twitter Card -->`)
  tags.push(`<meta name="twitter:card" content="${input.twitterCard ?? 'summary_large_image'}">`)
  tags.push(`<meta name="twitter:title" content="${escapeHTML(input.twitterTitle ?? input.ogTitle ?? input.title)}">`)
  tags.push(`<meta name="twitter:description" content="${escapeHTML(input.twitterDescription ?? input.ogDescription ?? input.description)}">`)

  if (input.twitterSite) {
    tags.push(`<meta name="twitter:site" content="${input.twitterSite}">`)
  }
  if (input.twitterCreator) {
    tags.push(`<meta name="twitter:creator" content="${input.twitterCreator}">`)
  }
  if (input.twitterImage ?? input.ogImage) {
    tags.push(`<meta name="twitter:image" content="${input.twitterImage ?? input.ogImage}">`)
  }

  return tags.map(tag => tag === '' || tag.startsWith('<!--') ? tag : indent + tag).join('\n')
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Validation helpers
export function validateMetaInput(input: MetaTagInput): { field: string; warning: string }[] {
  const warnings: { field: string; warning: string }[] = []

  if (input.title.length > 60) {
    warnings.push({ field: 'title', warning: `Title is ${input.title.length} chars. Google truncates at ~60 chars.` })
  }
  if (input.description.length > 160) {
    warnings.push({ field: 'description', warning: `Description is ${input.description.length} chars. Google truncates at ~160 chars.` })
  }
  if (!input.ogImage) {
    warnings.push({ field: 'ogImage', warning: 'No OG image set. Links shared on social media will show no preview image.' })
  }
  if (!input.canonicalUrl) {
    warnings.push({ field: 'canonicalUrl', warning: 'No canonical URL. This may cause duplicate content issues.' })
  }

  return warnings
}
```

**UI Notes:**
- Tab-grouped form: Basic SEO, Open Graph, Twitter, Technical
- Character counters for title (60 limit) and description (160 limit) with colour-coded feedback
- Live social preview panel: renders a mock Facebook/Twitter/LinkedIn link preview card using entered values
- Warning badges on fields that need attention (no image, title too long, etc.)
- Output: syntax-highlighted HTML snippet with copy button
- "Include only filled fields" toggle to exclude optional empty tags

---

### Tool 52: Open Graph Preview
**Route:** `/tools/og-preview`
**Backend:** Cloudflare Worker (required — fetches third-party URLs, CORS-blocked in browser)
**Input:** Any public URL
**Output:** Visual preview of how the link looks on Facebook, Twitter, LinkedIn, WhatsApp, Slack

**Cloudflare Worker implementation:**

```typescript
// cloudflare-workers/og-preview.ts
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const targetURL = url.searchParams.get('url')

    if (!targetURL) {
      return new Response(JSON.stringify({ error: 'url parameter required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://tools.shreyannarula.com' }
      })
    }

    try {
      // Validate URL
      const parsed = new URL(targetURL)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Only HTTP/HTTPS URLs are supported')
      }

      // Fetch with a realistic browser User-Agent (some sites block bots)
      const response = await fetch(targetURL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OGPreviewBot/1.0; +https://tools.shreyannarula.com)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
        cf: { timeout: 10 }  // 10 second timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      const ogData = extractOGTags(html, targetURL)

      return new Response(JSON.stringify(ogData), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://tools.shreyannarula.com',
          'Cache-Control': 'public, max-age=3600',  // cache for 1 hour
        }
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error).message }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://tools.shreyannarula.com' }
      })
    }
  }
}

interface OGData {
  title: string | null
  description: string | null
  image: string | null
  imageAlt: string | null
  siteName: string | null
  type: string | null
  url: string | null
  twitterCard: string | null
  twitterTitle: string | null
  twitterDescription: string | null
  twitterImage: string | null
  favicon: string | null
  themeColor: string | null
  finalUrl: string
}

function extractOGTags(html: string, originalUrl: string): OGData {
  const meta = (property: string): string | null => {
    const patterns = [
      new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+property=["']${property}["']`, 'i'),
      new RegExp(`<meta\\s+name=["']${property}["']\\s+content=["']([^"']+)["']`, 'i'),
    ]
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i)
  const faviconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i)

  const baseUrl = new URL(originalUrl)

  return {
    title: meta('og:title') ?? (titleMatch ? titleMatch[1] : null),
    description: meta('og:description') ?? meta('description'),
    image: meta('og:image'),
    imageAlt: meta('og:image:alt'),
    siteName: meta('og:site_name'),
    type: meta('og:type'),
    url: meta('og:url') ?? originalUrl,
    twitterCard: meta('twitter:card'),
    twitterTitle: meta('twitter:title'),
    twitterDescription: meta('twitter:description'),
    twitterImage: meta('twitter:image'),
    favicon: faviconMatch ? new URL(faviconMatch[1], baseUrl).href : `${baseUrl.origin}/favicon.ico`,
    themeColor: meta('theme-color'),
    finalUrl: originalUrl,
  }
}
```

**Route in `wrangler.toml`:**
```toml
[[routes]]
pattern = "tools.shreyannarula.com/api/worker/og-preview"
zone_name = "shreyannarula.com"
```

**UI Notes:**
- URL input with "Fetch Preview" button
- Show preview cards for: Facebook/LinkedIn (horizontal), Twitter (two card styles: summary and large image), WhatsApp (simple), Slack (with emoji)
- Each preview card is a rendered HTML mockup, not a screenshot
- Show raw tag table below: property → value
- Highlight missing tags with warnings: "Missing og:image — Facebook will show no image"
- Cache results client-side in `sessionStorage` so re-entering the same URL is instant

---

### Tool 53: Sitemap Generator
**Route:** `/tools/sitemap-generator`
**Library:** None — pure JS (XML string generation)
**Input:** List of URLs (paste or upload from CSV), configuration
**Output:** `sitemap.xml` file

**Implementation:**

```typescript
// lib/processing/sitemap.ts

export type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'

export interface SitemapURL {
  loc: string                        // Full URL
  lastmod?: string                   // ISO date YYYY-MM-DD
  changefreq?: ChangeFrequency
  priority?: number                  // 0.0–1.0
}

export interface SitemapOptions {
  urls: SitemapURL[]
  includeImages?: boolean            // Future: image sitemap extension
  compress?: boolean                 // gzip (browser can't do this — note only)
}

export function generateSitemap(options: SitemapOptions): string {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>`
  const urlSetOpen = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
  const urlSetClose = `</urlset>`

  const urlEntries = options.urls.map(url => {
    const lines: string[] = [`  <url>`, `    <loc>${escapeXML(url.loc)}</loc>`]

    if (url.lastmod) {
      lines.push(`    <lastmod>${url.lastmod}</lastmod>`)
    }
    if (url.changefreq) {
      lines.push(`    <changefreq>${url.changefreq}</changefreq>`)
    }
    if (url.priority !== undefined) {
      lines.push(`    <priority>${url.priority.toFixed(1)}</priority>`)
    }

    lines.push(`  </url>`)
    return lines.join('\n')
  })

  return [xmlHeader, urlSetOpen, ...urlEntries, urlSetClose].join('\n')
}

// Parse a list of raw URLs and apply defaults
export function parseURLsToSitemapEntries(
  rawUrls: string[],
  defaults: Partial<SitemapURL>
): SitemapURL[] {
  return rawUrls
    .map(line => line.trim())
    .filter(line => {
      try { new URL(line); return true }
      catch { return false }
    })
    .map(url => ({
      loc: url,
      lastmod: defaults.lastmod ?? new Date().toISOString().split('T')[0],
      changefreq: defaults.changefreq,
      priority: defaults.priority,
    }))
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Validate a sitemap's URLs
export function validateSitemap(urls: SitemapURL[]): { url: string; issue: string }[] {
  const issues: { url: string; issue: string }[] = []

  if (urls.length > 50000) {
    issues.push({ url: '', issue: 'Sitemap exceeds 50,000 URL limit. Split into multiple sitemaps and use a sitemap index.' })
  }

  urls.forEach(entry => {
    if (entry.priority !== undefined && (entry.priority < 0 || entry.priority > 1)) {
      issues.push({ url: entry.loc, issue: `Priority ${entry.priority} is outside 0.0–1.0 range` })
    }
    if (!entry.loc.startsWith('https://') && !entry.loc.startsWith('http://')) {
      issues.push({ url: entry.loc, issue: 'URL must start with http:// or https://' })
    }
  })

  return issues
}
```

**UI Notes:**
- Large textarea to paste URLs (one per line) OR upload a CSV file with a URL column
- Domain input: auto-prepend to relative URLs
- Default settings: changefreq dropdown, priority slider, last modified date
- Per-URL overrides: show as an editable table after parsing
- Validation panel: show errors/warnings per URL
- Output: syntax-highlighted XML with copy and download buttons
- Download as `sitemap.xml`
- Note if URL count exceeds 50,000 (the sitemap spec limit)

---

### Tool 54: robots.txt Generator
**Route:** `/tools/robots-txt`
**Library:** None — pure JS string generation
**Input:** Visual form controls
**Output:** `robots.txt` file content

**Implementation:**

```typescript
// lib/processing/robots-txt.ts

export interface RobotsRule {
  userAgent: string     // e.g. "*", "Googlebot", "Bingbot"
  disallow: string[]    // paths to disallow: "/admin/", "/private/"
  allow: string[]       // paths to explicitly allow (overrides disallow)
  crawlDelay?: number   // seconds between requests (not supported by Google)
}

export interface RobotsOptions {
  rules: RobotsRule[]
  sitemapUrls: string[]   // full URLs to sitemap.xml files
  hostDirective?: string  // preferred domain (for Yandex)
}

export function generateRobotsTxt(options: RobotsOptions): string {
  const sections: string[] = []

  // Group rules by user-agent and merge duplicates
  const agentMap = new Map<string, { disallow: Set<string>; allow: Set<string>; crawlDelay?: number }>()

  for (const rule of options.rules) {
    const existing = agentMap.get(rule.userAgent) ?? { disallow: new Set(), allow: new Set() }
    rule.disallow.forEach(d => existing.disallow.add(d))
    rule.allow.forEach(a => existing.allow.add(a))
    if (rule.crawlDelay !== undefined) existing.crawlDelay = rule.crawlDelay
    agentMap.set(rule.userAgent, existing)
  }

  // Always put wildcard (*) rule first
  const agents = [...agentMap.entries()].sort(([a], [b]) => {
    if (a === '*') return -1
    if (b === '*') return 1
    return a.localeCompare(b)
  })

  for (const [agent, rule] of agents) {
    const lines: string[] = [`User-agent: ${agent}`]
    rule.allow.forEach(path => lines.push(`Allow: ${path}`))
    rule.disallow.forEach(path => lines.push(`Disallow: ${path}`))
    if (rule.crawlDelay !== undefined) lines.push(`Crawl-delay: ${rule.crawlDelay}`)
    sections.push(lines.join('\n'))
  }

  if (options.sitemapUrls.length > 0) {
    sections.push(options.sitemapUrls.map(url => `Sitemap: ${url}`).join('\n'))
  }

  if (options.hostDirective) {
    sections.push(`Host: ${options.hostDirective}`)
  }

  return sections.join('\n\n')
}

// Common bot presets
export const COMMON_BOTS = [
  { label: 'All robots', value: '*' },
  { label: 'Google (Googlebot)', value: 'Googlebot' },
  { label: 'Google Images', value: 'Googlebot-Image' },
  { label: 'Google AdsBot', value: 'AdsBot-Google' },
  { label: 'Bing (Bingbot)', value: 'Bingbot' },
  { label: 'Yahoo (Slurp)', value: 'Slurp' },
  { label: 'DuckDuckGo (DuckDuckBot)', value: 'DuckDuckBot' },
  { label: 'Yandex (YandexBot)', value: 'YandexBot' },
  { label: 'Baidu (Baiduspider)', value: 'Baiduspider' },
  { label: 'ChatGPT (GPTBot)', value: 'GPTBot' },
  { label: 'Common Crawl (CCBot)', value: 'CCBot' },
  { label: 'SEMrush', value: 'SemrushBot' },
  { label: 'Ahref', value: 'AhrefsBot' },
]

// Common disallow path presets
export const COMMON_DISALLOW_PATHS = [
  '/admin/', '/api/', '/private/', '/tmp/', '/cache/',
  '*.pdf', '/wp-admin/', '/wp-login.php',
  '/search?', '/login', '/checkout', '/account',
]
```

**UI Notes:**
- Rule builder: add rules per user-agent with disallow/allow path lists
- "Block all" / "Allow all" quick presets per user-agent
- Common bot selector dropdown with checkboxes
- Sitemap URL inputs (add multiple)
- Live preview of generated `robots.txt`
- Validation: warn on `Disallow: /` with * agent ("This blocks all search engines from indexing your site")
- Copy and download buttons

---

### Tool 55: Image EXIF GPS Map
**Route:** `/tools/gps-map`
**Library:** `exifr` (already installed) + Leaflet.js (CDN)
**Input:** Any image with GPS EXIF data (JPG, HEIC, TIFF)
**Output:** Interactive map showing photo location + metadata panel

**Implementation:**

```typescript
// lib/processing/gps-map.ts
import * as exifr from 'exifr'

export interface GPSMapData {
  latitude: number
  longitude: number
  altitude?: number
  direction?: number       // compass bearing 0-360
  dateTaken?: Date
  camera?: string
  imageUrl: string         // Object URL for preview
}

export async function extractGPSData(file: File): Promise<GPSMapData | null> {
  const [gps, exifData] = await Promise.all([
    exifr.gps(file),
    exifr.parse(file, ['Make', 'Model', 'DateTimeOriginal', 'GPSAltitude', 'GPSImgDirection'])
  ])

  if (!gps || !gps.latitude || !gps.longitude) return null

  return {
    latitude: gps.latitude,
    longitude: gps.longitude,
    altitude: exifData?.GPSAltitude,
    direction: exifData?.GPSImgDirection,
    dateTaken: exifData?.DateTimeOriginal,
    camera: exifData?.Make && exifData?.Model
      ? `${exifData.Make} ${exifData.Model}`
      : exifData?.Make ?? exifData?.Model,
    imageUrl: URL.createObjectURL(file),
  }
}
```

**Leaflet map initialisation (in the React component — not in lib/):**

```typescript
// app/tools/gps-map/GPSMapTool.tsx
'use client'
import { useEffect, useRef } from 'react'

export function MapComponent({ lat, lng, imageUrl }: { lat: number; lng: number; imageUrl: string }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    if (typeof window === 'undefined') return

    // Leaflet must be loaded dynamically (it uses window/document)
    const L = (window as any).L
    if (!L) return

    const map = L.map(mapRef.current).setView([lat, lng], 15)
    mapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // Custom marker with photo thumbnail
    const icon = L.divIcon({
      html: `<div style="width:48px;height:48px;border-radius:50%;border:3px solid white;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.4)"><img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover"/></div>`,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    })

    L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(`<b>Photo Location</b><br>${lat.toFixed(6)}°, ${lng.toFixed(6)}°`)
      .openPopup()

    return () => { map.remove(); mapInstanceRef.current = null }
  }, [lat, lng, imageUrl])

  return <div ref={mapRef} style={{ height: '400px', width: '100%', borderRadius: '8px' }} />
}
```

**Load Leaflet CSS and JS in the page head (only for this tool page):**
```typescript
// app/tools/gps-map/page.tsx
import Head from 'next/head'

export default function GPSMapPage() {
  return (
    <>
      <Head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" />
      </Head>
      {/* Tool component */}
    </>
  )
}
```

**UI Notes:**
- Upload image → if no GPS data found, show: "No GPS data found in this image. GPS is usually present in photos taken on a smartphone with location enabled."
- Show photo thumbnail alongside the map
- Metadata panel: date taken, camera model, coordinates (decimal and DMS format), altitude, compass direction
- "Copy Coordinates" button (copies `lat,lng` for Google Maps)
- "Open in Google Maps" link: `https://maps.google.com/?q=${lat},${lng}`
- "Open in Apple Maps" link: `https://maps.apple.com/?ll=${lat},${lng}`
- Map tile layers: Street, Satellite (OpenStreetMap), Terrain — toggle
- Option to strip GPS and download cleaned image (reuse `stripMetadata` from Tool 22)

---

### Tool 56: Markdown Table Generator
**Route:** `/tools/markdown-table`
**Library:** None — pure JS
**Input:** Data entered in a spreadsheet-like grid OR pasted CSV
**Output:** Markdown table + HTML table

**Implementation:**

```typescript
// lib/processing/markdown-table.ts

export type Alignment = 'left' | 'center' | 'right' | 'none'

export interface TableData {
  headers: string[]
  rows: string[][]
  alignments: Alignment[]
}

export function generateMarkdownTable(data: TableData): string {
  const { headers, rows, alignments } = data

  // Calculate column widths for pretty formatting
  const colWidths = headers.map((h, i) => {
    const maxDataWidth = rows.reduce((max, row) => Math.max(max, (row[i] ?? '').length), 0)
    return Math.max(h.length, maxDataWidth, 3)  // minimum 3 for alignment markers
  })

  const formatCell = (content: string, width: number): string => {
    return content.padEnd(width, ' ')
  }

  const alignMarker = (alignment: Alignment, width: number): string => {
    switch (alignment) {
      case 'left':   return ':' + '-'.repeat(width - 1)
      case 'right':  return '-'.repeat(width - 1) + ':'
      case 'center': return ':' + '-'.repeat(width - 2) + ':'
      default:       return '-'.repeat(width)
    }
  }

  const headerRow = '| ' + headers.map((h, i) => formatCell(h, colWidths[i])).join(' | ') + ' |'
  const separatorRow = '| ' + colWidths.map((w, i) => alignMarker(alignments[i] ?? 'none', w)).join(' | ') + ' |'
  const dataRows = rows.map(row =>
    '| ' + colWidths.map((w, i) => formatCell(row[i] ?? '', w)).join(' | ') + ' |'
  )

  return [headerRow, separatorRow, ...dataRows].join('\n')
}

export function generateHTMLTable(data: TableData): string {
  const alignStyle = (a: Alignment): string =>
    a !== 'none' ? ` style="text-align:${a}"` : ''

  const headers = data.headers.map((h, i) =>
    `    <th${alignStyle(data.alignments[i] ?? 'none')}>${h}</th>`
  ).join('\n')

  const rows = data.rows.map(row =>
    `  <tr>\n` +
    data.headers.map((_, i) =>
      `    <td${alignStyle(data.alignments[i] ?? 'none')}>${row[i] ?? ''}</td>`
    ).join('\n') +
    `\n  </tr>`
  ).join('\n')

  return `<table>\n  <thead>\n  <tr>\n${headers}\n  </tr>\n  </thead>\n  <tbody>\n${rows}\n  </tbody>\n</table>`
}

// Parse a Markdown table string back to TableData
export function parseMarkdownTable(md: string): TableData | null {
  const lines = md.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return null

  const parseRow = (line: string): string[] =>
    line.split('|').slice(1, -1).map(cell => cell.trim())

  const headers = parseRow(lines[0])
  const separatorRow = lines[1]

  const alignments: Alignment[] = parseRow(separatorRow).map(cell => {
    if (cell.startsWith(':') && cell.endsWith(':')) return 'center'
    if (cell.endsWith(':')) return 'right'
    if (cell.startsWith(':')) return 'left'
    return 'none'
  })

  const rows = lines.slice(2).map(parseRow)

  return { headers, rows, alignments }
}

// Parse CSV string into TableData
export function csvToTableData(csv: string): TableData {
  const lines = csv.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map(line =>
    line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
  )
  return { headers, rows, alignments: headers.map(() => 'none') }
}
```

**UI Notes:**
- Editable grid (like a mini spreadsheet): click any cell to edit
- Add/remove rows and columns with +/- buttons at edges
- Alignment selector per column (header row has L/C/R toggle buttons)
- Two input modes: manual grid, paste CSV
- Two output tabs: Markdown, HTML
- Live preview renders the Markdown table below the editor
- Copy buttons per output tab

---

### Tool 57: Unix Timestamp Converter
**Route:** `/tools/unix-timestamp`
**Library:** `Intl.DateTimeFormat` (built-in)
**Input:** Unix timestamp (seconds or milliseconds) OR human-readable date
**Output:** Converted date in multiple formats and timezones

**Implementation:**

```typescript
// lib/processing/unix-timestamp.ts

export interface TimestampConversion {
  timestamp: number        // Unix timestamp in seconds
  timestampMs: number      // Unix timestamp in milliseconds
  iso8601: string          // ISO 8601 UTC: "2025-05-09T14:30:00.000Z"
  utc: string              // "Friday, 9 May 2025 14:30:00 UTC"
  local: string            // Local browser time
  relative: string         // "3 days ago", "in 2 hours"
  dayOfWeek: string        // "Friday"
  isInPast: boolean
  isInFuture: boolean
}

export function convertUnixTimestamp(input: number | string): TimestampConversion {
  let ts: number

  if (typeof input === 'string') {
    // Parse human-readable date to Unix timestamp
    const parsed = new Date(input)
    if (isNaN(parsed.getTime())) throw new Error('Invalid date string')
    ts = Math.floor(parsed.getTime() / 1000)
  } else {
    // Auto-detect seconds vs milliseconds
    // Milliseconds have 13 digits; seconds have 10 digits
    ts = input > 9999999999 ? Math.floor(input / 1000) : input
  }

  const date = new Date(ts * 1000)
  const now = Date.now()
  const diffMs = date.getTime() - now

  return {
    timestamp: ts,
    timestampMs: ts * 1000,
    iso8601: date.toISOString(),
    utc: new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit',
      second: '2-digit', hour12: false, timeZoneName: 'short',
    }).format(date),
    local: new Intl.DateTimeFormat(undefined, {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: '2-digit', minute: '2-digit',
      second: '2-digit', hour12: false, timeZoneName: 'short',
    }).format(date),
    relative: formatRelative(diffMs),
    dayOfWeek: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date),
    isInPast: diffMs < 0,
    isInFuture: diffMs > 0,
  }
}

function formatRelative(diffMs: number): string {
  const abs = Math.abs(diffMs)
  const suffix = diffMs < 0 ? 'ago' : 'from now'
  if (abs < 60000) return `${Math.round(abs / 1000)} seconds ${suffix}`
  if (abs < 3600000) return `${Math.round(abs / 60000)} minutes ${suffix}`
  if (abs < 86400000) return `${Math.round(abs / 3600000)} hours ${suffix}`
  if (abs < 2592000000) return `${Math.round(abs / 86400000)} days ${suffix}`
  if (abs < 31536000000) return `${Math.round(abs / 2592000000)} months ${suffix}`
  return `${Math.round(abs / 31536000000)} years ${suffix}`
}

export function getCurrentTimestamp(): { seconds: number; milliseconds: number } {
  const now = Date.now()
  return { seconds: Math.floor(now / 1000), milliseconds: now }
}
```

**UI Notes:**
- Two input modes: "Timestamp → Date" and "Date → Timestamp" (tab switch)
- "Now" button: fills current Unix timestamp and shows live updating counter
- Show both seconds AND milliseconds timestamps prominently
- Relative time: "3 hours ago"
- Output table: UTC, local browser time, and 5 major timezones (NY, London, Paris, Dubai, IST, Tokyo)
- Copy any value with individual copy buttons
- 2038 problem note: if user enters a timestamp > 2147483647, show: "⚠️ This timestamp exceeds the 32-bit integer limit (Year 2038 Problem)"

---

### Tool 58: IP Address Lookup
**Route:** `/tools/ip-lookup`
**Backend:** Cloudflare Worker (required — IP geolocation APIs use CORS)
**Input:** IP address (IPv4 or IPv6) OR "my IP" to detect automatically
**Output:** Geolocation data, ASN, ISP, timezone

**Cloudflare Worker implementation:**

```typescript
// cloudflare-workers/ip-lookup.ts
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const ip = url.searchParams.get('ip') ?? ''
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://tools.shreyannarula.com',
      'Content-Type': 'application/json',
    }

    try {
      let targetIP = ip

      // "my IP" mode: use Cloudflare's CF-Connecting-IP header
      if (!ip || ip === 'me') {
        targetIP = request.headers.get('CF-Connecting-IP') ?? ''
        if (!targetIP) {
          return new Response(JSON.stringify({ error: 'Could not detect IP' }), { status: 422, headers: corsHeaders })
        }
      }

      // Use ipapi.co — free for up to 1,000 requests/day, no API key required for low volume
      // For higher volume, upgrade to their paid tier or switch to ip-api.com
      const response = await fetch(`https://ipapi.co/${targetIP}/json/`, {
        headers: { 'User-Agent': 'tools.shreyannarula.com/1.0' }
      })

      if (!response.ok) throw new Error(`ipapi.co returned ${response.status}`)

      const data = await response.json() as Record<string, unknown>

      if (data.error) {
        return new Response(JSON.stringify({ error: data.reason ?? 'Invalid IP address' }), { status: 422, headers: corsHeaders })
      }

      // Return only the fields we need (don't expose everything)
      return new Response(JSON.stringify({
        ip: data.ip,
        version: data.version,
        city: data.city,
        region: data.region,
        regionCode: data.region_code,
        country: data.country_name,
        countryCode: data.country_code,
        continent: data.continent_code,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        utcOffset: data.utc_offset,
        isp: data.org,
        asn: data.asn,
        isEU: data.in_eu,
      }), { headers: { ...corsHeaders, 'Cache-Control': 'public, max-age=300' } })

    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders })
    }
  }
}
```

**UI Notes:**
- Input field pre-populated with "My IP" (detected automatically on page load)
- Toggle: "My IP" / "Look up another IP"
- Results displayed as a clean card grid: Location, ISP/ASN, Timezone
- Small map using OpenStreetMap (Leaflet, same as Tool 55) showing approximate location
- Privacy note: "IP geolocation is approximate. City-level accuracy is typical."
- Show IPv4 and IPv6 if both are available
- Note rate limit: if `ipapi.co` returns 429, show "Rate limited. Try again in a moment."

---

### Tool 59: Random Colour Generator
**Route:** `/tools/random-color`
**Library:** `chroma-js` (already installed)
**Input:** Harmony mode, hue constraints, count
**Output:** Colour palette with hex/rgb/hsl values

**Implementation:**

```typescript
// lib/processing/random-color.ts
import chroma from 'chroma-js'

export type ColorHarmony =
  | 'random'          // fully random
  | 'analogous'       // adjacent on colour wheel
  | 'complementary'   // opposite on colour wheel
  | 'triadic'         // 120° apart
  | 'split-complementary'
  | 'tetradic'        // 90° apart
  | 'monochromatic'   // same hue, different lightness/saturation
  | 'pastel'          // high lightness, low saturation
  | 'earth'           // warm, muted
  | 'neon'            // high saturation, high brightness

function secureRandomFloat(): number {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return arr[0] / 0xFFFFFFFF
}

function randomHue(): number { return Math.round(secureRandomFloat() * 360) }

export interface GeneratedColor {
  hex: string
  rgb: [number, number, number]
  hsl: [number, number, number]
  name: string       // closest CSS colour name approximation
  luminance: number
}

function toGeneratedColor(c: chroma.Color): GeneratedColor {
  const [h, s, l] = c.hsl()
  return {
    hex: c.hex(),
    rgb: c.rgb() as [number, number, number],
    hsl: [Math.round(h || 0), Math.round(s * 100), Math.round(l * 100)],
    name: findClosestCSSColor(c.hex()),
    luminance: c.luminance(),
  }
}

export function generateColorPalette(
  harmony: ColorHarmony,
  count: number,
  baseHue?: number
): GeneratedColor[] {
  const hue = baseHue ?? randomHue()

  let colors: chroma.Color[]

  switch (harmony) {
    case 'analogous':
      colors = Array.from({ length: count }, (_, i) => {
        const angle = hue + (i - Math.floor(count / 2)) * 30
        return chroma.hsl(angle % 360, 0.65 + secureRandomFloat() * 0.2, 0.45 + secureRandomFloat() * 0.2)
      })
      break

    case 'complementary':
      colors = [
        chroma.hsl(hue, 0.70, 0.50),
        chroma.hsl(hue + 180, 0.70, 0.50),
        chroma.hsl(hue, 0.70, 0.70),
        chroma.hsl(hue + 180, 0.70, 0.30),
        chroma.hsl(hue, 0.40, 0.85),
      ].slice(0, count)
      break

    case 'triadic':
      colors = [0, 120, 240].flatMap(offset => [
        chroma.hsl((hue + offset) % 360, 0.70, 0.50),
        chroma.hsl((hue + offset) % 360, 0.70, 0.70),
      ]).slice(0, count)
      break

    case 'monochromatic':
      colors = Array.from({ length: count }, (_, i) => {
        const lightness = 0.20 + (i / (count - 1)) * 0.70
        return chroma.hsl(hue, 0.60, lightness)
      })
      break

    case 'pastel':
      colors = Array.from({ length: count }, () =>
        chroma.hsl(randomHue(), 0.30 + secureRandomFloat() * 0.20, 0.75 + secureRandomFloat() * 0.15)
      )
      break

    case 'earth':
      colors = Array.from({ length: count }, () =>
        chroma.hsl(20 + secureRandomFloat() * 60, 0.30 + secureRandomFloat() * 0.30, 0.30 + secureRandomFloat() * 0.40)
      )
      break

    case 'neon':
      colors = Array.from({ length: count }, () =>
        chroma.hsl(randomHue(), 0.90 + secureRandomFloat() * 0.10, 0.55 + secureRandomFloat() * 0.15)
      )
      break

    default: // 'random' and 'split-complementary'
      colors = Array.from({ length: count }, () =>
        chroma.hsl(randomHue(), 0.50 + secureRandomFloat() * 0.40, 0.35 + secureRandomFloat() * 0.40)
      )
  }

  return colors.map(toGeneratedColor)
}

// Approximate CSS colour name from hex
function findClosestCSSColor(hex: string): string {
  // Simplified: return the closest of a small subset of named colours
  const namedColors: [string, string][] = [
    ['Red', '#FF0000'], ['Blue', '#0000FF'], ['Green', '#008000'],
    ['Yellow', '#FFFF00'], ['Orange', '#FFA500'], ['Purple', '#800080'],
    ['Pink', '#FFC0CB'], ['Brown', '#A52A2A'], ['Grey', '#808080'],
    ['White', '#FFFFFF'], ['Black', '#000000'], ['Cyan', '#00FFFF'],
    ['Magenta', '#FF00FF'], ['Lime', '#00FF00'], ['Teal', '#008080'],
    ['Navy', '#000080'], ['Coral', '#FF7F50'], ['Lavender', '#E6E6FA'],
  ]
  const c = chroma(hex)
  let closest = 'Custom'
  let minDist = Infinity
  for (const [name, namedHex] of namedColors) {
    const dist = chroma.deltaE(c, chroma(namedHex))
    if (dist < minDist) { minDist = dist; closest = name }
  }
  return closest
}
```

**UI Notes:**
- Harmony mode selector: buttons with visual icons showing the colour relationship pattern
- Count slider: 2–12 colours
- Base hue slider (optional — leave empty for random)
- Colour palette shown as large swatches
- Each swatch shows HEX, RGB, HSL on hover with individual copy buttons
- "Lock" icon on each colour to preserve it when regenerating
- "Regenerate" button — reshuffles unlocked colours
- Export options: CSS variables snippet, Tailwind config colours object, SCSS variables, JSON array

---

### Tool 60: Code Formatter / Beautifier
**Route:** `/tools/code-formatter`
**Library:** `prettier` (loaded via CDN — do not bundle, too large at ~800KB)
**Input:** Unformatted code in any supported language
**Output:** Beautifully formatted code

**Supported Languages:** JavaScript, TypeScript, JSX, TSX, JSON, CSS, SCSS, HTML, Markdown, YAML

**Implementation:**

```typescript
// lib/processing/code-formatter.ts

// Prettier is loaded lazily only when this tool is used
let prettierLoaded = false
let prettier: any
let prettierPlugins: Record<string, any> = {}

async function loadPrettier(): Promise<void> {
  if (prettierLoaded) return

  // Load from CDN — these are large, load only once per session
  const [prettierStandalone, babel, estree, typescript, css, html, markdown] = await Promise.all([
    import('https://unpkg.com/prettier@3/standalone.js' as any),
    import('https://unpkg.com/prettier@3/plugins/babel.js' as any),
    import('https://unpkg.com/prettier@3/plugins/estree.js' as any),
    import('https://unpkg.com/prettier@3/plugins/typescript.js' as any),
    import('https://unpkg.com/prettier@3/plugins/postcss.js' as any),
    import('https://unpkg.com/prettier@3/plugins/html.js' as any),
    import('https://unpkg.com/prettier@3/plugins/markdown.js' as any),
  ])

  prettier = prettierStandalone.default ?? prettierStandalone
  prettierPlugins = { babel: babel.default ?? babel, estree: estree.default ?? estree, typescript: typescript.default ?? typescript, css: css.default ?? css, html: html.default ?? html, markdown: markdown.default ?? markdown }
  prettierLoaded = true
}

export type FormattableLanguage =
  | 'javascript' | 'typescript' | 'jsx' | 'tsx'
  | 'json' | 'json5' | 'css' | 'scss' | 'less'
  | 'html' | 'markdown' | 'yaml'

const LANGUAGE_TO_PRETTIER_PARSER: Record<FormattableLanguage, string> = {
  javascript: 'babel', typescript: 'typescript', jsx: 'babel', tsx: 'typescript',
  json: 'json', json5: 'json5', css: 'css', scss: 'scss', less: 'less',
  html: 'html', markdown: 'markdown', yaml: 'yaml',
}

const LANGUAGE_TO_PLUGINS: Record<FormattableLanguage, string[]> = {
  javascript: ['babel', 'estree'], typescript: ['typescript', 'estree'],
  jsx: ['babel', 'estree'], tsx: ['typescript', 'estree'],
  json: ['babel', 'estree'], json5: ['babel', 'estree'],
  css: ['css'], scss: ['css'], less: ['css'],
  html: ['html'], markdown: ['markdown'], yaml: ['babel'],
}

export interface FormatterOptions {
  language: FormattableLanguage
  tabWidth: number           // 2 or 4
  useTabs: boolean
  singleQuote: boolean       // JS/TS only
  semicolons: boolean        // JS/TS only
  trailingComma: 'none' | 'es5' | 'all'
  printWidth: number         // line length (80 default)
}

export async function formatCode(
  code: string,
  options: FormatterOptions
): Promise<{ formatted: string; error?: string }> {
  await loadPrettier()

  const parser = LANGUAGE_TO_PRETTIER_PARSER[options.language]
  const pluginKeys = LANGUAGE_TO_PLUGINS[options.language]
  const plugins = pluginKeys.map(k => prettierPlugins[k]).filter(Boolean)

  try {
    const formatted = await prettier.format(code, {
      parser,
      plugins,
      tabWidth: options.tabWidth,
      useTabs: options.useTabs,
      singleQuote: options.singleQuote,
      semi: options.semicolons,
      trailingComma: options.trailingComma,
      printWidth: options.printWidth,
    })
    return { formatted }
  } catch (e) {
    return { formatted: code, error: (e as Error).message }
  }
}

// Auto-detect language from file extension
export function detectLanguageFromFilename(filename: string): FormattableLanguage | null {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map: Record<string, FormattableLanguage> = {
    js: 'javascript', ts: 'typescript', jsx: 'jsx', tsx: 'tsx',
    json: 'json', css: 'css', scss: 'scss', less: 'less',
    html: 'html', md: 'markdown', yml: 'yaml', yaml: 'yaml',
  }
  return map[ext ?? ''] ?? null
}
```

**UI Notes:**
- Code editor using `@uiw/react-codemirror` with syntax highlighting (already likely installed for Tool 7)
- Language auto-detection from file upload OR manual dropdown
- Formatter options panel: tab size, tabs vs spaces, quotes, semicolons, trailing commas, print width
- "Format" button + keyboard shortcut `Shift+Alt+F` (matches VS Code)
- Before/after view toggle (diff style highlighting of changes)
- Show "Loaded Prettier (800KB)" notification only on first load
- Copy formatted code + Download as same file extension
- Error display: if code has syntax errors prettier can't fix, show the error message inline

---

## 3. New Cloudflare Worker Routes

Two tools in this batch require Cloudflare Workers (Tools 52 and 58). Add these routes to `wrangler.toml`:

```toml
name = "tools-shreyannarula-workers"
main = "cloudflare-workers/index.ts"
compatibility_date = "2024-09-23"

[[routes]]
pattern = "tools.shreyannarula.com/api/worker/og-preview"
zone_name = "shreyannarula.com"

[[routes]]
pattern = "tools.shreyannarula.com/api/worker/ip-lookup"
zone_name = "shreyannarula.com"
```

**Worker entry point (`cloudflare-workers/index.ts`):**
```typescript
import ogPreview from './og-preview'
import ipLookup from './ip-lookup'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/worker/og-preview')) return ogPreview.fetch(request)
    if (url.pathname.startsWith('/api/worker/ip-lookup')) return ipLookup.fetch(request)

    return new Response('Not found', { status: 404 })
  }
}
```

**Rate limiting consideration for Tool 58 (IP Lookup):**
`ipapi.co` allows 1,000 requests/day on the free tier. At scale, implement caching in Cloudflare KV:
```typescript
// Cache IP lookup results for 5 minutes in KV
const cacheKey = `ip:${targetIP}`
const cached = await env.KV.get(cacheKey)
if (cached) return new Response(cached, { headers: corsHeaders })

// ... perform lookup ...
await env.KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 })
```

---

## 4. New Shared Utilities

### `lib/utils/ffmpeg-loader.ts`
Tools 41, 42, and 43 all use FFmpeg. The singleton loader must live in a shared file — do not duplicate it in each tool's processing file.

```typescript
// lib/utils/ffmpeg-loader.ts
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

let instance: FFmpeg | null = null
let loaded = false
let loadPromise: Promise<FFmpeg> | null = null

export async function getFFmpegInstance(
  onProgress?: (progress: number) => void
): Promise<FFmpeg> {
  // Prevent multiple simultaneous loads (race condition protection)
  if (loadPromise) return loadPromise

  if (instance && loaded) {
    if (onProgress) {
      instance.on('progress', ({ progress }) => onProgress(Math.round(progress * 100)))
    }
    return instance
  }

  loadPromise = (async () => {
    instance = new FFmpeg()
    if (onProgress) {
      instance.on('progress', ({ progress }) => onProgress(Math.round(progress * 100)))
    }

    const baseURL = '/ffmpeg'
    await instance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })

    loaded = true
    loadPromise = null
    return instance
  })()

  return loadPromise
}

export function isFFmpegLoaded(): boolean {
  return loaded
}
```

### `lib/utils/cloudflare-worker.ts`
Centralise the fetch calls to your Cloudflare Workers:

```typescript
// lib/utils/cloudflare-worker.ts
const WORKER_BASE = '/api/worker'

export async function fetchOGPreview(url: string): Promise<OGData> {
  const response = await fetch(`${WORKER_BASE}/og-preview?url=${encodeURIComponent(url)}`)
  if (!response.ok) {
    const err = await response.json() as { error: string }
    throw new Error(err.error ?? `HTTP ${response.status}`)
  }
  return response.json()
}

export async function fetchIPLookup(ip?: string): Promise<IPLookupResult> {
  const query = ip ? `?ip=${encodeURIComponent(ip)}` : '?ip=me'
  const response = await fetch(`${WORKER_BASE}/ip-lookup${query}`)
  if (!response.ok) {
    const err = await response.json() as { error: string }
    throw new Error(err.error ?? `HTTP ${response.status}`)
  }
  return response.json()
}
```

---

## 5. Extension Context Menu Additions

Add to `background/service-worker.ts`:

```typescript
// New context menus for batch 3

// Barcode from selected text
chrome.contextMenus.create({
  id: 'barcode-from-text',
  parentId: 'text-tools',
  title: '📊 Generate Barcode',
  contexts: ['selection'],
})

// Check timestamp of selected text
chrome.contextMenus.create({
  id: 'timestamp-convert',
  parentId: 'text-tools',
  title: '🕐 Convert Timestamp',
  contexts: ['selection'],
})

// Format selected code
chrome.contextMenus.create({
  id: 'format-code',
  parentId: 'text-tools',
  title: '✨ Format Code',
  contexts: ['selection'],
})

// IP lookup from selected text
chrome.contextMenus.create({
  id: 'ip-lookup',
  parentId: 'text-tools',
  title: '🌐 Look Up IP Address',
  contexts: ['selection'],
})

// Add to toolRoutes:
const batch3Routes: Record<string, string> = {
  'barcode-from-text': '/tools/barcode-generator',
  'timestamp-convert': '/tools/unix-timestamp',
  'format-code':       '/tools/code-formatter',
  'ip-lookup':         '/tools/ip-lookup',
}
```

---

## 6. Phase Build Order for Tools 41–60

### Week 1 (Days 1–7): Pure JS tools (zero new dependencies)
- [ ] **Tool 53:** Sitemap Generator — 2 hours
- [ ] **Tool 54:** robots.txt Generator — 2 hours
- [ ] **Tool 56:** Markdown Table Generator — 3 hours
- [ ] **Tool 57:** Unix Timestamp Converter — 2 hours
- [ ] **Tool 49:** CSS Box Shadow Generator — 3 hours
- [ ] **Tool 50:** CSS Border Radius Visualiser — 3 hours

**End of Week 1:** 6 tools live.

---

### Week 2 (Days 8–14): Library tools (all libraries already installed)
- [ ] **Tool 44:** Image to PDF — `pdf-lib`. 3 hours.
- [ ] **Tool 51:** Meta Tag Generator — pure JS. 3 hours.
- [ ] **Tool 59:** Random Colour Generator — `chroma-js`. 3 hours.
- [ ] **Tool 46:** Fake Data Generator — pure JS. 4 hours.
- [ ] **Tool 48:** Cron Expression Builder — `cronstrue`. 3 hours.

**End of Week 2:** 11 tools live.

---

### Week 3 (Days 15–21): New library tools
Install `jsbarcode`, `jose`, `cronstrue`:
- [ ] **Tool 45:** Barcode Generator — `jsbarcode`. 3 hours.
- [ ] **Tool 47:** JWT Generator — `jose`. 3 hours.
- [ ] **Tool 55:** GPS Map — `exifr` + Leaflet. 5 hours (map integration is complex).
- [ ] **Tool 60:** Code Formatter — Prettier CDN. 4 hours.

**End of Week 3:** 15 tools live.

---

### Week 4 (Days 22–28): Cloudflare Worker tools
Deploy workers first, then build frontend:
- [ ] **Tool 52:** OG Preview — deploy Worker, build UI. 5 hours.
- [ ] **Tool 58:** IP Address Lookup — deploy Worker, build UI. 3 hours.

**End of Week 4:** 17 tools live.

---

### Week 5 (Days 29–35): FFmpeg tools (most complex)
These share the FFmpeg singleton — build in order:
- [ ] **Tool 41:** Audio Format Converter — `@ffmpeg/ffmpeg`. 5 hours.
- [ ] **Tool 43:** Audio Trimmer — waveform + FFmpeg. 6 hours.
- [ ] **Tool 42:** Video to GIF — two-pass GIF + WebP. 5 hours.

**End of Week 5:** All 20 tools live. **Total: 60 working tools.**

---

## 7. Critical Rules Specific to This Batch

In addition to all 20 rules from Parts 1 and 2:

**Rule 21 — FFmpeg WASM must be a singleton.** Never instantiate `new FFmpeg()` more than once per session. Use the shared `getFFmpegInstance()` from `lib/utils/ffmpeg-loader.ts`. Multiple instances will exhaust browser memory rapidly. If a user navigates between Tool 41, 42, and 43, the same FFmpeg instance must be reused.

**Rule 22 — Video-to-GIF requires two-pass palette generation.** Single-pass GIFs using the default FFmpeg palette look desaturated and washed out. Always use the two-pass approach: `palettegen` then `paletteuse`. This is not optional — single-pass output will make the tool look low-quality.

**Rule 23 — Prettier must be loaded lazily from CDN, not bundled.** The Prettier standalone build is ~800KB. Importing it statically will increase the app's initial bundle by 800KB, making ALL tools slower to load. Import it only when Tool 60 is first used. Use `import()` (dynamic import), not a static `import` at the top of the file.

**Rule 24 — The OG Preview Cloudflare Worker must validate the target URL.** Without validation, the worker can be abused as an open HTTP proxy. Always check: (a) protocol is `http:` or `https:`, (b) the URL parses successfully, (c) enforce a 10-second timeout. Log the `CF-Connecting-IP` header for abuse monitoring.

**Rule 25 — ipapi.co has a 1,000 request/day free limit.** Cache results in Cloudflare KV for 5 minutes. At 1,000+ daily users, the IP Lookup tool will exhaust the free tier. Either implement KV caching (preferred) or upgrade to ipapi.co's paid tier. Do not call ipapi.co directly from the browser — always proxy through your Cloudflare Worker to enable caching.

**Rule 26 — Leaflet.js must only be loaded on the GPS Map and IP Lookup pages.** Leaflet adds ~42KB to the page. Never import it globally. Use `next/head` to load it only on pages that need it. Alternatively, create a `LeafletMap` component that uses `next/dynamic` with `ssr: false`.

**Rule 27 — JsBarcode throws uncaught exceptions for invalid input.** Always wrap the `JsBarcode()` call in a try/catch. An invalid EAN-13 value (e.g., wrong digit count) will throw a synchronous exception that will crash the tool if uncaught. Never let the exception bubble up to the React error boundary.

**Rule 28 — Fake Data Generator must use `crypto.getRandomValues()`, not `Math.random()`.** `Math.random()` is predictable and can be seeded. For password generation and UUID generation in Tool 46, cryptographic randomness is required. All random number generation in this tool must use the `secureRandom()` helper defined in the implementation above.

**Rule 29 — Audio trimming with `-c copy` only works when input and output formats match.** If the user selects a different output format in Tool 43, `-c copy` will produce a corrupted file. Always verify input and output extensions match before using `-c copy`. If they differ, use `-c:a [appropriate codec]` to re-encode.

**Rule 30 — Two-pass GIF generation requires `palette.png` to be deleted from FFmpeg's filesystem after use.** FFmpeg WASM's in-memory filesystem has limited space. Always call `ffmpeg.deleteFile('palette.png')` after the second pass. Failure to do so causes memory accumulation across multiple conversions in the same session.

---

*Part 3 complete. Tools 41–60 documented. You now have 60 tools fully specified.*
*Part 4 will cover Tools 61–80.*
*Last updated: May 2026. For tools.shreyannarula.com.*
