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

export function ImageWatermarkTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [wmMode, setWmMode] = React.useState<WatermarkMode>("text");
  const [wmFile, setWmFile] = React.useState<File | null>(null);
  const [text, setText] = React.useState("© My Name 2025");
  const [fontSize, setFontSize] = React.useState(36);
  const [fontColor, setFontColor] = React.useState("#ffffff");
  const [opacity, setOpacity] = React.useState(70);
  const [position, setPosition] = React.useState<Position>("bottom-right");
  const [margin, setMargin] = React.useState(20);
  const [angle, setAngle] = React.useState(0);
  const [tiled, setTiled] = React.useState(false);
  const [resultBlob, setResultBlob] = React.useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState(false);
  const previewUrl = useFilePreview(file);
  const wmPreviewUrl = useFilePreview(wmFile);
  const wmFileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { return () => { if (resultUrl) URL.revokeObjectURL(resultUrl); }; }, [resultUrl]);

  function getPosOffsets(cw: number, ch: number, ww: number, wh: number): { x: number; y: number } {
    const m = margin;
    const map: Record<Position, { x: number; y: number }> = {
      "top-left": { x: m, y: m },
      "top-center": { x: (cw - ww) / 2, y: m },
      "top-right": { x: cw - ww - m, y: m },
      "center": { x: (cw - ww) / 2, y: (ch - wh) / 2 },
      "bottom-left": { x: m, y: ch - wh - m },
      "bottom-center": { x: (cw - ww) / 2, y: ch - wh - m },
      "bottom-right": { x: cw - ww - m, y: ch - wh - m },
    };
    return map[position];
  }

  async function apply() {
    if (!file) return;
    setProcessing(true);
    try {
      const img = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      ctx.globalAlpha = opacity / 100;
      ctx.save();

      if (wmMode === "text") {
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = fontColor;
        const metrics = ctx.measureText(text);
        const tw = metrics.width, th = fontSize;
        if (tiled) {
          for (let y = 0; y < img.height + th; y += th * 3) {
            for (let x = 0; x < img.width + tw; x += tw + 40) {
              ctx.save();
              ctx.translate(x + tw / 2, y + th / 2);
              ctx.rotate((angle * Math.PI) / 180);
              ctx.fillText(text, -tw / 2, th / 2);
              ctx.restore();
            }
          }
        } else {
          const { x, y } = getPosOffsets(img.width, img.height, tw, th);
          ctx.translate(x + tw / 2, y + th / 2);
          ctx.rotate((angle * Math.PI) / 180);
          ctx.fillText(text, -tw / 2, th / 2);
        }
      } else if (wmFile) {
        const wmImg = await createImageBitmap(wmFile);
        if (tiled) {
          for (let y = 0; y < img.height + wmImg.height; y += wmImg.height * 2) {
            for (let x = 0; x < img.width + wmImg.width; x += wmImg.width * 2) {
              ctx.save();
              ctx.translate(x + wmImg.width / 2, y + wmImg.height / 2);
              ctx.rotate((angle * Math.PI) / 180);
              ctx.drawImage(wmImg, -wmImg.width / 2, -wmImg.height / 2);
              ctx.restore();
            }
          }
        } else {
          const { x, y } = getPosOffsets(img.width, img.height, wmImg.width, wmImg.height);
          ctx.translate(x + wmImg.width / 2, y + wmImg.height / 2);
          ctx.rotate((angle * Math.PI) / 180);
          ctx.drawImage(wmImg, -wmImg.width / 2, -wmImg.height / 2);
        }
      }

      ctx.restore();
      canvas.toBlob(blob => {
        if (!blob) return;
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        setResultBlob(blob);
        setResultUrl(URL.createObjectURL(blob));
      }, file.type === "image/png" ? "image/png" : "image/jpeg", 0.92);
    } finally { setProcessing(false); }
  }

  function reset() { setFile(null); setWmFile(null); if (resultUrl) URL.revokeObjectURL(resultUrl); setResultUrl(null); setResultBlob(null); }

  return (
    <div className="space-y-5 max-w-3xl">
      {!file ? (
        <DropZone accept={ACCEPT} maxSizeMB={25} onFiles={([f]) => setFile(f)} label="Drop image to watermark" sublabel="JPG, PNG, WebP · max 25 MB" />
      ) : (
        <div className="space-y-5">
          {/* Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[{ label: "Original", src: previewUrl }, { label: "Result", src: resultUrl }].map(({ label, src }) => (
              <div key={label} className="space-y-1">
                <span className="text-xs text-muted-foreground">{label}</span>
                <div className="rounded-lg border border-border/60 overflow-hidden bg-secondary/10" style={{ height: 200 }}>
                  {src ? <img src={src} alt={label} className="w-full h-full object-contain" /> : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Apply to preview</div>
                  )}
                </div>
              </div>
            ))}
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
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Watermark text</label>
                  <input id="wm-text" value={text} onChange={e => setText(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="flex items-end gap-3">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-xs text-muted-foreground">Font size</label>
                    <input type="number" id="wm-fontsize" min={10} max={200} value={fontSize} onChange={e => setFontSize(+e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Color</label>
                    <input type="color" value={fontColor} onChange={e => setFontColor(e.target.value)}
                      className="h-10 w-12 rounded border border-input cursor-pointer bg-background p-0.5" />
                  </div>
                </div>
              </>
            ) : (
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
                    <button onClick={() => setWmFile(null)} className="text-[10px] text-muted-foreground hover:text-destructive">Remove</button>
                  </div>
                )}
                <input ref={wmFileRef} type="file" accept="image/*" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) setWmFile(f); }} />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Opacity: {opacity}%</label>
              <Slider min={5} max={100} step={1} value={[opacity]} onValueChange={([v]) => setOpacity(v)} id="wm-opacity" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Angle: {angle}°</label>
              <Slider min={-180} max={180} step={5} value={[angle]} onValueChange={([v]) => setAngle(v)} id="wm-angle" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Margin: {margin}px</label>
              <Slider min={0} max={100} step={2} value={[margin]} onValueChange={([v]) => setMargin(v)} id="wm-margin" />
            </div>
            <div className="space-y-2">
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
            <Button onClick={apply} disabled={processing || (wmMode === "image" && !wmFile)} id="wm-apply">
              {processing ? "Applying…" : "Apply Watermark"}
            </Button>
            {resultBlob && (
              <Button variant="outline" onClick={() => downloadBlob(resultBlob!, file.name.replace(/(\.[^.]+)$/, "_watermarked$1"))} id="wm-download">
                <Download className="h-4 w-4" />Download
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={reset} id="wm-reset" aria-label="Reset">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
