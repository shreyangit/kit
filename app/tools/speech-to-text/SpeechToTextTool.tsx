"use client";

import * as React from "react";
import { Mic, MicOff, Copy, Check, Download, Trash2, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadText } from "@/lib/utils/download";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "en-US", label: "English (US)" }, { code: "en-GB", label: "English (UK)" },
  { code: "en-IN", label: "English (India)" }, { code: "hi-IN", label: "Hindi" },
  { code: "es-ES", label: "Spanish" }, { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" }, { code: "it-IT", label: "Italian" },
  { code: "pt-BR", label: "Portuguese (BR)" }, { code: "ru-RU", label: "Russian" },
  { code: "ja-JP", label: "Japanese" }, { code: "ko-KR", label: "Korean" },
  { code: "zh-CN", label: "Chinese (Simplified)" }, { code: "zh-TW", label: "Chinese (Traditional)" },
  { code: "ar-SA", label: "Arabic" }, { code: "nl-NL", label: "Dutch" },
  { code: "pl-PL", label: "Polish" }, { code: "sv-SE", label: "Swedish" },
  { code: "tr-TR", label: "Turkish" }, { code: "uk-UA", label: "Ukrainian" },
];

function isSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

export function SpeechToTextTool() {
  const [supported] = React.useState(isSupported);
  const [lang, setLang] = React.useState("en-US");
  const [continuous, setContinuous] = React.useState(true);
  const [finalText, setFinalText] = React.useState("");
  const [interimText, setInterimText] = React.useState("");
  const [recording, setRecording] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const recRef = React.useRef<unknown>(null);

  function startRec() {
    if (!supported) return;
    const SR = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition 
      ?? (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new (SR as any)();
    rec.lang = lang;
    rec.continuous = continuous;
    rec.interimResults = true;

    rec.onresult = (e: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ev = e as any;
      let fin = "", inter = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) fin += t + " ";
        else inter += t;
      }
      if (fin) setFinalText(prev => prev + fin);
      setInterimText(inter);
    };

    rec.onerror = (e: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ev = e as any;
      const msgs: Record<string, string> = {
        "not-allowed": "Microphone access denied. Allow mic permissions.",
        "no-speech": "No speech detected.", "network": "Network error.",
        "audio-capture": "No microphone found.",
      };
      setError(msgs[ev.error] ?? `Error: ${ev.error}`);
      setRecording(false);
    };

    rec.onend = () => {
      setInterimText("");
      if (continuous && recRef.current) { try { rec.start(); } catch { setRecording(false); } }
      else setRecording(false);
    };

    recRef.current = rec;
    try { rec.start(); setRecording(true); setError(null); } catch (e) { setError(String(e)); }
  }

  function stopRec() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (recRef.current as any)?.stop?.();
    recRef.current = null;
    setRecording(false);
    setInterimText("");
  }

  async function copy() {
    await navigator.clipboard.writeText(finalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const wordCount = finalText.trim() ? finalText.trim().split(/\s+/).length : 0;

  if (!supported) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-6 text-center space-y-3">
        <MonitorSmartphone className="h-8 w-8 text-amber-500 mx-auto" />
        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Chrome or Edge required</p>
        <p className="text-xs text-muted-foreground">Speech recognition uses a web API only available in Chrome and Edge. Firefox and Safari are not supported.</p>
        <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer"
          className="inline-block text-xs text-primary underline">Download Chrome →</a>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select id="stt-lang" value={lang} onChange={e => setLang(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
          <input type="checkbox" checked={continuous} onChange={e => setContinuous(e.target.checked)} className="rounded" />
          Continuous
        </label>
      </div>

      {/* Big mic button */}
      <div className="flex flex-col items-center gap-4 py-4">
        <button
          id="stt-mic"
          onClick={recording ? stopRec : startRec}
          className={cn(
            "h-20 w-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg",
            recording
              ? "bg-rose-500 hover:bg-rose-600 scale-110 shadow-rose-500/30 animate-pulse"
              : "bg-secondary hover:bg-secondary/80 hover:scale-105"
          )}
          aria-label={recording ? "Stop recording" : "Start recording"}
        >
          {recording ? <MicOff className="h-8 w-8 text-white" /> : <Mic className="h-8 w-8 text-muted-foreground" />}
        </button>
        <p className={cn("text-sm font-medium", recording ? "text-rose-400" : "text-muted-foreground")}>
          {recording ? "Recording… tap to stop" : "Tap to start"}
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {/* Live interim */}
      {interimText && (
        <div className="rounded-md border border-border/60 bg-secondary/10 px-4 py-3">
          <p className="text-xs text-muted-foreground italic mb-1">Live (unconfirmed)</p>
          <p className="text-sm text-muted-foreground italic">{interimText}</p>
        </div>
      )}

      {/* Final transcript */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Transcript · {wordCount} words · {finalText.length} chars</span>
          <div className="flex gap-1">
            {finalText && <>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={copy} id="stt-copy">
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => downloadText(finalText, "transcript.txt")} id="stt-download">
                <Download className="h-3.5 w-3.5" />Download
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => setFinalText("")} id="stt-clear">
                <Trash2 className="h-3.5 w-3.5" />Clear
              </Button>
            </>}
          </div>
        </div>
        <textarea
          id="stt-output"
          value={finalText}
          onChange={e => setFinalText(e.target.value)}
          placeholder="Transcript will appear here…"
          className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring h-48 resize-none"
        />
      </div>
    </div>
  );
}
