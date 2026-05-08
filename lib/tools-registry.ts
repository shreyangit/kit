// Single source of truth for all tools metadata
// The dashboard, search, sitemap, and extension all read from this file.

export type ToolCategory =
  | "image"
  | "document"
  | "audio-video"
  | "text-code"
  | "productivity"
  | "privacy-security"
  | "design"
  | "data"
  | "web-seo"
  | "writing";

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  tags: string[];
  isNew?: boolean;
  isImplemented?: boolean;
}

export const categoryMeta: Record<
  ToolCategory,
  { label: string; icon: string }
> = {
  image: { label: "Image", icon: "Image" },
  document: { label: "Document", icon: "FileText" },
  "audio-video": { label: "Audio & Video", icon: "Play" },
  "text-code": { label: "Text & Code", icon: "Code2" },
  productivity: { label: "Productivity", icon: "Zap" },
  "privacy-security": { label: "Privacy & Security", icon: "ShieldCheck" },
  design: { label: "Design", icon: "Palette" },
  data: { label: "Data", icon: "Database" },
  "web-seo": { label: "Web & SEO", icon: "Globe" },
  writing: { label: "Writing", icon: "PenLine" },
};

export const tools: Tool[] = [
  // ── BATCH 1: Text & Code (no heavy deps) ──────────────────────────────────
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format, validate, and minify JSON with syntax highlighting.",
    category: "text-code",
    icon: "Braces",
    tags: ["json", "format", "validate", "minify", "pretty", "code"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "text-case",
    name: "Text Case Converter",
    description:
      "Convert between camelCase, snake_case, UPPER, Title, kebab-case and more.",
    category: "text-code",
    icon: "CaseSensitive",
    tags: ["case", "text", "camel", "snake", "pascal", "kebab", "upper", "lower"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "word-count",
    name: "Word Count",
    description:
      "Words, characters, sentences, reading time, and Flesch readability score.",
    category: "writing",
    icon: "AlignLeft",
    tags: ["word", "count", "characters", "reading", "flesch", "readability"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "password-generator",
    name: "Password Generator",
    description:
      "Cryptographically secure passwords and passphrases with strength meter.",
    category: "privacy-security",
    icon: "KeyRound",
    tags: ["password", "generate", "secure", "crypto", "passphrase", "random"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "base64",
    name: "Base64 Encoder / Decoder",
    description: "Encode and decode Base64 for text and files.",
    category: "text-code",
    icon: "Binary",
    tags: ["base64", "encode", "decode", "text", "file", "data url"],
    isNew: true,
    isImplemented: true,
  },

  // ── Coming soon ───────────────────────────────────────────────────────────
  {
    id: "background-remover",
    name: "Background Remover",
    description: "Remove image backgrounds with AI running in your browser. Download as transparent PNG.",
    category: "image",
    icon: "Scissors",
    tags: ["background", "remove", "transparent", "png", "photo", "cutout", "ai"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    description: "Compress JPG, PNG, and WebP images without visible quality loss.",
    category: "image",
    icon: "PackageMinus",
    tags: ["compress", "image", "jpg", "png", "webp", "size", "optimize"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "pdf-merger",
    name: "PDF Merger & Splitter",
    description: "Merge multiple PDFs or extract page ranges. Reorder files before merging.",
    category: "document",
    icon: "FilePlus",
    tags: ["pdf", "merge", "split", "combine", "extract", "pages"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "image-converter",
    name: "Image Format Converter",
    description: "Convert between JPG, PNG, WebP, AVIF, GIF, and more.",
    category: "image",
    icon: "RefreshCw",
    tags: ["convert", "image", "jpg", "png", "webp", "avif", "format"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "image-resizer",
    name: "Image Resizer",
    description: "Resize by pixels or percentage, with social media presets and aspect ratio lock.",
    category: "image",
    icon: "Crop",
    tags: ["resize", "crop", "image", "dimensions", "aspect ratio", "social"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "pdf-to-image",
    name: "PDF to Image",
    description: "Export PDF pages as PNG or JPG at 72–300 DPI. Thumbnail grid with per-page download.",
    category: "document",
    icon: "FileImage",
    tags: ["pdf", "image", "png", "jpg", "convert", "export", "dpi"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512 hashes for text and files.",
    category: "privacy-security",
    icon: "Hash",
    tags: ["hash", "md5", "sha256", "sha512", "checksum", "crypto", "file integrity"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "regex-tester",
    name: "Regex Tester",
    description: "Test regular expressions with real-time match highlighting and group extraction.",
    category: "text-code",
    icon: "Search",
    tags: ["regex", "regular expression", "test", "match", "pattern", "flags"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "qr-code",
    name: "QR Code Generator",
    description: "Generate QR codes for URLs, text, email, WiFi, vCard, phone, and SMS.",
    category: "productivity",
    icon: "QrCode",
    tags: ["qr", "qrcode", "generate", "url", "text", "wifi", "vcard", "email"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "unit-converter",
    name: "Unit Converter",
    description: "Convert length, weight, temperature, area, volume, speed, data, and time.",
    category: "productivity",
    icon: "ArrowLeftRight",
    tags: ["unit", "convert", "length", "weight", "temperature", "area", "speed", "data"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "color-converter",
    name: "Color Picker & Converter",
    description: "Convert between HEX, RGB, HSL, HSV, CMYK. WCAG contrast ratios and color history.",
    category: "design",
    icon: "Pipette",
    tags: ["color", "hex", "rgb", "hsl", "picker", "convert", "wcag", "contrast"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "markdown-to-html",
    name: "Markdown → HTML",
    description: "Convert Markdown to HTML with live split-pane preview and formatting toolbar.",
    category: "text-code",
    icon: "FileCode",
    tags: ["markdown", "html", "convert", "preview", "md", "editor"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "csv-json",
    name: "CSV ↔ JSON",
    description: "Convert between CSV and JSON. Custom delimiters, preview table, file upload.",
    category: "data",
    icon: "Table",
    tags: ["csv", "json", "convert", "data", "spreadsheet", "delimiter"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "color-palette",
    name: "Color Palette Extractor",
    description: "Extract dominant colors from any image with HEX, RGB, and HSL values.",
    category: "design",
    icon: "Palette",
    tags: ["color", "palette", "extract", "image", "swatch", "dominant"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "diff-checker",
    name: "Diff Checker",
    description: "Compare two texts with line, word, or character diffs. Split and unified views.",
    category: "text-code",
    icon: "GitCompare",
    tags: ["diff", "compare", "text", "difference", "changes", "patch"],
    isNew: true,
    isImplemented: true,
  },

  // ── BATCH 5: Part 2 tools ──────────────────────────────────────────────────
  {
    id: "url-encoder",
    name: "URL Encoder / Decoder",
    description: "Encode or decode URLs in 4 modes: URI Component, Full URI, Base64, Form. Parses query params.",
    category: "web-seo",
    icon: "Globe",
    tags: ["url", "encode", "decode", "uri", "base64", "query", "params", "percent"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "base-converter",
    name: "Number Base Converter",
    description: "Convert numbers between Binary, Octal, Decimal, Hex, Base32, Base36. BigInt precision.",
    category: "text-code",
    icon: "Binary",
    tags: ["binary", "hex", "octal", "decimal", "base", "convert", "number", "bigint"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "char-counter",
    name: "Character & Byte Counter",
    description: "Count chars, words, bytes (UTF-8/16), reading time. Word frequency, platform limits.",
    category: "writing",
    icon: "AlignLeft",
    tags: ["character", "byte", "counter", "utf8", "utf16", "word", "frequency", "reading"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "lorem-ipsum",
    name: "Lorem Ipsum Generator",
    description: "Generate placeholder text by paragraphs, sentences, or words. Plain, HTML, or Markdown output.",
    category: "writing",
    icon: "PenLine",
    tags: ["lorem", "ipsum", "placeholder", "text", "generator", "paragraph", "dummy"],
    isNew: true,
    isImplemented: true,
  },
  {
    id: "jwt-decoder",
    name: "JWT Decoder",
    description: "Decode JSON Web Tokens client-side. View header, payload, expiry, and standard claims.",
    category: "privacy-security",
    icon: "ShieldCheck",
    tags: ["jwt", "json", "token", "decode", "auth", "bearer", "claims", "expiry"],
    isNew: true,
    isImplemented: true,
  },
];

export function getToolById(id: string): Tool | undefined {
  return tools.find((t) => t.id === id);
}

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return tools.filter((t) => t.category === category);
}

export function searchTools(query: string): Tool[] {
  const q = query.toLowerCase().trim();
  if (!q) return tools;
  return tools.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.includes(q))
  );
}
