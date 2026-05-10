// service-worker/context-menus.ts
// Defines every right-click menu item and the map from menu ID → tool ID.
// RULE: NO emoji in menu titles — they render inconsistently across OS.
// Use plain descriptive text only.

import { TOOL_BASE_URL } from '../lib/constants'

// Full map: contextMenuId → toolId
export const CONTEXT_MENU_TOOL_MAP: Record<string, string> = {
  // Image contexts
  'img-remove-bg':  'background-remover',
  'img-compress':   'image-compressor',
  'img-convert':    'image-converter',
  'img-resize':     'image-resizer',
  'img-exif':       'exif-viewer',
  'img-palette':    'color-palette',
  'img-watermark':  'image-watermark',
  'img-ocr':        'image-to-text',
  'img-to-pdf':     'image-to-pdf',
  'img-qr':         'qr-code',
  'img-gps':        'gps-map',

  // Text / selection contexts
  'text-word-count':  'word-count',
  'text-case':        'text-case',
  'text-hash':        'hash-generator',
  'text-base64-enc':  'base64',
  'text-base64-dec':  'base64',
  'text-html-enc':    'html-entities',
  'text-jwt':         'jwt-decoder',
  'text-regex':       'regex-tester',
  'text-lorem':       'lorem-ipsum',
  'text-diff':        'diff-checker',
  'text-speech':      'text-to-speech',
  'text-timestamp':   'unix-timestamp',
  'text-code-fmt':    'code-formatter',
  'text-barcode':     'barcode-generator',
  'text-slug':        'slug-generator',
  'text-readability': 'readability',

  // Link contexts
  'link-qr':        'qr-code',
  'link-og':        'og-preview',
  'link-url-enc':   'url-encoder',
  'link-favicon':   'favicon-generator',

  // Page contexts
  'page-qr':        'qr-code',
  'page-og':        'og-preview',
  'page-meta':      'meta-tag-generator',
  'page-robots':    'robots-txt',
  'page-sitemap':   'sitemap-generator',

  // Video contexts
  'video-gif':      'video-to-gif',

  // Audio contexts
  'audio-convert':  'audio-converter',
}

