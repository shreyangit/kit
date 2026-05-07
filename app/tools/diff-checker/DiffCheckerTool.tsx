"use client";

import * as React from "react";
import * as Diff from "diff";
import { Copy, Check, Download, RotateCcw, Columns2, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadText } from "@/lib/utils/download";
import { cn } from "@/lib/utils";

type DiffMode = "lines" | "words" | "chars";
type ViewMode = "split" | "unified";

// ── Split view line pairing ─────────────────────────────────────────────────

interface SplitRow {
  leftText: string;
  leftType: "removed" | "unchanged" | null;
  rightText: string;
  rightType: "added" | "unchanged" | null;
}

function buildSplitRows(changes: Diff.Change[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let i = 0;

  while (i < changes.length) {
    const cur = changes[i];

    if (!cur.added && !cur.removed) {
      // Unchanged: split by lines, each line is a row
      const lines = cur.value.split("\n").filter((_, idx, arr) => idx < arr.length - 1 || arr[arr.length - 1] !== "");
      for (const line of lines) {
        rows.push({ leftText: line, leftType: "unchanged", rightText: line, rightType: "unchanged" });
      }
      i++;
    } else if (cur.removed) {
      const next = changes[i + 1];
      if (next?.added) {
        // Paired removal/addition
        const removedLines = cur.value.split("\n").filter((_, idx, arr) => !(idx === arr.length - 1 && arr[arr.length - 1] === ""));
        const addedLines = next.value.split("\n").filter((_, idx, arr) => !(idx === arr.length - 1 && arr[arr.length - 1] === ""));
        const len = Math.max(removedLines.length, addedLines.length);
        for (let j = 0; j < len; j++) {
          rows.push({
            leftText: removedLines[j] ?? "",
            leftType: removedLines[j] !== undefined ? "removed" : null,
            rightText: addedLines[j] ?? "",
            rightType: addedLines[j] !== undefined ? "added" : null,
          });
        }
        i += 2;
      } else {
        const lines = cur.value.split("\n").filter((_, idx, arr) => !(idx === arr.length - 1 && arr[arr.length - 1] === ""));
        for (const line of lines) {
          rows.push({ leftText: line, leftType: "removed", rightText: "", rightType: null });
        }
        i++;
      }
    } else {
      // Orphan addition
      const lines = cur.value.split("\n").filter((_, idx, arr) => !(idx === arr.length - 1 && arr[arr.length - 1] === ""));
      for (const line of lines) {
        rows.push({ leftText: "", leftType: null, rightText: line, rightType: "added" });
      }
      i++;
    }
  }
  return rows;
}

// ── Unified lines ──────────────────────────────────────────────────────────

interface UnifiedLine {
  text: string;
  type: "added" | "removed" | "unchanged";
}

function buildUnifiedLines(changes: Diff.Change[]): UnifiedLine[] {
  const lines: UnifiedLine[] = [];
  for (const change of changes) {
    const type = change.added ? "added" : change.removed ? "removed" : "unchanged";
    const parts = change.value.split("\n");
    // Remove trailing empty caused by trailing newline
    if (parts[parts.length - 1] === "") parts.pop();
    for (const part of parts) {
      lines.push({ text: part, type });
    }
  }
  return lines;
}

// ── Stats ──────────────────────────────────────────────────────────────────

function computeStats(changes: Diff.Change[]) {
  let added = 0, removed = 0, unchanged = 0;
  for (const c of changes) {
    const lines = c.value.split("\n").filter((l, i, a) => !(i === a.length - 1 && l === "")).length;
    if (c.added) added += lines;
    else if (c.removed) removed += lines;
    else unchanged += lines;
  }
  return { added, removed, unchanged };
}

function buildUnifiedPatch(original: string, modified: string): string {
  return Diff.createPatch("text", original, modified, "Original", "Modified");
}

// ── Inline word-level highlight for removed/added lines ──────────────────

function highlightWordDiff(left: string, right: string): { leftJsx: React.ReactNode; rightJsx: React.ReactNode } {
  const wordDiff = Diff.diffWords(left, right);
  const leftJsx = wordDiff
    .filter((c) => !c.added)
    .map((c, i) =>
      c.removed ? <mark key={i} className="bg-red-500/30 rounded-sm">{c.value}</mark> : <span key={i}>{c.value}</span>
    );
  const rightJsx = wordDiff
    .filter((c) => !c.removed)
    .map((c, i) =>
      c.added ? <mark key={i} className="bg-green-500/30 rounded-sm">{c.value}</mark> : <span key={i}>{c.value}</span>
    );
  return { leftJsx, rightJsx };
}

// ── Cell ───────────────────────────────────────────────────────────────────

const lineTypeClass: Record<string, string> = {
  removed: "bg-red-500/10 border-l-2 border-red-500/50",
  added: "bg-green-500/10 border-l-2 border-green-500/50",
  unchanged: "",
};

const lineTypePrefix: Record<string, string> = {
  removed: "−",
  added: "+",
  unchanged: " ",
};

// ── Main component ─────────────────────────────────────────────────────────

export function DiffCheckerTool() {
  const [original, setOriginal] = React.useState("");
  const [modified, setModified] = React.useState("");
  const [mode, setMode] = React.useState<DiffMode>("lines");
  const [viewMode, setViewMode] = React.useState<ViewMode>("split");
  const [ignoreWs, setIgnoreWs] = React.useState(false);
  const [onlyChanged, setOnlyChanged] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const hasContent = original || modified;

  const changes = React.useMemo(() => {
    if (!original && !modified) return [];
    const opts = { ignoreWhitespace: ignoreWs };
    switch (mode) {
      case "lines": return Diff.diffLines(original, modified, opts);
      case "words": return Diff.diffWords(original, modified);
      case "chars": return Diff.diffChars(original, modified);
    }
  }, [original, modified, mode, ignoreWs]);

  const stats = React.useMemo(() => computeStats(changes), [changes]);
  const splitRows = React.useMemo(() => mode === "lines" ? buildSplitRows(changes) : [], [changes, mode]);
  const unifiedLines = React.useMemo(() => mode === "lines" ? buildUnifiedLines(changes) : [], [changes, mode]);

  const displaySplitRows = onlyChanged
    ? splitRows.filter((r) => r.leftType !== "unchanged" || r.rightType !== "unchanged")
    : splitRows;
  const displayUnifiedLines = onlyChanged
    ? unifiedLines.filter((l) => l.type !== "unchanged")
    : unifiedLines;

  async function handleCopyPatch() {
    const patch = buildUnifiedPatch(original, modified);
    await navigator.clipboard.writeText(patch);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDownloadPatch() {
    downloadText(buildUnifiedPatch(original, modified), "diff.patch", "text/plain");
  }

  function handleSwap() {
    setOriginal(modified);
    setModified(original);
  }

  function handleReset() {
    setOriginal("");
    setModified("");
  }

  return (
    <div className="space-y-5">
      {/* Input panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Original</span>
            <span className="text-[10px] text-muted-foreground">{original.split("\n").length} lines</span>
          </div>
          <Textarea
            id="diff-original"
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            placeholder="Paste original text here…"
            className="h-48 font-mono text-xs leading-relaxed resize-none"
            spellCheck={false}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Modified</span>
            <span className="text-[10px] text-muted-foreground">{modified.split("\n").length} lines</span>
          </div>
          <Textarea
            id="diff-modified"
            value={modified}
            onChange={(e) => setModified(e.target.value)}
            placeholder="Paste modified text here…"
            className="h-48 font-mono text-xs leading-relaxed resize-none"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Diff mode */}
        <div className="flex rounded-md border border-border overflow-hidden text-xs">
          {(["lines", "words", "chars"] as DiffMode[]).map((m) => (
            <button
              key={m}
              id={`diff-mode-${m}`}
              onClick={() => setMode(m)}
              className={cn("px-3 py-1.5 capitalize transition-colors", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50")}
            >
              {m}
            </button>
          ))}
        </div>

        {/* View mode */}
        <div className="flex rounded-md border border-border overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <button id="diff-view-split" onClick={() => setViewMode("split")} className={cn("px-2.5 py-1.5 transition-colors", viewMode === "split" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50")}>
                <Columns2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Split view</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button id="diff-view-unified" onClick={() => setViewMode("unified")} className={cn("px-2.5 py-1.5 transition-colors", viewMode === "unified" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50")}>
                <AlignLeft className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Unified view</TooltipContent>
          </Tooltip>
        </div>

        {/* Toggles */}
        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none text-muted-foreground">
          <input type="checkbox" checked={ignoreWs} onChange={(e) => setIgnoreWs(e.target.checked)} id="diff-ignore-ws" className="rounded" />
          Ignore whitespace
        </label>
        {hasContent && changes.some((c) => c.added || c.removed) && (
          <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none text-muted-foreground">
            <input type="checkbox" checked={onlyChanged} onChange={(e) => setOnlyChanged(e.target.checked)} id="diff-only-changed" className="rounded" />
            Changed only
          </label>
        )}

        <div className="flex-1" />

        {/* Actions */}
        {hasContent && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={handleSwap} id="diff-swap-btn">⇅ Swap</Button>
              </TooltipTrigger>
              <TooltipContent>Swap original and modified</TooltipContent>
            </Tooltip>
            {original && modified && (
              <>
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={handleCopyPatch} id="diff-copy-patch">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy patch
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={handleDownloadPatch} id="diff-download-patch">
                  <Download className="h-3.5 w-3.5" /> .patch
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={handleReset} id="diff-reset-btn">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </>
        )}
      </div>

      {/* Stats bar */}
      {hasContent && changes.length > 0 && (
        <div className="flex items-center gap-4 text-xs">
          {stats.added > 0 && <span className="text-green-500 font-medium">+{stats.added} added</span>}
          {stats.removed > 0 && <span className="text-red-400 font-medium">−{stats.removed} removed</span>}
          {stats.added === 0 && stats.removed === 0 && <span className="text-muted-foreground">No differences found.</span>}
        </div>
      )}

      {/* Diff output */}
      {hasContent && changes.length > 0 && (
        <div className="rounded-lg border border-border/60 overflow-hidden">
          {/* For word/char diff: simple colored spans */}
          {mode !== "lines" && (
            <div className="p-4 font-mono text-xs leading-7 whitespace-pre-wrap break-all bg-card">
              {changes.map((c, i) =>
                c.added ? (
                  <mark key={i} className="bg-green-500/20 text-foreground rounded-sm">{c.value}</mark>
                ) : c.removed ? (
                  <mark key={i} className="bg-red-500/20 text-foreground rounded-sm line-through">{c.value}</mark>
                ) : (
                  <span key={i}>{c.value}</span>
                )
              )}
            </div>
          )}

          {/* Split view (lines mode) */}
          {mode === "lines" && viewMode === "split" && (
            <div className="grid grid-cols-2 divide-x divide-border/60 overflow-x-auto">
              {/* Headers */}
              <div className="px-4 py-2 bg-secondary/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Original</div>
              <div className="px-4 py-2 bg-secondary/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Modified</div>

              {displaySplitRows.map((row, i) => {
                const wordDiffs = (row.leftType === "removed" && row.rightType === "added")
                  ? highlightWordDiff(row.leftText, row.rightText)
                  : null;

                return (
                  <React.Fragment key={i}>
                    <div className={cn("px-4 py-0.5 font-mono text-xs leading-5 min-h-[1.75rem]", row.leftType ? lineTypeClass[row.leftType] : "bg-secondary/5")}>
                      {row.leftType && (
                        <span className={cn("mr-2 select-none text-[10px]", row.leftType === "removed" ? "text-red-400" : "text-muted-foreground")}>
                          {lineTypePrefix[row.leftType]}
                        </span>
                      )}
                      {wordDiffs ? wordDiffs.leftJsx : row.leftText}
                    </div>
                    <div className={cn("px-4 py-0.5 font-mono text-xs leading-5 min-h-[1.75rem]", row.rightType ? lineTypeClass[row.rightType] : "bg-secondary/5")}>
                      {row.rightType && (
                        <span className={cn("mr-2 select-none text-[10px]", row.rightType === "added" ? "text-green-400" : "text-muted-foreground")}>
                          {lineTypePrefix[row.rightType]}
                        </span>
                      )}
                      {wordDiffs ? wordDiffs.rightJsx : row.rightText}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Unified view (lines mode) */}
          {mode === "lines" && viewMode === "unified" && (
            <div className="overflow-x-auto">
              {displayUnifiedLines.map((line, i) => (
                <div
                  key={i}
                  className={cn("flex items-start font-mono text-xs leading-5 min-h-[1.75rem]", lineTypeClass[line.type])}
                >
                  <span className={cn("w-6 shrink-0 text-center select-none text-[10px] pt-0.5", line.type === "added" ? "text-green-400" : line.type === "removed" ? "text-red-400" : "text-muted-foreground/30")}>
                    {lineTypePrefix[line.type]}
                  </span>
                  <span className="flex-1 px-2 py-0.5 break-all">{line.text || <span className="text-muted-foreground/30">↵</span>}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!hasContent && (
        <div className="rounded-lg border border-dashed border-border/60 py-16 text-center">
          <p className="text-sm text-muted-foreground">Paste text in both panels above to see differences.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Supports line, word, and character-level diffing.</p>
        </div>
      )}
    </div>
  );
}
