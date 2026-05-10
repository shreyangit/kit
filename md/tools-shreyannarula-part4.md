# tools.shreyannarula.com — Part 4 Implementation Guide
### Tools 61–80: Complete Build Reference

> Direct continuation of Parts 1, 2, and 3. All architecture decisions, shared components, COOP/COEP headers, Cloudflare Worker patterns, tools registry, FFmpeg singleton, and all 30 critical rules from prior parts remain fully in force. This document adds tools 61–80 with identical depth, specificity, and zero ambiguity. Do not re-implement anything from Parts 1–3.

---

## Context: What Was Built in Parts 1–3

**60 tools are already live.** Full list in Parts 1–3. This document starts at Tool 61.

---

## Tools 61–80 at a Glance

| # | Tool | Route | Primary Library / API |
|---|---|---|---|
| 61 | Video Compressor | `/tools/video-compressor` | `@ffmpeg/ffmpeg` (WASM) |
| 62 | Video Thumbnail Extractor | `/tools/video-thumbnail` | `@ffmpeg/ffmpeg` (WASM) |
| 63 | Audio Volume Normaliser | `/tools/audio-normaliser` | `@ffmpeg/ffmpeg` (WASM) |
| 64 | Photo Collage Maker | `/tools/photo-collage` | Canvas API |
| 65 | Watermark Remover (Guided) | `/tools/watermark-remover` | Canvas API + inpainting model |
| 66 | Invoice Generator | `/tools/invoice-generator` | `pdf-lib` |
| 67 | Resume Builder | `/tools/resume-builder` | `pdf-lib` |
| 68 | Budget Planner | `/tools/budget-planner` | Pure JS + `localStorage` |
| 69 | Habit Tracker | `/tools/habit-tracker` | Pure JS + `localStorage` |
| 70 | Pomodoro + Task Manager | `/tools/pomodoro-tasks` | Web APIs (extends Tool 36) |
| 71 | Flashcard / Quiz Maker | `/tools/flashcards` | Pure JS + `localStorage` |
| 72 | Mind Map Maker | `/tools/mind-map` | Canvas API + Pure JS |
| 73 | Kanban Board | `/tools/kanban` | Pure JS + `localStorage` |
| 74 | Mortgage / Loan Calculator | `/tools/loan-calculator` | Pure JS |
| 75 | BMI & Calorie Calculator | `/tools/health-calculator` | Pure JS |
| 76 | Tip Splitter | `/tools/tip-splitter` | Pure JS |
| 77 | Font Pairing Previewer | `/tools/font-pairing` | Google Fonts API (free) |
| 78 | Screenshot Annotator | `/tools/screenshot-annotator` | Canvas API |
| 79 | Webpage Screenshot Tool | `/tools/webpage-screenshot` | Cloudflare Worker + Puppeteer |
| 80 | Email Signature Builder | `/tools/email-signature` | Pure JS + HTML template |

---

## Table of Contents