export function buildContextMenus(): void {
  // ── Images ──────────────────────────────────────────────────────────────
  chrome.contextMenus.create({ id: 'kit-img', title: 'kit — Image Tools', contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-remove-bg', parentId: 'kit-img', title: 'Remove Background',       contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-compress',  parentId: 'kit-img', title: 'Compress Image',          contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-convert',   parentId: 'kit-img', title: 'Convert Format',          contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-resize',    parentId: 'kit-img', title: 'Resize & Crop',           contexts: ['image'] })
  chrome.contextMenus.create({ id: 'sep-img-1', parentId: 'kit-img', type: 'separator', contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-exif',      parentId: 'kit-img', title: 'View EXIF Data',          contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-palette',   parentId: 'kit-img', title: 'Extract Colour Palette',  contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-watermark', parentId: 'kit-img', title: 'Add Watermark',           contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-ocr',       parentId: 'kit-img', title: 'Extract Text (OCR)',      contexts: ['image'] })
  chrome.contextMenus.create({ id: 'sep-img-2', parentId: 'kit-img', type: 'separator', contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-to-pdf',    parentId: 'kit-img', title: 'Convert to PDF',          contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-qr',        parentId: 'kit-img', title: 'QR Code from URL',        contexts: ['image'] })
  chrome.contextMenus.create({ id: 'img-gps',       parentId: 'kit-img', title: 'Show GPS Location',       contexts: ['image'] })

  // ── Text Selection ───────────────────────────────────────────────────────
  chrome.contextMenus.create({ id: 'kit-text', title: 'kit — Text Tools', contexts: ['selection'] })

  // Sub-group: Transform
  chrome.contextMenus.create({ id: 'text-sub-transform', parentId: 'kit-text', title: 'Transform Text', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-word-count', parentId: 'text-sub-transform', title: 'Word Count & Readability', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-case',       parentId: 'text-sub-transform', title: 'Convert Case',             contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-diff',       parentId: 'text-sub-transform', title: 'Compare Text (Diff)',      contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-speech',     parentId: 'text-sub-transform', title: 'Read Aloud',              contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-slug',       parentId: 'text-sub-transform', title: 'Generate URL Slug',       contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-readability', parentId: 'text-sub-transform', title: 'Readability Score',      contexts: ['selection'] })

  // Sub-group: Encode / Hash
  chrome.contextMenus.create({ id: 'text-sub-encode', parentId: 'kit-text', title: 'Encode / Hash', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-hash',       parentId: 'text-sub-encode', title: 'Generate Hash (SHA/MD5)', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-base64-enc', parentId: 'text-sub-encode', title: 'Encode Base64',          contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-base64-dec', parentId: 'text-sub-encode', title: 'Decode Base64',          contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-html-enc',   parentId: 'text-sub-encode', title: 'Encode HTML Entities',   contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-jwt',        parentId: 'text-sub-encode', title: 'Decode JWT',             contexts: ['selection'] })

  // Sub-group: Developer Tools
  chrome.contextMenus.create({ id: 'text-sub-dev', parentId: 'kit-text', title: 'Developer Tools', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-code-fmt',   parentId: 'text-sub-dev', title: 'Format / Beautify Code', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-regex',      parentId: 'text-sub-dev', title: 'Test as Regex',          contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-timestamp',  parentId: 'text-sub-dev', title: 'Convert Timestamp',      contexts: ['selection'] })

  // Sub-group: Generate
  chrome.contextMenus.create({ id: 'text-sub-gen', parentId: 'kit-text', title: 'Generate from Text', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-barcode',    parentId: 'text-sub-gen', title: 'Generate Barcode',     contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'text-lorem',      parentId: 'text-sub-gen', title: 'Generate Lorem Ipsum', contexts: ['selection'] })

  // ── Links ────────────────────────────────────────────────────────────────
  chrome.contextMenus.create({ id: 'kit-link', title: 'kit — Link Tools', contexts: ['link'] })
  chrome.contextMenus.create({ id: 'link-qr',       parentId: 'kit-link', title: 'Generate QR Code',          contexts: ['link'] })
  chrome.contextMenus.create({ id: 'link-og',       parentId: 'kit-link', title: 'Preview Open Graph Card',   contexts: ['link'] })
  chrome.contextMenus.create({ id: 'link-url-enc',  parentId: 'kit-link', title: 'Encode URL',                contexts: ['link'] })
  chrome.contextMenus.create({ id: 'link-favicon',  parentId: 'kit-link', title: 'Generate Favicon from URL', contexts: ['link'] })

  // ── Page ─────────────────────────────────────────────────────────────────
  chrome.contextMenus.create({ id: 'kit-page', title: 'kit — Page Tools', contexts: ['page'] })
  chrome.contextMenus.create({ id: 'page-qr',      parentId: 'kit-page', title: 'QR Code for this Page',       contexts: ['page'] })
  chrome.contextMenus.create({ id: 'page-og',      parentId: 'kit-page', title: 'Preview Social Sharing Card', contexts: ['page'] })
  chrome.contextMenus.create({ id: 'page-meta',    parentId: 'kit-page', title: 'Inspect Meta Tags',           contexts: ['page'] })
  chrome.contextMenus.create({ id: 'sep-page-1', parentId: 'kit-page', type: 'separator', contexts: ['page'] })
  chrome.contextMenus.create({ id: 'page-robots',  parentId: 'kit-page', title: 'Generate robots.txt',        contexts: ['page'] })
  chrome.contextMenus.create({ id: 'page-sitemap', parentId: 'kit-page', title: 'Generate Sitemap',           contexts: ['page'] })

  // ── Video ────────────────────────────────────────────────────────────────
  chrome.contextMenus.create({ id: 'kit-video', title: 'kit — Video Tools', contexts: ['video'] })
  chrome.contextMenus.create({ id: 'video-gif', parentId: 'kit-video', title: 'Convert to GIF',               contexts: ['video'] })
}

export { TOOL_BASE_URL }
