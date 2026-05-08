"use client";

import * as React from "react";
import Papa from "papaparse";
import { Copy, Check, Download, Upload, RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadText } from "@/lib/utils/download";
import { cn } from "@/lib/utils";

type Delimiter = "," | ";" | "\t" | "|";
type JsonFormat = "objects" | "arrays" | "values";

const DELIMITERS: { value: Delimiter; label: string }[] = [
  { value: ",", label: "Comma (,)" },
  { value: ";", label: "Semicolon (;)" },
  { value: "\t", label: "Tab" },
  { value: "|", label: "Pipe (|)" },
];

function CopyBtn({ text, id }: { text: string; id: string }) {
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={copy} id={id}>
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}

// ── CSV → JSON ────────────────────────────────────────────────────────────

function CsvToJsonTab() {
  const [csv, setCsv] = React.useState("");
  const [delimiter, setDelimiter] = React.useState<Delimiter>(",");
  const [hasHeader, setHasHeader] = React.useState(true);
  const [format, setFormat] = React.useState<JsonFormat>("objects");
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const { json, headers, preview } = React.useMemo(() => {
    if (!csv.trim()) return { json: "", headers: [], preview: [] };
    try {
      const result = Papa.parse(csv.trim(), {
        delimiter,
        header: hasHeader,
        skipEmptyLines: true,
        dynamicTyping: true,
      });

      if (result.errors.length) {
        setError(result.errors[0].message);
        return { json: "", headers: [], preview: [] };
      }
      setError(null);

      let output: unknown;
      const headers = hasHeader ? (result.meta.fields ?? []) : [];

      if (!hasHeader) {
        const rows = result.data as unknown[][];
        output = format === "arrays" ? rows : format === "values" && rows[0]?.length === 1 ? rows.map(r => r[0]) : rows;
      } else {
        const data = result.data as Record<string, unknown>[];
        if (format === "objects") output = data;
        else if (format === "arrays") output = [result.meta.fields, ...data.map(row => (result.meta.fields ?? []).map(f => row[f]))];
        else output = data;
      }

      return {
        json: JSON.stringify(output, null, 2),
        headers,
        preview: (hasHeader ? result.data : result.data).slice(0, 5) as Record<string, unknown>[],
      };
    } catch (e) {
      setError((e as Error).message);
      return { json: "", headers: [], preview: [] };
    }
  }, [csv, delimiter, hasHeader, format]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsv(text);
  }

  return (
    <div className="space-y-4">
      {/* Options */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={delimiter} onValueChange={(v) => setDelimiter(v as Delimiter)}>
          <SelectTrigger id="csv-delimiter" className="w-40 text-xs h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DELIMITERS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={format} onValueChange={(v) => setFormat(v as JsonFormat)}>
          <SelectTrigger id="csv-format" className="w-44 text-xs h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="objects">Array of objects</SelectItem>
            <SelectItem value="arrays">Array of arrays</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
          <input type="checkbox" checked={hasHeader} onChange={e => setHasHeader(e.target.checked)} id="csv-has-header" className="rounded" />
          First row is header
        </label>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1 ml-auto" onClick={() => fileRef.current?.click()} id="csv-upload-btn">
          <Upload className="h-3.5 w-3.5" /> Upload CSV
        </Button>
        <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" className="sr-only" onChange={handleFile} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* CSV input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">CSV Input</span>
            {csv && <button onClick={() => setCsv("")} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"><RotateCcw className="h-3 w-3" />Clear</button>}
          </div>
          <Textarea
            id="csv-input"
            value={csv}
            onChange={e => setCsv(e.target.value)}
            placeholder={"name,age,city\nAlice,30,NYC\nBob,25,LA"}
            className="h-64 font-mono text-xs leading-relaxed"
            spellCheck={false}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        {/* JSON output */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">JSON Output</span>
            {json && (
              <div className="flex gap-1">
                <CopyBtn text={json} id="csv-json-copy" />
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => downloadText(json, "output.json", "application/json")} id="csv-json-download">
                  <Download className="h-3.5 w-3.5" />.json
                </Button>
              </div>
            )}
          </div>
          <pre className="h-64 overflow-auto rounded-md border border-border/60 bg-secondary/20 px-4 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all" id="csv-json-output">
            {json || <span className="text-muted-foreground">Output appears here…</span>}
          </pre>
        </div>
      </div>

      {/* Preview table */}
      {preview.length > 0 && headers.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">Preview (first 5 rows)</span>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-xs">
              <thead className="bg-secondary/30">
                <tr>
                  {headers.map(h => <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground border-b border-border/60 whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {(preview as Record<string, unknown>[]).map((row, i) => (
                  <tr key={i} className={cn(i % 2 === 0 ? "bg-card" : "bg-secondary/10")}>
                    {headers.map(h => <td key={h} className="px-3 py-2 font-mono border-b border-border/40 last:border-0 whitespace-nowrap">{String(row[h] ?? "")}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── JSON → CSV ────────────────────────────────────────────────────────────

function JsonToCsvTab() {
  const [json, setJson] = React.useState("");
  const [delimiter, setDelimiter] = React.useState<Delimiter>(",");
  const [error, setError] = React.useState<string | null>(null);

  const { csv, rowCount } = React.useMemo(() => {
    if (!json.trim()) return { csv: "", rowCount: 0 };
    try {
      const parsed = JSON.parse(json);
      setError(null);

      let rows: Record<string, unknown>[];
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object") {
        rows = parsed;
      } else if (typeof parsed === "object" && !Array.isArray(parsed)) {
        rows = [parsed];
      } else {
        setError("Input must be an array of objects or a single object.");
        return { csv: "", rowCount: 0 };
      }

      const allKeys = [...new Set(rows.flatMap(r => Object.keys(r)))];
      const dl = delimiter === "\t" ? "\t" : delimiter;
      const headerRow = allKeys.map(k => `"${k.replace(/"/g, '""')}"`).join(dl);
      const dataRows = rows.map(row =>
        allKeys.map(k => {
          const val = row[k];
          if (val === null || val === undefined) return "";
          const str = String(val);
          return str.includes(dl) || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(dl)
      );

      return { csv: [headerRow, ...dataRows].join("\n"), rowCount: rows.length };
    } catch (e) {
      setError((e as Error).message);
      return { csv: "", rowCount: 0 };
    }
  }, [json, delimiter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={delimiter} onValueChange={(v) => setDelimiter(v as Delimiter)}>
          <SelectTrigger id="json-delimiter" className="w-40 text-xs h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DELIMITERS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {rowCount > 0 && <span className="text-xs text-muted-foreground">{rowCount} row{rowCount !== 1 ? "s" : ""}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">JSON Input</span>
            {json && <button onClick={() => setJson("")} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"><RotateCcw className="h-3 w-3" />Clear</button>}
          </div>
          <Textarea
            id="json-input"
            value={json}
            onChange={e => setJson(e.target.value)}
            placeholder={'[\n  {"name":"Alice","age":30},\n  {"name":"Bob","age":25}\n]'}
            className="h-64 font-mono text-xs leading-relaxed"
            spellCheck={false}
          />
          {error && <p className="text-xs text-destructive font-mono">{error}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">CSV Output</span>
            {csv && (
              <div className="flex gap-1">
                <CopyBtn text={csv} id="json-csv-copy" />
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => downloadText(csv, "output.csv", "text/csv")} id="json-csv-download">
                  <Download className="h-3.5 w-3.5" />.csv
                </Button>
              </div>
            )}
          </div>
          <pre className="h-64 overflow-auto rounded-md border border-border/60 bg-secondary/20 px-4 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all" id="json-csv-output">
            {csv || <span className="text-muted-foreground">Output appears here…</span>}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

export function CsvJsonTool() {
  return (
    <div className="space-y-5 max-w-5xl">
      <Tabs defaultValue="csv-to-json" id="csv-json-tabs">
        <TabsList>
          <TabsTrigger value="csv-to-json" id="tab-csv-json">
            CSV <ArrowRight className="h-3 w-3 mx-1" /> JSON
          </TabsTrigger>
          <TabsTrigger value="json-to-csv" id="tab-json-csv">
            JSON <ArrowRight className="h-3 w-3 mx-1" /> CSV
          </TabsTrigger>
        </TabsList>
        <TabsContent value="csv-to-json" className="mt-5"><CsvToJsonTab /></TabsContent>
        <TabsContent value="json-to-csv" className="mt-5"><JsonToCsvTab /></TabsContent>
      </Tabs>
    </div>
  );
}