1. [New npm Dependencies](#1-new-npm-dependencies)
2. [Tools 61–80 Detailed Specs](#2-tools-6180-detailed-specs)
3. [Persistent Data Pattern (localStorage Tools)](#3-persistent-data-pattern-localstorage-tools)
4. [New Cloudflare Worker Route](#4-new-cloudflare-worker-route)
5. [Extension Context Menu Additions](#5-extension-context-menu-additions)
6. [Phase Build Order for Tools 61–80](#6-phase-build-order-for-tools-6180)
7. [Critical Rules Specific to This Batch](#7-critical-rules-specific-to-this-batch)

---

## 1. New npm Dependencies

```bash
npm install @imgly/background-removal
```

Only one new package this batch. Everything else uses libraries already installed in Parts 1–3 (`@ffmpeg/ffmpeg`, `@ffmpeg/util`, `pdf-lib`, `chroma-js`, Canvas API) or pure browser APIs (`localStorage`, Canvas, Web Speech, `Intl`).

| Package | Version | Used By | Notes |
|---|---|---|---|
| `@imgly/background-removal` | `^1.4.0` | Tool 65 | WASM-based inpainting model |

**Reminder — check before installing:** `@ffmpeg/ffmpeg`, `@ffmpeg/util`, `pdf-lib` were installed in earlier parts. Run `cat package.json | grep ffmpeg` before reinstalling.

---

## 2. Tools 61–80 Detailed Specs

---

### Tool 61: Video Compressor
**Route:** `/tools/video-compressor`
**Library:** `@ffmpeg/ffmpeg` (singleton from `lib/utils/ffmpeg-loader.ts`)
**Input:** MP4, MOV, WebM, AVI (max 2GB — warn if >500MB)
**Output:** Compressed MP4

**How it works:** FFmpeg re-encodes video using H.264 with CRF (Constant Rate Factor) quality control. Lower CRF = better quality, larger file. Target resolution and bitrate are also configurable.

**Implementation:**

```typescript
// lib/processing/video-compressor.ts
import { getFFmpegInstance } from '../utils/ffmpeg-loader'
import { fetchFile } from '@ffmpeg/util'

export type VideoQuality = 'high' | 'medium' | 'low' | 'custom'

export interface VideoCompressionOptions {
  quality: VideoQuality
  customCRF?: number        // 0–51 (18 = visually lossless, 28 = good compression, 40 = heavy)
  maxWidth?: number         // scale down if wider than this (maintains aspect ratio)
  removeAudio?: boolean
  targetSizeMB?: number     // optional target file size (uses 2-pass encoding)
}

const CRF_MAP: Record<Exclude<VideoQuality, 'custom'>, number> = {
  high:   20,  // near-lossless
  medium: 28,  // good balance
  low:    36,  // maximum compression
}

export async function compressVideo(
  file: File,
  options: VideoCompressionOptions,
  onProgress: (progress: number) => void
): Promise<{ blob: Blob; filename: string; originalSizeMB: number; compressedSizeMB: number }> {
  const ffmpeg = await getFFmpegInstance(onProgress)

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp4'
  const inputName = `input.${ext}`
  const outputName = 'output.mp4'

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  const crf = options.quality === 'custom' ? (options.customCRF ?? 28) : CRF_MAP[options.quality]

  // Build filter chain
  const filters: string[] = []
  if (options.maxWidth) {
    // Scale to maxWidth but only if video is wider; maintain aspect ratio
    filters.push(`scale='min(${options.maxWidth},iw)':-2`)
  }

  const args: string[] = ['-i', inputName]

  // Video codec settings
  args.push('-c:v', 'libx264')
  args.push('-crf', crf.toString())
  args.push('-preset', 'medium')   // encoding speed vs compression (ultrafast..veryslow)
  args.push('-movflags', '+faststart')  // enables streaming / progressive play

  // Apply video filters if any
  if (filters.length > 0) {
    args.push('-vf', filters.join(','))
  }

  // Audio handling
  if (options.removeAudio) {
    args.push('-an')
  } else {
    args.push('-c:a', 'aac', '-b:a', '128k')
  }

  args.push('-y', outputName)  // -y overwrites output without asking

  await ffmpeg.exec(args)

  const outputData = await ffmpeg.readFile(outputName)
  const blob = new Blob([outputData], { type: 'video/mp4' })

  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)

  const baseName = file.name.replace(/\.[^.]+$/, '')
  return {
    blob,
    filename: `${baseName}-compressed.mp4`,
    originalSizeMB: file.size / (1024 * 1024),
    compressedSizeMB: blob.size / (1024 * 1024),
  }
}
```

**UI Notes:**
- Quality selector: High / Medium / Low / Custom with CRF slider when Custom selected
- Show CRF scale explanation: "18 = near-lossless, 28 = recommended, 40 = heavy compression"
- Max width dropdown: Original, 1920px (1080p), 1280px (720p), 854px (480p)
- "Remove audio" toggle
- Progress bar with estimated time remaining (calculate from FFmpeg progress event timestamps)
- Before/after size comparison after completion: "Reduced from 248 MB to 31 MB (87% smaller)"
- Show output video preview player before download

---

### Tool 62: Video Thumbnail Extractor
**Route:** `/tools/video-thumbnail`
**Library:** `@ffmpeg/ffmpeg` (singleton) + Browser Video API fallback
**Input:** MP4, MOV, WebM, AVI (max 2GB)
**Output:** PNG thumbnails at selected timestamps

**Two approaches — use Browser Video API first (faster), fall back to FFmpeg:**

```typescript
// lib/processing/video-thumbnail.ts
import { getFFmpegInstance } from '../utils/ffmpeg-loader'
import { fetchFile } from '@ffmpeg/util'

// Approach 1: Browser Video API (fast, no WASM needed for MP4/WebM)
export async function extractThumbnailBrowser(
  file: File,
  timestampSeconds: number
): Promise<Blob | null> {
  return new Promise(resolve => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timestampSeconds, video.duration - 0.1)
    }

    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')!.drawImage(video, 0, 0)
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url)
        video.remove()
        resolve(blob)
      }, 'image/png')
    }

    video.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    video.src = url
    video.load()
  })
}

// Approach 2: FFmpeg (handles all formats including AVI, old MOV)
export async function extractThumbnailFFmpeg(
  file: File,
  timestampSeconds: number,
  onProgress: (p: number) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpegInstance(onProgress)
  const ext = file.name.split('.').pop() ?? 'mp4'
  const inputName = `input.${ext}`
  const outputName = 'thumbnail.png'

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  // -ss before -i for fast seeking; -vframes 1 = extract exactly one frame
  await ffmpeg.exec([
    '-ss', timestampSeconds.toString(),
    '-i', inputName,
    '-vframes', '1',
    '-q:v', '2',    // high quality JPEG equivalent
    outputName
  ])

  const data = await ffmpeg.readFile(outputName)
  const blob = new Blob([data], { type: 'image/png' })

  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)

  return blob
}

// Extract multiple thumbnails (grid/timeline)
export async function extractThumbnailGrid(
  file: File,
  count: number,   // number of thumbnails to extract
  onProgress: (progress: number) => void
): Promise<Blob[]> {
  const ffmpeg = await getFFmpegInstance(onProgress)
  const ext = file.name.split('.').pop() ?? 'mp4'
  const inputName = `input.${ext}`

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  // Get video duration first
  // FFmpeg outputs to stderr, use a dummy command to read metadata
  // Duration is read via the seekable video element instead
  const video = document.createElement('video')
  const duration = await new Promise<number>(resolve => {
    const url = URL.createObjectURL(file)
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration) }
    video.src = url
  })

  const thumbnails: Blob[] = []
  const interval = duration / (count + 1)

  for (let i = 1; i <= count; i++) {
    const timestamp = interval * i
    const outputName = `thumb_${i}.png`
    onProgress(Math.round((i / count) * 100))

    await ffmpeg.exec([
      '-ss', timestamp.toFixed(2),
      '-i', inputName,
      '-vframes', '1',
      outputName
    ])

    const data = await ffmpeg.readFile(outputName)
    thumbnails.push(new Blob([data], { type: 'image/png' }))
    await ffmpeg.deleteFile(outputName)
  }

  await ffmpeg.deleteFile(inputName)
  return thumbnails
}
```

**UI Notes:**
- Upload video → show video player with scrubber
- "Extract at current time" button — extracts frame at playhead position
- "Extract grid" mode — extracts N evenly-spaced thumbnails (default: 9, shown in 3×3 grid)
- Show thumbnail count selector (4, 9, 16, 25)
- Each extracted thumbnail: individual download PNG button
- "Download all as ZIP" button using `jszip`
- Show timestamp label on each thumbnail

---

### Tool 63: Audio Volume Normaliser
**Route:** `/tools/audio-normaliser`
**Library:** `@ffmpeg/ffmpeg` (singleton)
**Input:** MP3, WAV, OGG, FLAC, AAC (max 200MB)
**Output:** Normalised audio file (same format)

**How it works:** FFmpeg's `loudnorm` filter implements the EBU R128 loudness standard — the industry standard for broadcast audio normalisation. Two-pass processing: first measures the current loudness, then applies gain correction.

```typescript
// lib/processing/audio-normaliser.ts
import { getFFmpegInstance } from '../utils/ffmpeg-loader'
import { fetchFile } from '@ffmpeg/util'

export type NormalisationTarget = 'streaming' | 'broadcast' | 'podcast' | 'custom'

// EBU R128 loudness targets (LUFS = Loudness Units Full Scale)
const LOUDNESS_TARGETS: Record<Exclude<NormalisationTarget, 'custom'>, { target: number; truePeak: number; lra: number }> = {
  streaming:  { target: -14, truePeak: -1.0, lra: 11 },  // Spotify/Apple Music/YouTube standard
  broadcast:  { target: -23, truePeak: -1.0, lra: 18 },  // EBU R128 broadcast standard
  podcast:    { target: -16, truePeak: -1.5, lra: 13 },  // Podcast/voice standard
}

export interface NormalisationOptions {
  mode: NormalisationTarget
  customTarget?: number    // LUFS (e.g., -14)
  customTruePeak?: number  // dBTP (e.g., -1.0)
}

export async function normaliseAudio(
  file: File,
  options: NormalisationOptions,
  onProgress: (progress: number) => void
): Promise<{ blob: Blob; filename: string; gainApplied: string }> {
  const ffmpeg = await getFFmpegInstance(onProgress)

  const ext = file.name.split('.').pop() ?? 'mp3'
  const mimeMap: Record<string, string> = {
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
    flac: 'audio/flac', aac: 'audio/aac',
  }

  const { target, truePeak, lra } = options.mode === 'custom'
    ? { target: options.customTarget ?? -14, truePeak: options.customTruePeak ?? -1.0, lra: 11 }
    : LOUDNESS_TARGETS[options.mode]

  const inputName = `input.${ext}`
  const outputName = `output.${ext}`

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  // Single-pass loudnorm (linear mode — faster, good enough for most content)
  // For production broadcast, use two-pass for more accurate results
  await ffmpeg.exec([
    '-i', inputName,
    '-af', `loudnorm=I=${target}:TP=${truePeak}:LRA=${lra}:print_format=json`,
    '-c:a', getCodecForExt(ext),
    '-y', outputName
  ])

  const outputData = await ffmpeg.readFile(outputName)
  const blob = new Blob([outputData], { type: mimeMap[ext] ?? 'audio/mpeg' })

  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)

  const baseName = file.name.replace(/\.[^.]+$/, '')
  return {
    blob,
    filename: `${baseName}-normalised.${ext}`,
    gainApplied: `Target: ${target} LUFS`,
  }
}

function getCodecForExt(ext: string): string {
  const map: Record<string, string> = {
    mp3: 'libmp3lame', wav: 'pcm_s16le', ogg: 'libvorbis',
    flac: 'flac', aac: 'aac',
  }
  return map[ext] ?? 'copy'
}
```

**UI Notes:**
- Mode selector with descriptions: "Streaming (-14 LUFS)", "Broadcast (-23 LUFS)", "Podcast (-16 LUFS)", "Custom"
- Custom mode: target LUFS slider (-6 to -31) and true peak dBTP slider (-0.5 to -3.0)
- Explanatory text: "Streaming platforms like Spotify and YouTube auto-adjust to -14 LUFS. Normalising to this prevents your content from sounding louder or quieter than others."
- Audio player before/after (show both — use Web Audio API to play the original file without re-uploading)
- Download button with format preserved

---

### Tool 64: Photo Collage Maker
**Route:** `/tools/photo-collage`
**Library:** Canvas API (built-in)
**Input:** 2–20 images (JPG, PNG, WebP)
**Output:** Single PNG collage

**Implementation:**

```typescript
// lib/processing/photo-collage.ts

export type CollageLayout =
  | 'grid'          // equal-sized grid of N×M cells
  | 'horizontal'    // all images side by side
  | 'vertical'      // all images stacked
  | 'mosaic-2'      // 1 large + 2 small (3 photos)
  | 'mosaic-3'      // 1 large + 3 small (4 photos)
  | 'mosaic-5'      // magazine style (5 photos)
  | 'diagonal'      // diagonal strip layout

export interface CollageOptions {
  layout: CollageLayout
  canvasWidth: number       // output width in px
  gap: number               // space between photos (px)
  borderRadius: number      // corner radius per photo (px)
  backgroundColor: string   // hex
  padding: number           // outer padding (px)
}

interface ImageSlot {
  x: number; y: number
  width: number; height: number
}

export function calculateSlots(
  photoCount: number,
  layout: CollageLayout,
  canvasWidth: number,
  padding: number,
  gap: number
): { slots: ImageSlot[]; canvasHeight: number } {
  const inner = canvasWidth - padding * 2

  switch (layout) {
    case 'horizontal': {
      const w = (inner - gap * (photoCount - 1)) / photoCount
      const h = w * 0.75  // 4:3 aspect for each slot
      const slots = Array.from({ length: photoCount }, (_, i) => ({
        x: padding + i * (w + gap),
        y: padding,
        width: w,
        height: h,
      }))
      return { slots, canvasHeight: h + padding * 2 }
    }

    case 'vertical': {
      const h = (inner - gap * (photoCount - 1)) / photoCount
      const w = inner
      const slots = Array.from({ length: photoCount }, (_, i) => ({
        x: padding,
        y: padding + i * (h + gap),
        width: w,
        height: h,
      }))
      return { slots, canvasHeight: h * photoCount + gap * (photoCount - 1) + padding * 2 }
    }

    case 'grid': {
      const cols = Math.ceil(Math.sqrt(photoCount))
      const rows = Math.ceil(photoCount / cols)
      const cellW = (inner - gap * (cols - 1)) / cols
      const cellH = cellW * 0.75
      const slots = Array.from({ length: photoCount }, (_, i) => ({
        x: padding + (i % cols) * (cellW + gap),
        y: padding + Math.floor(i / cols) * (cellH + gap),
        width: cellW,
        height: cellH,
      }))
      return { slots, canvasHeight: rows * cellH + (rows - 1) * gap + padding * 2 }
    }

    case 'mosaic-2': {
      // Layout: one large left, two stacked right
      const largeW = inner * 0.6
      const smallW = inner - largeW - gap
      const h = smallW * 2 + gap
      return {
        slots: [
          { x: padding, y: padding, width: largeW, height: h },
          { x: padding + largeW + gap, y: padding, width: smallW, height: (h - gap) / 2 },
          { x: padding + largeW + gap, y: padding + (h - gap) / 2 + gap, width: smallW, height: (h - gap) / 2 },
        ],
        canvasHeight: h + padding * 2,
      }
    }

    case 'mosaic-3': {
      const topH = inner * 0.55
      const botH = inner * 0.4
      const botW = (inner - gap * 2) / 3
      return {
        slots: [
          { x: padding, y: padding, width: inner, height: topH },
          { x: padding, y: padding + topH + gap, width: botW, height: botH },
          { x: padding + botW + gap, y: padding + topH + gap, width: botW, height: botH },
          { x: padding + (botW + gap) * 2, y: padding + topH + gap, width: botW, height: botH },
        ],
        canvasHeight: topH + botH + gap + padding * 2,
      }
    }

    default:
      return calculateSlots(photoCount, 'grid', canvasWidth, padding, gap)
  }
}

export async function generateCollage(
  files: File[],
  options: CollageOptions
): Promise<Blob> {
  const { slots, canvasHeight } = calculateSlots(
    files.length, options.layout, options.canvasWidth, options.padding, options.gap
  )

  const canvas = document.createElement('canvas')
  canvas.width = options.canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')!

  // Background
  ctx.fillStyle = options.backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw each image into its slot with object-fit: cover behaviour
  for (let i = 0; i < files.length && i < slots.length; i++) {
    const img = await loadImage(files[i])
    const slot = slots[i]

    ctx.save()

    // Apply border radius clipping
    if (options.borderRadius > 0) {
      roundedRect(ctx, slot.x, slot.y, slot.width, slot.height, options.borderRadius)
      ctx.clip()
    }

    // Object-fit: cover — fill slot without stretching
    const scale = Math.max(slot.width / img.width, slot.height / img.height)
    const drawW = img.width * scale
    const drawH = img.height * scale
    const drawX = slot.x + (slot.width - drawW) / 2
    const drawY = slot.y + (slot.height - drawH) / 2

    ctx.drawImage(img, drawX, drawY, drawW, drawH)
    ctx.restore()
  }

  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/png'))
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Invalid image')) }
    img.src = url
  })
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
```

**UI Notes:**
- Multi-image upload with drag-to-reorder thumbnails
- Layout selector with visual layout previews (SVG diagrams showing the slot arrangement)
- Canvas width: 1200px, 1600px, 2000px, custom
- Gap, border radius, background colour, padding sliders
- Live preview of the collage (smaller size — 400px wide — updates in real-time)
- Download full-resolution PNG
- Warn if fewer photos uploaded than layout slots: "This layout needs 5 photos — add 2 more or choose a different layout"

---

### Tool 65: Watermark Remover (Guided)
**Route:** `/tools/watermark-remover`
**Library:** `@imgly/background-removal` (WASM model — already installed from Part 1) + Canvas API
**Input:** Image with visible watermark
**Output:** Image with watermark region inpainted

**Important Note on Scope:** True AI-powered inpainting (like Photoshop Content-Aware Fill) runs on powerful GPU hardware and cannot run in a browser in real-time. This tool implements a **guided content-aware fill** approach: the user paints over the watermark, and the tool fills it using a texture synthesis algorithm (patch-based inpainting). This is honest about its capabilities and works well for simple backgrounds (solid colours, patterns, simple gradients).

```typescript
// lib/processing/watermark-remover.ts

export interface InpaintOptions {
  maskData: ImageData    // user-drawn mask — white pixels = areas to fill
  patchSize: number      // size of search patches (default 9)
  iterations: number     // inpainting iterations (default 3)
}

// Simple patch-based inpainting (Criminisi-inspired, simplified for browser)
export async function inpaintImage(
  sourceCanvas: HTMLCanvasElement,
  options: InpaintOptions
): Promise<Blob> {
  const { width, height } = sourceCanvas
  const ctx = sourceCanvas.getContext('2d')!
  const imageData = ctx.getImageData(0, 0, width, height)
  const mask = options.maskData

  const ps = options.patchSize  // patch radius
  const pixels = imageData.data

  // For each masked pixel, find the best matching patch from unmasked region
  // and copy its colour
  const maskPixels: { x: number; y: number }[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      if (mask.data[idx] > 128) {  // white in mask = fill this pixel
        maskPixels.push({ x, y })
      }
    }
  }

  // Patch-based fill: for each masked pixel, sample from nearest unmasked patch
  for (let iter = 0; iter < options.iterations; iter++) {
    for (const { x, y } of maskPixels) {
      const idx = (y * width + x) * 4

      // Sample from surrounding non-masked area
      let bestSumR = 0, bestSumG = 0, bestSumB = 0
      let sampleCount = 0

      // Look in expanding rings around the pixel
      for (let dy = -ps; dy <= ps; dy++) {
        for (let dx = -ps; dx <= ps; dx++) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue

          const nMaskIdx = (ny * width + nx) * 4
          if (mask.data[nMaskIdx] > 128) continue  // skip other masked pixels

          const nIdx = (ny * width + nx) * 4
          bestSumR += pixels[nIdx]
          bestSumG += pixels[nIdx + 1]
          bestSumB += pixels[nIdx + 2]
          sampleCount++
        }
      }

      if (sampleCount > 0) {
        pixels[idx]     = Math.round(bestSumR / sampleCount)
        pixels[idx + 1] = Math.round(bestSumG / sampleCount)
        pixels[idx + 2] = Math.round(bestSumB / sampleCount)
        pixels[idx + 3] = 255
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return new Promise(resolve => sourceCanvas.toBlob(b => resolve(b!), 'image/png'))
}
```

**UI Notes:**
- Upload image → show in a canvas editor
- "Paint mask" mode: user draws over the watermark with a brush tool
  - Brush size slider (5–60px)
  - Eraser toggle
  - "Clear mask" button
- Show mask overlay as semi-transparent red while drawing
- "Remove Watermark" button → runs inpainting
- Show before/after slider comparison
- **Honest disclaimer banner:** "⚠️ This tool works best on simple backgrounds (solid colours, gradients, patterns). Complex backgrounds may produce imperfect results. For professional results, use Photoshop's Generative Fill."
- Download result as PNG

---

### Tool 66: Invoice Generator
**Route:** `/tools/invoice-generator`
**Library:** `pdf-lib` (already installed)
**Input:** Form fields (business info, client info, line items)
**Output:** Professional PDF invoice

```typescript
// lib/processing/invoice-generator.ts
import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib'

export interface InvoiceData {
  // Your business
  fromName: string
  fromAddress: string
  fromEmail: string
  fromPhone?: string
  fromLogoDataUrl?: string    // base64 data URL (max 200×100px logo)

  // Client
  toName: string
  toAddress: string
  toEmail?: string

  // Invoice meta
  invoiceNumber: string
  invoiceDate: string          // ISO date
  dueDate: string              // ISO date
  currency: string             // "USD", "EUR", "INR", etc.
  currencySymbol: string       // "$", "€", "₹"

  // Line items
  items: {
    description: string
    quantity: number
    unitPrice: number
  }[]

  // Tax & discount
  taxPercent?: number          // e.g. 18 for 18%
  taxLabel?: string            // "GST", "VAT", "Tax"
  discountPercent?: number
  discountLabel?: string

  // Notes
  notes?: string               // payment instructions, thank you message
}

function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842])  // A4 in points
  const { width, height } = page.getSize()

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const margin = 50
  const col2 = width / 2 + 20

  // ── Colours ─────────────────────────────────────────────────────────
  const black = rgb(0.1, 0.1, 0.1)
  const grey = rgb(0.5, 0.5, 0.5)
  const accentBlue = rgb(0.24, 0.39, 0.75)
  const lightGrey = rgb(0.95, 0.95, 0.95)

  // ── Header band ─────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: accentBlue })

  // Company name in header
  page.drawText(data.fromName, {
    x: margin, y: height - 55,
    size: 22, font: fontBold, color: rgb(1, 1, 1),
  })

  // INVOICE label
  page.drawText('INVOICE', {
    x: width - margin - 100, y: height - 55,
    size: 22, font: fontBold, color: rgb(1, 1, 1),
  })

  // Invoice number
  page.drawText(`#${data.invoiceNumber}`, {
    x: width - margin - 100, y: height - 75,
    size: 11, font: fontRegular, color: rgb(0.8, 0.8, 1),
  })

  let y = height - 120

  // ── From/To block ───────────────────────────────────────────────────
  page.drawText('FROM', { x: margin, y, size: 8, font: fontBold, color: grey })
  page.drawText('TO', { x: col2, y, size: 8, font: fontBold, color: grey })
  y -= 16

  const fromLines = [data.fromName, ...data.fromAddress.split('\n'), data.fromEmail, data.fromPhone ?? ''].filter(Boolean)
  const toLines = [data.toName, ...data.toAddress.split('\n'), data.toEmail ?? ''].filter(Boolean)

  const maxLines = Math.max(fromLines.length, toLines.length)
  for (let i = 0; i < maxLines; i++) {
    if (fromLines[i]) {
      page.drawText(fromLines[i], { x: margin, y, size: 10, font: i === 0 ? fontBold : fontRegular, color: black })
    }
    if (toLines[i]) {
      page.drawText(toLines[i], { x: col2, y, size: 10, font: i === 0 ? fontBold : fontRegular, color: black })
    }
    y -= 15
  }

  y -= 10

  // ── Dates ────────────────────────────────────────────────────────────
  page.drawRectangle({ x: margin, y: y - 30, width: width - margin * 2, height: 36, color: lightGrey })
  page.drawText(`Invoice Date: ${data.invoiceDate}`, { x: margin + 10, y: y - 18, size: 10, font: fontRegular, color: black })
  page.drawText(`Due Date: ${data.dueDate}`, { x: col2, y: y - 18, size: 10, font: fontRegular, color: black })
  y -= 50

  // ── Items table header ───────────────────────────────────────────────
  page.drawRectangle({ x: margin, y: y - 20, width: width - margin * 2, height: 24, color: accentBlue })
  page.drawText('Description', { x: margin + 10, y: y - 14, size: 10, font: fontBold, color: rgb(1, 1, 1) })
  page.drawText('Qty', { x: width - margin - 170, y: y - 14, size: 10, font: fontBold, color: rgb(1, 1, 1) })
  page.drawText('Unit Price', { x: width - margin - 120, y: y - 14, size: 10, font: fontBold, color: rgb(1, 1, 1) })
  page.drawText('Total', { x: width - margin - 60, y: y - 14, size: 10, font: fontBold, color: rgb(1, 1, 1) })
  y -= 35

  // ── Line items ────────────────────────────────────────────────────────
  let subtotal = 0
  data.items.forEach((item, idx) => {
    const total = item.quantity * item.unitPrice
    subtotal += total

    // Alternating row background
    if (idx % 2 === 0) {
      page.drawRectangle({ x: margin, y: y - 16, width: width - margin * 2, height: 22, color: rgb(0.98, 0.98, 0.99) })
    }

    page.drawText(item.description, { x: margin + 10, y: y - 8, size: 10, font: fontRegular, color: black })
    page.drawText(item.quantity.toString(), { x: width - margin - 170, y: y - 8, size: 10, font: fontRegular, color: black })
    page.drawText(formatCurrency(item.unitPrice, data.currencySymbol), { x: width - margin - 120, y: y - 8, size: 10, font: fontRegular, color: black })
    page.drawText(formatCurrency(total, data.currencySymbol), { x: width - margin - 60, y: y - 8, size: 10, font: fontRegular, color: black })
    y -= 25
  })

  y -= 10

  // ── Totals ────────────────────────────────────────────────────────────
  const totalsX = width - margin - 200

  const drawTotalRow = (label: string, amount: string, bold = false) => {
    page.drawText(label, { x: totalsX, y, size: 10, font: bold ? fontBold : fontRegular, color: bold ? black : grey })
    page.drawText(amount, { x: width - margin - 60, y, size: 10, font: bold ? fontBold : fontRegular, color: bold ? black : grey })
    y -= 18
  }

  drawTotalRow('Subtotal', formatCurrency(subtotal, data.currencySymbol))

  let discount = 0
  if (data.discountPercent) {
    discount = subtotal * (data.discountPercent / 100)
    drawTotalRow(`${data.discountLabel ?? 'Discount'} (${data.discountPercent}%)`, `-${formatCurrency(discount, data.currencySymbol)}`)
  }

  let tax = 0
  if (data.taxPercent) {
    tax = (subtotal - discount) * (data.taxPercent / 100)
    drawTotalRow(`${data.taxLabel ?? 'Tax'} (${data.taxPercent}%)`, formatCurrency(tax, data.currencySymbol))
  }

  const total = subtotal - discount + tax
  y -= 5
  page.drawLine({ start: { x: totalsX, y: y + 14 }, end: { x: width - margin, y: y + 14 }, thickness: 1, color: accentBlue })
  drawTotalRow('TOTAL DUE', formatCurrency(total, data.currencySymbol), true)

  // ── Notes ─────────────────────────────────────────────────────────────
  if (data.notes) {
    y -= 20
    page.drawText('Notes:', { x: margin, y, size: 9, font: fontBold, color: grey })
    y -= 14
    // Wrap long notes text
    const words = data.notes.split(' ')
    let line = ''
    for (const word of words) {
      if ((line + word).length > 80) {
        page.drawText(line.trim(), { x: margin, y, size: 9, font: fontRegular, color: grey })
        y -= 13
        line = word + ' '
      } else {
        line += word + ' '
      }
    }
    if (line.trim()) page.drawText(line.trim(), { x: margin, y, size: 9, font: fontRegular, color: grey })
  }

  return await doc.save()
}
```

**UI Notes:**
- Multi-step form: From (you) → To (client) → Invoice Details → Line Items → Review
- Persistent: auto-save form state to `localStorage` so refreshing doesn't lose work
- Logo upload (optional): show small logo in header (auto-resizes)
- Line items: add/remove rows, quantity and price inputs with live calculation
- Currency selector: USD, EUR, GBP, INR, AED, CAD, AUD (extend list easily)
- Tax and discount: optional percentage fields
- Live PDF preview (re-generates as user types, debounce 500ms)
- Download PDF button

---

### Tool 67: Resume Builder
**Route:** `/tools/resume-builder`
**Library:** `pdf-lib` (already installed)
**Input:** Structured form fields
**Output:** Professional single-page PDF resume

```typescript
// lib/processing/resume-builder.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface ResumeData {
  name: string
  title: string              // e.g. "Senior Frontend Developer"
  email: string
  phone: string
  location: string
  linkedin?: string
  github?: string
  website?: string
  summary: string            // 2–4 sentence professional summary

  experience: {
    company: string
    role: string
    startDate: string        // "Jan 2022"
    endDate: string          // "Present"
    bullets: string[]        // 2–4 bullet points
  }[]

  education: {
    institution: string
    degree: string
    field: string
    year: string
  }[]

  skills: string[]           // flat list, rendered as tags
  certifications?: string[]
  languages?: { language: string; proficiency: string }[]
}

export async function generateResumePDF(data: ResumeData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842])  // A4
  const { width, height } = page.getSize()

  const fontR = await doc.embedFont(StandardFonts.Helvetica)
  const fontB = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontI = await doc.embedFont(StandardFonts.HelveticaOblique)

  const margin = 45
  const accent = rgb(0.17, 0.24, 0.62)
  const dark = rgb(0.1, 0.1, 0.1)
  const mid = rgb(0.4, 0.4, 0.4)

  let y = height - margin

  // Name & Title
  page.drawText(data.name, { x: margin, y, size: 24, font: fontB, color: dark })
  y -= 22
  page.drawText(data.title, { x: margin, y, size: 12, font: fontR, color: accent })
  y -= 10

  // Contact bar
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1.5, color: accent })
  y -= 14

  const contacts = [data.email, data.phone, data.location, data.linkedin, data.github, data.website].filter(Boolean) as string[]
  const contactText = contacts.join('  ·  ')
  page.drawText(contactText, { x: margin, y, size: 8.5, font: fontR, color: mid })
  y -= 20

  // Helper: section header
  const sectionHeader = (title: string) => {
    page.drawText(title.toUpperCase(), { x: margin, y, size: 9, font: fontB, color: accent })
    y -= 4
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: accent })
    y -= 12
  }

  // Summary
  sectionHeader('Professional Summary')
  const summaryLines = wrapText(data.summary, 95)
  summaryLines.forEach(line => {
    page.drawText(line, { x: margin, y, size: 9.5, font: fontR, color: dark })
    y -= 13
  })
  y -= 8

  // Experience
  sectionHeader('Experience')
  data.experience.forEach(exp => {
    page.drawText(exp.role, { x: margin, y, size: 10.5, font: fontB, color: dark })
    const dateStr = `${exp.startDate} – ${exp.endDate}`
    page.drawText(dateStr, { x: width - margin - 80, y, size: 9, font: fontR, color: mid })
    y -= 14
    page.drawText(exp.company, { x: margin, y, size: 9.5, font: fontI, color: mid })
    y -= 12

    exp.bullets.forEach(bullet => {
      page.drawText('•', { x: margin + 5, y, size: 9, font: fontR, color: accent })
      const bulletLines = wrapText(bullet, 88)
      bulletLines.forEach((line, i) => {
        page.drawText(line, { x: margin + 15, y: y - i * 11, size: 9, font: fontR, color: dark })
      })
      y -= bulletLines.length * 11 + 2
    })
    y -= 6
  })

  // Education
  sectionHeader('Education')
  data.education.forEach(edu => {
    page.drawText(`${edu.degree} in ${edu.field}`, { x: margin, y, size: 10, font: fontB, color: dark })
    page.drawText(edu.year, { x: width - margin - 40, y, size: 9, font: fontR, color: mid })
    y -= 13
    page.drawText(edu.institution, { x: margin, y, size: 9.5, font: fontI, color: mid })
    y -= 18
  })

  // Skills
  sectionHeader('Skills')
  let skillX = margin
  data.skills.forEach(skill => {
    const skillW = skill.length * 6 + 16
    if (skillX + skillW > width - margin) { skillX = margin; y -= 20 }
    page.drawRectangle({ x: skillX, y: y - 12, width: skillW, height: 16, color: rgb(0.93, 0.94, 0.99), borderRadius: 4 })
    page.drawText(skill, { x: skillX + 8, y: y - 6, size: 8.5, font: fontR, color: accent })
    skillX += skillW + 6
  })

  return await doc.save()
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if ((current + word).length > maxChars) {
      if (current) lines.push(current.trim())
      current = word + ' '
    } else {
      current += word + ' '
    }
  }
  if (current.trim()) lines.push(current.trim())
  return lines
}
```

**UI Notes:**
- Tabbed sections: Personal Info, Summary, Experience, Education, Skills
- Experience entries: add/remove, drag to reorder
- Bullet points per experience: add/remove with character counter (recommended: <100 chars each)
- Skills: tag input — type and press Enter to add
- Live PDF preview (renders as A4 canvas, updates on change with 500ms debounce)
- Template selector: Classic (above), Modern (two-column), Minimal (serif font)
- Save to `localStorage` so progress persists across browser sessions

---

### Tool 68: Budget Planner
**Route:** `/tools/budget-planner`
**Library:** Pure JS + `localStorage`
**Input:** Income and expense entries via form
**Output:** Visual budget breakdown + savings summary

This tool is fully self-contained in the React component — the "processing" is pure arithmetic. See the Persistent Data Pattern section (Section 3) for the localStorage architecture used by this and Tools 69–73.

**UI Notes:**
- Monthly income input at top
- Expense categories (Housing, Food, Transport, Entertainment, etc.) with amount inputs
- Add custom categories
- Visual bar chart showing spending vs income (using SVG — no chart library needed)
- "50/30/20 Rule" indicator: shows how their budget compares to the recommended 50% needs / 30% wants / 20% savings split
- Savings summary: "You save $340/month (17% of income)"
- Data persists in `localStorage` key `shreyan-tools-budget`

---

### Tool 69: Habit Tracker
**Route:** `/tools/habit-tracker`
**Library:** Pure JS + `localStorage`
**Input:** Habit definitions + daily check-ins
**Output:** Streak counter + calendar heatmap

**UI Notes:**
- Create habits with name, icon, and target frequency (daily / N times per week)
- Check off habits for today with a single tap/click
- 30-day calendar grid per habit showing completion (green = done, empty = missed)
- Streak counter: "🔥 12-day streak"
- Longest streak tracker
- Weekly completion percentage

---

### Tool 70: Pomodoro + Task Manager
**Route:** `/tools/pomodoro-tasks`
**Library:** Pure JS + Web Notifications + Web Audio
**Note:** This extends Tool 36 (basic Pomodoro). This is a more complete version with task management.

**Additions over Tool 36:**
- Task list: add tasks, assign estimated pomodoros per task
- Mark tasks complete
- Associate pomodoro sessions with tasks — auto-marks task as in-progress
- Daily and weekly session stats
- Export sessions log as CSV

---

### Tool 71: Flashcard / Quiz Maker
**Route:** `/tools/flashcards`
**Library:** Pure JS + `localStorage`
**Input:** Question/answer pairs entered via form or CSV upload
**Output:** Interactive flashcard review mode

**Implementation highlights:**

```typescript
// lib/processing/flashcards.ts

