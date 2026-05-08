"use client";

import * as React from "react";
import { Upload, Download, RefreshCw, FileSpreadsheet, Braces } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { downloadBlob } from "@/lib/utils/download";
import { cn } from "@/lib/utils";

type Direction = "json-to-excel" | "excel-to-json";
type JsonStatus = "idle" | "ok" | "error";

function flattenObj(obj: Record<string, unknown>, prefix = ""): Record<string, string | number | boolean | null> {
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, val] of Object.entries(obj)) {
    const k = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      Object.assign(result, flattenObj(val as Record<string, unknown>, k));
    } else {
      result[k] = val as string | number | boolean | null;
    }
  }
  return result;
}

export function JsonExcelTool() {
  const [dir, setDir] = React.useState<Direction>("json-to-excel");
  const [jsonText, setJsonText] = React.useState("");
  const [jsonStatus, setJsonStatus] = React.useState<JsonStatus>("idle");
  const [jsonError, setJsonError] = React.useState("");
  const [excelFile, setExcelFile] = React.useState<File | null>(null);
  const [excelJson, setExcelJson] = React.useState("");
  const [preview, setPreview] = React.useState<{ headers: string[]; rows: (string | number | boolean | null)[][] } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // Validate JSON live
  React.useEffect(() => {
    if (!jsonText.trim()) { setJsonStatus("idle"); return; }
    try { JSON.parse(jsonText); setJsonStatus("ok"); setJsonError(""); }
    catch (e) { setJsonStatus("error"); setJsonError((e as Error).message); }
  }, [jsonText]);

  // Build preview from JSON
  const previewData = React.useMemo(() => {
    if (!jsonText.trim() || jsonStatus !== "ok") return null;
    try {
      const parsed = JSON.parse(jsonText);
      const arr: Record<string, unknown>[] = Array.isArray(parsed) ? parsed : [parsed];
      const flatRows = arr.map(r => flattenObj(r as Record<string, unknown>));
      const allKeys = [...new Set(flatRows.flatMap(r => Object.keys(r)))];
      return { headers: allKeys, rows: flatRows.map(r => allKeys.map(k => r[k] ?? null)) };
    } catch { return null; }
  }, [jsonText, jsonStatus]);

  async function downloadExcel() {
    if (!previewData) return;
    setLoading(true);
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.aoa_to_sheet([previewData.headers, ...previewData.rows.map(row => row.map(v => v ?? ""))]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      downloadBlob(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "data.xlsx");
    } finally { setLoading(false); }
  }

  async function downloadCSV() {
    if (!previewData) return;
    const rows = [previewData.headers, ...previewData.rows];
    const csv = rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv" }), "data.csv");
  }

  async function readExcel(file: File) {
    setLoading(true);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: null });
      setExcelJson(JSON.stringify(json, null, 2));
      const headers = json.length ? Object.keys(json[0] as object) : [];
      const rows = (json as Record<string, unknown>[]).slice(0, 20).map(r => headers.map(h => r[h] as string | number | boolean | null));
      setPreview({ headers, rows });
    } catch (e) {
      setExcelJson(`Error: ${(e as Error).message}`);
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <Tabs value={dir} onValueChange={v => { setDir(v as Direction); setPreview(null); }}>
        <TabsList>
          <TabsTrigger value="json-to-excel" id="jxl-tab-j2e" className="gap-1.5">
            <Braces className="h-3.5 w-3.5" />JSON → Excel
          </TabsTrigger>
          <TabsTrigger value="excel-to-json" id="jxl-tab-e2j" className="gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5" />Excel → JSON
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {dir === "json-to-excel" ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">JSON input — array of objects, or a single object</span>
              {jsonStatus === "ok" && <span className="text-[10px] text-green-500 font-mono">✓ Valid JSON</span>}
              {jsonStatus === "error" && <span className="text-[10px] text-destructive font-mono">✗ Invalid</span>}
            </div>
            <Textarea
              id="jxl-json-input"
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              placeholder={'[\n  {"name": "Alice", "age": 30},\n  {"name": "Bob", "age": 25}\n]'}
              className={cn("h-48 font-mono text-xs leading-relaxed", jsonStatus === "error" && "border-destructive")}
              spellCheck={false}
            />
            {jsonError && <p className="text-[10px] text-destructive font-mono">{jsonError}</p>}
          </div>

          {previewData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{previewData.rows.length} rows · {previewData.headers.length} columns</span>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={downloadCSV} id="jxl-csv">
                    <Download className="h-3.5 w-3.5" />CSV
                  </Button>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={downloadExcel} disabled={loading} id="jxl-xlsx">
                    <Download className="h-3.5 w-3.5" />{loading ? "Exporting…" : "Excel (.xlsx)"}
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/30">
                    <tr>{previewData.headers.map(h => <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground border-b border-border/60 whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {previewData.rows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-secondary/10">
                        {row.map((cell, j) => <td key={j} className="px-3 py-1.5 font-mono max-w-32 truncate">{String(cell ?? "")}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.rows.length > 10 && (
                  <div className="px-3 py-2 text-[10px] text-muted-foreground border-t border-border/60">
                    Showing 10 of {previewData.rows.length} rows
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {!excelFile ? (
            <button onClick={() => fileRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-border/60 bg-secondary/10 hover:border-primary/40 hover:bg-secondary/20 transition-colors py-12 flex flex-col items-center gap-3 cursor-pointer">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Drop .xlsx or .csv or tap to select</p>
                <p className="text-xs text-muted-foreground mt-0.5">Only the first sheet is processed</p>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-md border border-border/60 bg-card px-4 py-3">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <span className="text-sm truncate flex-1">{excelFile.name}</span>
              <Button variant="ghost" size="sm" onClick={() => { setExcelFile(null); setExcelJson(""); setPreview(null); }} className="gap-1">
                <RefreshCw className="h-3.5 w-3.5" />Change
              </Button>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="sr-only"
            onChange={e => { const f = e.target.files?.[0]; if (f) { setExcelFile(f); readExcel(f); } }} />

          {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="inline-block h-4 w-4 rounded-full border-2 border-border border-t-primary animate-spin" />Reading file…</div>}

          {excelJson && (
            <div className="space-y-2">
              {preview && (
                <div className="overflow-x-auto rounded-lg border border-border/60 mb-2">
                  <table className="w-full text-xs">
                    <thead className="bg-secondary/30">
                      <tr>{preview.headers.map(h => <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground border-b border-border/60 whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {preview.rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-secondary/10">
                          {row.map((cell, j) => <td key={j} className="px-3 py-1.5 font-mono max-w-32 truncate">{String(cell ?? "")}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">JSON Output</span>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => downloadBlob(new Blob([excelJson], { type: "application/json" }), "data.json")} id="jxl-download-json">
                  <Download className="h-3.5 w-3.5" />Download JSON
                </Button>
              </div>
              <Textarea readOnly value={excelJson} className="h-48 font-mono text-xs leading-relaxed" spellCheck={false} id="jxl-json-output" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
