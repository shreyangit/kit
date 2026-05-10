# tools.shreyannarula.com — Part 5 Implementation Guide
### Tools 81–100: Complete Build Reference

> Direct continuation of Parts 1, 2, 3, and 4. All architecture decisions, shared components (`ToolShell`, `DropZone`, `OutputPanel`, `ProcessingOverlay`), tools registry pattern, FFmpeg singleton, COOP/COEP headers, Cloudflare Worker patterns, `useLocalStorage` hook, and all 40 critical rules from prior parts remain fully in force. This document adds tools 81–100 with identical depth, code specificity, and zero ambiguity. Do not re-implement anything from Parts 1–4.

---

## Context: What Was Built in Parts 1–4

**80 tools are already live.** Full lists in Parts 1–4. This document starts at Tool 81.

---

## Tools 81–100 at a Glance

| # | Tool | Route | Primary Library / API |
|---|---|---|---|
| 81 | Color Blindness Simulator | `/tools/color-blindness` | Canvas API + CSS filters |
| 82 | CSS Clip-Path Generator | `/tools/clip-path` | Pure JS + SVG |
| 83 | CSS Animation Generator | `/tools/css-animation` | Pure JS |
| 84 | Icon Finder & Downloader | `/tools/icon-finder` | Iconify API (free) |
| 85 | Typography Scale Generator | `/tools/type-scale` | Pure JS |
| 86 | Palette from Image (Advanced) | `/tools/palette-advanced` | Canvas API + `chroma-js` |
| 87 | Hex/RGB/HSL Bulk Converter | `/tools/color-bulk` | `chroma-js` |
| 88 | Gradient Mesh Generator | `/tools/gradient-mesh` | Canvas API + WebGL |
| 89 | SVG Path Visualiser | `/tools/svg-path` | Pure JS + SVG |
| 90 | CSS Grid Generator | `/tools/css-grid` | Pure JS |
| 91 | Responsive Breakpoint Tester | `/tools/breakpoint-tester` | Cloudflare Worker + Puppeteer |
| 92 | HTML to Markdown | `/tools/html-to-markdown` | `turndown` |
| 93 | YAML ↔ JSON Converter | `/tools/yaml-json` | `js-yaml` |
| 94 | XML Formatter & Validator | `/tools/xml-formatter` | Pure JS (DOMParser) |
| 95 | TOML ↔ JSON Converter | `/tools/toml-json` | `@iarna/toml` |
| 96 | SQL Formatter | `/tools/sql-formatter` | `sql-formatter` |
| 97 | GraphQL Schema Formatter | `/tools/graphql-formatter` | `graphql` (browser build) |
| 98 | Environment Variable Parser | `/tools/env-parser` | Pure JS |
| 99 | HTTP Status Code Reference | `/tools/http-status` | Pure JS (static data) |
| 100 | Keyboard Shortcut Cheatsheet | `/tools/keyboard-shortcuts` | Pure JS (static data) |

---

## Table of Contents