export interface Flashcard {
  id: string
  front: string      // question / term
  back: string       // answer / definition
  tags: string[]
  created: number    // timestamp
  lastReviewed?: number
  nextReview?: number   // spaced repetition schedule
  easeFactor: number    // SM-2 algorithm ease factor (starts at 2.5)
  interval: number      // days until next review (starts at 1)
  repetitions: number   // total correct reviews
}

export interface Deck {
  id: string
  name: string
  description?: string
  cards: Flashcard[]
  created: number
}

// SM-2 spaced repetition algorithm
export function sm2(card: Flashcard, quality: 0 | 1 | 2 | 3 | 4 | 5): Flashcard {
  // quality: 0-2 = fail (too hard), 3-5 = pass (easy)
  let { easeFactor, interval, repetitions } = card

  if (quality >= 3) {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)
    repetitions++
  } else {
    repetitions = 0
    interval = 1
  }

  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    lastReviewed: Date.now(),
    nextReview: Date.now() + interval * 86400000,
  }
}

export function getCardsForReview(deck: Deck): Flashcard[] {
  const now = Date.now()
  return deck.cards.filter(card =>
    !card.nextReview || card.nextReview <= now
  )
}
```

**UI Notes:**
- Deck manager: create, name, delete decks
- Card editor: front/back text areas with markdown support (uses `marked` for rendering)
- Review mode: flip animation on card click, rate difficulty (Again / Hard / Good / Easy — maps to SM-2 0/1/3/5)
- Progress bar showing cards remaining in session
- Stats: cards due today, mastered, learning, new
- CSV import: first column = front, second column = back
- CSV export of all cards

---

### Tool 72: Mind Map Maker
**Route:** `/tools/mind-map`
**Library:** Canvas API (built-in) + Pure JS
**Input:** Hierarchical data entered via sidebar
**Output:** Visual mind map (PNG export)

```typescript
// lib/processing/mind-map.ts

