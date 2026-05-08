"use client";
import * as React from "react";
import { Copy, Check, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadText } from "@/lib/utils/download";

type Alignment = "none" | "left" | "center" | "right";

interface TableData { headers: string[]; rows: string[][]; alignments: Alignment[]; }

function alignMarker(a: Alignment, w: number): string {
  const dashes = "-".repeat(Math.max(w, 3));
  switch (a) {
    case "left": return ":" + dashes.slice(1);
    case "right": return dashes.slice(1) + ":";
    case "center": return ":" + dashes.slice(2) + ":";
    default: return dashes;
  }
}

function generateMarkdown(data: TableData): string {
  const { headers, rows, alignments } = data;
  const widths = headers.map((h, i) => Math.max(h.length, rows.reduce((m, r) => Math.max(m, (r[i] ?? "").length), 0), 3));
  const hRow = "| " + headers.map((h, i) => h.padEnd(widths[i])).join(" | ") + " |";
  const sep = "| " + widths.map((w, i) => alignMarker(alignments[i] ?? "none", w)).join(" | ") + " |";
  const dRows = rows.map(r => "| " + widths.map((w, i) => (r[i] ?? "").padEnd(w)).join(" | ") + " |");
  return [hRow, sep, ...dRows].join("\n");
}

function generateHTML(data: TableData): string {
  const aStyle = (a: Alignment) => a !== "none" ? ` style="text-align:${a}"` : "";
  const ths = data.headers.map((h, i) => `    <th${aStyle(data.alignments[i] ?? "none")}>${h}</th>`).join("\n");
  const trs = data.rows.map(r =>
    "  <tr>\n" + data.headers.map((_, i) => `    <td${aStyle(data.alignments[i] ?? "none")}>${r[i] ?? ""}</td>`).join("\n") + "\n  </tr>"
  ).join("\n");
  return `<table>\n  <thead>\n  <tr>\n${ths}\n  </tr>\n  </thead>\n  <tbody>\n${trs}\n  </tbody>\n</table>`;
}

function parseCSV(csv: string): TableData {
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map(l => l.split(",").map(c => c.trim().replace(/^"|"$/g, "")));
  return { headers, rows, alignments: headers.map(() => "none") };
}

const INITIAL: TableData = {
  headers: ["Name", "Role", "Location"],
  rows: [["Alice", "Engineer", "New York"], ["Bob", "Designer", "London"], ["Carol", "PM", "Tokyo"]],
  alignments: ["left", "center", "none"],
};

