"use client";
import * as React from "react";
import { Upload, RefreshCw, Download, Music, Play, Pause, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/utils/download";

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

async function generateWaveform(file: File, samples = 600): Promise<Float32Array> {
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const buf = await file.arrayBuffer();
  const audio = await ctx.decodeAudioData(buf);
  const raw = audio.getChannelData(0);
  const block = Math.floor(raw.length / samples);
  const out = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    let max = 0;
    for (let j = 0; j < block; j++) { const a = Math.abs(raw[i * block + j]); if (a > max) max = a; }
    out[i] = max;
  }
  await ctx.close();
  return out;
}

const MIME_MAP: Record<string, string> = {
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg",
  flac: "audio/flac", aac: "audio/aac", m4a: "audio/mp4",
};

export function AudioTrimmerTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [duration, setDuration] = React.useState(0);
  const [waveform, setWaveform] = React.useState<Float32Array | null>(null);
  const [range, setRange] = React.useState([0, 0]);
  const [dragging, setDragging] = React.useState<"start" | "end" | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [status, setStatus] = React.useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = React.useState("");
  const [result, setResult] = React.useState<{ blob: Blob; name: string } | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const waveRef = React.useRef<HTMLDivElement>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const srcRef = React.useRef<string | null>(null);
  const ffmpegRef = React.useRef<unknown>(null);
  const rafRef = React.useRef<number>(0);

  React.useEffect(() => () => { if (srcRef.current) URL.revokeObjectURL(srcRef.current); }, []);

  async function handleFile(f: File) {
    if (srcRef.current) URL.revokeObjectURL(srcRef.current);
    const url = URL.createObjectURL(f);
    srcRef.current = url;
    setFile(f); setResult(null); setStatus("idle"); setWaveform(null); setPlaying(false);
    const audio = new Audio(url);
    audio.onloadedmetadata = async () => {
      const d = audio.duration;
      setDuration(d); setRange([0, d]);
      audioRef.current = audio;
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
      audio.onended = () => { setPlaying(false); audio.currentTime = 0; };
      const wf = await generateWaveform(f);
      setWaveform(wf);
    };
  }

  function handleWaveClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!waveRef.current || !duration) return;
    const rect = waveRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const t = pct * duration;
    // Snap to nearest handle
    const dStart = Math.abs(t - range[0]), dEnd = Math.abs(t - range[1]);
    if (dStart < dEnd) setRange([Math.max(0, t), range[1]]);
    else setRange([range[0], Math.min(duration, t)]);
  }

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else {
      a.currentTime = range[0];
      a.play();
      setPlaying(true);
      const check = () => {
        if (a.currentTime >= range[1]) { a.pause(); a.currentTime = range[0]; setPlaying(false); return; }
        rafRef.current = requestAnimationFrame(check);
      };
      rafRef.current = requestAnimationFrame(check);
    }
  }

  async function trim() {
    if (!file) return;
    setStatus("loading"); setMsg("Loading FFmpeg…");
    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util");
      if (!ffmpegRef.current) {
        const ff = new FFmpeg();
        const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
        await ff.load({
          coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
        });
        ffmpegRef.current = ff;
      }
      const ff = ffmpegRef.current as import("@ffmpeg/ffmpeg").FFmpeg;
      setMsg("Trimming…");
      const ext = file.name.split(".").pop() ?? "mp3";
      const inName = `in.${ext}`, outName = `out.${ext}`;
      const dur = range[1] - range[0];
      await ff.writeFile(inName, await fetchFile(file));
      await ff.exec(["-ss", range[0].toFixed(3), "-i", inName, "-t", dur.toFixed(3), "-c", "copy", outName]);
      const data = await ff.readFile(outName);
      const mime = MIME_MAP[ext] ?? "audio/mpeg";
      const blob = new Blob([data as unknown as BlobPart], { type: mime });
      await ff.deleteFile(inName); try { await ff.deleteFile(outName); } catch {}
      const baseName = file.name.replace(/\.[^.]+$/, "");
      setResult({ blob, name: `${baseName}-trimmed.${ext}` });
      setStatus("done"); setMsg("");
    } catch (e) { setMsg(`Error: ${(e as Error).message}`); setStatus("error"); }
  }

  const clipDur = range[1] - range[0];

  return (
    <div className="space-y-6 max-w-2xl">
      {!file ? (
        <button onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="w-full rounded-lg border-2 border-dashed border-border/60 bg-secondary/10 hover:border-foreground/20 py-14 flex flex-col items-center gap-3 cursor-pointer transition-colors" id="trim-dropzone">
          <Scissors className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Drop audio or tap to select</p>
            <p className="text-xs text-muted-foreground mt-0.5">MP3, WAV, OGG, FLAC, AAC, M4A</p>
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3">
          <Music className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{fmt(duration)} total</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setFile(null); setResult(null); setWaveform(null); }} className="shrink-0 gap-1">
            <RefreshCw className="h-3.5 w-3.5" />Change
          </Button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="audio/*" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {waveform && (
        <div className="space-y-3">
          {/* Waveform */}
          <div ref={waveRef} className="relative h-20 rounded-lg bg-secondary/30 overflow-hidden cursor-crosshair select-none"
            onClick={handleWaveClick}>
            {/* Bars */}
            <svg viewBox={`0 0 ${waveform.length} 1`} preserveAspectRatio="none" className="w-full h-full">
              {Array.from(waveform).map((v, i) => {
                const pct = i / waveform.length;
                const inSel = pct >= range[0] / duration && pct <= range[1] / duration;
                return (
                  <rect key={i} x={i} y={(1 - v) / 2} width={0.8} height={v}
                    fill={inSel ? "var(--foreground)" : "var(--muted-foreground)"} opacity={inSel ? 0.9 : 0.3} />
                );
              })}
            </svg>
            {/* Playhead */}
            {duration > 0 && (
              <div className="absolute top-0 bottom-0 w-px bg-foreground/60 pointer-events-none"
                style={{ left: `${(currentTime / duration) * 100}%` }} />
            )}
            {/* Trim handles */}
            {duration > 0 && (
              <>
                <div className="absolute top-0 bottom-0 w-0.5 bg-foreground cursor-col-resize"
                  style={{ left: `${(range[0] / duration) * 100}%` }} />
                <div className="absolute top-0 bottom-0 w-0.5 bg-foreground cursor-col-resize"
                  style={{ left: `${(range[1] / duration) * 100}%` }} />
              </>
            )}
          </div>

          {/* Time inputs */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Start</span>
            <input type="number" value={range[0].toFixed(1)} step={0.1} min={0} max={range[1]}
              onChange={e => setRange([parseFloat(e.target.value), range[1]])}
              className="w-20 rounded-md border border-input bg-background px-2 py-1 text-center text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
            <span className="flex-1 text-center">→ {fmt(clipDur)} selected</span>
            <input type="number" value={range[1].toFixed(1)} step={0.1} min={range[0]} max={duration}
              onChange={e => setRange([range[0], parseFloat(e.target.value)])}
              className="w-20 rounded-md border border-input bg-background px-2 py-1 text-center text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
            <span>End</span>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={togglePlay} className="gap-1.5">
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? "Pause" : "Preview selection"}
            </Button>
            <Button size="sm" onClick={trim} disabled={status === "loading"} className="gap-1.5" id="trim-do">
              <Scissors className="h-4 w-4" />
              {status === "loading" ? msg : "Trim & Download"}
            </Button>
          </div>
        </div>
      )}

      {status === "error" && <p className="text-xs text-destructive">{msg}</p>}

      {result && (
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{result.name}</p>
            <p className="text-xs text-muted-foreground">Trimmed: {fmt(clipDur)}</p>
          </div>
          <Button size="sm" onClick={() => downloadBlob(result.blob, result.name)} id="trim-download" className="gap-1.5 shrink-0">
            <Download className="h-4 w-4" />Download
          </Button>
        </div>
      )}
    </div>
  );
}