export interface MindMapNode {
  id: string
  label: string
  children: MindMapNode[]
  x?: number    // calculated during layout
  y?: number
  color?: string
}

// Radial tree layout algorithm
export function layoutMindMap(root: MindMapNode, canvasWidth: number, canvasHeight: number): MindMapNode {
  const cx = canvasWidth / 2
  const cy = canvasHeight / 2

  root.x = cx
  root.y = cy

  function layoutChildren(node: MindMapNode, startAngle: number, endAngle: number, depth: number) {
    if (!node.children.length) return

    const angleStep = (endAngle - startAngle) / node.children.length
    const radius = 120 + depth * 90

    node.children.forEach((child, i) => {
      const angle = startAngle + angleStep * i + angleStep / 2
      child.x = (node.x ?? cx) + Math.cos(angle) * radius
      child.y = (node.y ?? cy) + Math.sin(angle) * radius
      layoutChildren(child, angle - angleStep / 2, angle + angleStep / 2, depth + 1)
    })
  }

  layoutChildren(root, 0, Math.PI * 2, 1)
  return root
}

export function drawMindMap(ctx: CanvasRenderingContext2D, root: MindMapNode) {
  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']

  function drawNode(node: MindMapNode, depth: number, colorIndex: number) {
    if (!node.x || !node.y) return

    // Draw connections to children
    node.children.forEach(child => {
      if (!child.x || !child.y) return

      ctx.beginPath()
      ctx.moveTo(node.x!, node.y!)
      // Curved bezier connection
      const cpX = (node.x! + child.x) / 2
      ctx.bezierCurveTo(cpX, node.y!, cpX, child.y, child.x, child.y)
      ctx.strokeStyle = COLORS[colorIndex % COLORS.length] + '60'
      ctx.lineWidth = Math.max(1, 4 - depth)
      ctx.stroke()
    })

    // Draw node bubble
    const text = node.label
    ctx.font = `${depth === 0 ? 'bold ' : ''}${Math.max(11, 16 - depth * 2)}px -apple-system, sans-serif`
    const textW = ctx.measureText(text).width
    const padX = 12, padY = 8
    const bw = textW + padX * 2
    const bh = 28

    ctx.fillStyle = depth === 0 ? COLORS[0] : (depth === 1 ? COLORS[colorIndex % COLORS.length] : '#1a1a1d')
    ctx.strokeStyle = COLORS[colorIndex % COLORS.length]
    ctx.lineWidth = depth > 0 ? 1.5 : 0

    ctx.beginPath()
    ctx.roundRect(node.x! - bw / 2, node.y! - bh / 2, bw, bh, 14)
    ctx.fill()
    if (depth > 0) ctx.stroke()

    ctx.fillStyle = depth === 0 ? 'white' : '#f1f1f3'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, node.x!, node.y!)

    node.children.forEach((child, i) => drawNode(child, depth + 1, depth === 1 ? i : colorIndex))
  }

  drawNode(root, 0, 0)
}
```

**UI Notes:**
- Sidebar tree editor: add/remove/rename nodes, drag to reparent
- Canvas panning (click+drag) and zooming (scroll wheel)
- Node colour customisation (click node to edit)
- Auto-layout button: re-runs radial layout
- Export as PNG (renders full canvas)
- Undo/redo (Ctrl+Z / Ctrl+Y) using a state history stack

---

### Tool 73: Kanban Board
**Route:** `/tools/kanban`
**Library:** Pure JS + `localStorage` + `@dnd-kit/core` (for drag-and-drop)
**Input:** Tasks created via UI
**Output:** Visual Kanban board (persistent)

**Implementation highlights:**

```typescript
// lib/processing/kanban.ts

