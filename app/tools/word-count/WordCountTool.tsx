"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function fleschKincaidGrade(avgWords: number, avgSyllables: number): number {
  return 0.39 * avgWords + 11.8 * avgSyllables - 15.59;
}

function analyzeText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const words = trimmed.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const syllables = words.reduce((acc, word) => acc + countSyllables(word), 0);
  const avgSyllablesPerWord = syllables / Math.max(words.length, 1);
  const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
  const fleschScore =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  const grade = fleschKincaidGrade(avgWordsPerSentence, avgSyllablesPerWord);

  function fleschLabel(score: number): { label: string; color: string } {
    if (score >= 90) return { label: "Very Easy", color: "text-green-500" };
    if (score >= 70) return { label: "Easy", color: "text-green-400" };
    if (score >= 60) return { label: "Standard", color: "text-yellow-500" };
    if (score >= 50) return { label: "Fairly Difficult", color: "text-orange-500" };
    if (score >= 30) return { label: "Difficult", color: "text-red-400" };
    return { label: "Very Difficult", color: "text-red-600" };
  }

  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    words: words.length,
    sentences: sentences.length,
    paragraphs: paragraphs.length,
    readingTime: `${Math.ceil(words.length / 238)} min`,
    speakingTime: `${Math.ceil(words.length / 150)} min`,
    fleschScore: Math.round(fleschScore),
    fleschLabel: fleschLabel(Math.round(fleschScore)),
    grade: Math.max(0, Math.round(grade * 10) / 10),
  };
}

const STAT_ORDER = [
  { key: "words", label: "Words" },
  { key: "characters", label: "Characters" },
  { key: "charactersNoSpaces", label: "No spaces" },
  { key: "sentences", label: "Sentences" },
  { key: "paragraphs", label: "Paragraphs" },
  { key: "readingTime", label: "Reading time" },
  { key: "speakingTime", label: "Speaking time" },
] as const;

export function WordCountTool() {
  const [input, setInput] = React.useState("");
  const stats = React.useMemo(() => analyzeText(input), [input]);

  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setInput("");
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="space-y-6">
      {/* Keyboard hint */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <kbd className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px]">esc</kbd>
        <span>Clear</span>
      </div>

      <Textarea
        id="word-count-input"
        placeholder="Paste or type your text here…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="h-56 text-sm font-sans resize-none"
        spellCheck
      />

      {stats ? (
        <div className="space-y-4 animate-fade-in">
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STAT_ORDER.map(({ key, label }) => (
              <div
                key={key}
                className="rounded-lg border border-border/60 bg-card px-4 py-3"
                id={`stat-${key}`}
              >
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className="text-lg font-semibold font-mono text-foreground">
                  {stats[key as keyof typeof stats] as string | number}
                </p>
              </div>
            ))}
          </div>

          {/* Readability */}
          <div className="rounded-lg border border-border/60 bg-card px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Readability
              </span>
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-xs text-muted-foreground cursor-help underline decoration-dotted">
                    Flesch score
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Flesch Reading Ease: higher = easier to read (90–100 = very easy, 0–30 = very difficult).
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-3xl font-bold font-mono">{stats.fleschScore}</p>
                <p className={`text-xs font-medium ${stats.fleschLabel.color}`}>
                  {stats.fleschLabel.label}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Grade level</p>
                <p className="text-xl font-semibold font-mono">{stats.grade}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/60 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Start typing to see live statistics.
          </p>
        </div>
      )}

      {input && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInput("")}
            id="word-count-reset"
            className="text-xs gap-1 text-muted-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
