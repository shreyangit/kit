"use client";

import * as React from "react";
import { RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Stats {
  chars: number;
  charsNoSpaces: number;
  words: number;
  uniqueWords: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  bytesUTF8: number;
  bytesUTF16: number;
  longestWord: string;
  avgWordLen: number;
  readSec: number;
  speakSec: number;
  topWords: { word: string; count: number }[];
}

const encoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;

function analyze(text: string): Stats {
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean) : [];
  const freq: Record<string, number> = {};
  for (const w of words) {
    const k = w.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (k) freq[k] = (freq[k] ?? 0) + 1;
  }
  const topWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([word, count]) => ({ word, count }));
  const longestWord = words.reduce((l, w) => w.length > l.length ? w : l, "");
  const avgWordLen = words.length === 0 ? 0 : words.reduce((s, w) => s + w.replace(/\W/g, "").length, 0) / words.length;
  return {
    chars: text.length,
    charsNoSpaces: text.replace(/\s/g, "").length,
    words: words.length,
    uniqueWords: new Set(words.map(w => w.toLowerCase())).size,
    sentences: (text.match(/[.!?]+/g) ?? []).length,
    paragraphs: text.split(/\n\s*\n/).filter(p => p.trim()).length,
    lines: text ? text.split("\n").length : 0,
    bytesUTF8: encoder ? encoder.encode(text).byteLength : new Blob([text]).size,
    bytesUTF16: text.length * 2,
    longestWord,
    avgWordLen: Math.round(avgWordLen * 10) / 10,
    readSec: Math.round((words.length / 238) * 60),
    speakSec: Math.round((words.length / 150) * 60),
    topWords,
  };
}

function fmtTime(sec: number): string {
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

// Platform limits for byte indicator
const LIMITS = [
  { name: "Twitter", chars: 280, warn: true },
  { name: "SMS", chars: 160, warn: true },
  { name: "Meta title", chars: 60, warn: false },
  { name: "Meta desc", chars: 160, warn: false },
];

function StatCard({ label, value, sub, id }: { label: string; value: string | number; sub?: string; id?: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card px-4 py-3" id={id}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p className="text-xl font-semibold font-mono text-foreground leading-tight">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export function CharCounterTool() {
  const [text, setText] = React.useState("");
  const [debouncedText, setDebouncedText] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);

  // Debounce for heavy analysis
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedText(text), 80);
    return () => clearTimeout(t);
  }, [text]);

  const stats = React.useMemo(() => analyze(debouncedText), [debouncedText]);
  const maxTopCount = stats.topWords[0]?.count ?? 1;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const t = await f.text();
    setText(t);
  }

  return (
    <div className="space-y-5">
      {/* Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono font-semibold text-foreground text-sm">{stats.chars.toLocaleString()}</span>
            <span>chars</span>
            <span className="font-mono font-semibold text-foreground text-sm">{stats.words.toLocaleString()}</span>
            <span>words</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => fileRef.current?.click()} id="char-upload">
              <Upload className="h-3.5 w-3.5" />Load .txt
            </Button>
            <input ref={fileRef} type="file" accept=".txt,.md,.csv,.json" className="sr-only" onChange={handleFile} />
            {text && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => setText("")} id="char-clear">
                <RotateCcw className="h-3.5 w-3.5" />Clear
              </Button>
            )}
          </div>
        </div>
        <Textarea
          id="char-counter-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste or type any text — stats update live…"
          className="h-44 sm:h-52 text-sm font-sans resize-none"
          spellCheck
        />
      </div>

      {/* Platform limits */}
      <div className="flex flex-wrap gap-2">
        {LIMITS.map(lim => {
          const pct = Math.min(100, (stats.chars / lim.chars) * 100);
          const over = stats.chars > lim.chars;
          return (
            <Tooltip key={lim.name}>
              <TooltipTrigger asChild>
                <div className={cn("rounded-md border px-3 py-1.5 flex items-center gap-2 cursor-default", over ? "border-destructive/40 bg-destructive/5" : "border-border/60 bg-card")}>
                  <span className="text-[10px] text-muted-foreground">{lim.name}</span>
                  <span className={cn("text-[10px] font-mono font-semibold", over ? "text-destructive" : "text-foreground")}>{stats.chars}/{lim.chars}</span>
                  <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", over ? "bg-destructive" : "bg-primary")} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>{lim.name} character limit: {lim.chars}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        <StatCard label="Characters" value={stats.chars.toLocaleString()} id="stat-chars" />
        <StatCard label="No spaces" value={stats.charsNoSpaces.toLocaleString()} id="stat-chars-nospace" />
        <StatCard label="Words" value={stats.words.toLocaleString()} sub={`${stats.uniqueWords} unique`} id="stat-words" />
        <StatCard label="Sentences" value={stats.sentences.toLocaleString()} id="stat-sentences" />
        <StatCard label="Paragraphs" value={stats.paragraphs.toLocaleString()} id="stat-paragraphs" />
        <StatCard label="Lines" value={stats.lines.toLocaleString()} id="stat-lines" />
        <StatCard label="UTF-8 bytes" value={fmtBytes(stats.bytesUTF8)} sub={`UTF-16: ${fmtBytes(stats.bytesUTF16)}`} id="stat-bytes" />
        <StatCard label="Reading time" value={fmtTime(stats.readSec)} sub={`Speaking: ${fmtTime(stats.speakSec)}`} id="stat-reading" />
        {stats.longestWord && <StatCard label="Longest word" value={stats.longestWord} sub={`${stats.longestWord.length} chars`} id="stat-longest" />}
        <StatCard label="Avg word len" value={stats.avgWordLen} id="stat-avg" />
      </div>

      {/* Top words frequency */}
      {stats.topWords.length > 0 && (
        <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Top words</p>
          <div className="space-y-1.5">
            {stats.topWords.map(({ word, count }) => (
              <div key={word} className="flex items-center gap-3">
                <span className="font-mono text-xs w-28 truncate text-foreground">{word}</span>
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(count / maxTopCount) * 100}%` }} />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!text && (
        <div className="rounded-lg border border-dashed border-border/60 py-12 text-center">
          <p className="text-sm text-muted-foreground">Start typing to see live statistics.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">UTF-8 bytes, word frequency, reading time, and more.</p>
        </div>
      )}
    </div>
  );
}
