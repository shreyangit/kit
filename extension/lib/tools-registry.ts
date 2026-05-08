// Extension tools registry — synced with kit/lib/tools-registry.ts
// Run `npm run verify-sync` to check for drift against the website registry.
//
// Extension-specific fields added to each tool:
//   hasInlineRunner: boolean   — runs inside the popup without opening a new tab
//   icon: string               — emoji for popup/FAB display

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

export interface Tool {
  id: string
  name: string
  description: string
  category: ToolCategory
  icon: string         // emoji — used in popup and FAB
  tags: string[]
  hasInlineRunner: boolean
}

export const CATEGORIES = [
  { id: 'image',            label: 'Image',          icon: '🖼️',  color: '#3B82F6' },
  { id: 'document',         label: 'Documents',      icon: '📄',  color: '#8B5CF6' },
  { id: 'text-code',        label: 'Text & Code',    icon: '💻',  color: '#10B981' },
  { id: 'audio-video',      label: 'Audio / Video',  icon: '🎵',  color: '#F59E0B' },
  { id: 'design',           label: 'Design',         icon: '🎨',  color: '#EC4899' },
  { id: 'data',             label: 'Data',           icon: '📊',  color: '#06B6D4' },
  { id: 'web-seo',          label: 'Web & SEO',      icon: '🌐',  color: '#84CC16' },
  { id: 'privacy-security', label: 'Security',       icon: '🔒',  color: '#EF4444' },
  { id: 'productivity',     label: 'Productivity',   icon: '⚡',  color: '#6366F1' },
  { id: 'writing',          label: 'Writing',        icon: '✍️',  color: '#F97316' },
] as const

