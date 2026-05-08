"use client";
import * as React from "react";
import { Copy, Check, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const TZ_LIST = [
  { label: "UTC", tz: "UTC" },
  { label: "New York", tz: "America/New_York" },
  { label: "London", tz: "Europe/London" },
  { label: "Mumbai", tz: "Asia/Kolkata" },
  { label: "Tokyo", tz: "Asia/Tokyo" },
  { label: "Sydney", tz: "Australia/Sydney" },
];

function formatInTZ(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "short", year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, timeZoneName: "short",
  }).format(d);
}

function relative(diffMs: number): string {
  const abs = Math.abs(diffMs), suf = diffMs < 0 ? "ago" : "from now";
  if (abs < 60000) return `${Math.round(abs / 1000)} seconds ${suf}`;
  if (abs < 3600000) return `${Math.round(abs / 60000)} minutes ${suf}`;
  if (abs < 86400000) return `${Math.round(abs / 3600000)} hours ${suf}`;
  if (abs < 2592000000) return `${Math.round(abs / 86400000)} days ${suf}`;
  if (abs < 31536000000) return `${Math.round(abs / 2592000000)} months ${suf}`;
  return `${Math.round(abs / 31536000000)} years ${suf}`;
}

function convert(input: string | number): { ts: number; tsMs: number; date: Date; iso: string; rel: string } | null {
  try {
    let ts: number;
    if (typeof input === "number" || /^\d+$/.test(String(input).trim())) {
      const n = Number(input);
      ts = n > 9999999999 ? Math.floor(n / 1000) : n;
    } else {
      const d = new Date(String(input).trim());
      if (isNaN(d.getTime())) return null;
      ts = Math.floor(d.getTime() / 1000);
    }
    const date = new Date(ts * 1000);
    return { ts, tsMs: ts * 1000, date, iso: date.toISOString(), rel: relative(date.getTime() - Date.now()) };
  } catch { return null; }
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  async function copy() { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); }
  return (
    <button onClick={copy} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0">
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export function UnixTimestampTool() {
  const [mode, setMode] = React.useState<"ts2date" | "date2ts">("ts2date");
  const [tsInput, setTsInput] = React.useState("");
  const [dateInput, setDateInput] = React.useState("");
  const [live, setLive] = React.useState(false);
  const [now, setNow] = React.useState<{ s: number; ms: number } | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  React.useEffect(() => {
    setNow({ s: Math.floor(Date.now() / 1000), ms: Date.now() });
  }, []);

  React.useEffect(() => {
    if (live) {
      intervalRef.current = setInterval(() => {
        const s = Math.floor(Date.now() / 1000), ms = Date.now();
        setNow({ s, ms });
        setTsInput(String(s));
      }, 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [live]);

  const result = mode === "ts2date"
    ? convert(tsInput)
    : (dateInput ? convert(dateInput) : null);

  const warn2038 = result && result.ts > 2147483647;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Mode */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setMode("ts2date")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === "ts2date" ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          Timestamp → Date
        </button>
        <button onClick={() => setMode("date2ts")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === "date2ts" ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          Date → Timestamp
        </button>
      </div>

      {/* Input */}
      {mode === "ts2date" ? (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Unix timestamp (seconds or milliseconds)</label>
          <div className="flex gap-2">
            <input id="ts-input" value={tsInput} onChange={e => { setTsInput(e.target.value); setLive(false); }}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. 1715000000 or 1715000000000" />
            <Button variant="outline" size="sm" onClick={() => { setLive(l => !l); if (!live && now) setTsInput(String(now.s)); }} className={`gap-1.5 shrink-0 ${live ? "bg-foreground text-background" : ""}`} id="ts-now">
              <Clock className="h-3.5 w-3.5" />{live ? "Live" : "Now"}
            </Button>
          </div>
          {now && <p className="text-[11px] text-muted-foreground">Current: <span className="font-mono">{now.s}s</span> / <span className="font-mono">{now.ms}ms</span></p>}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Date / Date-time string</label>
          <input id="date-input" type="datetime-local" value={dateInput} onChange={e => setDateInput(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <Button variant="outline" size="sm" onClick={() => {
            const d = new Date(); const pad = (n: number) => String(n).padStart(2, "0");
            setDateInput(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
          }} className="h-8 text-xs gap-1.5"><Clock className="h-3 w-3" />Now</Button>
        </div>
      )}

      {warn2038 && result && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <span className="text-amber-500 text-sm">⚠️</span>
          <p className="text-xs text-amber-500/80">This timestamp exceeds the 32-bit integer limit ({new Date(2147483647 * 1000).getFullYear()}). The Year 2038 Problem applies on 32-bit systems.</p>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          {/* Primary display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              ["Unix (seconds)", String(result.ts)],
              ["Unix (milliseconds)", String(result.tsMs)],
              ["ISO 8601", result.iso],
              ["Relative", result.rel],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center gap-2 rounded-md border border-border/60 bg-card px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-mono truncate">{value}</p>
                </div>
                <CopyBtn text={value} />
              </div>
            ))}
          </div>

          {/* Timezone table */}
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <div className="px-3 py-2 bg-secondary/20 border-b border-border/60">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">In major timezones</p>
            </div>
            <div className="divide-y divide-border/40">
              {TZ_LIST.map(({ label, tz }) => (
                <div key={tz} className="flex items-center gap-2 px-3 py-2.5">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
                  <span className="text-xs font-mono flex-1 truncate">{formatInTZ(result.date, tz)}</span>
                  <CopyBtn text={formatInTZ(result.date, tz)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tsInput && !result && <p className="text-xs text-destructive">Invalid input — enter a Unix timestamp or parseable date string</p>}
    </div>
  );
}
