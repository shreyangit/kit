"use client";

import * as React from "react";
import { Download, Upload, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/utils/download";
import { cn } from "@/lib/utils";

const PNG_SIZES = [16, 32, 48, 64, 180, 192, 512];
const ICO_SIZES = [16, 32];

const HTML_SNIPPET = `<!-- Paste into your <head> -->
<link rel="icon" type="image/x-icon" href="/favicons/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicons/favicon-180x180.png">
<link rel="icon" type="image/png" sizes="192x192" href="/favicons/favicon-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/favicons/favicon-512x512.png">
<link rel="manifest" href="/site.webmanifest">`;

async function resizeToCanvas(img: HTMLImageElement, size: number): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, size, size);
  return canvas;
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise(res => canvas.toBlob(b => res(b!), "image/png", 1.0));
}

async function buildIco(pngBlobs: Blob[]): Promise<Blob> {
  const bufs = await Promise.all(pngBlobs.map(b => b.arrayBuffer()));
  const ENTRY = 16, ICONDIR = 6;
  const headerSize = ICONDIR + ENTRY * bufs.length;
  let offset = headerSize;
  const header = new DataView(new ArrayBuffer(headerSize));
  header.setUint16(0, 0, true); header.setUint16(2, 1, true); header.setUint16(4, bufs.length, true);
  const sizes = ICO_SIZES;
  bufs.forEach((buf, i) => {
    const base = ICONDIR + i * ENTRY;
    const s = sizes[i];
    header.setUint8(base, s === 256 ? 0 : s); header.setUint8(base + 1, s === 256 ? 0 : s);
    header.setUint8(base + 2, 0); header.setUint8(base + 3, 0);
    header.setUint16(base + 4, 1, true); header.setUint16(base + 6, 32, true);
    header.setUint32(base + 8, buf.byteLength, true); header.setUint32(base + 12, offset, true);
    offset += buf.byteLength;
  });
  return new Blob([header.buffer, ...bufs], { type: "image/x-icon" });
}

export function FaviconGeneratorTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [previews, setPreviews] = React.useState<{ size: number; url: string }[]>([]);
  const [generating, setGenerating] = React.useState(false);
  const [generated, setGenerated] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [htmlCopied, setHtmlCopied] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const zipBlobRef = React.useRef<Blob | null>(null);

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previews.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, []);

  function handleFile(f: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f); setPreviewUrl(URL.createObjectURL(f));
    setGenerated(false); setPreviews([]); zipBlobRef.current = null;
  }

  async function generate() {
    if (!file) return;
    setGenerating(true); setProgress(0);
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = url; });
      URL.revokeObjectURL(url);

      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const folder = zip.folder("favicons")!;
      const newPreviews: { size: number; url: string }[] = [];
      const total = PNG_SIZES.length + ICO_SIZES.length + 1;
      let done = 0;

      // PNGs
      const pngBlobs: Map<number, Blob> = new Map();
      for (const size of PNG_SIZES) {
        const canvas = await resizeToCanvas(img, size);
        const blob = await canvasToBlob(canvas);
        pngBlobs.set(size, blob);
        folder.file(`favicon-${size}x${size}.png`, blob);
        if (size <= 64 || size === 192) newPreviews.push({ size, url: URL.createObjectURL(blob) });
        done++; setProgress(Math.round((done / total) * 90));
      }

      // ICO
      const icoBlobs = ICO_SIZES.map(s => pngBlobs.get(s)!);
      const ico = await buildIco(icoBlobs);
      folder.file("favicon.ico", ico); done++; setProgress(Math.round((done / total) * 90));

      // HTML snippet
      folder.file("snippet.html", HTML_SNIPPET);

      // Webmanifest
      const manifest = JSON.stringify({ name: "App", icons: [{ src: "/favicons/favicon-192x192.png", sizes: "192x192", type: "image/png" }, { src: "/favicons/favicon-512x512.png", sizes: "512x512", type: "image/png" }], theme_color: "#ffffff", background_color: "#ffffff", display: "standalone" }, null, 2);
      folder.file("site.webmanifest", manifest);

      const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
      zipBlobRef.current = zipBlob;
      setPreviews(newPreviews);
      setGenerated(true); setProgress(100);
    } finally { setGenerating(false); }
  }

  async function copyHtml() {
    await navigator.clipboard.writeText(HTML_SNIPPET);
    setHtmlCopied(true); setTimeout(() => setHtmlCopied(false), 1500);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Upload */}
      {!file ? (
        <button onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="w-full rounded-lg border-2 border-dashed border-border/60 bg-secondary/10 hover:border-primary/40 hover:bg-secondary/20 transition-colors py-14 flex flex-col items-center gap-3 cursor-pointer" id="fav-dropzone">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Drop image or tap to select</p>
            <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, SVG · ideally square, 512×512 or larger</p>
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-3">
          {previewUrl && <img src={previewUrl} alt="source" className="h-14 w-14 rounded-md object-contain border border-border/40" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreviewUrl(null); setGenerated(false); setPreviews([]); }} className="shrink-0 gap-1">
            Change
          </Button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {/* Generate */}
      {file && !generated && (
        <div className="space-y-3">
          <Button onClick={generate} disabled={generating} id="fav-generate" className="gap-2">
            {generating ? "Generating…" : "Generate Favicons"}
          </Button>
          {generating && (
            <div className="space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">Generating {progress < 90 ? "PNGs…" : "ZIP…"}</p>
            </div>
          )}
        </div>
      )}

      {/* Previews */}
      {generated && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground">Preview</span>
            <div className="flex items-end gap-3 flex-wrap">
              {previews.map(p => (
                <div key={p.size} className="flex flex-col items-center gap-1">
                  <div className={cn("rounded border border-border/60 overflow-hidden flex items-center justify-center bg-secondary/20",
                    p.size <= 32 ? "w-10 h-10" : p.size <= 48 ? "w-12 h-12" : "w-16 h-16"
                  )}>
                    <img src={p.url} alt={`${p.size}px`} style={{ width: p.size > 48 ? 48 : p.size, height: p.size > 48 ? 48 : p.size }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{p.size}×{p.size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Output summary */}
          <div className="rounded-lg border border-border/60 bg-card px-4 py-3 space-y-1 text-xs text-muted-foreground">
            <p className="font-medium text-foreground text-sm mb-2">Contents of favicons.zip</p>
            {PNG_SIZES.map(s => <p key={s} className="font-mono">favicon-{s}x{s}.png</p>)}
            <p className="font-mono">favicon.ico <span className="text-muted-foreground/60">(16×16 + 32×32 embedded)</span></p>
            <p className="font-mono">snippet.html <span className="text-muted-foreground/60">(HTML &lt;head&gt; snippet)</span></p>
            <p className="font-mono">site.webmanifest <span className="text-muted-foreground/60">(PWA manifest)</span></p>
          </div>

          {/* HTML snippet */}
          <div className="rounded-lg border border-border/60 bg-secondary/10 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">HTML snippet</span>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={copyHtml} id="fav-copy-html">
                {htmlCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {htmlCopied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <pre className="font-mono text-[10px] text-muted-foreground overflow-x-auto whitespace-pre-wrap">{HTML_SNIPPET}</pre>
          </div>

          {/* Download */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => downloadBlob(zipBlobRef.current!, "favicons.zip")} id="fav-download" className="gap-2">
              <Download className="h-4 w-4" />Download favicons.zip
            </Button>
            <Button variant="outline" onClick={generate} id="fav-regenerate" className="gap-2">
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