export const tools: Tool[] = [
  // ── Image ────────────────────────────────────────────────────────────────
  { id: 'background-remover', name: 'Background Remover',    description: 'Remove image backgrounds with AI.',              category: 'image',            icon: '✂️',  tags: ['background', 'remove', 'transparent', 'ai', 'image'],               hasInlineRunner: false },
  { id: 'image-compressor',   name: 'Image Compressor',      description: 'Compress images without visible quality loss.',  category: 'image',            icon: '📦',  tags: ['compress', 'image', 'optimize', 'size', 'jpg', 'png'],               hasInlineRunner: false },
  { id: 'image-converter',    name: 'Image Converter',       description: 'Convert between PNG, JPG, WebP, AVIF.',         category: 'image',            icon: '🔄',  tags: ['convert', 'image', 'png', 'jpg', 'webp', 'avif'],                    hasInlineRunner: false },
  { id: 'image-resizer',      name: 'Image Resizer',         description: 'Resize and crop images to exact dimensions.',   category: 'image',            icon: '📐',  tags: ['resize', 'crop', 'image', 'dimensions', 'scale'],                    hasInlineRunner: false },
  { id: 'image-to-pdf',       name: 'Image to PDF',          description: 'Convert images to a PDF document.',             category: 'image',            icon: '📄',  tags: ['image', 'pdf', 'convert', 'jpg', 'png'],                             hasInlineRunner: false },
  { id: 'image-to-text',      name: 'Image to Text (OCR)',   description: 'Extract text from images using OCR.',           category: 'image',            icon: '📝',  tags: ['ocr', 'text', 'image', 'extract', 'recognition'],                    hasInlineRunner: false },
  { id: 'image-watermark',    name: 'Image Watermark',       description: 'Add text or image watermarks.',                 category: 'image',            icon: '💧',  tags: ['watermark', 'image', 'text', 'logo', 'overlay'],                     hasInlineRunner: false },
  { id: 'exif-viewer',        name: 'EXIF Viewer',           description: 'View full EXIF metadata from any photo.',       category: 'image',            icon: '📋',  tags: ['exif', 'metadata', 'photo', 'camera', 'image'],                      hasInlineRunner: false },
  { id: 'color-palette',      name: 'Colour Palette Extractor', description: 'Extract dominant colours from an image.',   category: 'image',            icon: '🎨',  tags: ['color', 'colour', 'palette', 'image', 'extract'],                    hasInlineRunner: false },
  { id: 'favicon-generator',  name: 'Favicon Generator',     description: 'Generate favicons in all required sizes.',      category: 'image',            icon: '⭐',  tags: ['favicon', 'icon', 'website', 'generator', 'png'],                    hasInlineRunner: false },
  { id: 'barcode-generator',  name: 'Barcode Generator',     description: 'Generate barcodes in multiple formats.',        category: 'image',            icon: '📊',  tags: ['barcode', 'generate', 'ean', 'qr', 'upc', 'scan'],                   hasInlineRunner: false },
  { id: 'qr-code',            name: 'QR Code Generator',     description: 'Generate QR codes for any text or URL.',        category: 'image',            icon: '📱',  tags: ['qr', 'code', 'generate', 'url', 'scan', 'barcode'],                  hasInlineRunner: true  },
  { id: 'svg-optimizer',      name: 'SVG Optimizer',         description: 'Optimise and clean SVG files.',                 category: 'image',            icon: '⚡',  tags: ['svg', 'optimize', 'clean', 'vector', 'minify'],                      hasInlineRunner: false },
  { id: 'gps-map',            name: 'Image GPS Map',         description: 'View photo GPS location on a map.',             category: 'image',            icon: '📍',  tags: ['gps', 'exif', 'map', 'location', 'photo', 'latitude'],               hasInlineRunner: false },

  // ── Document ─────────────────────────────────────────────────────────────
  { id: 'pdf-merger',         name: 'PDF Merger',            description: 'Merge multiple PDFs into one.',                 category: 'document',         icon: '📎',  tags: ['pdf', 'merge', 'combine', 'document', 'join'],                       hasInlineRunner: false },
  { id: 'pdf-to-image',       name: 'PDF to Image',          description: 'Convert PDF pages to PNG or JPG.',             category: 'document',         icon: '🖼️',  tags: ['pdf', 'image', 'convert', 'png', 'jpg', 'page'],                     hasInlineRunner: false },
  { id: 'pdf-compressor',     name: 'PDF Compressor',        description: 'Reduce PDF file size for sharing.',            category: 'document',         icon: '📦',  tags: ['pdf', 'compress', 'reduce', 'size', 'document'],                     hasInlineRunner: false },

  // ── Text & Code ───────────────────────────────────────────────────────────
  { id: 'json-formatter',     name: 'JSON Formatter',        description: 'Format, validate, and minify JSON.',            category: 'text-code',        icon: '{}',  tags: ['json', 'format', 'validate', 'minify', 'pretty'],                    hasInlineRunner: true  },
  { id: 'base64',             name: 'Base64 Encoder',        description: 'Encode and decode Base64 strings.',             category: 'text-code',        icon: '📦',  tags: ['base64', 'encode', 'decode', 'binary', 'string'],                    hasInlineRunner: true  },
  { id: 'url-encoder',        name: 'URL Encoder',           description: 'Encode and decode URL components.',             category: 'text-code',        icon: '🔗',  tags: ['url', 'encode', 'decode', 'percent', 'uri'],                         hasInlineRunner: true  },
  { id: 'html-entities',      name: 'HTML Entities',         description: 'Encode and decode HTML entities.',              category: 'text-code',        icon: '🏷️',  tags: ['html', 'entities', 'encode', 'decode', 'escape'],                    hasInlineRunner: true  },
  { id: 'jwt-decoder',        name: 'JWT Decoder',           description: 'Decode and inspect JWT tokens.',                category: 'text-code',        icon: '🔑',  tags: ['jwt', 'token', 'decode', 'auth', 'header', 'payload'],               hasInlineRunner: true  },
  { id: 'jwt-generator',      name: 'JWT Generator',         description: 'Generate signed JWT tokens.',                   category: 'text-code',        icon: '🔐',  tags: ['jwt', 'token', 'generate', 'sign', 'auth'],                          hasInlineRunner: false },
  { id: 'regex-tester',       name: 'Regex Tester',          description: 'Test and debug regular expressions live.',      category: 'text-code',        icon: '🔍',  tags: ['regex', 'regexp', 'test', 'pattern', 'match'],                       hasInlineRunner: true  },
  { id: 'diff-checker',       name: 'Diff Checker',          description: 'Compare two texts side by side.',               category: 'text-code',        icon: '↔️',  tags: ['diff', 'compare', 'text', 'changes', 'delta'],                       hasInlineRunner: true  },
  { id: 'markdown-to-html',   name: 'Markdown to HTML',      description: 'Convert Markdown to HTML instantly.',          category: 'text-code',        icon: '📝',  tags: ['markdown', 'html', 'convert', 'render', 'preview'],                  hasInlineRunner: false },
  { id: 'markdown-table',     name: 'Markdown Table',        description: 'Build Markdown tables visually.',               category: 'text-code',        icon: '📋',  tags: ['markdown', 'table', 'csv', 'html', 'grid'],                          hasInlineRunner: false },
  { id: 'code-formatter',     name: 'Code Formatter',        description: 'Format JS, TS, JSON, CSS via Prettier.',       category: 'text-code',        icon: '✨',  tags: ['prettier', 'format', 'beautify', 'code', 'js', 'ts', 'css'],         hasInlineRunner: true  },

  // ── Text tools ────────────────────────────────────────────────────────────
  { id: 'text-case',          name: 'Text Case Converter',   description: 'Convert text between cases.',                  category: 'text-code',        icon: '🔡',  tags: ['case', 'upper', 'lower', 'camel', 'snake', 'text'],                  hasInlineRunner: true  },
  { id: 'word-count',         name: 'Word Count',            description: 'Count words, chars, and reading time.',        category: 'text-code',        icon: '📊',  tags: ['word', 'count', 'character', 'reading', 'time'],                     hasInlineRunner: true  },
  { id: 'char-counter',       name: 'Character Counter',     description: 'Count chars with Twitter/LinkedIn limits.',    category: 'text-code',        icon: '#️⃣', tags: ['character', 'count', 'twitter', 'linkedin', 'limit'],                hasInlineRunner: true  },
  { id: 'lorem-ipsum',        name: 'Lorem Ipsum',           description: 'Generate placeholder text.',                   category: 'text-code',        icon: '📄',  tags: ['lorem', 'ipsum', 'placeholder', 'text', 'generate'],                 hasInlineRunner: true  },

  // ── Audio / Video ─────────────────────────────────────────────────────────
  { id: 'video-to-gif',       name: 'Video to GIF',          description: 'Convert video clips to animated GIFs.',        category: 'audio-video',      icon: '🎞️',  tags: ['video', 'gif', 'convert', 'animate', 'mp4'],                         hasInlineRunner: false },
  { id: 'audio-converter',    name: 'Audio Converter',       description: 'Convert between MP3, WAV, OGG, FLAC.',        category: 'audio-video',      icon: '🎵',  tags: ['audio', 'convert', 'mp3', 'wav', 'ogg', 'flac'],                     hasInlineRunner: false },
  { id: 'audio-trimmer',      name: 'Audio Trimmer',         description: 'Trim audio files in the browser.',             category: 'audio-video',      icon: '✂️',  tags: ['audio', 'trim', 'cut', 'mp3', 'edit'],                               hasInlineRunner: false },
  { id: 'speech-to-text',     name: 'Speech to Text',        description: 'Transcribe speech using your microphone.',     category: 'audio-video',      icon: '🎤',  tags: ['speech', 'text', 'transcribe', 'voice', 'mic'],                      hasInlineRunner: false },
  { id: 'text-to-speech',     name: 'Text to Speech',        description: 'Convert text to spoken audio.',                category: 'audio-video',      icon: '🔊',  tags: ['tts', 'speech', 'audio', 'voice', 'speak'],                          hasInlineRunner: false },

  // ── Design ────────────────────────────────────────────────────────────────
  { id: 'color-converter',    name: 'Colour Converter',      description: 'Convert HEX, RGB, HSL, HSB instantly.',       category: 'design',           icon: '🎨',  tags: ['color', 'colour', 'hex', 'rgb', 'hsl', 'convert'],                   hasInlineRunner: true  },
  { id: 'color-contrast',     name: 'Colour Contrast',       description: 'Check WCAG contrast ratios for accessibility.',category: 'design',           icon: '🔲',  tags: ['color', 'contrast', 'wcag', 'accessibility', 'a11y'],                 hasInlineRunner: false },
  { id: 'gradient-generator', name: 'Gradient Generator',    description: 'Build CSS gradients visually.',                category: 'design',           icon: '🌈',  tags: ['gradient', 'css', 'linear', 'radial', 'generate'],                   hasInlineRunner: false },
  { id: 'box-shadow',         name: 'Box Shadow Generator',  description: 'Design multi-layer CSS box shadows.',          category: 'design',           icon: '🌑',  tags: ['box-shadow', 'css', 'shadow', 'design', 'generator'],                 hasInlineRunner: false },
  { id: 'border-radius',      name: 'Border Radius Visualiser', description: 'Visualise CSS border-radius per corner.',  category: 'design',           icon: '⬜',  tags: ['border-radius', 'css', 'corners', 'design'],                         hasInlineRunner: false },
  { id: 'aspect-ratio',       name: 'Aspect Ratio Calculator', description: 'Calculate and preserve aspect ratios.',     category: 'design',           icon: '📐',  tags: ['aspect', 'ratio', 'dimensions', 'calculate', 'video'],               hasInlineRunner: true  },
  { id: 'color-palette',      name: 'Colour Palette Extractor', description: 'Extract colours from any image.',         category: 'design',           icon: '🎨',  tags: ['color', 'colour', 'palette', 'image', 'extract'],                    hasInlineRunner: false },
  { id: 'random-color',       name: 'Random Colour Generator', description: 'Generate harmonious colour palettes.',     category: 'design',           icon: '🎲',  tags: ['color', 'colour', 'palette', 'random', 'generate', 'harmony'],       hasInlineRunner: false },

  // ── Data ──────────────────────────────────────────────────────────────────
  { id: 'csv-json',           name: 'CSV ↔ JSON',            description: 'Convert between CSV and JSON formats.',        category: 'data',             icon: '📊',  tags: ['csv', 'json', 'convert', 'data', 'table'],                           hasInlineRunner: false },
  { id: 'json-excel',         name: 'JSON to Excel',         description: 'Export JSON data to Excel/CSV.',               category: 'data',             icon: '📈',  tags: ['json', 'excel', 'csv', 'export', 'spreadsheet'],                     hasInlineRunner: false },
  { id: 'fake-data-generator',name: 'Fake Data Generator',   description: 'Generate realistic test data.',                category: 'data',             icon: '🎭',  tags: ['fake', 'data', 'generate', 'test', 'mock', 'name'],                  hasInlineRunner: false },
  { id: 'pomodoro',           name: 'Pomodoro Timer',        description: 'Focus timer with work and break intervals.',   category: 'data',             icon: '⏱️',  tags: ['pomodoro', 'timer', 'focus', 'work', 'break'],                        hasInlineRunner: false },

  // ── Web & SEO ─────────────────────────────────────────────────────────────
  { id: 'meta-tag-generator', name: 'Meta Tag Generator',    description: 'Generate SEO meta tags with live preview.',   category: 'web-seo',          icon: '🏷️',  tags: ['seo', 'meta', 'og', 'twitter', 'html'],                              hasInlineRunner: false },
  { id: 'og-preview',         name: 'Open Graph Preview',    description: 'Preview any URL social sharing card.',        category: 'web-seo',          icon: '👁️',  tags: ['og', 'open-graph', 'preview', 'social', 'twitter'],                  hasInlineRunner: false },
  { id: 'sitemap-generator',  name: 'Sitemap Generator',     description: 'Build sitemap.xml for any URL list.',         category: 'web-seo',          icon: '🗺️',  tags: ['sitemap', 'xml', 'seo', 'urls', 'crawl'],                            hasInlineRunner: false },
  { id: 'robots-txt',         name: 'robots.txt Generator',  description: 'Generate robots.txt with bot presets.',       category: 'web-seo',          icon: '🤖',  tags: ['robots', 'seo', 'crawl', 'bot', 'disallow'],                         hasInlineRunner: false },

  // ── Security / Privacy ────────────────────────────────────────────────────
  { id: 'password-generator', name: 'Password Generator',    description: 'Generate secure, random passwords.',          category: 'privacy-security', icon: '🔐',  tags: ['password', 'secure', 'random', 'generate', 'strong'],                hasInlineRunner: true  },
  { id: 'hash-generator',     name: 'Hash Generator',        description: 'Generate MD5, SHA-1, SHA-256, SHA-512.',     category: 'privacy-security', icon: '#️⃣', tags: ['hash', 'md5', 'sha', 'sha256', 'crypto', 'checksum'],                hasInlineRunner: true  },

  // ── Productivity ──────────────────────────────────────────────────────────
  { id: 'unit-converter',     name: 'Unit Converter',        description: 'Convert length, weight, temp, area.',         category: 'productivity',     icon: '📏',  tags: ['unit', 'convert', 'length', 'weight', 'temperature', 'metric'],      hasInlineRunner: true  },
  { id: 'timezone-converter', name: 'Timezone Converter',    description: 'Convert times between world timezones.',      category: 'productivity',     icon: '🌍',  tags: ['timezone', 'time', 'convert', 'utc', 'world'],                       hasInlineRunner: true  },
  { id: 'unix-timestamp',     name: 'Unix Timestamp',        description: 'Convert timestamps to dates and back.',       category: 'productivity',     icon: '🕐',  tags: ['unix', 'timestamp', 'date', 'epoch', 'iso'],                         hasInlineRunner: true  },
  { id: 'base-converter',     name: 'Number Base Converter', description: 'Convert decimal, hex, binary, octal.',       category: 'productivity',     icon: '🔢',  tags: ['base', 'binary', 'hex', 'octal', 'decimal', 'convert'],              hasInlineRunner: true  },
  { id: 'cron-builder',       name: 'Cron Expression Builder', description: 'Build and validate cron expressions.',     category: 'productivity',     icon: '⏰',  tags: ['cron', 'schedule', 'expression', 'time', 'job'],                     hasInlineRunner: false },
  { id: 'ip-lookup',          name: 'IP Lookup',             description: 'Look up geolocation for any IP address.',    category: 'productivity',     icon: '🌐',  tags: ['ip', 'geolocation', 'isp', 'lookup', 'network'],                     hasInlineRunner: false },
]

// Remove duplicates (color-palette appears in both image and design categories above — deduplicate)
const seen = new Set<string>()
export const uniqueTools = tools.filter(t => {
  if (seen.has(t.id)) return false
  seen.add(t.id)
  return true
})

export function getTool(id: string): Tool | undefined {
  return uniqueTools.find(t => t.id === id)
}

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return uniqueTools.filter(t => t.category === category)
}