1. [New npm Dependencies](#1-new-npm-dependencies)
2. [Tools 81–100 Detailed Specs](#2-tools-81100-detailed-specs)
3. [Static Data Tools Pattern](#3-static-data-tools-pattern)
4. [New Cloudflare Worker Route](#4-new-cloudflare-worker-route)
5. [Extension Context Menu Additions](#5-extension-context-menu-additions)
6. [Phase Build Order for Tools 81–100](#6-phase-build-order-for-tools-81100)
7. [Critical Rules Specific to This Batch](#7-critical-rules-specific-to-this-batch)

---

## 1. New npm Dependencies

```bash
npm install turndown js-yaml @iarna/toml sql-formatter graphql
```

Check `package.json` before running — `chroma-js` is already present from Part 1.

Full dependency table for this batch:

| Package | Version (min) | Used By | Notes |
|---|---|---|---|
| `turndown` | `^7.1.0` | Tool 92 | HTML → Markdown conversion |
| `js-yaml` | `^4.1.0` | Tool 93 | YAML parse and stringify |
| `@iarna/toml` | `^2.2.5` | Tool 95 | TOML parse and stringify |
| `sql-formatter` | `^15.0.0` | Tool 96 | SQL beautifier |
| `graphql` | `^16.8.0` | Tool 97 | GraphQL schema parsing |
| `chroma-js` | already installed | Tools 86, 87, 88 | — |

Tools 81–90 (design tools) and Tools 98–100 (reference tools) use only built-in browser APIs or zero dependencies. Do not install anything for them.

---

## 2. Tools 81–100 Detailed Specs

---

### Tool 81: Color Blindness Simulator
**Route:** `/tools/color-blindness`
**Library:** Canvas API + CSS `filter` matrices (built-in)
**Input:** Any image (JPG, PNG, WebP) or a URL to an image
**Output:** Side-by-side visual comparison of how the image looks under each type of colour blindness

**How it works:** Colour blindness simulation applies specific colour transformation matrices to each pixel using the Canvas API. These matrices are derived from research by Machado et al. (2009) and are the same matrices used in professional accessibility tools.

**Implementation:**

```typescript
// lib/processing/color-blindness.ts

export type ColorBlindnessType =
  | 'normal'
  | 'protanopia'       // red-blind (1% of males)
  | 'deuteranopia'     // green-blind (1% of males, most common)
  | 'tritanopia'       // blue-blind (very rare)
  | 'protanomaly'      // red-weak
  | 'deuteranomaly'    // green-weak (most common, 5% of males)
  | 'tritanomaly'      // blue-weak
  | 'achromatopsia'    // complete colour blindness (greyscale)
  | 'achromatomaly'    // partial greyscale

// Colour transformation matrices (applied to linear RGB values)
// Each matrix is [r_r, r_g, r_b, g_r, g_g, g_b, b_r, b_g, b_b]
// where output_red = r_r*R + r_g*G + r_b*B, etc.
const MATRICES: Record<Exclude<ColorBlindnessType, 'normal'>, number[]> = {
  protanopia:    [0.152, 1.053, -0.205, 0.115, 0.786,  0.099, -0.004, -0.048, 1.052],
  deuteranopia:  [0.367, 0.861, -0.228, 0.280, 0.673,  0.047, -0.012,  0.043, 0.969],
  tritanopia:    [1.256, -0.077, -0.179, -0.078, 0.931, 0.148,  0.005,  0.691, 0.304],
  protanomaly:   [0.458, 0.679, -0.137, 0.092, 0.822,  0.086, -0.009, -0.024, 1.033],
  deuteranomaly: [0.547, 0.607, -0.154, 0.184, 0.824, -0.008,  0.000,  0.079, 0.921],
  tritanomaly:   [1.017, 0.093, -0.110, 0.006, 0.733,  0.261,  0.000,  0.182, 0.818],
  achromatopsia: [0.213, 0.715, 0.072, 0.213, 0.715, 0.072, 0.213, 0.715, 0.072],
  achromatomaly: [0.618, 0.320, 0.062, 0.163, 0.775, 0.062, 0.163, 0.320, 0.516],
}

// Linearise sRGB value (reverse gamma correction) for accurate matrix multiplication
function linearise(c: number): number {
  const n = c / 255
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4)
}

// Apply sRGB gamma correction to linear value
function delinearise(c: number): number {
  return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055))
}

export function simulateColorBlindness(
  sourceCanvas: HTMLCanvasElement,
  type: ColorBlindnessType
): HTMLCanvasElement {
  const output = document.createElement('canvas')
  output.width = sourceCanvas.width
  output.height = sourceCanvas.height
  const ctx = output.getContext('2d')!
  ctx.drawImage(sourceCanvas, 0, 0)

  if (type === 'normal') return output

  const imageData = ctx.getImageData(0, 0, output.width, output.height)
  const data = imageData.data
  const m = MATRICES[type]

  for (let i = 0; i < data.length; i += 4) {
    // Convert from sRGB to linear RGB for accurate matrix multiplication
    const r = linearise(data[i])
    const g = linearise(data[i + 1])
    const b = linearise(data[i + 2])

    // Apply colour blindness transformation matrix
    const sr = m[0] * r + m[1] * g + m[2] * b
    const sg = m[3] * r + m[4] * g + m[5] * b
    const sb = m[6] * r + m[7] * g + m[8] * b

    // Convert back to sRGB with gamma correction
    data[i]     = Math.max(0, Math.min(255, delinearise(sr)))
    data[i + 1] = Math.max(0, Math.min(255, delinearise(sg)))
    data[i + 2] = Math.max(0, Math.min(255, delinearise(sb)))
    // Alpha channel [i+3] is unchanged
  }

  ctx.putImageData(imageData, 0, 0)
  return output
}

// Process all types at once for comparison view
export async function simulateAllTypes(
  file: File,
  onProgress: (completed: number, total: number) => void
): Promise<Record<ColorBlindnessType, HTMLCanvasElement>> {
  const img = new Image()
  const url = URL.createObjectURL(file)
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Invalid image'))
    img.src = url
  })

  const source = document.createElement('canvas')
  source.width = img.naturalWidth
  source.height = img.naturalHeight
  source.getContext('2d')!.drawImage(img, 0, 0)
  URL.revokeObjectURL(url)

  const types: ColorBlindnessType[] = [
    'normal', 'protanopia', 'deuteranopia', 'tritanopia',
    'protanomaly', 'deuteranomaly', 'tritanomaly',
    'achromatopsia', 'achromatomaly',
  ]

  const results = {} as Record<ColorBlindnessType, HTMLCanvasElement>
  for (let i = 0; i < types.length; i++) {
    results[types[i]] = simulateColorBlindness(source, types[i])
    onProgress(i + 1, types.length)
    // Yield to UI thread between heavy operations
    await new Promise(r => setTimeout(r, 0))
  }

  return results
}

export const COLOR_BLINDNESS_INFO: Record<ColorBlindnessType, { label: string; prevalence: string; description: string }> = {
  normal:        { label: 'Normal Vision',      prevalence: '~95% of people',              description: 'Standard colour perception.' },
  protanopia:    { label: 'Protanopia',          prevalence: '~1% of males',                description: 'Cannot perceive red light. Reds appear dark.' },
  deuteranopia:  { label: 'Deuteranopia',        prevalence: '~1% of males',                description: 'Cannot perceive green light. Most common type.' },
  tritanopia:    { label: 'Tritanopia',           prevalence: '<0.01% of people',            description: 'Cannot perceive blue light. Very rare.' },
  protanomaly:   { label: 'Protanomaly',          prevalence: '~1% of males',                description: 'Reduced red perception. Reds appear faded.' },
  deuteranomaly: { label: 'Deuteranomaly',        prevalence: '~5% of males',                description: 'Reduced green perception. Most common CVD.' },
  tritanomaly:   { label: 'Tritanomaly',           prevalence: '<0.01% of people',            description: 'Reduced blue perception.' },
  achromatopsia: { label: 'Achromatopsia',         prevalence: '~0.003% of people',           description: 'Complete colour blindness. Sees only greyscale.' },
  achromatomaly: { label: 'Achromatomaly',          prevalence: 'Very rare',                   description: 'Partial colour blindness, mostly greyscale.' },
}
```

**UI Notes:**
- Upload image or paste URL
- 9-panel grid showing image under all colour blindness types simultaneously
- Each panel labelled with type name, prevalence, and description tooltip
- Click any panel to expand it full-width
- Download any single simulation as PNG
- "Download all as ZIP" button (9 PNGs)
- Overlay toggle: before/after slider for any selected type pair (normal vs simulated)
- Use case note: "Use this to check if your UI colours are accessible to colour-blind users"

---

### Tool 82: CSS Clip-Path Generator
**Route:** `/tools/clip-path`
**Library:** Pure JS + SVG (built-in)
**Input:** Visual drag-handle controls on a shape canvas
**Output:** CSS `clip-path` property string

**Implementation:**

```typescript
// lib/processing/clip-path.ts

export type ClipShape =
  | 'polygon'    // arbitrary polygon with draggable vertices
  | 'circle'     // circle(radius at cx cy)
  | 'ellipse'    // ellipse(rx ry at cx cy)
  | 'inset'      // inset(top right bottom left round radius)

export interface PolygonPoint { x: number; y: number }  // 0–100 percent

export function generateClipPath(shape: ClipShape, params: ClipPathParams): {
  css: string
  cssProperty: string
  webkitCSS: string
} {
  let value: string

  switch (shape) {
    case 'polygon': {
      const { points } = params as PolygonParams
      const pointStr = points.map(p => `${p.x.toFixed(1)}% ${p.y.toFixed(1)}%`).join(', ')
      value = `polygon(${pointStr})`
      break
    }
    case 'circle': {
      const { radius, cx, cy } = params as CircleParams
      value = `circle(${radius.toFixed(1)}% at ${cx.toFixed(1)}% ${cy.toFixed(1)}%)`
      break
    }
    case 'ellipse': {
      const { rx, ry, cx, cy } = params as EllipseParams
      value = `ellipse(${rx.toFixed(1)}% ${ry.toFixed(1)}% at ${cx.toFixed(1)}% ${cy.toFixed(1)}%)`
      break
    }
    case 'inset': {
      const { top, right, bottom, left, radius } = params as InsetParams
      value = `inset(${top}% ${right}% ${bottom}% ${left}%${radius ? ` round ${radius}px` : ''})`
      break
    }
  }

  return {
    css: `clip-path: ${value};`,
    cssProperty: value,
    webkitCSS: `-webkit-clip-path: ${value};`,
  }
}

export interface PolygonParams { points: PolygonPoint[] }
export interface CircleParams  { radius: number; cx: number; cy: number }
export interface EllipseParams { rx: number; ry: number; cx: number; cy: number }
export interface InsetParams   { top: number; right: number; bottom: number; left: number; radius?: number }

export type ClipPathParams = PolygonParams | CircleParams | EllipseParams | InsetParams

// Preset polygon shapes
export const POLYGON_PRESETS: { label: string; points: PolygonPoint[] }[] = [
  { label: 'Triangle',     points: [{ x:50, y:0 }, { x:100, y:100 }, { x:0, y:100 }] },
  { label: 'Rhombus',      points: [{ x:50, y:0 }, { x:100, y:50 }, { x:50, y:100 }, { x:0, y:50 }] },
  { label: 'Pentagon',     points: [{ x:50, y:0 }, { x:100, y:38 }, { x:81, y:100 }, { x:19, y:100 }, { x:0, y:38 }] },
  { label: 'Hexagon',      points: [{ x:50, y:0 }, { x:100, y:25 }, { x:100, y:75 }, { x:50, y:100 }, { x:0, y:75 }, { x:0, y:25 }] },
  { label: 'Star',         points: [{ x:50, y:0 }, { x:61, y:35 }, { x:98, y:35 }, { x:68, y:57 }, { x:79, y:91 }, { x:50, y:70 }, { x:21, y:91 }, { x:32, y:57 }, { x:2, y:35 }, { x:39, y:35 }] },
  { label: 'Arrow Right',  points: [{ x:0, y:20 }, { x:60, y:20 }, { x:60, y:0 }, { x:100, y:50 }, { x:60, y:100 }, { x:60, y:80 }, { x:0, y:80 }] },
  { label: 'Message Bubble', points: [{ x:0, y:0 }, { x:100, y:0 }, { x:100, y:75 }, { x:30, y:75 }, { x:15, y:100 }, { x:20, y:75 }, { x:0, y:75 }] },
  { label: 'Parallelogram', points: [{ x:20, y:0 }, { x:100, y:0 }, { x:80, y:100 }, { x:0, y:100 }] },
  { label: 'Trapezoid',    points: [{ x:20, y:0 }, { x:80, y:0 }, { x:100, y:100 }, { x:0, y:100 }] },
  { label: 'Bevel',        points: [{ x:15, y:0 }, { x:85, y:0 }, { x:100, y:15 }, { x:100, y:85 }, { x:85, y:100 }, { x:15, y:100 }, { x:0, y:85 }, { x:0, y:15 }] },
]
```

**UI Notes:**
- Left panel: interactive shape canvas (400×400px)
  - Polygon mode: draggable vertices (white circles), click canvas edge to add vertex, double-click vertex to remove
  - Circle/Ellipse mode: drag centre handle and radius handles
  - Inset mode: 4 sliders (top/right/bottom/left)
- Right panel: preview area showing a real image or colour block with the clip-path applied
- Preset shape gallery above canvas
- Shape type tabs: Polygon / Circle / Ellipse / Inset
- Animate toggle: continuously rotates the shape (shows clip-path animation potential)
- Output: `clip-path` CSS + `-webkit-clip-path` CSS — copy buttons for each
- Tailwind arbitrary value: `[clip-path:polygon(...)]`

---

### Tool 83: CSS Animation Generator
**Route:** `/tools/css-animation`
**Library:** Pure JS (built-in)
**Input:** Animation property controls
**Output:** CSS `@keyframes` + animation property string

**Implementation:**

```typescript
// lib/processing/css-animation.ts

export type EasingFunction =
  | 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
  | 'cubic-bezier'  // custom cubic-bezier(x1, y1, x2, y2)
  | 'steps'         // steps(n, jump-start|jump-end|jump-none|jump-both)

export type AnimationProperty =
  | 'transform-translate' | 'transform-scale' | 'transform-rotate'
  | 'opacity' | 'color' | 'background-color'
  | 'width' | 'height' | 'border-radius'
  | 'box-shadow' | 'filter'

export interface KeyframeStop {
  percent: number      // 0–100
  value: string        // CSS value at this stop e.g. "translateX(0px)"
}

export interface AnimationConfig {
  name: string
  keyframes: KeyframeStop[]
  duration: number           // ms
  easing: EasingFunction
  cubicBezierValues?: [number, number, number, number]
  stepsCount?: number
  stepsJump?: 'start' | 'end' | 'none' | 'both'
  delay: number              // ms
  iterationCount: number | 'infinite'
  direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  fillMode: 'none' | 'forwards' | 'backwards' | 'both'
  property: AnimationProperty
}

export function generateKeyframesCSS(config: AnimationConfig): {
  keyframesBlock: string
  animationProperty: string
  fullCSS: string
} {
  const stops = config.keyframes
    .slice()
    .sort((a, b) => a.percent - b.percent)
    .map(stop => `  ${stop.percent}% {\n    ${propertyCSS(config.property, stop.value)}\n  }`)
    .join('\n')

  const keyframesBlock = `@keyframes ${config.name} {\n${stops}\n}`

  const easingValue = config.easing === 'cubic-bezier' && config.cubicBezierValues
    ? `cubic-bezier(${config.cubicBezierValues.join(', ')})`
    : config.easing === 'steps' && config.stepsCount
    ? `steps(${config.stepsCount}, jump-${config.stepsJump ?? 'end'})`
    : config.easing

  const iterCount = config.iterationCount === 'infinite' ? 'infinite' : config.iterationCount

  const animationProperty = [
    `animation-name: ${config.name};`,
    `animation-duration: ${config.duration}ms;`,
    `animation-timing-function: ${easingValue};`,
    `animation-delay: ${config.delay}ms;`,
    `animation-iteration-count: ${iterCount};`,
    `animation-direction: ${config.direction};`,
    `animation-fill-mode: ${config.fillMode};`,
  ].join('\n')

  const shorthand = `animation: ${config.name} ${config.duration}ms ${easingValue} ${config.delay}ms ${iterCount} ${config.direction} ${config.fillMode};`

  return {
    keyframesBlock,
    animationProperty,
    fullCSS: `${keyframesBlock}\n\n.element {\n  ${shorthand}\n}`,
  }
}

function propertyCSS(property: AnimationProperty, value: string): string {
  const map: Record<AnimationProperty, string> = {
    'transform-translate': `transform: translate(${value});`,
    'transform-scale':     `transform: scale(${value});`,
    'transform-rotate':    `transform: rotate(${value});`,
    'opacity':             `opacity: ${value};`,
    'color':               `color: ${value};`,
    'background-color':    `background-color: ${value};`,
    'width':               `width: ${value};`,
    'height':              `height: ${value};`,
    'border-radius':       `border-radius: ${value};`,
    'box-shadow':          `box-shadow: ${value};`,
    'filter':              `filter: ${value};`,
  }
  return map[property] ?? `${property}: ${value};`
}

// Preset animations
export const ANIMATION_PRESETS: { label: string; config: Partial<AnimationConfig> }[] = [
  {
    label: 'Fade In',
    config: { property: 'opacity', duration: 600, easing: 'ease-out', keyframes: [{ percent: 0, value: '0' }, { percent: 100, value: '1' }] }
  },
  {
    label: 'Slide In Left',
    config: { property: 'transform-translate', duration: 500, easing: 'ease-out', keyframes: [{ percent: 0, value: '-100%, 0' }, { percent: 100, value: '0, 0' }] }
  },
  {
    label: 'Bounce',
    config: { property: 'transform-translate', duration: 800, easing: 'cubic-bezier', cubicBezierValues: [0.36, 0.07, 0.19, 0.97], keyframes: [{ percent: 0, value: '0, 0' }, { percent: 20, value: '0, -30px' }, { percent: 40, value: '0, 0' }, { percent: 60, value: '0, -15px' }, { percent: 80, value: '0, 0' }, { percent: 100, value: '0, 0' }] }
  },
  {
    label: 'Pulse',
    config: { property: 'transform-scale', duration: 1000, easing: 'ease-in-out', iterationCount: 'infinite', keyframes: [{ percent: 0, value: '1' }, { percent: 50, value: '1.05' }, { percent: 100, value: '1' }] }
  },
  {
    label: 'Spin',
    config: { property: 'transform-rotate', duration: 1000, easing: 'linear', iterationCount: 'infinite', keyframes: [{ percent: 0, value: '0deg' }, { percent: 100, value: '360deg' }] }
  },
  {
    label: 'Shake',
    config: { property: 'transform-translate', duration: 600, easing: 'ease-in-out', keyframes: [{ percent: 0, value: '0, 0' }, { percent: 10, value: '-10px, 0' }, { percent: 30, value: '10px, 0' }, { percent: 50, value: '-8px, 0' }, { percent: 70, value: '8px, 0' }, { percent: 90, value: '-4px, 0' }, { percent: 100, value: '0, 0' }] }
  },
  {
    label: 'Heartbeat',
    config: { property: 'transform-scale', duration: 1400, easing: 'ease-in-out', iterationCount: 'infinite', keyframes: [{ percent: 0, value: '1' }, { percent: 14, value: '1.15' }, { percent: 28, value: '1' }, { percent: 42, value: '1.15' }, { percent: 70, value: '1' }, { percent: 100, value: '1' }] }
  },
  {
    label: 'Float',
    config: { property: 'transform-translate', duration: 3000, easing: 'ease-in-out', iterationCount: 'infinite', direction: 'alternate', keyframes: [{ percent: 0, value: '0, 0' }, { percent: 100, value: '0, -20px' }] }
  },
]
```

**UI Notes:**
- Live preview box: animated element (a styled square card) demonstrates the animation in real-time
- Keyframe editor: visual timeline with draggable stop markers, value input per stop
- Property selector dropdown with visual icons per property type
- Easing selector with Bézier curve editor for `cubic-bezier` mode (4 draggable handles)
- Duration, delay, iteration count, direction, fill-mode controls
- Preset gallery: click to apply and preview
- Output tabs: Shorthand CSS, Verbose CSS, Tailwind arbitrary values
- "Export as GSAP" toggle: outputs equivalent GSAP JS animation code for advanced users

---

### Tool 84: Icon Finder & Downloader
**Route:** `/tools/icon-finder`
**Library:** Iconify API (free, no API key required)
**Input:** Search query + icon set filter
**Output:** SVG icon download or copy

**How it works:** Iconify hosts 200,000+ open-source icons from 100+ icon sets. Their API is free with no authentication. Icons are fetched on-demand as SVG strings.

```typescript
// lib/processing/icon-finder.ts

export interface IconSearchResult {
  id: string         // e.g. "mdi:home" (setPrefix:iconName)
  setPrefix: string  // e.g. "mdi"
  setName: string    // e.g. "Material Design Icons"
  iconName: string   // e.g. "home"
  body: string       // SVG inner content (paths, circles, etc.)
  width: number
  height: number
}

export interface IconSet {
  prefix: string
  name: string
  total: number
  license: string
}

// Popular icon sets to show as filters
export const POPULAR_ICON_SETS: IconSet[] = [
  { prefix: 'mdi',          name: 'Material Design Icons', total: 7300,  license: 'Apache 2.0' },
  { prefix: 'heroicons',    name: 'Heroicons',             total: 292,   license: 'MIT' },
  { prefix: 'tabler',       name: 'Tabler Icons',          total: 4600,  license: 'MIT' },
  { prefix: 'lucide',       name: 'Lucide',                total: 1400,  license: 'ISC' },
  { prefix: 'ph',           name: 'Phosphor Icons',        total: 9072,  license: 'MIT' },
  { prefix: 'ri',           name: 'Remix Icon',            total: 2800,  license: 'Apache 2.0' },
  { prefix: 'carbon',       name: 'Carbon',                total: 2100,  license: 'Apache 2.0' },
  { prefix: 'bi',           name: 'Bootstrap Icons',       total: 2000,  license: 'MIT' },
  { prefix: 'fa6-solid',    name: 'Font Awesome Solid',    total: 1400,  license: 'CC BY 4.0' },
  { prefix: 'fluent',       name: 'Fluent UI Icons',       total: 3160,  license: 'MIT' },
  { prefix: 'solar',        name: 'Solar Icons',           total: 7500,  license: 'CC BY 4.0' },
  { prefix: 'ant-design',   name: 'Ant Design Icons',      total: 831,   license: 'MIT' },
]

// Search icons via Iconify API
export async function searchIcons(
  query: string,
  prefixes?: string[],
  limit: number = 64
): Promise<IconSearchResult[]> {
  const params = new URLSearchParams({
    query,
    limit: limit.toString(),
    ...(prefixes?.length ? { prefixes: prefixes.join(',') } : {}),
  })

  const response = await fetch(`https://api.iconify.design/search?${params}`)
  if (!response.ok) throw new Error(`Iconify API error: ${response.status}`)

  const data = await response.json() as {
    icons: string[]
    total: number
  }

  // Fetch SVG data for each result
  const results = await Promise.all(
    data.icons.slice(0, limit).map(async (iconId) => {
      const [prefix, ...nameParts] = iconId.split(':')
      const name = nameParts.join(':')
      return fetchIconSVG(prefix, name)
    })
  )

  return results.filter(Boolean) as IconSearchResult[]
}

export async function fetchIconSVG(
  prefix: string,
  iconName: string
): Promise<IconSearchResult | null> {
  try {
    const response = await fetch(`https://api.iconify.design/${prefix}/${iconName}.svg`)
    if (!response.ok) return null

    const svgString = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, 'image/svg+xml')
    const svg = doc.querySelector('svg')
    if (!svg) return null

    const setInfo = POPULAR_ICON_SETS.find(s => s.prefix === prefix)

    return {
      id: `${prefix}:${iconName}`,
      setPrefix: prefix,
      setName: setInfo?.name ?? prefix,
      iconName,
      body: svg.innerHTML,
      width: parseInt(svg.getAttribute('width') ?? '24'),
      height: parseInt(svg.getAttribute('height') ?? '24'),
    }
  } catch {
    return null
  }
}

// Generate downloadable SVG with custom size and colour
export function generateSVGDownload(
  icon: IconSearchResult,
  size: number,
  color: string
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${icon.width} ${icon.height}" fill="${color}">${icon.body}</svg>`
}

// Generate code snippets for popular frameworks
export function generateIconCode(icon: IconSearchResult, framework: 'react' | 'vue' | 'html' | 'iconify'): string {
  const [prefix, name] = icon.id.split(':')
  switch (framework) {
    case 'react':
      return `// npm install @iconify/react\nimport { Icon } from '@iconify/react'\n<Icon icon="${icon.id}" />`
    case 'vue':
      return `// npm install @iconify/vue\nimport { Icon } from '@iconify/vue'\n<Icon icon="${icon.id}" />`
    case 'html':
      return `<script src="https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js"></script>\n<iconify-icon icon="${icon.id}"></iconify-icon>`
    case 'iconify':
      return `${prefix}:${name}`
  }
}
```

**UI Notes:**
- Search bar at top (debounce 300ms, minimum 2 chars)
- Icon set filter: "All" selected by default, click to filter by set
- Results grid: 8×8 or more icons at 48×48px with icon name on hover
- Click icon to open detail panel:
  - Large preview (128×128px) with colour picker
  - Size input: 16, 20, 24, 32, 48, 64, 128, custom
  - Download as SVG button
  - Download as PNG button (convert SVG to canvas to PNG)
  - Copy SVG code button
  - Copy icon ID button (for Iconify framework usage)
  - Code snippet tabs: React, Vue, HTML, Iconify ID
  - Licence badge (MIT, Apache 2.0, etc.)
- "Favourites" — pin icons with a star, persisted in `localStorage`
- Infinite scroll or "Load more" (Iconify returns 64 results per query)

---

### Tool 85: Typography Scale Generator
**Route:** `/tools/type-scale`
**Library:** Pure JS (built-in)
**Input:** Base font size, scale ratio, number of steps
**Output:** Complete type scale as CSS custom properties

**Implementation:**

```typescript
// lib/processing/type-scale.ts

export type ScaleRatio =
  | 'minor-second'    // 1.067
  | 'major-second'    // 1.125
  | 'minor-third'     // 1.200
  | 'major-third'     // 1.250
  | 'perfect-fourth'  // 1.333
  | 'augmented-fourth'// 1.414
  | 'perfect-fifth'   // 1.500
  | 'golden-ratio'    // 1.618
  | 'major-sixth'     // 1.667
  | 'minor-seventh'   // 1.778
  | 'major-seventh'   // 1.875
  | 'octave'          // 2.000
  | 'custom'

export const SCALE_RATIOS: Record<Exclude<ScaleRatio, 'custom'>, number> = {
  'minor-second':     1.067,
  'major-second':     1.125,
  'minor-third':      1.200,
  'major-third':      1.250,
  'perfect-fourth':   1.333,
  'augmented-fourth': 1.414,
  'perfect-fifth':    1.500,
  'golden-ratio':     1.618,
  'major-sixth':      1.667,
  'minor-seventh':    1.778,
  'major-seventh':    1.875,
  'octave':           2.000,
}

export interface TypeScaleStep {
  label: string       // e.g. "2xl", "lg", "base", "sm"
  px: number
  rem: number
  em: number
  step: number        // 0 = base, positive = larger, negative = smaller
}

export interface TypeScaleConfig {
  baseSize: number          // px (typically 16)
  ratio: ScaleRatio
  customRatio?: number      // used when ratio === 'custom'
  stepsUp: number           // steps above base (e.g. 6)
  stepsDown: number         // steps below base (e.g. 2)
  unit: 'rem' | 'em' | 'px'
  precision: number         // decimal places (3 recommended)
}

const STEP_LABELS = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl']

export function generateTypeScale(config: TypeScaleConfig): TypeScaleStep[] {
  const ratio = config.ratio === 'custom'
    ? (config.customRatio ?? 1.333)
    : SCALE_RATIOS[config.ratio]

  const steps: TypeScaleStep[] = []
  const totalSteps = config.stepsDown + config.stepsUp + 1

  for (let i = -config.stepsDown; i <= config.stepsUp; i++) {
    const px = config.baseSize * Math.pow(ratio, i)
    const labelIndex = config.stepsDown + i
    const label = STEP_LABELS[Math.min(labelIndex, STEP_LABELS.length - 1)] ?? `step-${i}`

    steps.push({
      label,
      px: parseFloat(px.toFixed(config.precision)),
      rem: parseFloat((px / 16).toFixed(config.precision)),
      em: parseFloat((px / config.baseSize).toFixed(config.precision)),
      step: i,
    })
  }

  return steps
}

export function generateCSSVariables(steps: TypeScaleStep[], unit: 'rem' | 'em' | 'px'): string {
  const vars = steps.map(s => {
    const value = unit === 'rem' ? `${s.rem}rem` : unit === 'em' ? `${s.em}em` : `${s.px}px`
    return `  --font-size-${s.label}: ${value};`
  }).join('\n')
  return `:root {\n${vars}\n}`
}

export function generateTailwindConfig(steps: TypeScaleStep[]): string {
  const entries = steps.map(s => `    '${s.label}': '${s.rem}rem',`).join('\n')
  return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    fontSize: {\n${entries}\n    }\n  }\n}`
}

export function generateSCSSMap(steps: TypeScaleStep[], unit: 'rem' | 'em' | 'px'): string {
  const entries = steps.map(s => {
    const value = unit === 'rem' ? `${s.rem}rem` : unit === 'em' ? `${s.em}em` : `${s.px}px`
    return `  '${s.label}': ${value},`
  }).join('\n')
  return `$type-scale: (\n${entries}\n);\n\n// Usage: font-size: map-get($type-scale, 'lg');`
}
```

**UI Notes:**
- Base size input (default 16px)
- Ratio selector: named musical interval ratios with descriptions + custom numeric input
- Steps up / steps down sliders (0–8 each)
- Unit toggle: rem / em / px
- Live type scale preview: show each step as actual rendered text ("The quick brown fox...") so user sees the visual rhythm
- Multiple output tabs: CSS Variables, Tailwind config, SCSS map, plain JSON
- Copy buttons per output tab
- "Try on page" button: injects CSS variables into the current page for instant preview (uses content script)

---

### Tool 86: Palette from Image (Advanced)
**Route:** `/tools/palette-advanced`
**Library:** Canvas API + `chroma-js`
**Input:** Any image
**Output:** Extracted palette with dominant colours, named colours, analogous/complementary suggestions

**Note:** This replaces Tool 18 (basic palette extractor) with a more powerful version. Tool 18 remains live — this is a standalone advanced tool, not a replacement.

```typescript
// lib/processing/palette-advanced.ts
import chroma from 'chroma-js'

export interface AdvancedPaletteResult {
  dominant: string         // single most dominant colour hex
  palette: PaletteColor[]
  darkColors: PaletteColor[]
  lightColors: PaletteColor[]
  vibrantColors: PaletteColor[]
  mutedColors: PaletteColor[]
  colourTemperature: 'warm' | 'cool' | 'neutral'
}

export interface PaletteColor {
  hex: string
  rgb: [number, number, number]
  hsl: [number, number, number]
  population: number      // how many pixels this colour represents (%)
  name: string            // closest named colour approximation
  contrastWithWhite: number
  contrastWithBlack: number
  accessibleTextColor: 'black' | 'white'
}

export async function extractAdvancedPalette(
  file: File,
  swatchCount: number = 12
): Promise<AdvancedPaletteResult> {
  // Load image onto canvas
  const img = new Image()
  const url = URL.createObjectURL(file)
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Invalid image'))
    img.src = url
  })

  const canvas = document.createElement('canvas')
  const scale = Math.min(1, 200 / Math.max(img.naturalWidth, img.naturalHeight))
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(url)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data

  // Collect pixel colours (skip transparent pixels)
  const colorMap = new Map<string, number>()
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue  // skip transparent
    // Quantise to 6-bit colour (divide each channel by 4, multiply back)
    const r = Math.round(pixels[i] / 8) * 8
    const g = Math.round(pixels[i + 1] / 8) * 8
    const b = Math.round(pixels[i + 2] / 8) * 8
    const key = `${r},${g},${b}`
    colorMap.set(key, (colorMap.get(key) ?? 0) + 1)
  }

  const totalPixels = colorMap.size
  const sorted = [...colorMap.entries()].sort((a, b) => b[1] - a[1])

  // Use median-cut or k-means approximation (simple: take top N by frequency, ensure distinctness)
  const palette: PaletteColor[] = []
  for (const [key, count] of sorted) {
    if (palette.length >= swatchCount) break

    const [r, g, b] = key.split(',').map(Number)
    const c = chroma(r, g, b)
    const hex = c.hex()

    // Skip colours too similar to already-selected ones (minimum ΔE distance of 20)
    const tooSimilar = palette.some(existing => chroma.deltaE(chroma(existing.hex), c) < 20)
    if (tooSimilar) continue

    const [h, s, l] = c.hsl()
    palette.push({
      hex,
      rgb: [r, g, b],
      hsl: [Math.round(h || 0), Math.round(s * 100), Math.round(l * 100)],
      population: Math.round((count / totalPixels) * 100 * 10) / 10,
      name: findClosestColorName(hex),
      contrastWithWhite: chroma.contrast(c, 'white'),
      contrastWithBlack: chroma.contrast(c, 'black'),
      accessibleTextColor: c.luminance() > 0.179 ? 'black' : 'white',
    })
  }

  const dominant = palette[0]?.hex ?? '#000000'

  // Classify colours
  const darkColors  = palette.filter(c => c.hsl[2] < 35)
  const lightColors = palette.filter(c => c.hsl[2] > 65)
  const vibrantColors = palette.filter(c => c.hsl[1] > 60)
  const mutedColors   = palette.filter(c => c.hsl[1] < 30)

  // Colour temperature: average hue of vibrant colours
  const avgHue = palette.reduce((sum, c) => sum + c.hsl[0], 0) / palette.length
  const temperature: 'warm' | 'cool' | 'neutral' =
    avgHue < 60 || avgHue > 300 ? 'warm' : avgHue > 120 && avgHue < 260 ? 'cool' : 'neutral'

  return { dominant, palette, darkColors, lightColors, vibrantColors, mutedColors, colourTemperature: temperature }
}

