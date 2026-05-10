"use client";

import * as React from "react";
import { Download, RotateCcw, Copy, Share2, Grid2x2, Square, Moon, ArrowLeftRight, Wand2, CloudDownload, Link as LinkIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropZone, useFilePreview, formatSize } from "@/components/tool-shell/DropZone";
import { downloadBlob } from "@/lib/utils/download";
import { cn } from "@/lib/utils";
import { BG_API_URL } from "./config";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

// Edge refinement utility
async function refineEdges(imageBlob: Blob, blurAmount: number): Promise<Blob> {
  if (blurAmount === 0) return imageBlob;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(imageBlob);
      // Basic feathering by drawing with a slight blur, then compositing
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((b) => resolve(b || imageBlob), "image/png");
    };
    img.src = URL.createObjectURL(imageBlob);
  });
}

// Inject "Made with kit" tEXt metadata into a PNG blob
async function injectPngMetadata(blob: Blob): Promise<Blob> {
  const buf = await blob.arrayBuffer();
  const src = new Uint8Array(buf);

  // Build tEXt chunk: keyword + \0 + text
  const keyword = "Comment";
  const text = "Made with kit — kit.shreyannarula.com";
  const chunkData = new TextEncoder().encode(keyword + "\0" + text);
  const chunkLen = chunkData.length;

  // CRC32 implementation (no deps)
  const crcTable = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })();
  function crc32(data: Uint8Array) {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  const typeBytes = new TextEncoder().encode("tEXt");
  const chunkBody = new Uint8Array(typeBytes.length + chunkData.length);
  chunkBody.set(typeBytes, 0);
  chunkBody.set(chunkData, typeBytes.length);
  const crc = crc32(chunkBody);

  // Length (4B) + type (4B) + data + CRC (4B)
  const textChunk = new Uint8Array(4 + 4 + chunkLen + 4);
  const view = new DataView(textChunk.buffer);
  view.setUint32(0, chunkLen, false);
  textChunk.set(typeBytes, 4);
  textChunk.set(chunkData, 8);
  view.setUint32(8 + chunkLen, crc, false);

  // Insert after IHDR chunk (bytes 0-7 = PNG sig, 8-20 = IHDR length+type, 21+4+4 = IHDR data+crc)
  // IHDR is always the first chunk: sig(8) + length(4) + IHDR(4) + data(13) + crc(4) = 33 bytes
  const insertAt = 33;
  const result = new Uint8Array(src.length + textChunk.length);
  result.set(src.slice(0, insertAt), 0);
  result.set(textChunk, insertAt);
  result.set(src.slice(insertAt), insertAt + textChunk.length);

  return new Blob([result], { type: "image/png" });
}

// Composite background utility
async function compositeBackground(
  fgBlob: Blob,
  bgType: "transparent" | "color" | "image",
  color: string,
  bgBlob: Blob | null,
  format: "image/png" | "image/jpeg" | "image/webp" = "image/png"
): Promise<Blob> {
  if (bgType === "transparent" && format === "image/png") return fgBlob;

  return new Promise((resolve, reject) => {
    const fgImg = new Image();
    fgImg.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = fgImg.width;
      canvas.height = fgImg.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("No context");

      const drawFgAndResolve = () => {
        ctx.drawImage(fgImg, 0, 0);
        canvas.toBlob((b) => (b ? resolve(b) : reject("Blob failed")), format, 0.95);
      };

      if (bgType === "color") {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawFgAndResolve();
      } else if (bgType === "image" && bgBlob) {
        const bgImg = new Image();
        bgImg.onload = () => {
          // Cover logic
          const scale = Math.max(canvas.width / bgImg.width, canvas.height / bgImg.height);
          const x = (canvas.width / scale - bgImg.width) / 2;
          const y = (canvas.height / scale - bgImg.height) / 2;
          ctx.drawImage(bgImg, x * scale, y * scale, bgImg.width * scale, bgImg.height * scale);
          drawFgAndResolve();
        };
        bgImg.src = URL.createObjectURL(bgBlob);
      } else {
        if (format === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        drawFgAndResolve();
      }
    };
    fgImg.src = URL.createObjectURL(fgBlob);
  });
}

