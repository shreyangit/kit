"use client";

import * as React from "react";
import { Download, RotateCcw, Type, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DropZone, useFilePreview } from "@/components/tool-shell/DropZone";
import { downloadBlob } from "@/lib/utils/download";
import { cn } from "@/lib/utils";

type WatermarkMode = "text" | "image";
type Position = "top-left" | "top-center" | "top-right" | "center" | "bottom-left" | "bottom-center" | "bottom-right";

const POSITIONS: Position[] = ["top-left", "top-center", "top-right", "center", "bottom-left", "bottom-center", "bottom-right"];
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const PREVIEW_MAX = 900; // longest side of the live-preview canvas, in px

const FONTS = [
  { value: "sans-serif", label: "Sans" },
  { value: "serif", label: "Serif" },
  { value: "monospace", label: "Mono" },
];

interface RenderOpts {
  mode: WatermarkMode;
  text: string;
  fontSize: number;
  fontColor: string;
  fontFamily: string;
  shadow: boolean;
  opacity: number;
  position: Position;
  margin: number;
  angle: number;
  tiled: boolean;
  wmScale: number; // image watermark width as % of base width
}

// Single render routine used for both the live preview (scaled down) and the
// full-resolution export. `renderScale` multiplies every size so the layout is
// identical at any resolution.
function renderWatermark(
  canvas: HTMLCanvasElement,
  base: CanvasImageSource,
  baseW: number,
  baseH: number,
  wm: CanvasImageSource | null,
  wmW: number,
  wmH: number,
  opts: RenderOpts,
  renderScale: number
) {
  canvas.width = Math.round(baseW * renderScale);
  canvas.height = Math.round(baseH * renderScale);
  const cw = canvas.width;
  const ch = canvas.height;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(base, 0, 0, cw, ch);
  ctx.globalAlpha = opts.opacity / 100;

  const margin = opts.margin * renderScale;
  const rad = (opts.angle * Math.PI) / 180;

  function place(itemW: number, itemH: number): { x: number; y: number } {
    const m = margin;
    const map: Record<Position, { x: number; y: number }> = {
      "top-left": { x: m, y: m },
      "top-center": { x: (cw - itemW) / 2, y: m },
      "top-right": { x: cw - itemW - m, y: m },
      "center": { x: (cw - itemW) / 2, y: (ch - itemH) / 2 },
      "bottom-left": { x: m, y: ch - itemH - m },
      "bottom-center": { x: (cw - itemW) / 2, y: ch - itemH - m },
      "bottom-right": { x: cw - itemW - m, y: ch - itemH - m },
    };
    return map[opts.position];
  }

  if (opts.mode === "text") {
    if (!opts.text) { ctx.globalAlpha = 1; return; }
    const fontPx = opts.fontSize * renderScale;
    ctx.font = `bold ${fontPx}px ${opts.fontFamily}`;
    ctx.fillStyle = opts.fontColor;
    ctx.textBaseline = "middle";
    if (opts.shadow) {
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = fontPx * 0.12;
      ctx.shadowOffsetX = fontPx * 0.04;
      ctx.shadowOffsetY = fontPx * 0.04;
    }
    const metrics = ctx.measureText(opts.text);
    const tw = metrics.width;
    const th = fontPx;
    if (opts.tiled) {
      const stepY = th * 3;
      const stepX = tw + fontPx * 1.2;
      for (let y = th; y < ch + stepY; y += stepY) {
        for (let x = 0; x < cw + stepX; x += stepX) {
          ctx.save();
          ctx.translate(x + tw / 2, y);
          ctx.rotate(rad);
          ctx.fillText(opts.text, -tw / 2, 0);
          ctx.restore();
        }
      }
    } else {
      const { x, y } = place(tw, th);
      ctx.save();
      ctx.translate(x + tw / 2, y + th / 2);
      ctx.rotate(rad);
      ctx.fillText(opts.text, -tw / 2, 0);
      ctx.restore();
    }
  } else if (wm) {
    const drawW = cw * (opts.wmScale / 100);
    const drawH = drawW * (wmH / wmW);
    if (opts.tiled) {
      const stepX = drawW * 1.6;
      const stepY = drawH * 1.6;
      for (let y = 0; y < ch + drawH; y += stepY) {
        for (let x = 0; x < cw + drawW; x += stepX) {
          ctx.save();
          ctx.translate(x + drawW / 2, y + drawH / 2);
          ctx.rotate(rad);
          ctx.drawImage(wm, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.restore();
        }
      }
    } else {
      const { x, y } = place(drawW, drawH);
      ctx.save();
      ctx.translate(x + drawW / 2, y + drawH / 2);
      ctx.rotate(rad);
      ctx.drawImage(wm, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}

export function ImageWatermarkTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [wmMode, setWmMode] = React.useState<WatermarkMode>("text");
  const [wmFile, setWmFile] = React.useState<File | null>(null);
  const [text, setText] = React.useState("© My Name 2025");
  const [fontSize, setFontSize] = React.useState(36);
  const [fontColor, setFontColor] = React.useState("#ffffff");
  const [fontFamily, setFontFamily] = React.useState("sans-serif");
  const [shadow, setShadow] = React.useState(true);
  const [opacity, setOpacity] = React.useState(70);
  const [position, setPosition] = React.useState<Position>("bottom-right");
  const [margin, setMargin] = React.useState(20);
  const [angle, setAngle] = React.useState(0);
  const [tiled, setTiled] = React.useState(false);
  const [wmScale, setWmScale] = React.useState(20);
  const [exporting, setExporting] = React.useState(false);

  const previewUrl = useFilePreview(file);
  const wmPreviewUrl = useFilePreview(wmFile);
  const wmFileRef = React.useRef<HTMLInputElement>(null);
  const previewCanvasRef = React.useRef<HTMLCanvasElement>(null);

  // Decoded sources held in state; setState only ever fires from async
  // callbacks (never synchronously inside an effect body).
  type Decoded = { bmp: ImageBitmap; w: number; h: number };
  const [base, setBase] = React.useState<Decoded | null>(null);
  const [wm, setWm] = React.useState<Decoded | null>(null);

  // Decode base image
  React.useEffect(() => {
    if (!file) return;
    let cancelled = false;
    createImageBitmap(file).then((bmp) => {
      if (cancelled) { bmp.close(); return; }
      setBase((prev) => { prev?.bmp.close(); return { bmp, w: bmp.width, h: bmp.height }; });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [file]);

  // Decode watermark image
  React.useEffect(() => {
    if (!wmFile) return;
    let cancelled = false;
    createImageBitmap(wmFile).then((bmp) => {
      if (cancelled) { bmp.close(); return; }
      setWm((prev) => { prev?.bmp.close(); return { bmp, w: bmp.width, h: bmp.height }; });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [wmFile]);

  const opts: RenderOpts = React.useMemo(() => ({
    mode: wmMode, text, fontSize, fontColor, fontFamily, shadow,
    opacity, position, margin, angle, tiled, wmScale,
  }), [wmMode, text, fontSize, fontColor, fontFamily, shadow, opacity, position, margin, angle, tiled, wmScale]);

  // Live preview — re-renders the canvas (an external system) on every change.
  React.useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!base || !canvas) return;
    const scale = Math.min(1, PREVIEW_MAX / Math.max(base.w, base.h));
    renderWatermark(canvas, base.bmp, base.w, base.h,
      wm?.bmp ?? null, wm?.w ?? 1, wm?.h ?? 1, opts, scale);
  }, [opts, base, wm]);

  async function handleDownload() {
    if (!base || !file || exporting) return;
    setExporting(true);
    try {
      const canvas = document.createElement("canvas");
      renderWatermark(canvas, base.bmp, base.w, base.h,
        wm?.bmp ?? null, wm?.w ?? 1, wm?.h ?? 1, opts, 1);
      const type = file.type === "image/png" ? "image/png"
        : file.type === "image/webp" ? "image/webp" : "image/jpeg";
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, type, 0.92));
      if (blob) downloadBlob(blob, file.name.replace(/(\.[^.]+)$/, "_watermarked$1"));
    } finally {
      setExporting(false);
    }
  }

  function reset() {
    setFile(null);
    setWmFile(null);
    setBase((prev) => { prev?.bmp.close(); return null; });
    setWm((prev) => { prev?.bmp.close(); return null; });
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {!file ? (
        <DropZone accept={ACCEPT} maxSizeMB={25} onFiles={([f]) => setFile(f)} label="Drop image to watermark" sublabel="JPG, PNG, WebP · max 25 MB · live preview" />
      ) : (
        <div className="space-y-5">
          {/* Live preview */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Live preview</span>
              <span className="text-[10px] text-muted-foreground">Updates as you tweak · exports at full resolution</span>
            </div>
            <div
              className="rounded-lg border border-border/60 overflow-hidden flex items-center justify-center"
              style={{
                minHeight: 220,
                backgroundImage: [
                  "linear-gradient(45deg, var(--border) 25%, transparent 25%)",
                  "linear-gradient(-45deg, var(--border) 25%, transparent 25%)",
                  "linear-gradient(45deg, transparent 75%, var(--border) 75%)",
                  "linear-gradient(-45deg, transparent 75%, var(--border) 75%)",
                ].join(", "),
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                backgroundColor: "var(--muted)",
              }}
            >
              {previewUrl && (
                <canvas ref={previewCanvasRef} className="max-w-full object-contain" style={{ maxHeight: 440 }} />
              )}
            </div>
          </div>

          {/* Watermark mode */}
          <div className="flex gap-1.5">
            <button onClick={() => setWmMode("text")} id="wm-mode-text"
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors", wmMode === "text" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
              <Type className="h-3.5 w-3.5" />Text
            </button>
            <button onClick={() => setWmMode("image")} id="wm-mode-image"
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors", wmMode === "image" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
              <ImageIcon className="h-3.5 w-3.5" />Image / Logo
            </button>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {wmMode === "text" ? (
              <>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs text-muted-foreground">Watermark text</label>
                  <input id="wm-text" value={text} onChange={e => setText(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="flex items-end gap-3">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-xs text-muted-foreground">Font size</label>
                    <input type="number" id="wm-fontsize" min={10} max={400} value={fontSize} onChange={e => setFontSize(+e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Color</label>
                    <input type="color" value={fontColor} onChange={e => setFontColor(e.target.value)}
                      className="h-10 w-12 rounded border border-input cursor-pointer bg-background p-0.5" />
                  </div>
                </div>
                <div className="flex items-end gap-3">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-xs text-muted-foreground">Font</label>
                    <div className="flex gap-1.5">
                      {FONTS.map(f => (
                        <button key={f.value} onClick={() => setFontFamily(f.value)} id={`wm-font-${f.value}`}
                          className={cn("flex-1 py-2 rounded-md text-xs transition-colors", fontFamily === f.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80")}
                          style={{ fontFamily: f.value }}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none pb-2.5">
                    <input type="checkbox" checked={shadow} onChange={e => setShadow(e.target.checked)} className="rounded" id="wm-shadow" />
                    Shadow
                  </label>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs text-muted-foreground">Logo / watermark image (PNG with transparency recommended)</label>
                  {!wmFile ? (
                    <button onClick={() => wmFileRef.current?.click()}
                      className="w-full rounded-md border border-dashed border-border/60 py-6 text-xs text-muted-foreground hover:border-primary/40 transition-colors">
                      Click to select logo image
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      {wmPreviewUrl && <img src={wmPreviewUrl} alt="wm" className="h-10 w-auto rounded" />}
                      <span className="text-xs text-muted-foreground truncate flex-1">{wmFile.name}</span>
                      <button onClick={() => { setWmFile(null); setWm((prev) => { prev?.bmp.close(); return null; }); }} className="text-[10px] text-muted-foreground hover:text-destructive">Remove</button>
                    </div>
                  )}
                  <input ref={wmFileRef} type="file" accept="image/*" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) setWmFile(f); }} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs text-muted-foreground">Logo size: {wmScale}% of image width</label>
                  <Slider min={2} max={100} step={1} value={[wmScale]} onValueChange={([v]) => setWmScale(v)} id="wm-scale" />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Opacity: {opacity}%</label>
              <Slider min={5} max={100} step={1} value={[opacity]} onValueChange={([v]) => setOpacity(v)} id="wm-opacity" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Angle: {angle}°</label>
              <Slider min={-180} max={180} step={5} value={[angle]} onValueChange={([v]) => setAngle(v)} id="wm-angle" />
            </div>
            <div className={cn("space-y-1.5", tiled && "opacity-50 pointer-events-none")}>
              <label className="text-xs text-muted-foreground">Margin: {margin}px</label>
              <Slider min={0} max={200} step={2} value={[margin]} onValueChange={([v]) => setMargin(v)} id="wm-margin" />
            </div>
            <div className={cn("space-y-2", tiled && "opacity-50 pointer-events-none")}>
              <label className="text-xs text-muted-foreground">Position</label>
              <div className="grid grid-cols-3 gap-1">
                {POSITIONS.map(p => (
                  <button key={p} onClick={() => setPosition(p)} id={`wm-pos-${p}`}
                    className={cn("py-1 rounded text-[10px] capitalize transition-colors", position === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80")}>
                    {p.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input type="checkbox" checked={tiled} onChange={e => setTiled(e.target.checked)} className="rounded" id="wm-tiled" />
            Tile watermark across entire image
          </label>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleDownload} disabled={exporting || (wmMode === "image" && !wm)} id="wm-download">
              {exporting ? (
                <><span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> Exporting…</>
              ) : (
                <><Download className="h-4 w-4" />Download</>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={reset} id="wm-reset" aria-label="Reset">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