function findClosestColorName(hex: string): string {
  // Uses a small curated map of 150 named colours
  // Returns the closest match by ΔE distance
  const NAMED = { 'Crimson': '#DC143C', 'Coral': '#FF7F50', 'Tomato': '#FF6347', 'Salmon': '#FA8072', 'OrangeRed': '#FF4500', 'DarkOrange': '#FF8C00', 'Orange': '#FFA500', 'Gold': '#FFD700', 'Yellow': '#FFFF00', 'Khaki': '#F0E68C', 'LawnGreen': '#7CFC00', 'LimeGreen': '#32CD32', 'ForestGreen': '#228B22', 'DarkGreen': '#006400', 'Teal': '#008080', 'CadetBlue': '#5F9EA0', 'SteelBlue': '#4682B4', 'DodgerBlue': '#1E90FF', 'DeepSkyBlue': '#00BFFF', 'Navy': '#000080', 'Indigo': '#4B0082', 'Purple': '#800080', 'DarkMagenta': '#8B008B', 'HotPink': '#FF69B4', 'DeepPink': '#FF1493', 'RosyBrown': '#BC8F8F', 'Sienna': '#A0522D', 'Brown': '#A52A2A', 'Maroon': '#800000', 'Black': '#000000', 'DimGray': '#696969', 'Gray': '#808080', 'Silver': '#C0C0C0', 'Gainsboro': '#DCDCDC', 'WhiteSmoke': '#F5F5F5', 'White': '#FFFFFF', 'Ivory': '#FFFFF0', 'LightYellow': '#FFFFE0', 'Linen': '#FAF0E6', 'MistyRose': '#FFE4E1', 'LavenderBlush': '#FFF0F5', 'Lavender': '#E6E6FA', 'Thistle': '#D8BFD8', 'Plum': '#DDA0DD', 'Violet': '#EE82EE', 'Orchid': '#DA70D6', 'Fuchsia': '#FF00FF', 'Magenta': '#FF00FF' }
  let closest = 'Custom'
  let minDist = Infinity
  const c = chroma(hex)
  for (const [name, namedHex] of Object.entries(NAMED)) {
    const dist = chroma.deltaE(c, chroma(namedHex))
    if (dist < minDist) { minDist = dist; closest = name }
  }
  return closest
}
```

**UI Notes:**
- Image upload with instant processing
- Main palette swatches (large, prominent)
- Classified sections: "Dominant", "Vibrant", "Muted", "Dark", "Light"
- Each swatch: click to copy HEX / RGB / HSL
- Colour temperature badge: "🔥 Warm palette" or "❄️ Cool palette"
- Export palette as: CSS variables, Tailwind config, Adobe ASE (JSON approximation), Figma paste-compatible JSON
- "Generate UI from palette" — shows a mock UI card using the dominant colours as background, text, and accent

---

### Tool 87: Hex/RGB/HSL Bulk Converter
**Route:** `/tools/color-bulk`
**Library:** `chroma-js`
**Input:** Multiple colour values (one per line, mixed formats)
**Output:** Converted values in all formats as a table

```typescript
// lib/processing/color-bulk.ts
import chroma from 'chroma-js'