function humanizeError(e: any): string {
  const msg = String(e.message || e).toLowerCase();
  if (msg.includes("fetch") || msg.includes("network")) return "Network error. Check your connection and try again.";
  if (msg.includes("webassembly") || msg.includes("wasm")) return "WebAssembly error. Try Chrome or Firefox.";
  if (msg.includes("memory") || msg.includes("oom")) return "Image too complex. Try a smaller image.";
  return "Processing failed. Please try a different image.";
}

export function BackgroundRemoverTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [resultBlob, setResultBlob] = React.useState<Blob | null>(null);
  const [processing, setProcessing] = React.useState(false);
  const [progressText, setProgressText] = React.useState("");
  const [progressPct, setProgressPct] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [sliderPos, setSliderPos] = React.useState(50);
  const [mode, setMode] = React.useState<"browser" | "api">("browser");
  
  // Customization state
  const [previewBg, setPreviewBg] = React.useState<"checker" | "white" | "dark">("checker");
  const [customBgType, setCustomBgType] = React.useState<"transparent" | "color" | "image">("transparent");
  const [customBgColor, setCustomBgColor] = React.useState("#ffffff");
  const [customBgBlob, setCustomBgBlob] = React.useState<Blob | null>(null);
  const [edgeBlur, setEdgeBlur] = React.useState(0);
  const [finalBlob, setFinalBlob] = React.useState<Blob | null>(null);

  // Extras
  const [urlInput, setUrlInput] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [hasWasm, setHasWasm] = React.useState(true);

  const originalUrl = useFilePreview(file);
  const resultUrl = useFilePreview(finalBlob as File | null);

  React.useEffect(() => {
    setHasWasm(typeof WebAssembly !== "undefined");
  }, []);

  // Update final blob when customization changes
  React.useEffect(() => {
    if (!resultBlob) return;
    const updateFinal = async () => {
      const refined = await refineEdges(resultBlob, edgeBlur);
      const composited = await compositeBackground(refined, customBgType, customBgColor, customBgBlob, "image/png");
      setFinalBlob(composited);
    };
    updateFinal();
  }, [resultBlob, edgeBlur, customBgType, customBgColor, customBgBlob]);

  const processImage = async (imgFile: File) => {
    setProcessing(true);
    setError(null);
    setProgressPct(0);
    setProgressText("Initializing...");

    try {
      if (mode === "api") {
        setProgressText("Uploading to API...");
        setProgressPct(20);
        const formData = new FormData();
        formData.append("file", imgFile);
        const res = await fetch(BG_API_URL, { method: "POST", body: formData });
        if (!res.ok) throw new Error(await res.text());
        setProgressPct(90);
        setProgressText("Receiving result...");
        const blob = await res.blob();
        setResultBlob(blob);
      } else {
        const { removeBackground } = await import("@imgly/background-removal");
        const blob = await removeBackground(imgFile, {
          progress: (key: string, current: number, total: number) => {
            if (total > 0) {
              const pct = Math.round((current / total) * 100);
              setProgressPct(pct);
              if (key.includes("fetch")) setProgressText(`Downloading AI model (one-time)… ${pct}%`);
              else if (key.includes("infer")) setProgressText(`Removing background… ${pct}%`);
              else setProgressText(`${key} ${pct}%`);
            }
          },
        });
        setResultBlob(blob);
      }
    } catch (e) {
      setError(humanizeError(e));
    } finally {
      setProcessing(false);
      setProgressText("");
      setProgressPct(0);
    }
  };

  function handleStart(selectedFile: File) {
    setFile(selectedFile);
    setResultBlob(null);
    setFinalBlob(null);
    processImage(selectedFile);
  }

  function handleRetry() {
    if (file) processImage(file);
  }

  async function handleUrlLoad() {
    if (!urlInput) return;
    try {
      setProcessing(true);
      const res = await fetch(urlInput);
      if (!res.ok) throw new Error("Could not fetch image");
      const blob = await res.blob();
      const f = new File([blob], "image.png", { type: blob.type || "image/png" });
      handleStart(f);
    } catch (e) {
      setError("Image URL must allow cross-origin access (CORS). Try downloading it instead.");
      setProcessing(false);
    }
  }

  async function handleSample(name: string) {
    try {
      const res = await fetch(`/samples/sample-${name}.png`);
      const blob = await res.blob();
      const f = new File([blob], `sample-${name}.png`, { type: "image/png" });
      handleStart(f);
    } catch (e) {
      console.error(e);
    }
  }

  function handleReset() {
    setFile(null);
    setResultBlob(null);
    setFinalBlob(null);
    setError(null);
    setCustomBgType("transparent");
    setEdgeBlur(0);
  }

  async function downloadFormat(type: "png" | "jpeg" | "webp") {
    if (!resultBlob || !file) return;
    // Always work from raw AI result, apply user preferences fresh on download
    const refined = edgeBlur > 0 ? await refineEdges(resultBlob, edgeBlur) : resultBlob;
    // For non-PNG formats, fall back to white if user chose transparent (JPEG/WebP can't be transparent)
    const bgTypeForDl = type !== "png" && customBgType === "transparent" ? "color" : customBgType;
    const bgColorForDl = bgTypeForDl === "color" && customBgType === "transparent" ? "#ffffff" : customBgColor;
    let outBlob = await compositeBackground(refined, bgTypeForDl, bgColorForDl, customBgBlob, `image/${type}` as "image/png" | "image/jpeg" | "image/webp");
    if (type === "png") outBlob = await injectPngMetadata(outBlob);
    const name = file.name.replace(/\.[^.]+$/, `_nobg.${type === "jpeg" ? "jpg" : type}`);
    downloadBlob(outBlob, name);
  }

  async function copyToClipboard() {
    if (!finalBlob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": finalBlob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Clipboard write failed", e);
    }
  }

  function shareToX() {
    const text = encodeURIComponent("Removed a background in seconds with kit (free, in-browser, no upload) 🚀");
    const url = encodeURIComponent("https://kit.shreyannarula.com/tools/background-remover");
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  }

  if (!hasWasm) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        Your browser does not support WebAssembly, which is required for the in-browser model. Please use Chrome, Firefox, or Edge.
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {!file ? (
        <div className="max-w-3xl mx-auto space-y-6 pt-4">
          {/* Mode Toggle (Sleek inline version) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border bg-secondary/5 px-5 py-4">
            <div className="space-y-1">
              <p className="text-base font-medium">Processing Engine</p>
              <p className="text-sm text-muted-foreground">
                {mode === "browser" 
                  ? "Runs instantly and privately in your browser." 
                  : "Uses high-quality cloud AI. Free fallback to CPU."}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-background border px-3 py-1.5 rounded-full shadow-sm">
              <span className={cn("text-sm", mode === "browser" ? "font-medium" : "text-muted-foreground")}>Private</span>
              <Switch checked={mode === "api"} onCheckedChange={(c) => setMode(c ? "api" : "browser")} />
              <span className={cn("text-sm", mode === "api" ? "font-medium" : "text-muted-foreground")}>Cloud API</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>Great for:</span>
            <span className="px-3 py-1 rounded-full bg-secondary/50 border">Portraits</span>
            <span className="px-3 py-1 rounded-full bg-secondary/50 border">Products</span>
            <span className="px-3 py-1 rounded-full bg-secondary/50 border">Logos</span>
          </div>

          <div className="shadow-sm">
            <DropZone
              accept={ACCEPT}
              maxSizeMB={20}
              onFiles={([f]) => handleStart(f)}
              label="Drop image to remove background"
              sublabel="JPG, PNG, WebP · max 20 MB · paste from clipboard supported"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Or paste image URL..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="text-sm h-11"
              onKeyDown={(e) => e.key === "Enter" && handleUrlLoad()}
            />
            <Button variant="secondary" onClick={handleUrlLoad} disabled={!urlInput} className="shrink-0 h-11 px-6">
              <LinkIcon className="h-4 w-4 mr-2" /> Load Image
            </Button>
          </div>

          <div className="pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-4">Try a sample image:</p>
            <div className="flex gap-4">
              {["portrait", "product", "logo"].map((name) => (
                <button
                  key={name}
                  onClick={() => handleSample(name)}
                  className="h-20 w-20 rounded-xl border overflow-hidden hover:border-primary hover:ring-2 ring-primary/20 transition-all bg-secondary/10 shadow-sm"
                >
                  <img src={`/samples/sample-${name}.png`} alt={name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_340px] gap-6 lg:gap-8 items-start">
          {/* LEFT: Preview Area */}
          <div className="space-y-4 overflow-hidden">
            <div className="flex items-center justify-between lg:hidden">
              <h3 className="text-lg font-medium">Result</h3>
            </div>
            
            <div
              className="relative w-full rounded-2xl overflow-hidden border bg-secondary/5 shadow-inner transition-colors"
              style={{
                height: "clamp(300px, 60vh, 700px)",
                ...(previewBg === "checker" ? {
                  backgroundImage: [
                    "linear-gradient(45deg, var(--border) 25%, transparent 25%)",
                    "linear-gradient(-45deg, var(--border) 25%, transparent 25%)",
                    "linear-gradient(45deg, transparent 75%, var(--border) 75%)",
                    "linear-gradient(-45deg, transparent 75%, var(--border) 75%)",
                  ].join(", "),
                  backgroundSize: "24px 24px",
                  backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0px",
                  backgroundColor: "var(--muted)",
                } : previewBg === "white" ? { backgroundColor: "#ffffff" } : { backgroundColor: "#111111" }),
              }}
            >
              {/* processing overlay... */}
              {processing && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/40 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" />
                  <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-background border shadow-xl">
                    {progressText.includes("Download") ? <CloudDownload className="h-5 w-5 animate-bounce text-primary" /> : <Wand2 className="h-5 w-5 animate-spin text-primary" />}
                    <span className="text-base font-medium">{progressText}</span>
                  </div>
                </div>
              )}

              {/* Slider */}
              {resultUrl && !processing ? (
                <>
                  <img src={resultUrl} alt="Result" className="absolute inset-0 w-full h-full object-contain" />
                  <div className="absolute inset-0 overflow-hidden border-r-2 border-white/80" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                    <img src={originalUrl ?? ""} alt="Original" className="absolute inset-0 w-full h-full object-contain bg-background" />
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 cursor-ew-resize"
                    style={{ left: `${sliderPos}%`, touchAction: "none", transform: "translateX(-50%)" }}
                    onPointerDown={(e) => {
                      const el = e.currentTarget.parentElement!;
                      const move = (ev: PointerEvent) => {
                        const r = el.getBoundingClientRect();
                        setSliderPos(Math.min(100, Math.max(0, ((ev.clientX - r.left) / r.width) * 100)));
                      };
                      const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
                      window.addEventListener("pointermove", move);
                      window.addEventListener("pointerup", up);
                    }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 h-12 w-12 rounded-full bg-white shadow-xl flex items-center justify-center pointer-events-none border">
                      <ArrowLeftRight className="h-5 w-5" style={{ color: "oklch(0.25 0 0)" }} />
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 text-sm font-medium bg-black/60 text-white rounded-md px-3 py-1 z-10 backdrop-blur-md">Original</div>
                  <div className="absolute top-4 right-4 text-sm font-medium bg-black/60 text-white rounded-md px-3 py-1 z-10 backdrop-blur-md">Result</div>
                </>
              ) : (
                <img src={originalUrl ?? ""} alt="Original" className={cn("w-full h-full object-contain", processing && "opacity-30 blur-sm scale-[0.99] transition-all duration-700")} />
              )}
            </div>

            <div className="flex justify-center gap-2">
              <Button variant="ghost" size="icon" className={cn("h-10 w-10 rounded-full", previewBg === "checker" && "bg-secondary")} onClick={() => setPreviewBg("checker")}>
                <Grid2x2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className={cn("h-10 w-10 rounded-full", previewBg === "white" && "bg-secondary")} onClick={() => setPreviewBg("white")}>
                <Square className="h-4 w-4" fill="currentColor" />
              </Button>
              <Button variant="ghost" size="icon" className={cn("h-10 w-10 rounded-full", previewBg === "dark" && "bg-secondary")} onClick={() => setPreviewBg("dark")}>
                <Moon className="h-4 w-4" fill="currentColor" />
              </Button>
            </div>
          </div>

          {/* RIGHT: Inspector Panel */}
          <div className="flex flex-col gap-6 bg-secondary/5 border rounded-2xl p-5 lg:sticky top-6">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">Inspector</h3>
                <p className="text-sm text-muted-foreground font-mono truncate max-w-[200px]" title={file.name}>
                  {file.name}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleReset} className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {error && (
              <div className="flex flex-col gap-3 bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl border border-destructive/20">
                <p>{error}</p>
                <Button variant="outline" size="sm" onClick={handleRetry} className="h-8 w-full bg-background">Try Again</Button>
              </div>
            )}

            {/* Editor tools (hidden if processing) */}
            {!processing && resultUrl && (
              <>
                <div className="space-y-3">
                  <p className="text-sm font-medium">Background</p>
                  <Tabs defaultValue={customBgType === "transparent" ? "none" : customBgType} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-9">
                      <TabsTrigger value="none" className="text-xs" onClick={() => setCustomBgType("transparent")}>None</TabsTrigger>
                      <TabsTrigger value="color" className="text-xs" onClick={() => setCustomBgType("color")}>Color</TabsTrigger>
                      <TabsTrigger value="image" className="text-xs" onClick={() => setCustomBgType("image")}>Image</TabsTrigger>
                    </TabsList>
                    <TabsContent value="color" className="pt-4 space-y-3">
                      <div className="flex gap-2 items-center">
                        <Input type="color" value={customBgColor} onChange={e => setCustomBgColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                        <div className="flex flex-wrap gap-2 flex-1">
                          {["#ffffff", "#000000", "#f3f4f6", "#1e293b", "#3b82f6", "#ef4444"].map(c => (
                            <button key={c} className="w-8 h-8 rounded-full border shadow-sm ring-offset-background hover:ring-2 ring-primary/30 transition-all" style={{ backgroundColor: c }} onClick={() => setCustomBgColor(c)} />
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="image" className="pt-4">
                      <Input type="file" accept="image/*" onChange={(e) => setCustomBgBlob(e.target.files?.[0] || null)} className="text-sm" />
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">Edge Softness</span>
                    <span className="font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">{edgeBlur}px</span>
                  </div>
                  <Slider value={[edgeBlur]} onValueChange={([v]) => setEdgeBlur(v)} max={10} step={1} className="py-2" />
                </div>

                <div className="pt-4 border-t space-y-3">
                  <Button onClick={() => downloadFormat("png")} className="w-full h-11 text-base gap-2">
                    <Download className="h-5 w-5" /> Download Result
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={copyToClipboard} className="flex-1 h-10 gap-2">
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />} 
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => downloadFormat("jpeg")} className="h-10 w-10 shrink-0">
                          <span className="text-xs font-semibold">JPG</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download as smaller JPEG (white bg)</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => downloadFormat("webp")} className="h-10 w-10 shrink-0">
                          <span className="text-xs font-semibold">WEBP</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download as modern WebP format</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </>
            )}

            {/* Processing state block inside right panel */}
            {processing && (
              <div className="py-8 text-center space-y-3">
                <Wand2 className="h-8 w-8 mx-auto text-primary animate-pulse" />
                <p className="text-sm text-muted-foreground">AI is processing your image...</p>
              </div>
            )}
            
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