export interface KanbanCard {
  id: string
  title: string
  description?: string
  tags: string[]
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  created: number
}

export interface KanbanColumn {
  id: string
  title: string
  color: string
  cards: KanbanCard[]
  limit?: number   // WIP limit
}

export interface KanbanBoard {
  id: string
  name: string
  columns: KanbanColumn[]
  created: number
}

// Default board template
export const DEFAULT_BOARD: KanbanBoard = {
  id: crypto.randomUUID(),
  name: 'My Board',
  columns: [
    { id: 'backlog',     title: 'Backlog',      color: '#6366f1', cards: [] },
    { id: 'todo',        title: 'To Do',        color: '#f59e0b', cards: [] },
    { id: 'in-progress', title: 'In Progress',  color: '#3b82f6', cards: [], limit: 3 },
    { id: 'done',        title: 'Done',         color: '#22c55e', cards: [] },
  ],
  created: Date.now(),
}
```

**UI Notes:**
- Horizontal scrollable column layout
- Drag cards between columns using `@dnd-kit/core`
- Add cards via "+ Add card" button at bottom of each column
- Card detail modal: title, description (markdown), tags, priority, due date
- Column customisation: rename, recolour, set WIP limit
- WIP limit enforcement: column turns red when at limit
- Filter by tag or priority
- Multiple boards (board switcher in header)

---

### Tool 74: Mortgage / Loan Calculator
**Route:** `/tools/loan-calculator`
**Library:** None — pure JS
**Input:** Loan amount, interest rate, term
**Output:** Monthly payment, total interest, amortisation schedule

```typescript
// lib/processing/loan-calculator.ts