export interface BulkColorResult {
  original: string
  hex: string | null
  rgb: string | null
  hsl: string | null
  hsv: string | null
  lab: string | null
  oklch: string | null
  cssName: string | null
  isValid: boolean
  error?: string
}

export function convertColorsInBulk(inputs: string[]): BulkColorResult[] {
  return inputs.map(raw => {
    const input = raw.trim()
    if (!input) return null

    try {
      const c = chroma(input)
      const [h, s, l] = c.hsl()
      const [hv, sv, v] = c.hsv()
      const [la, labA, labB] = c.lab()

      // oklch is not in older chroma-js — compute approximation from lab
      const L = Math.round(l * 100)
      const chroma_val = Math.sqrt(labA ** 2 + labB ** 2)
      const hue = ((Math.atan2(labB, labA) * 180 / Math.PI) + 360) % 360

      return {
        original: input,
        hex: c.hex(),
        rgb: `rgb(${c.rgb().map(Math.round).join(', ')})`,
        hsl: `hsl(${Math.round(h || 0)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
        hsv: `hsv(${Math.round(hv || 0)}, ${Math.round(sv * 100)}%, ${Math.round(v * 100)}%)`,
        lab: `lab(${Math.round(la)} ${Math.round(labA)} ${Math.round(labB)})`,
        oklch: `oklch(${(L / 100).toFixed(3)} ${(chroma_val / 100).toFixed(3)} ${Math.round(hue)})`,
        cssName: null,  // omit for performance in bulk mode
        isValid: true,
      }
    } catch {
      return {
        original: input,
        hex: null, rgb: null, hsl: null, hsv: null, lab: null, oklch: null, cssName: null,
        isValid: false,
        error: `Cannot parse "${input}" as a colour`,
      }
    }
  }).filter(Boolean) as BulkColorResult[]
}
```

**UI Notes:**
- Large textarea: paste any list of colours — HEX, `rgb()`, `hsl()`, CSS names, all mixed
- "Convert" button (or auto-convert after 500ms debounce)
- Results in a sortable table: Original | HEX | RGB | HSL | HSV | LAB | OKLCH
- Copy individual values (click cell to copy)
- "Copy column" button for each format column (copies all values of that format)
- Download as CSV
- Invalid entries shown in red with error message in the row
- Row count indicator: "Converted 47 colours, 2 invalid"
- Input presets: "Paste Figma variables", "Paste CSS file colours" (extracts colour values from pasted CSS text)

---

### Tool 88: Gradient Mesh Generator
**Route:** `/tools/gradient-mesh`
**Library:** Canvas API + WebGL (built-in)
**Input:** Control point colours via UI
**Output:** Mesh gradient image (PNG export)

**How it works:** A gradient mesh creates smooth colour transitions through a grid of control points. This is implemented using bilinear interpolation on the Canvas API — a WebGL fallback uses `gl.TRIANGLE_STRIP` for GPU-accelerated rendering on larger canvases.

```typescript
// lib/processing/gradient-mesh.ts

export interface MeshPoint {
  x: number   // 0–1 normalised
  y: number   // 0–1 normalised
  color: string  // hex
}

// Bilinear interpolation between 4 corner colours at position (tx, ty)
function bilinearInterp(
  c00: [number, number, number], c10: [number, number, number],
  c01: [number, number, number], c11: [number, number, number],
  tx: number, ty: number
): [number, number, number] {
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const r = lerp(lerp(c00[0], c10[0], tx), lerp(c01[0], c11[0], tx), ty)
  const g = lerp(lerp(c00[1], c10[1], tx), lerp(c01[1], c11[1], tx), ty)
  const b = lerp(lerp(c00[2], c10[2], tx), lerp(c01[2], c11[2], tx), ty)
  return [r, g, b]
}

export function renderMeshGradient(
  canvas: HTMLCanvasElement,
  meshPoints: MeshPoint[][],   // 2D array [row][col] of control points
): void {
  const ctx = canvas.getContext('2d')!
  const { width, height } = canvas
  const imageData = ctx.createImageData(width, height)

  const rows = meshPoints.length
  const cols = meshPoints[0].length

  // For each pixel, find which mesh cell it's in and bilinearly interpolate
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const nx = px / width   // normalised x
      const ny = py / height  // normalised y

      // Find the mesh cell
      const cellCol = Math.min(Math.floor(nx * (cols - 1)), cols - 2)
      const cellRow = Math.min(Math.floor(ny * (rows - 1)), rows - 2)

      // Local t values within the cell
      const tx = (nx * (cols - 1)) - cellCol
      const ty = (ny * (rows - 1)) - cellRow

      // Get 4 corner colours
      const parseColor = (hex: string): [number, number, number] => {
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        return [r, g, b]
      }

      const c00 = parseColor(meshPoints[cellRow][cellCol].color)
      const c10 = parseColor(meshPoints[cellRow][cellCol + 1].color)
      const c01 = parseColor(meshPoints[cellRow + 1][cellCol].color)
      const c11 = parseColor(meshPoints[cellRow + 1][cellCol + 1].color)

      const [r, g, b] = bilinearInterp(c00, c10, c01, c11, tx, ty)

      const idx = (py * width + px) * 4
      imageData.data[idx]     = Math.round(r)
      imageData.data[idx + 1] = Math.round(g)
      imageData.data[idx + 2] = Math.round(b)
      imageData.data[idx + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

// Generate random aesthetically pleasing mesh
export function randomMesh(rows: number, cols: number): MeshPoint[][] {
  // Use analogous colour scheme for pleasing results
  const baseHue = Math.random() * 360
  const hues = Array.from({ length: rows * cols }, (_, i) =>
    (baseHue + i * (120 / (rows * cols))) % 360
  )

  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const hue = hues[r * cols + c]
      const sat = 60 + Math.random() * 30
      const lit = 40 + Math.random() * 30
      const chroma = require('chroma-js')
      return {
        x: c / (cols - 1),
        y: r / (rows - 1),
        color: chroma.hsl(hue, sat / 100, lit / 100).hex(),
      }
    })
  )
}
```

**UI Notes:**
- Canvas: 600×600px preview
- Mesh size selector: 2×2, 3×3, 4×4, 5×5 control points
- Each intersection: a colour swatch that opens a colour picker on click
- "Randomise" button: generates a new random harmonious mesh
- "Add noise" slider: adds Perlin-like variation to smooth gradients
- Export: PNG at 1×, 2×, 4× resolution
- CSS approximation output: shows the nearest achievable `background: radial-gradient(...)` multi-gradient stack (acknowledges it's an approximation)

---

### Tool 89: SVG Path Visualiser
**Route:** `/tools/svg-path`
**Library:** Pure JS + SVG (built-in)
**Input:** SVG `d` attribute path string
**Output:** Visual diagram of the path with annotated commands

```typescript
// lib/processing/svg-path.ts

export type SVGCommand = {
  type: string           // M, L, C, Q, A, Z, H, V etc.
  isRelative: boolean    // lowercase = relative
  args: number[]
  description: string    // human-readable
  startPoint: { x: number; y: number }
  endPoint: { x: number; y: number }
}

export function parseSVGPath(d: string): { commands: SVGCommand[]; error?: string } {
  const commands: SVGCommand[] = []
  // Tokenise the path data string
  const tokenRegex = /([MmLlHhVvCcSsQqTtAaZz])|(-?[0-9]*\.?[0-9]+(?:e[-+]?[0-9]+)?)/gi
  const tokens: string[] = []
  let match: RegExpExecArray | null
  while ((match = tokenRegex.exec(d)) !== null) {
    tokens.push(match[0])
  }

  let i = 0
  let currentX = 0, currentY = 0
  let currentCommand = ''

  const readNum = (): number => parseFloat(tokens[i++] ?? '0')

  while (i < tokens.length) {
    const token = tokens[i]
    if (/[MmLlHhVvCcSsQqTtAaZz]/.test(token)) {
      currentCommand = token
      i++
    }

    const type = currentCommand.toUpperCase()
    const isRelative = currentCommand === currentCommand.toLowerCase() && type !== 'Z'
    const startX = currentX, startY = currentY

    try {
      switch (type) {
        case 'M': {
          const x = readNum(), y = readNum()
          currentX = isRelative ? currentX + x : x
          currentY = isRelative ? currentY + y : y
          commands.push({ type, isRelative, args: [x, y], description: `Move to (${currentX.toFixed(1)}, ${currentY.toFixed(1)})`, startPoint: { x: startX, y: startY }, endPoint: { x: currentX, y: currentY } })
          break
        }
        case 'L': {
          const x = readNum(), y = readNum()
          const ex = isRelative ? currentX + x : x
          const ey = isRelative ? currentY + y : y
          commands.push({ type, isRelative, args: [x, y], description: `Line to (${ex.toFixed(1)}, ${ey.toFixed(1)})`, startPoint: { x: startX, y: startY }, endPoint: { x: ex, y: ey } })
          currentX = ex; currentY = ey
          break
        }
        case 'H': {
          const x = readNum()
          const ex = isRelative ? currentX + x : x
          commands.push({ type, isRelative, args: [x], description: `Horizontal line to x=${ex.toFixed(1)}`, startPoint: { x: startX, y: startY }, endPoint: { x: ex, y: currentY } })
          currentX = ex
          break
        }
        case 'V': {
          const y = readNum()
          const ey = isRelative ? currentY + y : y
          commands.push({ type, isRelative, args: [y], description: `Vertical line to y=${ey.toFixed(1)}`, startPoint: { x: startX, y: startY }, endPoint: { x: currentX, y: ey } })
          currentY = ey
          break
        }
        case 'C': {
          const x1 = readNum(), y1 = readNum(), x2 = readNum(), y2 = readNum(), x = readNum(), y = readNum()
          const ex = isRelative ? currentX + x : x
          const ey = isRelative ? currentY + y : y
          commands.push({ type, isRelative, args: [x1, y1, x2, y2, x, y], description: `Cubic Bézier to (${ex.toFixed(1)}, ${ey.toFixed(1)})`, startPoint: { x: startX, y: startY }, endPoint: { x: ex, y: ey } })
          currentX = ex; currentY = ey
          break
        }
        case 'Z': {
          commands.push({ type: 'Z', isRelative: false, args: [], description: 'Close path', startPoint: { x: startX, y: startY }, endPoint: { x: startX, y: startY } })
          break
        }
        default:
          i++  // skip unknown tokens
      }
    } catch {
      return { commands, error: `Parse error near token index ${i}` }
    }
  }

  return { commands }
}
```

**UI Notes:**
- Large textarea for `d` attribute input
- SVG preview canvas below with:
  - Path rendered in accent colour
  - Control points shown as coloured dots (M = blue, C handles = grey dashed, endpoints = green)
  - Numbered command labels along the path
- Command list on the right: each command shown as a colour-coded chip with its description
- Click any command in the list to highlight it on the canvas
- Conversion tools: "Convert to absolute coordinates", "Normalise to viewBox", "Simplify (remove redundant commands)"
- Editable: modify the `d` string and see live updates

---

### Tool 90: CSS Grid Generator
**Route:** `/tools/css-grid`
**Library:** Pure JS (built-in)
**Input:** Grid configuration controls
**Output:** CSS Grid property strings + visual preview

```typescript
// lib/processing/css-grid.ts

export interface GridConfig {
  columns: string[]     // e.g. ['1fr', '2fr', '1fr'] or ['repeat(3, 1fr)']
  rows: string[]        // e.g. ['auto', '200px', '1fr']
  columnGap: number     // px
  rowGap: number        // px
  justifyItems: 'start' | 'end' | 'center' | 'stretch'
  alignItems: 'start' | 'end' | 'center' | 'stretch'
  justifyContent: 'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly'
  alignContent: 'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly'
  namedAreas?: string[][] // grid-template-areas
}

export interface GridItemPlacement {
  id: string
  name: string
  columnStart: number | 'auto'
  columnEnd: number | 'auto'
  rowStart: number | 'auto'
  rowEnd: number | 'auto'
  color: string
}

export function generateGridCSS(config: GridConfig, items: GridItemPlacement[]): {
  containerCSS: string
  itemsCSS: string
  fullCSS: string
  namedAreasString?: string
} {
  const colTemplate = config.columns.join(' ')
  const rowTemplate = config.rows.join(' ')

  const areasString = config.namedAreas
    ? config.namedAreas.map(row => `"${row.join(' ')}"`).join('\n  ')
    : undefined

  const containerLines = [
    'display: grid;',
    `grid-template-columns: ${colTemplate};`,
    `grid-template-rows: ${rowTemplate};`,
    `gap: ${config.rowGap}px ${config.columnGap}px;`,
    config.justifyItems !== 'stretch' ? `justify-items: ${config.justifyItems};` : null,
    config.alignItems !== 'stretch' ? `align-items: ${config.alignItems};` : null,
    config.justifyContent !== 'start' ? `justify-content: ${config.justifyContent};` : null,
    config.alignContent !== 'start' ? `align-content: ${config.alignContent};` : null,
    areasString ? `grid-template-areas:\n  ${areasString};` : null,
  ].filter(Boolean).join('\n  ')

  const containerCSS = `.container {\n  ${containerLines}\n}`

  const itemsCSS = items.map(item => {
    const lines = [
      item.columnStart !== 'auto' ? `grid-column-start: ${item.columnStart};` : null,
      item.columnEnd !== 'auto' ? `grid-column-end: ${item.columnEnd};` : null,
      item.rowStart !== 'auto' ? `grid-row-start: ${item.rowStart};` : null,
      item.rowEnd !== 'auto' ? `grid-row-end: ${item.rowEnd};` : null,
    ].filter(Boolean).join('\n    ')
    return lines ? `.${item.name} {\n    ${lines}\n  }` : null
  }).filter(Boolean).join('\n\n  ')

  return {
    containerCSS,
    itemsCSS,
    fullCSS: `${containerCSS}${itemsCSS ? '\n\n' + itemsCSS : ''}`,
    namedAreasString: areasString,
  }
}
```

**UI Notes:**
- Interactive visual grid canvas: click cells to create/resize/move items
- Column/row track controls: add, remove, edit track sizes (fr, px, auto, minmax, repeat)
- Gap controls (column gap, row gap)
- Alignment controls: justify-items, align-items, justify-content, align-content
- Named areas mode: type area names directly in grid cells (generates `grid-template-areas`)
- Per-item placement: drag items to span multiple cells
- Output: CSS for container + all items
- Responsive preview: toggle between desktop/tablet/mobile widths

---

### Tool 91: Responsive Breakpoint Tester
**Route:** `/tools/breakpoint-tester`
**Backend:** Cloudflare Worker + Puppeteer (Browser Rendering — same setup as Tool 79)
**Input:** Any public URL
**Output:** Screenshots at standard breakpoints side by side

```typescript
// cloudflare-workers/breakpoint-tester.ts
import puppeteer from '@cloudflare/puppeteer'

export const BREAKPOINTS = [
  { name: 'Mobile S',  width: 320,  height: 568  },
  { name: 'Mobile M',  width: 375,  height: 667  },
  { name: 'Mobile L',  width: 425,  height: 812  },
  { name: 'Tablet',    width: 768,  height: 1024 },
  { name: 'Laptop',    width: 1024, height: 768  },
  { name: 'Desktop',   width: 1440, height: 900  },
  { name: '4K',        width: 2560, height: 1440 },
]

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const targetURL = url.searchParams.get('url')
    const breakpointName = url.searchParams.get('breakpoint') ?? 'Desktop'

    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://tools.shreyannarula.com',
      'Content-Type': 'image/png',
    }

    if (!targetURL) {
      return new Response(JSON.stringify({ error: 'url required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    try {
      new URL(targetURL)  // validate
      const bp = BREAKPOINTS.find(b => b.name === breakpointName) ?? BREAKPOINTS[5]

      const browser = await puppeteer.launch(env.BROWSER)
      const page = await browser.newPage()
      await page.setViewport({ width: bp.width, height: bp.height, deviceScaleFactor: 2 })
      await page.goto(targetURL, { waitUntil: 'networkidle2', timeout: 15000 })
      await page.evaluateHandle('document.fonts.ready')

      const screenshot = await page.screenshot({ type: 'png', fullPage: false })
      await browser.close()

      return new Response(screenshot as Buffer, {
        headers: { ...corsHeaders, 'Cache-Control': 'public, max-age=120' }
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error).message }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }
}
```

**UI Notes:**
- URL input + "Test" button
- Show all 7 breakpoints loading in parallel (skeleton loaders while screenshots arrive)
- Each breakpoint panel: screenshot + device name + width label
- Click any panel to expand to full size
- Toggle: viewport screenshot vs full-page scroll
- Download all as ZIP (7 PNGs)
- Note: screenshots taken sequentially to avoid overwhelming Puppeteer

---

### Tool 92: HTML to Markdown
**Route:** `/tools/html-to-markdown`
**Library:** `turndown`
**Input:** HTML string or paste/upload `.html` file
**Output:** Markdown string

```typescript
// lib/processing/html-to-markdown.ts
import TurndownService from 'turndown'

export interface HTMLToMarkdownOptions {
  headingStyle: 'atx' | 'setext'       // # Heading vs Heading\n======
  horizontalRule: '***' | '---' | '___'
  bulletListMarker: '-' | '*' | '+'
  codeBlockStyle: 'indented' | 'fenced'
  fence: '```' | '~~~'
  emDelimiter: '_' | '*'
  strongDelimiter: '**' | '__'
  linkStyle: 'inlined' | 'referenced'
  linkReferenceStyle: 'full' | 'collapsed' | 'shortcut'
  preformattedCode: boolean              // keep <code> blocks pre-formatted
}

export function convertHTMLToMarkdown(
  html: string,
  options: Partial<HTMLToMarkdownOptions> = {}
): { markdown: string; error?: string } {
  try {
    const td = new TurndownService({
      headingStyle: options.headingStyle ?? 'atx',
      hr: options.horizontalRule ?? '---',
      bulletListMarker: options.bulletListMarker ?? '-',
      codeBlockStyle: options.codeBlockStyle ?? 'fenced',
      fence: options.fence ?? '```',
      emDelimiter: options.emDelimiter ?? '_',
      strongDelimiter: options.strongDelimiter ?? '**',
      linkStyle: options.linkStyle ?? 'inlined',
      linkReferenceStyle: options.linkReferenceStyle ?? 'full',
      preformattedCode: options.preformattedCode ?? true,
    })

    // Custom rule: convert <figure><img><figcaption> to Markdown image with alt
    td.addRule('figure', {
      filter: 'figure',
      replacement(content: string, node: Node): string {
        const img = (node as Element).querySelector('img')
        const caption = (node as Element).querySelector('figcaption')
        if (img) {
          const src = img.getAttribute('src') ?? ''
          const alt = img.getAttribute('alt') ?? caption?.textContent ?? ''
          return `\n![${alt}](${src})\n`
        }
        return content
      }
    })

    // Custom rule: strip script and style tags entirely
    td.addRule('strip-scripts', {
      filter: ['script', 'style', 'noscript'],
      replacement: () => ''
    })

    // Custom rule: convert <del> to ~~strikethrough~~
    td.addRule('strikethrough', {
      filter: ['del', 's', 'strike'],
      replacement: (content: string) => `~~${content}~~`
    })

    const markdown = td.turndown(html)
    return { markdown }
  } catch (e) {
    return { markdown: '', error: (e as Error).message }
  }
}
```

**UI Notes:**
- Two-pane editor: HTML input left, Markdown output right
- Options panel: heading style, bullet marker, code block style, link style
- "Clean HTML first" toggle: strips `class`, `id`, `style` attributes before converting (reduces noise)
- File upload: accept `.html` files
- Paste from clipboard button
- Copy Markdown + Download `.md` buttons
- Live conversion as user types (debounce 300ms)
- Line count and word count of output

---

### Tool 93: YAML ↔ JSON Converter
**Route:** `/tools/yaml-json`
**Library:** `js-yaml`
**Input:** YAML string or JSON string
**Output:** Converted string in the other format

```typescript
// lib/processing/yaml-json.ts
import * as yaml from 'js-yaml'

export function yamlToJSON(yamlString: string): { result: string; error?: string } {
  try {
    const parsed = yaml.load(yamlString)
    return { result: JSON.stringify(parsed, null, 2) }
  } catch (e) {
    return { result: '', error: (e as Error).message }
  }
}

export function jsonToYAML(jsonString: string, options?: { indent: number; lineWidth: number }): { result: string; error?: string } {
  try {
    const parsed = JSON.parse(jsonString)
    const yamlStr = yaml.dump(parsed, {
      indent: options?.indent ?? 2,
      lineWidth: options?.lineWidth ?? 80,
      noRefs: true,
      sortKeys: false,
    })
    return { result: yamlStr }
  } catch (e) {
    return { result: '', error: (e as Error).message }
  }
}

export function detectFormat(input: string): 'yaml' | 'json' | 'unknown' {
  const trimmed = input.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json'
  if (trimmed.includes(': ') || trimmed.includes(':\n') || trimmed.startsWith('- ')) return 'yaml'
  return 'unknown'
}
```

**UI Notes:**
- Auto-detect format on paste — set input label accordingly
- Swap button: flip input and output
- Two syntax-highlighted editors (use `@uiw/react-codemirror` — already used for JSON formatter)
- YAML indent size selector: 2 or 4 spaces
- Common use case note: "Perfect for converting GitHub Actions YAML to JSON or vice versa"
- Copy output + Download buttons

---

### Tool 94: XML Formatter & Validator
**Route:** `/tools/xml-formatter`
**Library:** Built-in `DOMParser` + `XMLSerializer` (browser built-in, zero cost)
**Input:** XML string or `.xml` file upload
**Output:** Formatted XML string

```typescript
// lib/processing/xml-formatter.ts

export function formatXML(xmlString: string, indentSize: number = 2): { result: string; isValid: boolean; error?: string } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')

  // Check for parse errors
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    return {
      result: '',
      isValid: false,
      error: parseError.textContent?.split('\n')[0] ?? 'Invalid XML',
    }
  }

  // Serialise with indentation
  const indent = ' '.repeat(indentSize)
  const result = formatNode(doc.documentElement, 0, indent)

  return { result: `<?xml version="1.0" encoding="UTF-8"?>\n${result}`, isValid: true }
}

function formatNode(node: Element, depth: number, indent: string): string {
  const prefix = indent.repeat(depth)
  const tagName = node.tagName
  const attrs = Array.from(node.attributes)
    .map(a => ` ${a.name}="${a.value.replace(/"/g, '&quot;')}"`)
    .join('')

  const children = Array.from(node.childNodes)
  const elementChildren = children.filter(c => c.nodeType === Node.ELEMENT_NODE) as Element[]
  const textContent = children
    .filter(c => c.nodeType === Node.TEXT_NODE)
    .map(c => c.textContent?.trim())
    .filter(Boolean)
    .join('')

  if (elementChildren.length === 0 && !textContent) {
    return `${prefix}<${tagName}${attrs}/>`
  }

  if (elementChildren.length === 0 && textContent) {
    return `${prefix}<${tagName}${attrs}>${textContent}</${tagName}>`
  }

  const childrenStr = elementChildren
    .map(child => formatNode(child, depth + 1, indent))
    .join('\n')

  return `${prefix}<${tagName}${attrs}>\n${childrenStr}\n${prefix}</${tagName}>`
}

export function minifyXML(xmlString: string): { result: string; error?: string } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')
  const parseError = doc.querySelector('parsererror')
  if (parseError) return { result: '', error: parseError.textContent ?? 'Invalid XML' }

  const serialiser = new XMLSerializer()
  return { result: serialiser.serializeToString(doc).replace(/>\s+</g, '><').trim() }
}
```

**UI Notes:**
- Two modes: "Format" (beautify) and "Minify"
- Indent size selector: 2 or 4 spaces
- Validation result: green "✓ Valid XML" or red "✗ Invalid" with error line number
- Syntax-highlighted output using `@uiw/react-codemirror` in XML mode
- Copy + Download `.xml` buttons
- File upload for `.xml` files
- XPath query input: test XPath expressions against the document and see matching nodes highlighted

---

### Tool 95: TOML ↔ JSON Converter
**Route:** `/tools/toml-json`
**Library:** `@iarna/toml`
**Input:** TOML string or JSON string
**Output:** Converted string

```typescript
// lib/processing/toml-json.ts
import TOML from '@iarna/toml'

export function tomlToJSON(tomlString: string): { result: string; error?: string } {
  try {
    const parsed = TOML.parse(tomlString)
    return { result: JSON.stringify(parsed, null, 2) }
  } catch (e) {
    return { result: '', error: (e as Error).message }
  }
}

export function jsonToTOML(jsonString: string): { result: string; error?: string } {
  try {
    const parsed = JSON.parse(jsonString)
    return { result: TOML.stringify(parsed as any) }
  } catch (e) {
    return { result: '', error: (e as Error).message }
  }
}
```

**UI Notes:**
- Two-pane layout (same pattern as Tool 93)
- Auto-detect format from input
- Swap button
- Common use-case note: "Great for working with Rust (Cargo.toml), Hugo, Python (pyproject.toml)"
- Error display inline with line number when TOML parse fails

---

### Tool 96: SQL Formatter
**Route:** `/tools/sql-formatter`
**Library:** `sql-formatter`
**Input:** Unformatted SQL string
**Output:** Beautifully formatted SQL

```typescript
// lib/processing/sql-formatter.ts
import { format, SqlLanguage } from 'sql-formatter'

export type SQLDialect =
  | 'sql'            // Standard SQL
  | 'mysql'
  | 'postgresql'
  | 'sqlite'
  | 'bigquery'
  | 'mariadb'
  | 'db2'
  | 'redshift'
  | 'spark'
  | 'hive'
  | 'n1ql'           // Couchbase N1QL
  | 'plsql'          // Oracle PL/SQL
  | 'tsql'           // T-SQL (SQL Server)

export interface SQLFormatOptions {
  dialect: SQLDialect
  indentStyle: 'standard' | 'tabularLeft' | 'tabularRight'
  tabWidth: number
  useTabs: boolean
  keywordCase: 'upper' | 'lower' | 'preserve'
  identifierCase: 'upper' | 'lower' | 'preserve'
  linesBetweenQueries: number  // blank lines between separate SQL statements
  denseOperators: boolean      // e.g. a=b vs a = b
  newlineBeforeSemicolon: boolean
}

export function formatSQL(
  sql: string,
  options: Partial<SQLFormatOptions> = {}
): { result: string; error?: string } {
  try {
    const formatted = format(sql, {
      language: (options.dialect ?? 'sql') as SqlLanguage,
      tabWidth: options.tabWidth ?? 2,
      useTabs: options.useTabs ?? false,
      keywordCase: options.keywordCase ?? 'upper',
      identifierCase: options.identifierCase ?? 'preserve',
      linesBetweenQueries: options.linesBetweenQueries ?? 1,
      denseOperators: options.denseOperators ?? false,
      newlineBeforeSemicolon: options.newlineBeforeSemicolon ?? false,
      indentStyle: options.indentStyle ?? 'standard',
    })
    return { result: formatted }
  } catch (e) {
    return { result: sql, error: (e as Error).message }
  }
}

// Extract table names and column names from SQL for quick reference
export function extractSQLEntities(sql: string): { tables: string[]; columns: string[] } {
  const tableRegex = /\bFROM\b\s+(\w+)|\bJOIN\b\s+(\w+)|\bINTO\b\s+(\w+)|\bUPDATE\b\s+(\w+)/gi
  const tables: string[] = []
  let match: RegExpExecArray | null
  while ((match = tableRegex.exec(sql)) !== null) {
    const name = match[1] ?? match[2] ?? match[3] ?? match[4]
    if (name && !tables.includes(name.toLowerCase())) tables.push(name.toLowerCase())
  }

  const columnRegex = /SELECT\s+([\s\S]+?)\s+FROM/i
  const colMatch = sql.match(columnRegex)
  const columns = colMatch
    ? colMatch[1].split(',').map(c => c.trim().split(/\s+as\s+/i).pop()!.trim().replace(/["`]/g, '')).filter(c => c !== '*')
    : []

  return { tables, columns }
}
```

**UI Notes:**
- Large code editor with SQL syntax highlighting
- Dialect selector: Standard SQL, MySQL, PostgreSQL, SQLite, BigQuery, T-SQL, PL/SQL, Spark
- Options panel: keyword case, identifier case, indent style, tab width
- Format button + keyboard shortcut `Shift+Alt+F`
- "Minify SQL" button (collapses to single line)
- Entities panel: extracted table names and column names shown as chips
- Copy + Download `.sql` buttons

---

### Tool 97: GraphQL Schema Formatter
**Route:** `/tools/graphql-formatter`
**Library:** `graphql` (browser build)
**Input:** GraphQL schema (SDL) or query string
**Output:** Formatted and validated SDL/query

```typescript
// lib/processing/graphql-formatter.ts
import { parse, print, validate, buildSchema, GraphQLSchema } from 'graphql'

export type GraphQLInputType = 'schema' | 'query'

export function formatGraphQL(
  input: string,
  type: GraphQLInputType,
  schema?: string  // optional schema for query validation
): { result: string; isValid: boolean; errors: string[] } {
  try {
    const ast = parse(input)
    const formatted = print(ast)  // print() re-serialises with consistent formatting

    if (type === 'query' && schema) {
      try {
        const builtSchema: GraphQLSchema = buildSchema(schema)
        const validationErrors = validate(builtSchema, ast)
        if (validationErrors.length > 0) {
          return {
            result: formatted,
            isValid: false,
            errors: validationErrors.map(e => e.message),
          }
        }
      } catch (schemaError) {
        // Schema itself invalid — still return formatted query, just skip validation
      }
    }

    return { result: formatted, isValid: true, errors: [] }
  } catch (e) {
    return { result: '', isValid: false, errors: [(e as Error).message] }
  }
}

// Extract type names and field names for reference
export function extractSchemaInfo(schemaString: string): {
  types: string[]
  queries: string[]
  mutations: string[]
  subscriptions: string[]
} {
  try {
    const schema = buildSchema(schemaString)
    const typeMap = schema.getTypeMap()
    const types = Object.keys(typeMap).filter(t => !t.startsWith('__'))

    const queryType = schema.getQueryType()
    const mutationType = schema.getMutationType()
    const subType = schema.getSubscriptionType()

    return {
      types,
      queries: queryType ? Object.keys(queryType.getFields()) : [],
      mutations: mutationType ? Object.keys(mutationType.getFields()) : [],
      subscriptions: subType ? Object.keys(subType.getFields()) : [],
    }
  } catch {
    return { types: [], queries: [], mutations: [], subscriptions: [] }
  }
}
```

**UI Notes:**
- Two tabs: "Schema (SDL)" and "Query / Mutation"
- GraphQL syntax-highlighted editor
- Validation badge: "✓ Valid Schema" or "✗ 3 errors"
- Error list below editor with line numbers
- Schema + Query mode: paste schema in one tab, query in another — validates query against schema
- Schema explorer panel: shows extracted types, queries, mutations as an expandable tree
- Copy formatted + Download `.graphql` buttons

---

### Tool 98: Environment Variable Parser
**Route:** `/tools/env-parser`
**Library:** None — pure JS
**Input:** `.env` file content (paste or upload)
**Output:** Parsed key-value table + export formats

```typescript
// lib/processing/env-parser.ts

export interface EnvEntry {
  key: string
  value: string
  comment?: string
  lineNumber: number
  isEmpty: boolean
  isComment: boolean
  hasQuotes: boolean
  quoteType?: 'single' | 'double'
}

export function parseEnvFile(content: string): EnvEntry[] {
  const lines = content.split('\n')
  return lines.map((line, i) => {
    const trimmed = line.trim()

    // Empty line
    if (!trimmed) {
      return { key: '', value: '', lineNumber: i + 1, isEmpty: true, isComment: false, hasQuotes: false }
    }

    // Comment line
    if (trimmed.startsWith('#')) {
      return { key: '', value: trimmed.slice(1).trim(), lineNumber: i + 1, isEmpty: false, isComment: true, hasQuotes: false }
    }

    // Key=value line
    const equalsIndex = trimmed.indexOf('=')
    if (equalsIndex === -1) {
      return { key: trimmed, value: '', lineNumber: i + 1, isEmpty: false, isComment: false, hasQuotes: false }
    }

    const key = trimmed.slice(0, equalsIndex).trim()
    let rawValue = trimmed.slice(equalsIndex + 1)

    // Extract inline comment (after unquoted #)
    let comment: string | undefined
    let hasQuotes = false
    let quoteType: 'single' | 'double' | undefined

    // Handle quoted values
    if (rawValue.startsWith('"') || rawValue.startsWith("'")) {
      quoteType = rawValue.startsWith('"') ? 'double' : 'single'
      const closeQuote = rawValue.indexOf(rawValue[0], 1)
      const value = closeQuote > -1 ? rawValue.slice(1, closeQuote) : rawValue.slice(1)
      const afterQuote = closeQuote > -1 ? rawValue.slice(closeQuote + 1).trim() : ''
      if (afterQuote.startsWith('#')) comment = afterQuote.slice(1).trim()
      return { key, value, comment, lineNumber: i + 1, isEmpty: false, isComment: false, hasQuotes: true, quoteType }
    }

    // Unquoted value — extract inline comment
    const commentIdx = rawValue.indexOf(' #')
    if (commentIdx > -1) {
      comment = rawValue.slice(commentIdx + 2).trim()
      rawValue = rawValue.slice(0, commentIdx).trim()
    }

    return { key, value: rawValue.trim(), comment, lineNumber: i + 1, isEmpty: false, isComment: false, hasQuotes: false }
  })
}

export function entriesToExport(entries: EnvEntry[], format: 'json' | 'yaml' | 'shell' | 'docker'): string {
  const kvPairs = entries.filter(e => !e.isEmpty && !e.isComment && e.key)
  switch (format) {
    case 'json':
      return JSON.stringify(Object.fromEntries(kvPairs.map(e => [e.key, e.value])), null, 2)
    case 'yaml':
      return kvPairs.map(e => `${e.key}: "${e.value.replace(/"/g, '\\"')}"`).join('\n')
    case 'shell':
      return kvPairs.map(e => `export ${e.key}="${e.value.replace(/"/g, '\\"')}"`).join('\n')
    case 'docker':
      return kvPairs.map(e => `-e ${e.key}="${e.value.replace(/"/g, '\\"')}"`).join(' \\\n  ')
  }
}
```

**UI Notes:**
- Large textarea for paste OR file upload for `.env`, `.env.local`, `.env.production`
- Parsed table: line # | key | value (masked by default) | comment
- "Reveal values" toggle: shows/hides actual values (useful for sharing screenshots)
- Search/filter rows by key name
- Export as: JSON, YAML, shell export commands, Docker `-e` flags
- Validation: flag duplicate keys, empty keys, keys with spaces (invalid), suspiciously short secrets
- "Generate .env.example" button: replaces all values with placeholder comments (safe to commit)

---

### Tool 99: HTTP Status Code Reference
**Route:** `/tools/http-status`
**Library:** None — static data (no network, no library)
**Input:** Search or browse by code number or category
**Output:** Status code definition, description, use cases, cURL examples

This is a pure static reference tool. All data is hardcoded in the source file.

```typescript
// lib/data/http-status-codes.ts

export interface HTTPStatusCode {
  code: number
  phrase: string              // "Not Found"
  category: '1xx' | '2xx' | '3xx' | '4xx' | '5xx'
  categoryName: string        // "Client Error"
  rfc: string                 // "RFC 7231"
  description: string         // detailed explanation
  useCase: string             // when to use this code
  cacheability: 'cacheable' | 'not-cacheable' | 'conditional'
  retryable: boolean
  commonIn: string[]          // frameworks/contexts where this is commonly seen
  example?: string            // brief request/response example
}

export const HTTP_STATUS_CODES: HTTPStatusCode[] = [
  // 1xx Informational
  { code: 100, phrase: 'Continue', category: '1xx', categoryName: 'Informational', rfc: 'RFC 7231', description: 'The server has received the request headers and the client should proceed to send the request body.', useCase: 'Used with the Expect: 100-continue header before sending a large request body.', cacheability: 'not-cacheable', retryable: false, commonIn: ['File uploads', 'Large POST requests'] },
  { code: 101, phrase: 'Switching Protocols', category: '1xx', categoryName: 'Informational', rfc: 'RFC 7231', description: 'The server is switching protocols as requested by the client.', useCase: 'WebSocket upgrades from HTTP/1.1.', cacheability: 'not-cacheable', retryable: false, commonIn: ['WebSockets', 'HTTP/2 upgrades'] },

  // 2xx Success
  { code: 200, phrase: 'OK', category: '2xx', categoryName: 'Success', rfc: 'RFC 7231', description: 'The request succeeded. The response body contains the requested resource or the result of the action.', useCase: 'Default success response for GET, POST, PUT, PATCH.', cacheability: 'cacheable', retryable: false, commonIn: ['REST APIs', 'Web browsers', 'CDNs'] },
  { code: 201, phrase: 'Created', category: '2xx', categoryName: 'Success', rfc: 'RFC 7231', description: 'The request succeeded and a new resource was created.', useCase: 'Return after a successful POST that creates a resource. Include Location header pointing to the new resource.', cacheability: 'not-cacheable', retryable: false, commonIn: ['REST APIs'] },
  { code: 204, phrase: 'No Content', category: '2xx', categoryName: 'Success', rfc: 'RFC 7231', description: 'The request succeeded but there is no content to return.', useCase: 'DELETE operations, PUT/PATCH updates when the client does not need the updated resource.', cacheability: 'not-cacheable', retryable: false, commonIn: ['REST APIs', 'CORS preflight responses'] },
  { code: 206, phrase: 'Partial Content', category: '2xx', categoryName: 'Success', rfc: 'RFC 7233', description: 'The server is delivering only part of the resource due to a Range header in the request.', useCase: 'Video streaming, resumable file downloads.', cacheability: 'cacheable', retryable: false, commonIn: ['Video streaming', 'Large file downloads'] },

  // 3xx Redirection
  { code: 301, phrase: 'Moved Permanently', category: '3xx', categoryName: 'Redirection', rfc: 'RFC 7231', description: 'The requested resource has been permanently moved to a new URL.', useCase: 'Permanent URL changes. Clients and search engines should update their records.', cacheability: 'cacheable', retryable: false, commonIn: ['SEO redirects', 'URL restructuring'] },
  { code: 302, phrase: 'Found', category: '3xx', categoryName: 'Redirection', rfc: 'RFC 7231', description: 'The resource is temporarily at a different URL.', useCase: 'Temporary redirects. Often misused — prefer 307 to preserve request method.', cacheability: 'not-cacheable', retryable: false, commonIn: ['Login redirects', 'Maintenance pages'] },
  { code: 304, phrase: 'Not Modified', category: '3xx', categoryName: 'Redirection', rfc: 'RFC 7232', description: 'The requested resource has not changed since the version specified in the request headers.', useCase: 'HTTP caching with ETag or Last-Modified. Client uses cached version.', cacheability: 'cacheable', retryable: false, commonIn: ['CDNs', 'Browser caching'] },
  { code: 307, phrase: 'Temporary Redirect', category: '3xx', categoryName: 'Redirection', rfc: 'RFC 7231', description: 'The resource is temporarily at another URL. Unlike 302, the same HTTP method must be used.', useCase: 'Temporary redirects where preserving the HTTP method (POST → POST) is critical.', cacheability: 'not-cacheable', retryable: true, commonIn: ['REST APIs', 'HTTPS redirects'] },
  { code: 308, phrase: 'Permanent Redirect', category: '3xx', categoryName: 'Redirection', rfc: 'RFC 7538', description: 'The resource has been permanently moved. Same HTTP method must be used.', useCase: 'Prefer over 301 when the original request used POST and you want to preserve it.', cacheability: 'cacheable', retryable: false, commonIn: ['API versioning'] },

  // 4xx Client Error
  { code: 400, phrase: 'Bad Request', category: '4xx', categoryName: 'Client Error', rfc: 'RFC 7231', description: 'The server cannot process the request due to malformed syntax or invalid parameters.', useCase: 'Invalid JSON body, missing required fields, invalid query parameters.', cacheability: 'not-cacheable', retryable: false, commonIn: ['REST APIs', 'Form validation'] },
  { code: 401, phrase: 'Unauthorized', category: '4xx', categoryName: 'Client Error', rfc: 'RFC 7235', description: 'Authentication is required and has failed or has not been provided.', useCase: 'Missing or invalid Bearer token, API key, or session cookie. Misleadingly named — means unauthenticated.', cacheability: 'not-cacheable', retryable: true, commonIn: ['REST APIs', 'OAuth', 'JWT'] },
  { code: 403, phrase: 'Forbidden', category: '4xx', categoryName: 'Client Error', rfc: 'RFC 7231', description: 'The client is authenticated but lacks permission to access the resource.', useCase: 'User is logged in but does not have the right role or ownership of the resource.', cacheability: 'not-cacheable', retryable: false, commonIn: ['Role-based access control', 'Multi-tenant apps'] },
  { code: 404, phrase: 'Not Found', category: '4xx', categoryName: 'Client Error', rfc: 'RFC 7231', description: 'The requested resource does not exist on the server.', useCase: 'Invalid URL, deleted resource, or intentionally hiding a resource from unauthorised users.', cacheability: 'cacheable', retryable: false, commonIn: ['Every web application'] },
  { code: 405, phrase: 'Method Not Allowed', category: '4xx', categoryName: 'Client Error', rfc: 'RFC 7231', description: 'The HTTP method used is not supported by the target resource.', useCase: 'Sending DELETE to a read-only endpoint, GET to a POST-only endpoint.', cacheability: 'not-cacheable', retryable: false, commonIn: ['REST APIs'] },
  { code: 409, phrase: 'Conflict', category: '4xx', categoryName: 'Client Error', rfc: 'RFC 7231', description: 'The request conflicts with the current state of the resource.', useCase: 'Creating a resource that already exists (duplicate key), concurrent edit conflicts.', cacheability: 'not-cacheable', retryable: true, commonIn: ['REST APIs', 'Database operations'] },
  { code: 410, phrase: 'Gone', category: '4xx', categoryName: 'Client Error', rfc: 'RFC 7231', description: 'The resource existed but has been permanently deleted. Unlike 404, this state is expected to be permanent.', useCase: 'Deleted content that should be removed from search engine indexes.', cacheability: 'cacheable', retryable: false, commonIn: ['Content management', 'SEO'] },
  { code: 422, phrase: 'Unprocessable Entity', category: '4xx', categoryName: 'Client Error', rfc: 'RFC 4918', description: 'The request was well-formed but the server was unable to process the contained instructions due to semantic errors.', useCase: 'Validation errors: correct JSON format but invalid business logic (e.g., age = -5).', cacheability: 'not-cacheable', retryable: false, commonIn: ['REST APIs', 'Rails', 'Laravel'] },
  { code: 429, phrase: 'Too Many Requests', category: '4xx', categoryName: 'Client Error', rfc: 'RFC 6585', description: 'The client has sent too many requests in a given time window.', useCase: 'Rate limiting. Include Retry-After header to tell client when to try again.', cacheability: 'not-cacheable', retryable: true, commonIn: ['APIs', 'Authentication endpoints'] },

  // 5xx Server Error
  { code: 500, phrase: 'Internal Server Error', category: '5xx', categoryName: 'Server Error', rfc: 'RFC 7231', description: 'The server encountered an unexpected condition that prevented it from fulfilling the request.', useCase: 'Unhandled exceptions, database errors, infrastructure failures.', cacheability: 'not-cacheable', retryable: true, commonIn: ['Every web server'] },
  { code: 502, phrase: 'Bad Gateway', category: '5xx', categoryName: 'Server Error', rfc: 'RFC 7231', description: 'The server received an invalid response from an upstream server while acting as a gateway.', useCase: 'Reverse proxy (Nginx/Cloudflare) cannot reach the origin server.', cacheability: 'not-cacheable', retryable: true, commonIn: ['Nginx', 'Cloudflare', 'Load balancers'] },
  { code: 503, phrase: 'Service Unavailable', category: '5xx', categoryName: 'Server Error', rfc: 'RFC 7231', description: 'The server is temporarily unable to handle the request due to maintenance or overload.', useCase: 'Planned maintenance, server overload. Include Retry-After header.', cacheability: 'not-cacheable', retryable: true, commonIn: ['Maintenance pages', 'Autoscaling'] },
  { code: 504, phrase: 'Gateway Timeout', category: '5xx', categoryName: 'Server Error', rfc: 'RFC 7231', description: 'The gateway or proxy did not receive a timely response from the upstream server.', useCase: 'Slow database queries, upstream API timeouts.', cacheability: 'not-cacheable', retryable: true, commonIn: ['Nginx', 'API gateways', 'Load balancers'] },
]
```

**UI Notes:**
- Search bar: type a code number (e.g., "404") or keyword (e.g., "rate limit") — instant filtering
- Category filter tabs: All, 1xx, 2xx, 3xx, 4xx, 5xx — each shows a colour-coded count badge
- Each code shown as a card: large code number, phrase, brief description
- Expand card: shows full description, use case, RFC reference, cacheability, retryability
- Colour coding: 2xx = green, 3xx = blue, 4xx = orange, 5xx = red
- "Copy as table" button: copies all matching codes as a markdown table
- No network requests — completely offline-capable

---

### Tool 100: Keyboard Shortcut Cheatsheet
**Route:** `/tools/keyboard-shortcuts`
**Library:** None — pure JS (static data)
**Input:** Application/OS filter selection
**Output:** Searchable keyboard shortcut reference

```typescript
// lib/data/keyboard-shortcuts.ts

export interface Shortcut {
  action: string
  keys: {
    mac?: string[]     // e.g. ['⌘', 'K']
    windows?: string[] // e.g. ['Ctrl', 'K']
    linux?: string[]   // usually same as Windows
  }
  category: string
  tags: string[]
}

export interface ShortcutSet {
  app: string
  icon: string
  shortcuts: Shortcut[]
}

export const SHORTCUT_SETS: ShortcutSet[] = [
  {
    app: 'VS Code',
    icon: '💻',
    shortcuts: [
      { action: 'Open Command Palette', keys: { mac: ['⌘', 'Shift', 'P'], windows: ['Ctrl', 'Shift', 'P'] }, category: 'General', tags: ['command', 'palette', 'find'] },
      { action: 'Quick Open File',      keys: { mac: ['⌘', 'P'],           windows: ['Ctrl', 'P'] },           category: 'Files',   tags: ['open', 'file', 'find'] },
      { action: 'Toggle Terminal',      keys: { mac: ['⌃', '`'],           windows: ['Ctrl', '`'] },           category: 'Terminal', tags: ['terminal', 'console'] },
      { action: 'Format Document',      keys: { mac: ['⇧', '⌥', 'F'],      windows: ['Shift', 'Alt', 'F'] },   category: 'Editing', tags: ['format', 'beautify'] },
      { action: 'Go to Line',           keys: { mac: ['⌃', 'G'],           windows: ['Ctrl', 'G'] },           category: 'Navigation', tags: ['line', 'go to'] },
      { action: 'Multi-cursor (click)', keys: { mac: ['⌥', 'Click'],       windows: ['Alt', 'Click'] },        category: 'Editing', tags: ['cursor', 'multi'] },
      { action: 'Select All Occurrences', keys: { mac: ['⌘', 'Shift', 'L'], windows: ['Ctrl', 'Shift', 'L'] }, category: 'Editing', tags: ['select', 'occurrences'] },
      { action: 'Zen Mode',             keys: { mac: ['⌘', 'K', 'Z'],      windows: ['Ctrl', 'K', 'Z'] },      category: 'View',    tags: ['zen', 'focus'] },
      { action: 'Split Editor Right',   keys: { mac: ['⌘', '\\'],          windows: ['Ctrl', '\\'] },          category: 'View',    tags: ['split', 'panel'] },
      { action: 'Rename Symbol',        keys: { mac: ['F2'],                windows: ['F2'] },                  category: 'Refactoring', tags: ['rename', 'refactor'] },
    ]
  },
  {
    app: 'Chrome DevTools',
    icon: '🔧',
    shortcuts: [
      { action: 'Open DevTools',        keys: { mac: ['⌘', '⌥', 'I'],      windows: ['F12'] },                 category: 'General', tags: ['devtools', 'open'] },
      { action: 'Toggle Device Mode',   keys: { mac: ['⌘', 'Shift', 'M'],  windows: ['Ctrl', 'Shift', 'M'] },  category: 'Elements', tags: ['mobile', 'responsive'] },
      { action: 'Open Console',         keys: { mac: ['⌘', '⌥', 'J'],      windows: ['Ctrl', 'Shift', 'J'] },  category: 'Console', tags: ['console', 'js'] },
      { action: 'Inspect Element',      keys: { mac: ['⌘', 'Shift', 'C'],  windows: ['Ctrl', 'Shift', 'C'] },  category: 'Elements', tags: ['inspect', 'element'] },
      { action: 'Clear Console',        keys: { mac: ['⌘', 'K'],           windows: ['Ctrl', 'L'] },           category: 'Console', tags: ['clear'] },
      { action: 'Hard Reload',          keys: { mac: ['⌘', 'Shift', 'R'],  windows: ['Ctrl', 'Shift', 'R'] },  category: 'General', tags: ['reload', 'cache'] },
    ]
  },
  {
    app: 'macOS',
    icon: '🍎',
    shortcuts: [
      { action: 'Spotlight Search',     keys: { mac: ['⌘', 'Space'] },                                         category: 'System',   tags: ['search', 'spotlight'] },
      { action: 'Screenshot (region)',  keys: { mac: ['⌘', 'Shift', '4'] },                                    category: 'System',   tags: ['screenshot', 'screen'] },
      { action: 'Screenshot (window)', keys: { mac: ['⌘', 'Shift', '4', 'Space'] },                           category: 'System',   tags: ['screenshot', 'window'] },
      { action: 'Force Quit',          keys: { mac: ['⌘', '⌥', 'Esc'] },                                      category: 'System',   tags: ['quit', 'force', 'kill'] },
      { action: 'Mission Control',     keys: { mac: ['⌃', '↑'] },                                             category: 'Windows',  tags: ['mission control', 'spaces'] },
      { action: 'App Switcher',        keys: { mac: ['⌘', 'Tab'] },                                           category: 'Windows',  tags: ['switch', 'app'] },
      { action: 'Hide App',            keys: { mac: ['⌘', 'H'] },                                             category: 'Windows',  tags: ['hide'] },
      { action: 'Emoji Picker',        keys: { mac: ['⌃', '⌘', 'Space'] },                                    category: 'Input',    tags: ['emoji'] },
    ]
  },
  {
    app: 'Windows',
    icon: '🪟',
    shortcuts: [
      { action: 'Task Manager',        keys: { windows: ['Ctrl', 'Shift', 'Esc'] },                           category: 'System',   tags: ['task manager', 'processes'] },
      { action: 'Virtual Desktop',     keys: { windows: ['⊞', 'Ctrl', 'D'] },                                 category: 'Windows',  tags: ['virtual', 'desktop'] },
      { action: 'Lock Screen',         keys: { windows: ['⊞', 'L'] },                                         category: 'System',   tags: ['lock', 'screen'] },
      { action: 'Snap Window Left',    keys: { windows: ['⊞', '←'] },                                         category: 'Windows',  tags: ['snap', 'tile'] },
      { action: 'Screenshot',          keys: { windows: ['⊞', 'Shift', 'S'] },                                category: 'System',   tags: ['screenshot', 'snip'] },
      { action: 'File Explorer',       keys: { windows: ['⊞', 'E'] },                                         category: 'System',   tags: ['explorer', 'files'] },
    ]
  },
  {
    app: 'Figma',
    icon: '🎨',
    shortcuts: [
      { action: 'Scale Object',        keys: { mac: ['K'], windows: ['K'] },                                   category: 'Transform', tags: ['scale', 'resize'] },
      { action: 'Component',          keys: { mac: ['⌘', '⌥', 'K'],      windows: ['Ctrl', 'Alt', 'K'] },    category: 'Design',   tags: ['component', 'symbol'] },
      { action: 'Auto Layout',        keys: { mac: ['⇧', 'A'],            windows: ['Shift', 'A'] },          category: 'Layout',   tags: ['auto layout', 'flex'] },
      { action: 'Flatten',            keys: { mac: ['⌘', 'E'],            windows: ['Ctrl', 'E'] },           category: 'Edit',     tags: ['flatten', 'merge'] },
      { action: 'Show/Hide UI',       keys: { mac: ['⌘', '\\'],           windows: ['Ctrl', '\\'] },          category: 'View',     tags: ['ui', 'panels'] },
      { action: 'Toggle Rulers',      keys: { mac: ['⇧', 'R'],            windows: ['Shift', 'R'] },          category: 'View',     tags: ['rulers', 'guides'] },
    ]
  },
]
```

**UI Notes:**
- App selector: tabs or dropdown for VS Code, Chrome DevTools, macOS, Windows, Figma + others
- OS toggle: Mac / Windows (shows appropriate key symbols)
- Search bar: filter shortcuts by action name or key combination
- Category filter: chips per category within the selected app
- Key rendering: display keys as styled `<kbd>` elements with OS-appropriate symbols (⌘ ⌥ ⌃ ⇧ for Mac; Ctrl Alt Win Shift for Windows)
- "Print cheatsheet" button: generates a clean printable PDF layout using `window.print()` with a `@media print` stylesheet
- Completely offline-capable — no network requests

---

## 3. Static Data Tools Pattern

Tools 99 and 100 are **reference tools** — they contain large static datasets and provide search/filter UX over them. Both follow this identical pattern:

```typescript
// Pattern for all static reference tools

// 1. Data file: lib/data/[tool-name].ts
// - All data hardcoded as TypeScript constants
// - Typed with interfaces
// - Zero external dependencies, zero network calls

// 2. Search hook: uses useMemo + simple string matching
// - No debounce needed (all data is local, search is instant)
// - Filter by multiple criteria simultaneously

// 3. Component: renders filtered data as cards or table rows
// - Virtual scrolling if list exceeds 100 items (use react-window or native intersection observer)
// - No loading states (data is always available instantly)
// - Works completely offline after first page load (cacheable by Cloudflare)

// 4. SEO: generate a static page for each item (Next.js generateStaticParams)
// - /tools/http-status/404 → pre-rendered page for code 404
// - This captures search traffic for "404 status code meaning" etc.
```

**SEO benefit of static params for reference tools:**

```typescript
// app/tools/http-status/[code]/page.tsx
export function generateStaticParams() {
  return HTTP_STATUS_CODES.map(code => ({ code: code.code.toString() }))
}

export function generateMetadata({ params }: { params: { code: string } }) {
  const statusCode = HTTP_STATUS_CODES.find(c => c.code === parseInt(params.code))
  if (!statusCode) return {}
  return {
    title: `HTTP ${statusCode.code} ${statusCode.phrase} — What it means and when to use it`,
    description: statusCode.description,
  }
}
```

This generates 40+ pre-rendered pages (one per HTTP status code) that each rank for their respective search queries at zero infrastructure cost.

---

## 4. New Cloudflare Worker Route

Tool 91 (Responsive Breakpoint Tester) uses the same Puppeteer Browser Rendering setup as Tools 79. Add a new route in `wrangler.toml`:

```toml
[[routes]]
pattern = "tools.shreyannarula.com/api/worker/breakpoint-tester"
zone_name = "shreyannarula.com"
```

Both Tool 79 and Tool 91 share the same `[[browser]]` binding — only one binding entry is needed. Update `cloudflare-workers/index.ts`:

```typescript
import screenshotWorker from './webpage-screenshot'
import breakpointWorker from './breakpoint-tester'
import ogPreviewWorker from './og-preview'
import ipLookupWorker from './ip-lookup'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/worker/screenshot'))         return screenshotWorker.fetch(request, env)
    if (url.pathname.startsWith('/api/worker/breakpoint-tester'))  return breakpointWorker.fetch(request, env)
    if (url.pathname.startsWith('/api/worker/og-preview'))         return ogPreviewWorker.fetch(request, env)
    if (url.pathname.startsWith('/api/worker/ip-lookup'))          return ipLookupWorker.fetch(request, env)
    return new Response('Not found', { status: 404 })
  }
}
```

---

## 5. Extension Context Menu Additions

```typescript
// Additions to service-worker/context-menus.ts

// Image: simulate colour blindness
chrome.contextMenus.create({
  id: 'img-colorblind',
  parentId: 'shreyan-img',
  title: '👁️ Simulate Colour Blindness',
  contexts: ['image'],
})

// Text: format SQL
chrome.contextMenus.create({
  id: 'text-format-sql',
  parentId: 'text-sub-dev',
  title: '🗄️ Format SQL',
  contexts: ['selection'],
})

// Text: format GraphQL
chrome.contextMenus.create({
  id: 'text-format-graphql',
  parentId: 'text-sub-dev',
  title: '🔷 Format GraphQL',
  contexts: ['selection'],
})

// Text: parse env variables
chrome.contextMenus.create({
  id: 'text-env-parse',
  parentId: 'text-sub-dev',
  title: '⚙️ Parse .env Variables',
  contexts: ['selection'],
})

// Add to toolRoutes:
const batch5Routes: Record<string, string> = {
  'img-colorblind':    'color-blindness',
  'text-format-sql':   'sql-formatter',
  'text-format-graphql': 'graphql-formatter',
  'text-env-parse':    'env-parser',
}
```

---

## 6. Phase Build Order for Tools 81–100

### Week 1 (Days 1–5): Static reference tools (zero complexity)
These are data + search UI — no logic to debug:
- [ ] **Tool 99:** HTTP Status Reference — 2 hours (data + search + static params SEO)
- [ ] **Tool 100:** Keyboard Shortcut Cheatsheet — 3 hours (data + app selector + OS toggle + print)

---

### Week 2 (Days 6–10): Pure-JS developer tools
- [ ] **Tool 94:** XML Formatter — 2 hours (DOMParser, already in browser)
- [ ] **Tool 98:** Environment Variable Parser — 2 hours
- [ ] **Tool 93:** YAML ↔ JSON — 2 hours (`js-yaml`)
- [ ] **Tool 95:** TOML ↔ JSON — 2 hours (`@iarna/toml`)

---

### Week 3 (Days 11–16): More developer tools + larger libraries
- [ ] **Tool 92:** HTML to Markdown — 2 hours (`turndown`)
- [ ] **Tool 96:** SQL Formatter — 3 hours (`sql-formatter`)
- [ ] **Tool 97:** GraphQL Formatter — 3 hours (`graphql`)
- [ ] **Tool 85:** Typography Scale Generator — 3 hours

---

### Week 4 (Days 17–22): Design tools
- [ ] **Tool 82:** CSS Clip-Path Generator — 4 hours (interactive SVG drag handles)
- [ ] **Tool 83:** CSS Animation Generator — 4 hours (keyframe timeline editor)
- [ ] **Tool 90:** CSS Grid Generator — 5 hours (interactive grid canvas)
- [ ] **Tool 89:** SVG Path Visualiser — 4 hours (path parser + annotated canvas)

---

### Week 5 (Days 23–30): Image/colour tools + APIs
- [ ] **Tool 81:** Colour Blindness Simulator — 4 hours (pixel matrix math + 9-panel grid)
- [ ] **Tool 87:** Hex/RGB/HSL Bulk Converter — 2 hours
- [ ] **Tool 86:** Palette from Image (Advanced) — 4 hours (median-cut quantisation)
- [ ] **Tool 84:** Icon Finder — 4 hours (Iconify API + grid + favourites)
- [ ] **Tool 88:** Gradient Mesh — 5 hours (bilinear interpolation renderer)
- [ ] **Tool 91:** Breakpoint Tester — 4 hours (Cloudflare Worker + Puppeteer, shared with Tool 79)

**End of Week 5:** All 20 tools live. **Total: 100 working tools.**

---

## 7. Critical Rules Specific to This Batch

In addition to all 40 rules from Parts 1–4:

**Rule 41 — Colour blindness matrix multiplication must use linear RGB, not sRGB.**
Applying the transformation matrices directly to sRGB values (0–255) produces incorrect results — colours look wrong. Always linearise using the sRGB → linear conversion (`linearise()` function) before matrix multiplication, then convert back with `delinearise()`. This is the single most common mistake in colour blindness simulation implementations.

**Rule 42 — Iconify API requests must be cached in `sessionStorage`.**
The Iconify search API is rate-limited. Every time the user types a character, a new search fires. Implement a simple in-memory cache (a `Map<string, IconSearchResult[]>`) keyed by query string. If the same query is repeated (user types, deletes, retypes), serve from cache. Do not use `localStorage` for this — icon data is session-specific and large.

**Rule 43 — The SVG Path Parser must handle implicit command repetition.**
In SVG path syntax, a command letter does not need to be repeated for consecutive arguments of the same type. `M 10 10 L 20 20 30 30` is equivalent to `M 10 10 L 20 20 L 30 30`. The parser must handle this implicit repetition — do not assume each argument group starts with a command letter.

**Rule 44 — The CSS Grid Generator must validate track sizes.**
`minmax(0, 1fr)`, `repeat(3, 200px)`, `auto-fill`, `auto-fit` are all valid CSS Grid track values. Do not validate with a simple regex — accept any non-empty string and render it directly. If the CSS is invalid, the browser preview will simply not render the grid as expected, which is sufficient feedback.

**Rule 45 — Static reference tools (HTTP Status, Keyboard Shortcuts) must generate static pages per item.**
Use `generateStaticParams()` in Next.js to pre-render one page per HTTP status code and one page per shortcut set. This creates 60+ pre-rendered, SEO-optimised pages that rank for free. Do not skip this — it is the primary organic traffic driver for these tools.

**Rule 46 — The Colour Blindness Simulator must yield to the UI thread between each simulation.**
Processing 9 colour blindness simulations sequentially without yielding will freeze the browser tab for 2–5 seconds on large images. After each simulation completes, call `await new Promise(r => setTimeout(r, 0))` to yield. This keeps the progress indicator updating smoothly.

**Rule 47 — The GraphQL formatter uses the `graphql` package's `parse()` + `print()` for formatting.**
Do not implement a custom formatter. `parse()` + `print()` roundtrip is the canonical way to format GraphQL — it produces the exact same output as Prettier's GraphQL plugin. The output is always normalised and deterministic.

**Rule 48 — The Environment Variable Parser must mask values by default.**
`.env` files contain secrets (API keys, database passwords, tokens). When the parsed table is displayed, values must be masked as `••••••••` by default, with a "Reveal values" toggle. Never display secret values by default — users screenshot these tools and share them accidentally.

**Rule 49 — The Responsive Breakpoint Tester shares the Cloudflare Browser binding with Tool 79.**
Only one `[[browser]]` binding entry in `wrangler.toml`. Do not add a second one. Both tools route through the same worker entry point. The Cloudflare Workers free tier includes 100k requests/day — the paid tier ($5/month) includes Browser Rendering.

**Rule 50 — The Keyboard Shortcut Cheatsheet must work offline and support printing.**
Add `@media print` CSS that hides navigation, search, and filter UI, showing only the shortcut cards in a clean grid layout. Use `window.print()` triggered by a "Print" button. This makes the tool useful as a physical reference card — a strong retention driver.

---

*Part 5 complete. Tools 81–100 documented. You now have 100 tools fully specified.*
*Part 6 will cover Tools 101–110 + final integration checklist, deployment runbook, and monitoring setup.*
*Last updated: May 2026. For tools.shreyannarula.com.*