export function MarkdownTableTool() {
  const [data, setData] = React.useState<TableData>(INITIAL);
  const [mode, setMode] = React.useState<"grid" | "csv">("grid");
  const [csvInput, setCsvInput] = React.useState("");
  const [outputTab, setOutputTab] = React.useState<"markdown" | "html">("markdown");
  const [copied, setCopied] = React.useState(false);

  function setCell(row: number, col: number, val: string) {
    setData(d => { const rows = d.rows.map(r => [...r]); rows[row][col] = val; return { ...d, rows }; });
  }
  function setHeader(col: number, val: string) {
    setData(d => { const headers = [...d.headers]; headers[col] = val; return { ...d, headers }; });
  }
  function setAlignment(col: number, a: Alignment) {
    setData(d => { const alignments = [...d.alignments]; alignments[col] = a; return { ...d, alignments }; });
  }
  function addRow() { setData(d => ({ ...d, rows: [...d.rows, d.headers.map(() => "")] })); }
  function addCol() {
    setData(d => ({
      headers: [...d.headers, `Col ${d.headers.length + 1}`],
      rows: d.rows.map(r => [...r, ""]),
      alignments: [...d.alignments, "none"],
    }));
  }
  function removeRow(i: number) { setData(d => ({ ...d, rows: d.rows.filter((_, j) => j !== i) })); }
  function removeCol(i: number) {
    setData(d => ({
      headers: d.headers.filter((_, j) => j !== i),
      rows: d.rows.map(r => r.filter((_, j) => j !== i)),
      alignments: d.alignments.filter((_, j) => j !== i),
    }));
  }

  function applyCSV() {
    try { setData(parseCSV(csvInput)); setMode("grid"); }
    catch { /* ignore */ }
  }

  const output = outputTab === "markdown" ? generateMarkdown(data) : generateHTML(data);

  async function copy() { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); }

  const ALIGN_ICONS: Record<Alignment, string> = { none: "—", left: "L", center: "C", right: "R" };
  const ALIGN_CYCLE: Alignment[] = ["none", "left", "center", "right"];

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Mode */}
      <div className="flex gap-1.5">
        {(["grid","csv"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${mode === m ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {m === "grid" ? "Visual grid" : "Paste CSV"}
          </button>
        ))}
      </div>

      {mode === "csv" && (
        <div className="space-y-2">
          <textarea value={csvInput} onChange={e => setCsvInput(e.target.value)} rows={5}
            placeholder={"Name,Role,Location\nAlice,Engineer,New York\nBob,Designer,London"}
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            spellCheck={false} />
          <Button size="sm" onClick={applyCSV}>Import CSV</Button>
        </div>
      )}

      {/* Grid */}
      {mode === "grid" && (
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {data.headers.map((h, ci) => (
                  <th key={ci} className="border-b border-r border-border/60 last:border-r-0 p-0 relative bg-secondary/20">
                    <div className="flex flex-col">
                      <input value={h} onChange={e => setHeader(ci, e.target.value)}
                        className="px-2 py-2 font-semibold bg-transparent outline-none w-full text-xs" />
                      <div className="flex items-center justify-between px-1.5 pb-1 gap-1 border-t border-border/40">
                        <button onClick={() => setAlignment(ci, ALIGN_CYCLE[(ALIGN_CYCLE.indexOf(data.alignments[ci] ?? "none") + 1) % 4])}
                          className="text-[10px] text-muted-foreground hover:text-foreground w-5 h-5 rounded bg-secondary flex items-center justify-center transition-colors">
                          {ALIGN_ICONS[data.alignments[ci] ?? "none"]}
                        </button>
                        {data.headers.length > 1 && (
                          <button onClick={() => removeCol(ci)} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors">✕</button>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
                <th className="border-b border-border/60 bg-secondary/10 w-8">
                  <button onClick={addCol} className="w-full h-full text-muted-foreground hover:text-foreground flex items-center justify-center p-2 transition-colors">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-secondary/5">
                  {row.map((cell, ci) => (
                    <td key={ci} className="border-b border-r border-border/40 last:border-r-0 p-0">
                      <input value={cell} onChange={e => setCell(ri, ci, e.target.value)}
                        className="px-2 py-1.5 bg-transparent outline-none w-full text-xs" />
                    </td>
                  ))}
                  <td className="border-b border-border/40 bg-secondary/5 w-8">
                    <button onClick={() => removeRow(ri)} className="w-full h-full text-muted-foreground hover:text-destructive flex items-center justify-center p-1.5 transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={data.headers.length + 1} className="p-0">
                  <button onClick={addRow} className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-2 transition-colors">
                    <Plus className="h-3.5 w-3.5" />Add row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Preview */}
      <div className="rounded-lg border border-border/60 bg-secondary/10 px-4 py-3 overflow-x-auto">
        <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wider">Preview</p>
        <table className="text-sm border-collapse">
          <thead><tr>{data.headers.map((h, i) => <th key={i} className="border border-border/60 px-3 py-1.5 text-left text-xs font-semibold bg-secondary/20">{h}</th>)}</tr></thead>
          <tbody>{data.rows.map((row, ri) => <tr key={ri}>{row.map((c, ci) => <td key={ci} className="border border-border/60 px-3 py-1 text-xs text-muted-foreground">{c}</td>)}</tr>)}</tbody>
        </table>
      </div>

      {/* Output */}
      <div className="space-y-2">
        <div className="flex gap-1.5">
          {(["markdown","html"] as const).map(t => (
            <button key={t} onClick={() => setOutputTab(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium uppercase transition-colors ${outputTab === t ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
        <textarea readOnly value={output}
          className="w-full h-32 rounded-md border border-input bg-background px-3 py-2.5 font-mono text-xs leading-relaxed resize-y focus:outline-none"
          spellCheck={false} />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copy} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}Copy
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadText(output, `table.${outputTab === "markdown" ? "md" : "html"}`)} className="gap-1.5">
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}
