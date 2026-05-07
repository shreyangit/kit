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
    description: "Remove image backgrounds instantly in your browser. No server uploads.",
    category: "image",
    icon: "Scissors",
    tags: ["background", "remove", "transparent", "png", "photo", "cutout"],
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
    description: "Merge multiple PDFs or extract specific pages — all in-browser.",
    category: "document",
    icon: "FilePlus",
    tags: ["pdf", "merge", "split", "combine", "extract", "pages"],
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
    description: "Export PDF pages as PNG at 72, 150, or 300 DPI.",
    category: "document",
    icon: "FileImage",
    tags: ["pdf", "image", "png", "convert", "export", "dpi"],
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
    description: "Convert between HEX, RGB, HSL, HSV, CMYK with WCAG contrast ratios.",
    category: "design",
    icon: "Pipette",
    tags: ["color", "hex", "rgb", "hsl", "picker", "convert", "wcag"],
  },
  {
    id: "markdown-to-html",
    name: "Markdown → HTML",
    description: "Convert Markdown to HTML with live split-pane preview.",
    category: "text-code",
    icon: "FileCode",
    tags: ["markdown", "html", "convert", "preview", "md"],
  },
  {
    id: "csv-json",
    name: "CSV ↔ JSON",
    description: "Convert between CSV and JSON formats with auto-type detection.",
    category: "data",
    icon: "Table",
    tags: ["csv", "json", "convert", "data", "spreadsheet"],
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