export interface LoanInputs {
  principal: number       // loan amount
  annualRate: number      // annual interest rate (%)
  termMonths: number      // loan term in months
  downPayment?: number    // for mortgage calculations
  extraPayment?: number   // additional monthly payment
}

export interface LoanResult {
  monthlyPayment: number
  totalPayment: number
  totalInterest: number
  effectiveRate: number  // monthly rate
  payoffMonths: number   // months to payoff (considering extra payments)
  schedule: AmortisationEntry[]
}

export interface AmortisationEntry {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

export function calculateLoan(inputs: LoanInputs): LoanResult {
  const P = inputs.principal - (inputs.downPayment ?? 0)
  const r = (inputs.annualRate / 100) / 12
  const n = inputs.termMonths
  const extra = inputs.extraPayment ?? 0

  if (r === 0) {
    // Interest-free loan
    const monthly = P / n
    return {
      monthlyPayment: monthly,
      totalPayment: P,
      totalInterest: 0,
      effectiveRate: 0,
      payoffMonths: n,
      schedule: Array.from({ length: n }, (_, i) => ({
        month: i + 1,
        payment: monthly,
        principal: monthly,
        interest: 0,
        balance: P - monthly * (i + 1),
      }))
    }
  }

  // Standard amortisation formula
  const monthlyPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)

  const schedule: AmortisationEntry[] = []
  let balance = P
  let month = 0
  let totalInterest = 0

  while (balance > 0 && month < n * 2) {  // safety limit
    month++
    const interest = balance * r
    const principalPaid = Math.min(monthlyPayment - interest + extra, balance)
    balance = Math.max(0, balance - principalPaid)
    totalInterest += interest

    schedule.push({
      month,
      payment: principalPaid + interest,
      principal: principalPaid,
      interest,
      balance,
    })

    if (balance <= 0) break
  }

  return {
    monthlyPayment: monthlyPayment + extra,
    totalPayment: monthlyPayment * month - (balance > 0 ? balance : 0) + totalInterest,
    totalInterest,
    effectiveRate: r,
    payoffMonths: month,
    schedule,
  }
}
```

**UI Notes:**
- Large inputs for loan amount, interest rate, term (years/months toggle), down payment
- Monthly payment shown prominently
- Breakdown: principal vs interest pie chart (SVG)
- Comparison mode: compare two loan scenarios side-by-side
- Amortisation table (show first 12 rows, "Show all" toggle)
- Extra payment impact: "Paying $200 extra per month saves $18,340 in interest and pays off 4 years 2 months earlier"

---

### Tool 75: BMI & Calorie Calculator
**Route:** `/tools/health-calculator`
**Library:** None — pure JS
**Input:** Height, weight, age, gender, activity level
**Output:** BMI, BMR, TDEE, macronutrient targets

```typescript
// lib/processing/health-calculator.ts

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active'
export type Goal = 'lose' | 'maintain' | 'gain'

export interface HealthInputs {
  heightCm: number
  weightKg: number
  age: number
  gender: 'male' | 'female'
  activityLevel: ActivityLevel
  goal: Goal
}

export interface HealthResult {
  bmi: number
  bmiCategory: string
  bmiColour: string         // for UI indicator
  bmr: number               // Basal Metabolic Rate (calories at rest)
  tdee: number              // Total Daily Energy Expenditure
  targetCalories: number    // adjusted for goal
  macros: {
    protein: { grams: number; calories: number; percent: number }
    carbs:   { grams: number; calories: number; percent: number }
    fats:    { grams: number; calories: number; percent: number }
  }
  healthyWeightRange: { min: number; max: number }
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  'very-active': 1.9,
}

export function calculateHealth(inputs: HealthInputs): HealthResult {
  const { heightCm, weightKg, age, gender, activityLevel, goal } = inputs

  // BMI
  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)
  const bmiCategory = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal weight' : bmi < 30 ? 'Overweight' : 'Obese'
  const bmiColour = bmi < 18.5 ? '#f59e0b' : bmi < 25 ? '#22c55e' : bmi < 30 ? '#f97316' : '#ef4444'

  // Mifflin-St Jeor BMR formula (most accurate)
  const bmr = gender === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161

  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel]

  const targetCalories = goal === 'lose' ? tdee - 500 : goal === 'gain' ? tdee + 300 : tdee

  // Standard macro split: 30% protein, 40% carbs, 30% fats
  const protein = { calories: targetCalories * 0.30, percent: 30, grams: 0 }
  protein.grams = Math.round(protein.calories / 4)
  const carbs = { calories: targetCalories * 0.40, percent: 40, grams: 0 }
  carbs.grams = Math.round(carbs.calories / 4)
  const fats = { calories: targetCalories * 0.30, percent: 30, grams: 0 }
  fats.grams = Math.round(fats.calories / 9)

  const healthyWeightMin = 18.5 * heightM * heightM
  const healthyWeightMax = 24.9 * heightM * heightM

  return {
    bmi: Math.round(bmi * 10) / 10,
    bmiCategory, bmiColour,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    macros: { protein, carbs, fats },
    healthyWeightRange: { min: Math.round(healthyWeightMin * 10) / 10, max: Math.round(healthyWeightMax * 10) / 10 },
  }
}
```

**UI Notes:**
- Unit toggle: metric (kg/cm) ↔ imperial (lbs/feet+inches)
- BMI gauge visual (needle on a coloured arc)
- Macro breakdown as a pie chart (SVG)
- Activity level descriptions with example lifestyles
- Calorie deficit/surplus recommendation with timeline: "At -500 calories/day, you'd reach your goal weight in ~14 weeks"
- **Medical disclaimer:** "This tool provides estimates based on population averages. Consult a healthcare professional for personalised advice."

---

### Tool 76: Tip Splitter
**Route:** `/tools/tip-splitter`
**Library:** None — pure JS
**Input:** Bill amount, tip %, number of people
**Output:** Per-person amount + tip breakdown

**UI Notes:**
- Bill amount input with currency selector
- Tip percentage: quick buttons (10%, 15%, 18%, 20%, 25%) + custom input
- Number of people: +/- stepper
- Show total tip, total bill, per-person amount
- "Round up" toggle: rounds each person's share up to nearest dollar and shows the "good deed" extra tip
- "Unequal split" mode: assign percentages per person (useful when some people ordered more)

---

### Tool 77: Font Pairing Previewer
**Route:** `/tools/font-pairing`
**Library:** Google Fonts API (free, no API key needed for CSS loading)
**Input:** Font selections
**Output:** Live typography preview

**How it works:** Google Fonts CSS is free. Load fonts by appending a `<link>` tag dynamically — no API key required.

```typescript
// lib/processing/font-pairing.ts

export interface FontPair {
  heading: string    // Google Font name e.g. "Playfair Display"
  body: string       // Google Font name e.g. "Source Sans 3"
  description: string
}

// Curated font pairings
export const CURATED_PAIRINGS: FontPair[] = [
  { heading: 'Playfair Display', body: 'Source Sans 3',   description: 'Editorial & Elegant' },
  { heading: 'Montserrat',       body: 'Merriweather',    description: 'Modern & Classic' },
  { heading: 'Raleway',          body: 'Lato',            description: 'Clean & Minimal' },
  { heading: 'Oswald',           body: 'Open Sans',       description: 'Bold & Readable' },
  { heading: 'Lora',             body: 'PT Sans',         description: 'Warm & Friendly' },
  { heading: 'Abril Fatface',    body: 'Poppins',         description: 'Expressive & Playful' },
  { heading: 'Space Grotesk',    body: 'Inter',           description: 'Technical & Precise' },
  { heading: 'DM Serif Display', body: 'DM Sans',         description: 'Contemporary Contrast' },
  { heading: 'Bebas Neue',       body: 'Roboto',          description: 'Impact & Utility' },
  { heading: 'Cormorant Garamond', body: 'Proza Libre',   description: 'Literary & Refined' },
]

