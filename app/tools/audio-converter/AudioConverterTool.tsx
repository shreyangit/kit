"use client";
import * as React from "react";
import { Upload, RefreshCw, Download, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/utils/download";

const FORMATS = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "opus"] as const;
type AudioFormat = typeof FORMATS[number];
const FORMAT_MIME: Record<AudioFormat, string> = {
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg",
  flac: "audio/flac", aac: "audio/aac", m4a: "audio/mp4", opus: "audio/opus",
};
const FORMAT_CODECS: Record<AudioFormat, string> = {
  mp3: "-c:a libmp3lame -q:a 2", wav: "-c:a pcm_s16le",
  ogg: "-c:a libvorbis -q:a 4", flac: "-c:a flac",
  aac: "-c:a aac -b:a 192k", m4a: "-c:a aac -b:a 192k",
  opus: "-c:a libopus -b:a 128k",
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function formatTime(s: number) {
  const m = Math.floor(s / 60); return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export function AudioConverterTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [target, setTarget] = React.useState<AudioFormat>("mp3");
  const [status, setStatus] = React.useState<"idle" | "loading" | "processing" | "done" | "error">("idle");
  const [progress, setProgress] = React.useState(0);
  const [msg, setMsg] = React.useState("");
  const [result, setResult] = React.useState<{ blob: Blob; name: string } | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const ffmpegRef = React.useRef<unknown>(null);

  function handleFile(f: File) {
    setFile(f); setResult(null); setStatus("idle"); setProgress(0);
  }

  async function convert() {
    if (!file) return;
    setStatus("loading"); setProgress(0); setMsg("Loading FFmpeg engine (~31 MB, cached after first use)…");
    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util");
      if (!ffmpegRef.current) {
        const ff = new FFmpeg();
        ff.on("progress", ({ progress: p }: { progress: number }) => setProgress(Math.round(p * 100)));
        ff.on("log", () => {});
        const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
        await ff.load({
          coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
        });
        ffmpegRef.current = ff;
      }
      const ff = ffmpegRef.current as import("@ffmpeg/ffmpeg").FFmpeg;
      setStatus("processing"); setMsg("Converting…");
      const ext = file.name.split(".").pop() ?? "audio";
      const inName = `input.${ext}`;
      const outName = `output.${target}`;
      await ff.writeFile(inName, await fetchFile(file));
      await ff.exec(["-i", inName, ...FORMAT_CODECS[target].split(" "), outName]);
      const data = await ff.readFile(outName);
      const blob = new Blob([data as unknown as BlobPart], { type: FORMAT_MIME[target] });
      await ff.deleteFile(inName); await ff.deleteFile(outName);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      setResult({ blob, name: `${baseName}.${target}` });
      setStatus("done"); setMsg("");
    } catch (e) {
      setMsg(`Error: ${(e as Error).message}`);
      setStatus("error");
    }
  }

  const inputExt = file?.name.split(".").pop()?.toLowerCase() ?? "";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Upload */}
      {!file ? (
        <button onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="w-full rounded-lg border-2 border-dashed border-border/60 bg-secondary/10 hover:border-foreground/20 py-14 flex flex-col items-center gap-3 cursor-pointer transition-colors" id="audio-dropzone">
          <Music className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Drop audio or tap to select</p>
            <p className="text-xs text-muted-foreground mt-0.5">MP3, WAV, OGG, FLAC, AAC, M4A, OPUS · max 200 MB</p>
            <p className="text-xs text-muted-foreground mt-1 opacity-60">First use downloads FFmpeg (~31 MB, cached permanently)</p>
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3">
          <Music className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setFile(null); setResult(null); }} className="shrink-0 gap-1">
            <RefreshCw className="h-3.5 w-3.5" />Change
          </Button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="audio/*" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {/* Format picker */}
      {file && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium">Convert to</p>
          <div className="flex flex-wrap gap-2">
            {FORMATS.filter(f => f !== inputExt).map(fmt => (
              <button key={fmt} id={`fmt-${fmt}`}
                onClick={() => setTarget(fmt)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase transition-colors ${target === fmt ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {fmt}
              </button>
            ))}
          </div>
          <Button onClick={convert} disabled={status === "loading" || status === "processing"} id="audio-convert">
            {status === "idle" || status === "done" ? "Convert" : status === "error" ? "Retry" : "Converting…"}
          </Button>
        </div>
      )}

      {/* Progress */}
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

      {/* Result */}
      {result && (
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{result.name}</p>
            <p className="text-xs text-muted-foreground">{formatSize(result.blob.size)} · {target.toUpperCase()}</p>
          </div>
          <Button size="sm" onClick={() => downloadBlob(result.blob, result.name)} id="audio-download" className="gap-1.5 shrink-0">
            <Download className="h-4 w-4" />Download
          </Button>
        </div>
      )}
    </div>
  );
}
