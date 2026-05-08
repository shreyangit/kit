"use client";

import * as React from "react";
import { Play, Pause, Square, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function chunk(text: string, maxLen: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > maxLen && cur) { chunks.push(cur.trim()); cur = s; }
    else cur += s;
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.length ? chunks : [text];
}

type Status = "idle" | "speaking" | "paused";

export function TextToSpeechTool() {
  const [text, setText] = React.useState("");
  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([]);
  const [voiceIdx, setVoiceIdx] = React.useState(0);
  const [rate, setRate] = React.useState(1);
  const [pitch, setPitch] = React.useState(1);
  const [volume, setVolume] = React.useState(1);
  const [status, setStatus] = React.useState<Status>("idle");
  const [charIdx, setCharIdx] = React.useState(-1);
  const [supported, setSupported] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) { setSupported(false); return; }
    function load() { const v = window.speechSynthesis.getVoices(); if (v.length) setVoices(v); }
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  // Keyboard shortcut: Space = pause/resume
  React.useEffect(() => {
    function h(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); status === "speaking" ? pause() : status === "paused" ? resume() : speak(); }
    }
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [status, text]);

  function speak() {
    if (!text.trim() || !supported) return;
    window.speechSynthesis.cancel();
    const chunks = chunk(text, 200);
    let idx = 0;
    let chunkOffset = 0;
    function nextChunk() {
      if (idx >= chunks.length) { setStatus("idle"); setCharIdx(-1); return; }
      const utt = new SpeechSynthesisUtterance(chunks[idx]);
      if (voices[voiceIdx]) utt.voice = voices[voiceIdx];
      utt.rate = rate; utt.pitch = pitch; utt.volume = volume;
      utt.onboundary = e => setCharIdx(chunkOffset + e.charIndex);
      utt.onend = () => { chunkOffset += chunks[idx].length + 1; idx++; nextChunk(); };
      utt.onerror = () => { setStatus("idle"); setCharIdx(-1); };
      if (idx === 0) utt.onstart = () => setStatus("speaking");
      window.speechSynthesis.speak(utt);
    }
    nextChunk();
    setStatus("speaking");
  }

  function pause() { window.speechSynthesis.pause(); setStatus("paused"); }
  function resume() { window.speechSynthesis.resume(); setStatus("speaking"); }
  function stop() { window.speechSynthesis.cancel(); setStatus("idle"); setCharIdx(-1); }

  // Group voices by language
  const grouped = React.useMemo(() => {
    const map: Record<string, SpeechSynthesisVoice[]> = {};
    voices.forEach(v => { const lang = v.lang.split("-")[0]; (map[lang] = map[lang] ?? []).push(v); });
    return map;
  }, [voices]);

  if (!supported) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-5 py-6 text-center">
        <VolumeX className="h-8 w-8 text-destructive mx-auto mb-3" />
        <p className="text-sm font-medium text-destructive">Speech Synthesis not supported</p>
        <p className="text-xs text-muted-foreground mt-1">Please use Chrome, Edge, or Safari.</p>
      </div>
    );
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Text input with word highlight hint */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{wordCount} words · {text.length} chars</span>
          {text.length > 2000 && <span className="text-[10px] text-amber-500">Long texts may have gaps between chunks</span>}
        </div>
        <Textarea
          id="tts-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste or type text to read aloud…"
          className="h-44 text-sm font-sans leading-relaxed resize-none"
          spellCheck
        />
      </div>

      {/* Voice selector */}
      {voices.length > 0 && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Voice</label>
          <select id="tts-voice" value={voiceIdx} onChange={e => setVoiceIdx(+e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            {Object.entries(grouped).map(([lang, vcs]) => (
              <optgroup key={lang} label={lang.toUpperCase()}>
                {vcs.map(v => {
                  const vi = voices.indexOf(v);
                  return <option key={vi} value={vi}>{v.name} ({v.lang})</option>;
                })}
              </optgroup>
            ))}
          </select>
        </div>
      )}

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Rate", value: rate, set: setRate, min: 0.5, max: 2, step: 0.1, fmt: (v: number) => `${v}×` },
          { label: "Pitch", value: pitch, set: setPitch, min: 0.5, max: 2, step: 0.1, fmt: (v: number) => `${v}` },
          { label: "Volume", value: volume, set: setVolume, min: 0, max: 1, step: 0.05, fmt: (v: number) => `${Math.round(v * 100)}%` },
        ].map(sl => (
          <div key={sl.label} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">{sl.label}</label>
              <span className="text-xs font-mono text-foreground">{sl.fmt(sl.value)}</span>
            </div>
            <input type="range" min={sl.min} max={sl.max} step={sl.step} value={sl.value}
              onChange={e => sl.set(+e.target.value)} className="w-full" id={`tts-${sl.label.toLowerCase()}`} />
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {status === "idle" && (
          <Button onClick={speak} disabled={!text.trim()} id="tts-play" className="gap-2">
            <Play className="h-4 w-4" />Play
          </Button>
        )}
        {status === "speaking" && (
          <Button onClick={pause} variant="outline" id="tts-pause" className="gap-2">
            <Pause className="h-4 w-4" />Pause
          </Button>
        )}
        {status === "paused" && (
          <Button onClick={resume} id="tts-resume" className="gap-2">
            <Play className="h-4 w-4" />Resume
          </Button>
        )}
        {status !== "idle" && (
          <Button onClick={stop} variant="outline" id="tts-stop" className="gap-2">
            <Square className="h-4 w-4" />Stop
          </Button>
        )}
        <div className={cn("flex items-center gap-1.5 text-xs ml-2", status === "idle" ? "text-muted-foreground" : status === "speaking" ? "text-primary" : "text-amber-500")}>
          <Volume2 className="h-3.5 w-3.5" />
          {status === "idle" ? "Ready" : status === "speaking" ? "Speaking…" : "Paused"}
        </div>
        <span className="ml-auto text-[10px] text-muted-foreground/60 hidden sm:block">Space = pause/resume</span>
      </div>
    </div>
  );
}
