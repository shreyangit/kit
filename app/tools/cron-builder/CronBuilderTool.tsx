"use client";
import * as React from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "Every minute", expression: "* * * * *" },
  { label: "Every 5 min", expression: "*/5 * * * *" },
  { label: "Every 15 min", expression: "*/15 * * * *" },
  { label: "Every 30 min", expression: "*/30 * * * *" },
  { label: "Hourly", expression: "0 * * * *" },
  { label: "Every 6h", expression: "0 */6 * * *" },
  { label: "Daily midnight", expression: "0 0 * * *" },
  { label: "Daily 9am", expression: "0 9 * * *" },
  { label: "Weekdays 9am", expression: "0 9 * * 1-5" },
  { label: "Mon 9am", expression: "0 9 * * 1" },
  { label: "Weekly (Sun)", expression: "0 0 * * 0" },
  { label: "Monthly 1st", expression: "0 0 1 * *" },
];

function matchField(value: number, field: string): boolean {
  if (field === "*") return true;
  if (field.includes("/")) return value % parseInt(field.split("/")[1]) === 0;
  if (field.includes("-")) { const [a, b] = field.split("-").map(Number); return value >= a && value <= b; }
  if (field.includes(",")) return field.split(",").map(Number).includes(value);
  return parseInt(field) === value;
}

function nextRuns(expr: string, count = 5): Date[] {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return [];
  const results: Date[] = [];
  let c = new Date(Math.ceil(Date.now() / 60000) * 60000);
  let iter = 0;
  while (results.length < count && iter++ < 100000) {
    const [min, hr, dom, mon, dow] = parts;
    if (matchField(c.getMinutes(), min) && matchField(c.getHours(), hr) &&
      matchField(c.getDate(), dom) && matchField(c.getMonth() + 1, mon) &&
      matchField(c.getDay(), dow)) results.push(new Date(c));
    c = new Date(c.getTime() + 60000);
  }
  return results;
}

function fmtDate(d: Date) {
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function CronBuilderTool() {
  const [expr, setExpr] = React.useState("0 9 * * 1-5");
  const [description, setDescription] = React.useState("");
  const [descError, setDescError] = React.useState<string | null>(null);
  const [runs, setRuns] = React.useState<Date[]>([]);
  const [copied, setCopied] = React.useState(false);
  const [mode, setMode] = React.useState<"visual" | "manual">("visual");

  // Visual mode state
  const [minute, setMinute] = React.useState("0");
  const [hour, setHour] = React.useState("9");
  const [dom, setDom] = React.useState("*");
  const [month, setMonth] = React.useState("*");
  const [dow, setDow] = React.useState("1-5");

  React.useEffect(() => {
    if (mode === "visual") setExpr(`${minute} ${hour} ${dom} ${month} ${dow}`);
  }, [minute, hour, dom, month, dow, mode]);

  React.useEffect(() => {
    describe();
  }, [expr]);

  async function describe() {
    if (!expr.trim()) return;
    try {
      const cronstrue = (await import("cronstrue")).default;
      const desc = cronstrue.toString(expr.trim(), { throwExceptionOnParseError: true, verbose: true });
      setDescription(desc); setDescError(null);
      setRuns(nextRuns(expr.trim()));
    } catch (e) {
      setDescError((e as Error).message); setDescription(""); setRuns([]);
    }
  }

  function applyPreset(e: string) {
    setExpr(e);
    const [m, h, d, mo, dw] = e.split(" ");
    setMinute(m); setHour(h); setDom(d); setMonth(mo); setDow(dw);
  }

  async function copy() { await navigator.clipboard.writeText(expr); setCopied(true); setTimeout(() => setCopied(false), 1500); }

  const fieldClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Mode toggle */}
      <div className="flex gap-1.5">
        {(["visual", "manual"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${mode === m ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {m === "visual" ? "Visual builder" : "Manual input"}
          </button>
        ))}
      </div>

      {/* Visual builder */}
      {mode === "visual" && (
        <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-4">
          {[
            { label: "Minute", value: minute, set: setMinute, examples: ["*", "0", "*/5", "0,30", "0-30"] },
            { label: "Hour", value: hour, set: setHour, examples: ["*", "0", "9", "*/6", "9-17"] },
            { label: "Day of month", value: dom, set: setDom, examples: ["*", "1", "15", "1,15"] },
            { label: "Month", value: month, set: setMonth, examples: ["*", "1", "6", "1-3"] },
            { label: "Day of week", value: dow, set: setDow, examples: ["*", "0", "1-5", "1", "0,6"] },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-28 shrink-0">{f.label}</span>
              <input value={f.value} onChange={e => f.set(e.target.value)}
                className="w-24 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring" />
              <div className="flex gap-1 flex-wrap">
                {f.examples.map(ex => (
                  <button key={ex} onClick={() => f.set(ex)}
                    className="px-2 py-0.5 rounded bg-secondary text-muted-foreground text-[11px] font-mono hover:text-foreground hover:bg-secondary/70 transition-colors">
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual input */}
      {mode === "manual" && (
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Cron expression <span className="opacity-50">(minute hour day month weekday)</span></label>
          <input id="cron-input" value={expr} onChange={e => setExpr(e.target.value)}
            className={fieldClass} placeholder="* * * * *" />
        </div>
      )}

      {/* Expression display */}
      <div className="rounded-lg border border-border/60 bg-secondary/10 px-4 py-3 flex items-center gap-3">
        <span className="font-mono text-lg font-semibold tracking-widest flex-1">{expr}</span>
        <Button variant="ghost" size="sm" onClick={copy} className="gap-1.5 shrink-0">
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>

      {/* Description */}
      {description && (
        <div className="rounded-lg border border-border/60 bg-card px-4 py-3">
          <p className="text-sm font-medium text-foreground">{description}</p>
          {runs.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs text-muted-foreground font-medium mb-1.5">Next {runs.length} scheduled runs</p>
              {runs.map((r, i) => (
                <p key={i} className="text-xs font-mono text-muted-foreground">
                  <span className="text-foreground/40 mr-2">{i + 1}.</span>{fmtDate(r)}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
      {descError && <p className="text-xs text-destructive">{descError}</p>}

      {/* Presets */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Common presets</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <button key={p.expression} onClick={() => applyPreset(p.expression)}
              className={cn("px-2.5 py-1 rounded-md border text-xs transition-colors",
                expr === p.expression ? "border-foreground/30 bg-foreground/5 text-foreground" : "border-border/60 text-muted-foreground hover:border-foreground/20 hover:text-foreground")}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
