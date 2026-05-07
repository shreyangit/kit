"use client";

import * as React from "react";
import { Copy, Check, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const ALL_FLAGS = [
  { id: "g", label: "g", description: "Global — find all matches, not just first" },
  { id: "i", label: "i", description: "Case insensitive" },
  { id: "m", label: "m", description: "Multiline — ^ and $ match line boundaries" },
  { id: "s", label: "s", description: "Dot-all — . matches newlines too" },
  { id: "u", label: "u", description: "Unicode — enable full Unicode matching" },
] as const;

type FlagId = (typeof ALL_FLAGS)[number]["id"];

// Highlight colours for successive matches
const MATCH_COLORS = [
  "bg-primary/20 text-foreground",
  "bg-amber-500/20 text-foreground",
  "bg-green-500/20 text-foreground",
  "bg-rose-500/20 text-foreground",
  "bg-violet-500/20 text-foreground",
];

interface Segment { text: string; matchIndex: number | null; }
interface MatchInfo { fullMatch: string; groups: Record<string, string>; namedGroups: Record<string, string>; index: number; }

function buildSegments(text: string, regex: RegExp): { segments: Segment[]; matches: MatchInfo[] } {
  const matches: MatchInfo[] = [];
  const segments: Segment[] = [];
  let lastIndex = 0;

  const gRegex = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g");
  let m: RegExpExecArray | null;

  while ((m = gRegex.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;

    if (start > lastIndex) segments.push({ text: text.slice(lastIndex, start), matchIndex: null });

    const matchIdx = matches.length;
    segments.push({ text: m[0], matchIndex: matchIdx });

    const groups: Record<string, string> = {};
    m.forEach((g, i) => { if (i > 0) groups[i] = g ?? ""; });

    const namedGroups = m.groups ? { ...m.groups } : {};
    matches.push({ fullMatch: m[0], groups, namedGroups, index: start });

    lastIndex = end;
    // Prevent infinite loops on zero-length matches
    if (m[0].length === 0) gRegex.lastIndex++;
  }

  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex), matchIndex: null });
  return { segments, matches };
}

const CHEATSHEET = [
  { pattern: ".", desc: "Any character except newline" },
  { pattern: "\\d", desc: "Digit [0-9]" },
  { pattern: "\\D", desc: "Non-digit" },
  { pattern: "\\w", desc: "Word character [a-zA-Z0-9_]" },
  { pattern: "\\W", desc: "Non-word character" },
  { pattern: "\\s", desc: "Whitespace" },
  { pattern: "\\S", desc: "Non-whitespace" },
  { pattern: "^", desc: "Start of string/line" },
  { pattern: "$", desc: "End of string/line" },
  { pattern: "a*", desc: "0 or more a's" },
  { pattern: "a+", desc: "1 or more a's" },
  { pattern: "a?", desc: "0 or 1 a" },
  { pattern: "a{3}", desc: "Exactly 3 a's" },
  { pattern: "a{2,4}", desc: "2 to 4 a's" },
  { pattern: "(abc)", desc: "Capture group" },
  { pattern: "(?:abc)", desc: "Non-capture group" },
  { pattern: "(?<name>abc)", desc: "Named capture group" },
  { pattern: "a|b", desc: "a or b" },
  { pattern: "[abc]", desc: "Character class: a, b, or c" },
  { pattern: "[^abc]", desc: "Not a, b, or c" },
  { pattern: "(?=abc)", desc: "Lookahead: followed by abc" },
  { pattern: "(?!abc)", desc: "Negative lookahead" },
];