export function loadGoogleFont(fontName: string): Promise<void> {
  return new Promise((resolve) => {
    const id = `gf-${fontName.replace(/\s/g, '-')}`
    if (document.getElementById(id)) { resolve(); return }

    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:ital,wght@0,400;0,700;1,400&display=swap`
    link.onload = () => resolve()
    document.head.appendChild(link)
  })
}

export async function loadFontPair(pair: FontPair): Promise<void> {
  await Promise.all([loadGoogleFont(pair.heading), loadGoogleFont(pair.body)])
}
```

**UI Notes:**
- Curated pairings gallery (10 presets shown as cards with live preview text)
- Custom pairing: two font search dropdowns (uses Google Fonts list — embed a curated list of 200 popular fonts)
- Preview panel: shows heading (H1, H2), body paragraph, and caption with selected fonts
- Preview text is editable — user can type their own content
- Size controls for heading and body
- "Weights" toggle: show multiple font weights
- CSS snippet output: `@import url(...)` + CSS classes
- Dark/light mode preview toggle

---

### Tool 78: Screenshot Annotator
**Route:** `/tools/screenshot-annotator`
**Library:** Canvas API (built-in)
**Input:** Any image (screenshot, photo, etc.)
**Output:** Annotated image (PNG)

```typescript
// lib/processing/annotator.ts

export type DrawTool =
  | 'arrow'       // directional arrow
  | 'rectangle'   // hollow rectangle
  | 'circle'      // hollow ellipse
  | 'text'        // text label
  | 'pen'         // freehand drawing
  | 'highlight'   // semi-transparent yellow rectangle
  | 'blur'        // pixelate a region
  | 'crop-mark'   // bracket corners (like a screenshot crop indicator)
  | 'callout'     // speech bubble with text

export interface Annotation {
  id: string
  tool: DrawTool
  color: string
  lineWidth: number
  // Coordinates (relative to canvas, 0–1 normalised)
  x1: number; y1: number
  x2?: number; y2?: number
  text?: string
  fontSize?: number
  points?: { x: number; y: number }[]  // for pen tool
}

export function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  ann: Annotation,
  canvasW: number,
  canvasH: number
) {
  const x1 = ann.x1 * canvasW
  const y1 = ann.y1 * canvasH
  const x2 = (ann.x2 ?? 0) * canvasW
  const y2 = (ann.y2 ?? 0) * canvasH

  ctx.strokeStyle = ann.color
  ctx.fillStyle = ann.color
  ctx.lineWidth = ann.lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  switch (ann.tool) {
    case 'arrow': {
      const angle = Math.atan2(y2 - y1, x2 - x1)
      const headLen = 16
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4))
      ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4))
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'rectangle': {
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
      break
    }
    case 'circle': {
      ctx.beginPath()
      ctx.ellipse(
        (x1 + x2) / 2, (y1 + y2) / 2,
        Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2,
        0, 0, Math.PI * 2
      )
      ctx.stroke()
      break
    }
    case 'highlight': {
      ctx.globalAlpha = 0.35
      ctx.fillStyle = '#FFFF00'
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1)
      ctx.globalAlpha = 1
      break
    }
    case 'text': {
      ctx.font = `${ann.fontSize ?? 18}px -apple-system, sans-serif`
      ctx.fillText(ann.text ?? '', x1, y1)
      break
    }
    case 'pen': {
      if (!ann.points?.length) break
      ctx.beginPath()
      ann.points.forEach((pt, i) => {
        const px = pt.x * canvasW, py = pt.y * canvasH
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      })
      ctx.stroke()
      break
    }
    case 'blur': {
      const rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1)
      const bx = Math.min(x1, x2), by = Math.min(y1, y2)
      // Pixelate region for blur effect
      const pixelSize = 12
      const imageData = ctx.getImageData(bx, by, rw, rh)
      for (let py = 0; py < rh; py += pixelSize) {
        for (let px = 0; px < rw; px += pixelSize) {
          const idx = (py * rw + px) * 4
          const r = imageData.data[idx], g = imageData.data[idx+1], b = imageData.data[idx+2]
          for (let dy = 0; dy < pixelSize && py + dy < rh; dy++) {
            for (let dx = 0; dx < pixelSize && px + dx < rw; dx++) {
              const nIdx = ((py + dy) * rw + (px + dx)) * 4
              imageData.data[nIdx] = r; imageData.data[nIdx+1] = g; imageData.data[nIdx+2] = b
            }
          }
        }
      }
      ctx.putImageData(imageData, bx, by)
      break
    }
  }
}
```

**UI Notes:**
- Toolbar: Arrow, Rectangle, Circle, Text, Pen, Highlight, Blur, Crop-mark
- Colour picker + stroke width slider
- Undo/redo stack (Ctrl+Z / Ctrl+Y)
- Annotations list: select any annotation to delete or recolour
- "Clear all" button
- Clipboard paste support: paste a screenshot directly (Ctrl+V)
- Download annotated PNG
- Copy to clipboard (for pasting into Slack, email, etc.)
- Zoom in/out for precise annotations on small areas

---

### Tool 79: Webpage Screenshot Tool
**Route:** `/tools/webpage-screenshot`
**Backend:** Cloudflare Worker with Puppeteer (Browser Rendering)
**Input:** Any public URL
**Output:** PNG screenshot of the webpage

**Cloudflare Worker with Browser Rendering API:**

```typescript
// cloudflare-workers/webpage-screenshot.ts
import puppeteer from '@cloudflare/puppeteer'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const targetURL = url.searchParams.get('url')
    const viewport = url.searchParams.get('viewport') ?? 'desktop'
    const fullPage = url.searchParams.get('fullPage') === 'true'

    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://tools.shreyannarula.com',
      'Content-Type': 'image/png',
    }

    if (!targetURL) {
      return new Response(JSON.stringify({ error: 'url parameter required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    try {
      const parsed = new URL(targetURL)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Only HTTP/HTTPS URLs are supported')
      }

      // Use Cloudflare Browser Rendering — this is a paid Cloudflare feature
      // Requires: wrangler.toml [[browser]] binding
      const browser = await puppeteer.launch(env.BROWSER)
      const page = await browser.newPage()

      const viewports: Record<string, { width: number; height: number }> = {
        desktop: { width: 1280, height: 800 },
        mobile:  { width: 390,  height: 844 },
        tablet:  { width: 768,  height: 1024 },
      }

      await page.setViewport(viewports[viewport] ?? viewports.desktop)

      await page.goto(targetURL, {
        waitUntil: 'networkidle2',
        timeout: 15000,
      })

      // Wait for fonts to load
      await page.evaluateHandle('document.fonts.ready')

      const screenshot = await page.screenshot({
        type: 'png',
        fullPage,
        encoding: 'binary',
      })

      await browser.close()

      return new Response(screenshot as Buffer, {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=300',
          'Content-Disposition': `inline; filename="screenshot.png"`,
        }
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error).message }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }
}
```

**wrangler.toml addition:**
```toml
[[browser]]
binding = "BROWSER"
```

**Cost note:** Cloudflare Browser Rendering is available on the paid Workers plan ($5/month). Each screenshot invocation uses Puppeteer. Cache aggressively (same URL within 5 minutes returns cached result from KV).

**UI Notes:**
- URL input with "Take Screenshot" button
- Viewport selector: Desktop (1280px), Tablet (768px), Mobile (390px)
- Full page vs viewport-only toggle
- Show screenshot inline with download PNG button
- Show page dimensions and file size
- "Download" as PNG
- Error states: "Page not accessible", "Page took too long to load", "Invalid URL"

---

### Tool 80: Email Signature Builder
**Route:** `/tools/email-signature`
**Library:** None — pure JS + HTML template generation
**Input:** Personal info and style choices
**Output:** HTML email signature code

```typescript
// lib/processing/email-signature.ts

export interface SignatureData {
  name: string
  title: string
  company?: string
  email: string
  phone?: string
  website?: string
  linkedin?: string
  twitter?: string
  github?: string
  avatarDataUrl?: string    // base64 image for headshot
  logoDataUrl?: string      // company logo
  accentColor: string       // hex
  fontSize: number          // 13 or 14
  template: 'simple' | 'horizontal' | 'card' | 'minimal'
}

export function generateSignatureHTML(data: SignatureData): string {
  const { accentColor, fontSize } = data

  const socialIcons = [
    data.linkedin && `<a href="${data.linkedin}" style="margin-right:8px"><img src="https://img.icons8.com/color/16/linkedin.png" width="16" height="16" alt="LinkedIn" style="vertical-align:middle"/></a>`,
    data.twitter  && `<a href="${data.twitter}"  style="margin-right:8px"><img src="https://img.icons8.com/color/16/twitter.png"   width="16" height="16" alt="Twitter"  style="vertical-align:middle"/></a>`,
    data.github   && `<a href="${data.github}"   style="margin-right:8px"><img src="https://img.icons8.com/color/16/github.png"    width="16" height="16" alt="GitHub"   style="vertical-align:middle"/></a>`,
  ].filter(Boolean).join('')

  switch (data.template) {
    case 'simple':
    default:
      return `
<table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:${fontSize}px;color:#333333">
  <tr>
    ${data.avatarDataUrl ? `<td style="padding-right:16px;vertical-align:top">
      <img src="${data.avatarDataUrl}" width="72" height="72" style="border-radius:50%;display:block" alt="${data.name}">
    </td>` : ''}
    <td style="vertical-align:top">
      <div style="font-size:${fontSize + 2}px;font-weight:bold;color:#111111;margin-bottom:2px">${data.name}</div>
      <div style="color:${accentColor};margin-bottom:4px">${data.title}${data.company ? ` · ${data.company}` : ''}</div>
      <div style="border-top:2px solid ${accentColor};padding-top:8px;margin-top:4px">
        ${data.phone ? `<div>📞 <a href="tel:${data.phone}" style="color:#333;text-decoration:none">${data.phone}</a></div>` : ''}
        <div>✉️ <a href="mailto:${data.email}" style="color:${accentColor};text-decoration:none">${data.email}</a></div>
        ${data.website ? `<div>🌐 <a href="${data.website}" style="color:${accentColor};text-decoration:none">${data.website.replace(/^https?:\/\//, '')}</a></div>` : ''}
      </div>
      ${socialIcons ? `<div style="margin-top:8px">${socialIcons}</div>` : ''}
    </td>
  </tr>
</table>
      `.trim()
  }
}
```

**UI Notes:**
- Form: name, title, company, email, phone, website, social links
- Avatar upload (optional): circular crop, max 100×100px
- Accent colour picker
- Template gallery: 4 styles with live previews
- Live HTML preview (renders the signature in an iframe)
- Instructions panel: "How to add to Gmail / Outlook / Apple Mail"
- Copy HTML button
- Test email: "Send a test email to yourself" (opens mailto: with signature in body — works in most email clients)

---

## 3. Persistent Data Pattern (localStorage Tools)

Tools 68–73 (Budget Planner, Habit Tracker, Pomodoro Tasks, Flashcards, Mind Map, Kanban) all store user data in `localStorage`. All must follow this exact pattern to ensure data never gets lost and the tools remain usable across sessions.

### Storage Key Naming Convention

```typescript
// All keys prefixed with 'shreyan-tools-' to avoid conflicts
const STORAGE_KEYS = {
  budget:      'shreyan-tools-budget',
  habits:      'shreyan-tools-habits',
  pomodoro:    'shreyan-tools-pomodoro',
  flashcards:  'shreyan-tools-flashcards',
  mindmap:     'shreyan-tools-mindmap',
  kanban:      'shreyan-tools-kanban',
} as const
```

### useLocalStorage Hook

```typescript
// lib/utils/use-local-storage.ts
import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const set = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prev => {
      const next = typeof newValue === 'function' ? (newValue as (p: T) => T)(prev) : newValue
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // localStorage may be full (5MB limit) — show user a warning
        console.warn(`localStorage full. Could not save ${key}`)
      }
      return next
    })
  }, [key])

  const clear = useCallback(() => {
    localStorage.removeItem(key)
    setValue(defaultValue)
  }, [key, defaultValue])

  return [value, set, clear]
}
```

### Export / Import Pattern

Every persistent tool must have export and import buttons:

```typescript
// Export: download data as JSON
function exportData(key: string, data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Import: upload JSON file and restore data
async function importData(file: File): Promise<unknown> {
  const text = await file.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Invalid JSON file — could not import data')
  }
}
```

Add a small "Export data" and "Import data" button to every persistent tool's settings panel. This is the single most important feature for user trust — their data must be portable.

---

## 4. New Cloudflare Worker Route

Tool 79 (Webpage Screenshot) requires a new Cloudflare Worker route. Add to `wrangler.toml`:

```toml
[[routes]]
pattern = "tools.shreyannarula.com/api/worker/screenshot"
zone_name = "shreyannarula.com"

# Browser Rendering binding (requires Workers paid plan)
[[browser]]
binding = "BROWSER"
```

**Cost note for Cloudflare Browser Rendering:**
Cloudflare Workers paid plan is $5/month. Browser Rendering is included. Each screenshot takes ~3–5 seconds and consumes CPU time. Cache results in KV for 5 minutes per URL to avoid redundant processing.

---

## 5. Extension Context Menu Additions

```typescript
// Add to service-worker/context-menus.ts

// Page context: screenshot
chrome.contextMenus.create({
  id: 'page-screenshot',
  parentId: 'shreyan-page',
  title: '📸 Take Screenshot',
  contexts: ['page'],
})

// Image: annotate
chrome.contextMenus.create({
  id: 'img-annotate',
  parentId: 'shreyan-img',
  title: '✏️ Annotate Image',
  contexts: ['image'],
})

// Image: collage (only useful if user right-clicks multiple? Covered via popup instead)
// Not added as context menu — too complex for right-click flow

// Add to toolRoutes:
'page-screenshot': 'webpage-screenshot',
'img-annotate':    'screenshot-annotator',
```

---

## 6. Phase Build Order for Tools 61–80

### Week 1 (Days 1–7): Pure JS / Calculator tools
No new libraries, no complexity:
- [ ] **Tool 74:** Loan Calculator — 2 hours
- [ ] **Tool 75:** BMI & Health Calculator — 2 hours
- [ ] **Tool 76:** Tip Splitter — 1 hour
- [ ] **Tool 68:** Budget Planner — 3 hours
- [ ] **Tool 69:** Habit Tracker — 3 hours

**End of Week 1:** 5 tools live.

---

### Week 2 (Days 8–14): Storage-based productivity tools
All use the `useLocalStorage` pattern:
- [ ] **Tool 70:** Pomodoro + Tasks — 4 hours
- [ ] **Tool 71:** Flashcards — 5 hours (SM-2 algorithm + review UI)
- [ ] **Tool 73:** Kanban — 5 hours (`@dnd-kit/core` drag-and-drop)

**End of Week 2:** 8 tools live.

---

### Week 3 (Days 15–21): Canvas-based tools
- [ ] **Tool 78:** Screenshot Annotator — 6 hours (most complex canvas tool in this batch)
- [ ] **Tool 64:** Photo Collage Maker — 5 hours
- [ ] **Tool 72:** Mind Map — 6 hours (layout algorithm + interactive canvas)

**End of Week 3:** 11 tools live.

---

### Week 4 (Days 22–28): PDF + API tools
- [ ] **Tool 66:** Invoice Generator — 5 hours (pdf-lib, complex layout)
- [ ] **Tool 67:** Resume Builder — 5 hours
- [ ] **Tool 77:** Font Pairing Previewer — 3 hours
- [ ] **Tool 80:** Email Signature Builder — 3 hours

**End of Week 4:** 15 tools live.

---

### Week 5 (Days 29–35): FFmpeg and WASM tools
- [ ] **Tool 61:** Video Compressor — 4 hours
- [ ] **Tool 62:** Video Thumbnail Extractor — 4 hours
- [ ] **Tool 63:** Audio Volume Normaliser — 3 hours
- [ ] **Tool 65:** Watermark Remover — 6 hours (canvas inpainting + disclaimer)
- [ ] **Tool 79:** Webpage Screenshot — 5 hours (Cloudflare Worker + Puppeteer)

**End of Week 5:** All 20 tools live. **Total: 80 working tools.**

---

## 7. Critical Rules Specific to This Batch

In addition to all 30 rules from Parts 1–3:

**Rule 31 — Video Compressor: always output MP4 regardless of input format.**
H.264 MP4 is the most universally compatible format. Users uploading `.avi`, `.mov`, or `.wmv` should always receive an `.mp4` output. Never output the same container format as input for video compression — this creates user confusion about what changed.

**Rule 32 — Video Thumbnail extraction: try Browser Video API first, FFmpeg second.**
Browser's `HTMLVideoElement` can extract frames from MP4 and WebM without loading WASM. Only fall back to FFmpeg for AVI, old QuickTime MOV, and other formats the browser can't decode natively. This makes the tool dramatically faster for common formats.

**Rule 33 — Invoice and Resume builders: auto-save to localStorage every time the form changes.**
Users frequently navigate away from these tools mid-completion. Data loss on a half-completed invoice is a severe UX failure. Implement auto-save with a 1-second debounce. Show a subtle "Auto-saved" indicator.

**Rule 34 — Flashcard SM-2 algorithm: never reset ease factor below 1.3.**
The SM-2 algorithm will produce negative intervals if ease factor drops below 1.3. Always clamp: `easeFactor = Math.max(1.3, newEaseFactor)`. The reference implementation in the spec says this explicitly.

**Rule 35 — Photo Collage: enforce minimum 2 images.**
A "collage" of 1 image is not a collage — it's a no-op that confuses users. Validate before processing and show: "Please add at least 2 photos to create a collage."

**Rule 36 — Font Pairing: load fonts lazily, not on page load.**
Never load all Google Fonts on page load. Only load the fonts for the currently previewed pair. Use the `loadGoogleFont()` function which checks if the font `<link>` already exists before adding another one.

**Rule 37 — Watermark Remover: the honest disclaimer is mandatory and must appear above the upload zone.**
The inpainting algorithm works well on simple backgrounds but poorly on complex ones. Showing the disclaimer only after processing (when results are bad) creates frustration. Show it prominently BEFORE the user invests time in drawing the mask.

**Rule 38 — Screenshot Annotator: store annotations as a normalised (0–1) coordinate array, not pixel coordinates.**
If the user uploads a 4000×3000px image and the canvas is displayed at 800×600px, pixel coordinates from mouse events are screen-relative. Always normalise all coordinates to the range 0–1 relative to the image dimensions. This ensures annotations render correctly at any display size and in the exported PNG.

**Rule 39 — Webpage Screenshot: cache aggressively in Cloudflare KV.**
Puppeteer takes 3–5 seconds per screenshot and consumes significant CPU time. Cache every screenshot result in KV for 5 minutes, keyed by `screenshot:{url}:{viewport}:{fullPage}`. A cached response is near-instant and costs nothing.

**Rule 40 — localStorage tools: always implement export/import.**
User data in `localStorage` is tied to the browser and device. If a user clears their browser data, switches browsers, or gets a new computer, all their budget, kanban, flashcard, and habit data is permanently lost. Export to JSON and import from JSON is the minimum required portability feature for any tool that stores user-created data.

---

*Part 4 complete. Tools 61–80 documented. You now have 80 tools fully specified.*
*Part 5 will cover Tools 81–100.*
*Part 6 will cover Tools 101–110 + final integration checklist.*
*Last updated: May 2026. For tools.shreyannarula.com.*
