"use client";
import * as React from "react";
import { Upload, RefreshCw, Download, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { downloadBlob } from "@/lib/utils/download";

const WIDTH_PRESETS = [320, 480, 640, 800] as const;

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}
function fmtSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VideoToGifTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [duration, setDuration] = React.useState(0);
  const [range, setRange] = React.useState([0, 8]);
  const [fps, setFps] = React.useState(12);
  const [width, setWidth] = React.useState(480);
  const [quality, setQuality] = React.useState<"draft" | "good" | "best">("good");
  const [format, setFormat] = React.useState<"gif" | "webp">("gif");
  const [status, setStatus] = React.useState<"idle" | "loading" | "processing" | "done" | "error">("idle");
  const [progress, setProgress] = React.useState(0);
  const [msg, setMsg] = React.useState("");
  const [result, setResult] = React.useState<{ blob: Blob; name: string; url: string } | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const ffmpegRef = React.useRef<unknown>(null);

  function handleFile(f: File) {
    setFile(f); setResult(null); setStatus("idle"); setProgress(0);
    const url = URL.createObjectURL(f);
    const v = document.createElement("video");
    v.src = url;
    v.onloadedmetadata = () => {
      const d = Math.floor(v.duration);
      setDuration(d);
      setRange([0, Math.min(8, d)]);
      URL.revokeObjectURL(url);
    };
  }

  async function convert() {
    if (!file) return;
    setStatus("loading"); setProgress(0); setMsg("Loading FFmpeg (~31 MB, cached)…");
    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util");
      if (!ffmpegRef.current) {
        const ff = new FFmpeg();
        ff.on("progress", ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100)));
        const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
        await ff.load({
          coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
        });
        ffmpegRef.current = ff;
      }
      const ff = ffmpegRef.current as import("@ffmpeg/ffmpeg").FFmpeg;
      setStatus("processing"); setMsg("Generating…");
      const ext = file.name.split(".").pop() ?? "mp4";
      const inName = `input.${ext}`;
      const outName = `output.${format}`;
      const start = range[0], dur = range[1] - range[0];
      await ff.writeFile(inName, await fetchFile(file));

      if (format === "gif") {
        await ff.exec(["-ss", String(start), "-t", String(dur), "-i", inName,
          "-vf", `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=stats_mode=diff`, "palette.png"]);
        const dither = { draft: "bayer:bayer_scale=3", good: "bayer:bayer_scale=5", best: "floyd_steinberg" }[quality];
        await ff.exec(["-ss", String(start), "-t", String(dur), "-i", inName, "-i", "palette.png",
          "-filter_complex", `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=${dither}`, outName]);
        try { await ff.deleteFile("palette.png"); } catch {}
      } else {
        const q = quality === "best" ? "90" : quality === "good" ? "75" : "60";
        await ff.exec(["-ss", String(start), "-t", String(dur), "-i", inName,
          "-vf", `fps=${fps},scale=${width}:-1:flags=lanczos`,
          "-c:v", "libwebp_anim", "-quality", q, "-loop", "0", outName]);
      }

      const data = await ff.readFile(outName);
      const mimeType = format === "gif" ? "image/gif" : "image/webp";
      const blob = new Blob([data as unknown as BlobPart], { type: mimeType });
      const resUrl = URL.createObjectURL(blob);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      setResult({ blob, name: `${baseName}.${format}`, url: resUrl });
      setStatus("done"); setMsg("");
      await ff.deleteFile(inName); try { await ff.deleteFile(outName); } catch {}
    } catch (e) {
      setMsg(`Error: ${(e as Error).message}`); setStatus("error");
    }
  }

  const clipDur = range[1] - range[0];
  const estFrames = Math.round(clipDur * fps);

  return (
    <div className="space-y-6 max-w-2xl">
      {!file ? (
        <button onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="w-full rounded-lg border-2 border-dashed border-border/60 bg-secondary/10 hover:border-foreground/20 py-14 flex flex-col items-center gap-3 cursor-pointer transition-colors" id="gif-dropzone">
          <Video className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Drop video or tap to select</p>
            <p className="text-xs text-muted-foreground mt-0.5">MP4, MOV, WebM, AVI · max 500 MB</p>
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3">
          <Video className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate font-medium">{file.name}</p>
            {duration > 0 && <p className="text-xs text-muted-foreground">Duration: {fmt(duration)}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setFile(null); setResult(null); }} className="shrink-0 gap-1">
            <RefreshCw className="h-3.5 w-3.5" />Change
          </Button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="video/*" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {file && (
        <div className="space-y-5 rounded-lg border border-border/60 bg-card px-5 py-4">
          {/* Clip range */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Clip range</span>
              <span>{fmt(range[0])} → {fmt(range[1])} <span className="opacity-60">({clipDur}s)</span></span>
            </div>
            <Slider min={0} max={duration || 30} step={0.5} value={range}
              onValueChange={v => setRange(v)} id="gif-range" />
            {clipDur > 15 && (
              <p className="text-xs text-amber-500">GIFs longer than 10s become very large. 3–8s recommended.</p>
            )}
          </div>

          {/* FPS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>FPS</span>
              <span>{fps} fps · ~{estFrames} frames</span>
            </div>
            <Slider min={8} max={24} step={2} value={[fps]} onValueChange={([v]) => setFps(v)} id="gif-fps" />
          </div>

          {/* Width */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Width</p>
            <div className="flex gap-2 flex-wrap">
              {WIDTH_PRESETS.map(w => (
                <button key={w} onClick={() => setWidth(w)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${width === w ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                  {w}px
                </button>
              ))}
            </div>
          </div>

          {/* Format & Quality */}
          <div className="flex flex-wrap gap-6">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Format</p>
              <div className="flex gap-2">
                {(["gif", "webp"] as const).map(f => (
                  <button key={f} onClick={() => setFormat(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase transition-colors ${format === f ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                    {f}
                  </button>
                ))}
              </div>
              {format === "webp" && <p className="text-xs text-muted-foreground opacity-70">30–70% smaller, not supported everywhere</p>}
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Quality</p>
              <div className="flex gap-2">
                {(["draft", "good", "best"] as const).map(q => (
                  <button key={q} onClick={() => setQuality(q)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${quality === q ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={convert} disabled={status === "loading" || status === "processing"} id="gif-convert">
            {status === "idle" || status === "done" ? `Generate ${format.toUpperCase()}` : status === "error" ? "Retry" : "Generating…"}
          </Button>
        </div>
      )}

      {(status === "loading" || status === "processing") && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-border border-t-foreground animate-spin inline-block shrink-0" />
            {msg} {status === "processing" && progress > 0 && `${progress}%`}
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-foreground rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {status === "error" && <p className="text-xs text-destructive">{msg}</p>}

      {result && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Preview</p>
          <img src={result.url} alt="Generated GIF" className="rounded-lg border border-border/60 max-w-full max-h-64 object-contain" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{fmtSize(result.blob.size)}</span>
            <Button size="sm" onClick={() => downloadBlob(result.blob, result.name)} id="gif-download" className="gap-1.5">
              <Download className="h-4 w-4" />Download {format.toUpperCase()}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