export function RegexTesterTool() {
  const [pattern, setPattern] = React.useState("");
  const [flags, setFlags] = React.useState<Set<FlagId>>(new Set(["g"]));
  const [testStr, setTestStr] = React.useState("");
  const [replaceWith, setReplaceWith] = React.useState("");
  const [showCheat, setShowCheat] = React.useState(false);
  const [copiedResult, setCopiedResult] = React.useState(false);

  function toggleFlag(f: FlagId) {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  }

  const flagStr = ALL_FLAGS.map((f) => f.id).filter((f) => flags.has(f)).join("");

  const { regex, error } = React.useMemo(() => {
    if (!pattern) return { regex: null, error: null };
    try {
      return { regex: new RegExp(pattern, flagStr), error: null };
    } catch (e) {
      return { regex: null, error: (e as Error).message };
    }
  }, [pattern, flagStr]);

  const { segments, matches } = React.useMemo(() => {
    if (!regex || !testStr) return { segments: [{ text: testStr, matchIndex: null }], matches: [] };
    try { return buildSegments(testStr, regex); }
    catch { return { segments: [{ text: testStr, matchIndex: null }], matches: [] }; }
  }, [regex, testStr]);

  const replacedStr = React.useMemo(() => {
    if (!regex || !testStr || replaceWith === "") return null;
    try { return testStr.replace(regex, replaceWith); }
    catch { return null; }
  }, [regex, testStr, replaceWith]);

  async function copyReplaced() {
    if (!replacedStr) return;
    await navigator.clipboard.writeText(replacedStr);
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 1500);
  }

  function reset() {
    setPattern("");
    setTestStr("");
    setReplaceWith("");
    setFlags(new Set(["g"]));
  }

  const hasContent = pattern || testStr;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Pattern input + flags */}
      <div className="rounded-lg border border-border/60 bg-card px-4 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-lg font-mono select-none">/</span>
          <div className="flex-1 relative">
            <input
              id="regex-pattern"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className={cn(
                "w-full bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none py-1",
                error && "text-destructive"
              )}
              placeholder="Enter regex pattern…"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
          <span className="text-muted-foreground text-lg font-mono select-none">/</span>
          {/* Flags */}
          <div className="flex gap-1">
            {ALL_FLAGS.map(({ id, label, description }) => (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <button
                    id={`flag-${id}`}
                    onClick={() => toggleFlag(id)}
                    className={cn(
                      "h-7 w-7 rounded text-xs font-mono font-semibold transition-colors",
                      flags.has(id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{description}</TooltipContent>
              </Tooltip>
            ))}
          </div>
          {hasContent && (
            <Button variant="ghost" size="icon" onClick={reset} id="regex-reset" className="h-7 w-7 shrink-0">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-destructive font-mono bg-destructive/10 rounded px-2 py-1">{error}</p>
        )}

        {/* Match stats */}
        {!error && regex && testStr && (
          <div className="flex items-center gap-3 text-xs">
            <span className={cn("font-semibold", matches.length > 0 ? "text-green-500" : "text-muted-foreground")}>
              {matches.length} match{matches.length !== 1 ? "es" : ""}
            </span>
            {matches.length > 0 && (
              <span className="text-muted-foreground">
                {matches.reduce((acc, m) => acc + m.fullMatch.length, 0)} chars matched
              </span>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="test" id="regex-tabs">
        <TabsList>
          <TabsTrigger value="test" id="regex-tab-test">Test</TabsTrigger>
          <TabsTrigger value="replace" id="regex-tab-replace">Replace</TabsTrigger>
          <TabsTrigger value="matches" id="regex-tab-matches">
            Matches {matches.length > 0 && <span className="ml-1 text-[10px] bg-primary/20 text-primary rounded-full px-1.5">{matches.length}</span>}
          </TabsTrigger>
        </TabsList>

        {/* Test tab */}
        <TabsContent value="test" className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Test string</span>
            <Textarea
              id="regex-test-input"
              placeholder="Paste your test string here…"
              value={testStr}
              onChange={(e) => setTestStr(e.target.value)}
              className="h-32 font-mono text-sm resize-none"
              spellCheck={false}
            />
          </div>

          {/* Highlighted output */}
          {testStr && (
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Highlighted</span>
              <div
                id="regex-highlighted"
                className="min-h-16 rounded-md border border-border/60 bg-secondary/20 p-3 font-mono text-sm whitespace-pre-wrap break-all leading-6"
              >
                {segments.map((seg, i) =>
                  seg.matchIndex !== null ? (
                    <mark
                      key={i}
                      className={cn("rounded px-0.5", MATCH_COLORS[seg.matchIndex % MATCH_COLORS.length])}
                      title={`Match ${seg.matchIndex + 1}`}
                    >
                      {seg.text}
                    </mark>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  )
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Replace tab */}
        <TabsContent value="replace" className="mt-4 space-y-3">
          {!testStr && <p className="text-xs text-muted-foreground">Add a test string first in the Test tab.</p>}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Replace with</label>
            <Input
              id="regex-replace-input"
              value={replaceWith}
              onChange={(e) => setReplaceWith(e.target.value)}
              placeholder="Replacement string (use $1, $2, $<name> for groups)…"
              className="font-mono text-sm"
              spellCheck={false}
            />
          </div>
          {replacedStr !== null && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Result</span>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={copyReplaced} id="regex-copy-replaced">
                  {copiedResult ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  Copy
                </Button>
              </div>
              <div className="min-h-16 rounded-md border border-border/60 bg-card p-3 font-mono text-sm whitespace-pre-wrap break-all">
                {replacedStr}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Matches tab */}
        <TabsContent value="matches" className="mt-4">
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">{pattern && testStr ? "No matches found." : "Add a pattern and test string to see matches."}</p>
          ) : (
            <div className="space-y-2">
              {matches.map((m, i) => (
                <div key={i} className="rounded-md border border-border/60 bg-card px-4 py-3 space-y-2" id={`match-${i}`}>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", MATCH_COLORS[i % MATCH_COLORS.length])}>
                      Match {i + 1}
                    </span>
                    <span className="text-[10px] text-muted-foreground">index {m.index}–{m.index + m.fullMatch.length}</span>
                  </div>
                  <p className="font-mono text-sm text-foreground break-all">&ldquo;{m.fullMatch}&rdquo;</p>
                  {Object.keys(m.groups).length > 0 && (
                    <div className="space-y-1">
                      {Object.entries(m.groups).map(([k, v]) => (
                        <div key={k} className="flex gap-2 text-xs">
                          <span className="text-muted-foreground font-mono">Group {k}:</span>
                          <span className="font-mono text-foreground">{v || "(empty)"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {Object.keys(m.namedGroups).length > 0 && (
                    <div className="space-y-1">
                      {Object.entries(m.namedGroups).map(([k, v]) => (
                        <div key={k} className="flex gap-2 text-xs">
                          <span className="text-muted-foreground font-mono">?&lt;{k}&gt;:</span>
                          <span className="font-mono text-foreground">{v ?? "(empty)"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cheatsheet */}
      <div className="rounded-lg border border-border/60 overflow-hidden">
        <button
          onClick={() => setShowCheat(!showCheat)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          id="regex-cheatsheet-toggle"
        >
          <span>Quick Reference</span>
          {showCheat ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {showCheat && (
          <div className="border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-0">
            {CHEATSHEET.map(({ pattern: p, desc }) => (
              <div
                key={p}
                className="flex items-center gap-3 px-4 py-2 border-b border-border/40 last:border-0 hover:bg-secondary/30 cursor-pointer transition-colors"
                onClick={() => setPattern((prev) => prev + p)}
              >
                <code className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">{p}</code>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
