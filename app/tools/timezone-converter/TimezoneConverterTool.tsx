"use client";

import * as React from "react";
import { X, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COMMON_TZ = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Sao_Paulo", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
  "Asia/Dubai", "Asia/Kolkata", "Asia/Dhaka", "Asia/Bangkok", "Asia/Shanghai",
  "Asia/Tokyo", "Asia/Seoul", "Australia/Sydney", "Pacific/Auckland", "Pacific/Honolulu",
];

const CITY_LABELS: Record<string, string> = {
  "UTC": "UTC", "America/New_York": "New York", "America/Chicago": "Chicago",
  "America/Denver": "Denver", "America/Los_Angeles": "Los Angeles",
  "America/Sao_Paulo": "São Paulo", "Europe/London": "London", "Europe/Paris": "Paris",
  "Europe/Berlin": "Berlin", "Europe/Moscow": "Moscow", "Asia/Dubai": "Dubai",
  "Asia/Kolkata": "Mumbai / Delhi", "Asia/Dhaka": "Dhaka", "Asia/Bangkok": "Bangkok",
  "Asia/Shanghai": "Shanghai / Beijing", "Asia/Tokyo": "Tokyo", "Asia/Seoul": "Seoul",
  "Australia/Sydney": "Sydney", "Pacific/Auckland": "Auckland", "Pacific/Honolulu": "Honolulu",
};

function formatInTZ(date: Date, tz: string): { time: string; date: string; offset: string; dayLabel: string } {
  const tf = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const df = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", year: "numeric", month: "short", day: "numeric" });
  const of = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" });
  const offset = of.formatToParts(date).find(p => p.type === "timeZoneName")?.value ?? "UTC";
  return { time: tf.format(date), date: df.format(date), offset, dayLabel: "" };
}

function getLocalTZ(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "UTC"; }
}

function toLocalISOString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TimezoneConverterTool() {
  const localTZ = React.useMemo(() => getLocalTZ(), []);
  const [dateStr, setDateStr] = React.useState("2024-01-01T09:00");
  const [sourceTZ, setSourceTZ] = React.useState(localTZ);
  const [targets, setTargets] = React.useState<string[]>(["UTC", "America/New_York", "Europe/London", "Asia/Kolkata", "Asia/Tokyo"]);
  const [addTZ, setAddTZ] = React.useState("");
  const [allTZs, setAllTZs] = React.useState<string[]>(COMMON_TZ);

  React.useEffect(() => {
    setDateStr(toLocalISOString(new Date()));
    setSourceTZ(getLocalTZ());
  }, []);

  React.useEffect(() => {
    try {
      const all = (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf("timeZone");
      setAllTZs(all);
    } catch { /* use fallback */ }
  }, []);

  // Parse the input datetime in the source timezone → UTC Date
  const sourceDate = React.useMemo(() => {
    try {
      // Treat input as local time in sourceTZ
      const naive = new Date(dateStr); // treats as local — we'll correct for sourceTZ
      // Use Intl to get what the "naive" time would be in UTC if it were in sourceTZ
      const utcCandidate = new Date(dateStr + ":00Z");
      const localFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: sourceTZ, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
      });
      const parts = localFormatter.formatToParts(utcCandidate);
      const get = (t: string) => parts.find(p => p.type === t)?.value ?? "00";
      const localStr = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}Z`;
      const localInUTC = new Date(localStr);
      const offset = utcCandidate.getTime() - localInUTC.getTime();
      return new Date(utcCandidate.getTime() + offset);
    } catch { return new Date(); }
  }, [dateStr, sourceTZ]);

  const results = React.useMemo(() =>
    [sourceTZ, ...targets.filter(t => t !== sourceTZ)].map(tz => {
      const f = formatInTZ(sourceDate, tz);
      // Check if different calendar day from source
      const srcDay = new Intl.DateTimeFormat("en-CA", { timeZone: sourceTZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(sourceDate);
      const tgtDay = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(sourceDate);
      const dayDiff = (new Date(tgtDay).getTime() - new Date(srcDay).getTime()) / 86400000;
      return { tz, ...f, isSource: tz === sourceTZ, dayDiff };
    }), [sourceDate, sourceTZ, targets]);

  function addTarget() {
    if (!addTZ || targets.includes(addTZ) || addTZ === sourceTZ) return;
    setTargets(prev => [...prev, addTZ]);
    setAddTZ("");
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Input row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Date & Time</label>
          <input id="tz-datetime" type="datetime-local" value={dateStr} onChange={e => setDateStr(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">In timezone</label>
          <select id="tz-source" value={sourceTZ} onChange={e => setSourceTZ(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm h-10 focus:outline-none focus:ring-2 focus:ring-ring max-w-52">
            {allTZs.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <Button variant="outline" size="sm" className="h-10 text-xs gap-1.5" onClick={() => setDateStr(toLocalISOString(new Date()))} id="tz-now">
          <Clock className="h-3.5 w-3.5" />Now
        </Button>
      </div>

      {/* Results */}
      <div className="space-y-2">
        {results.map(r => (
          <div key={r.tz} className={cn("rounded-lg border px-4 py-3 flex flex-wrap items-center gap-4 justify-between",
            r.isSource ? "border-primary/40 bg-primary/5" : "border-border/60 bg-card"
          )}>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">{CITY_LABELS[r.tz] ?? r.tz.replace(/_/g, " ")}</span>
                {r.isSource && <span className="text-[10px] uppercase tracking-wider text-primary font-medium px-1.5 py-0.5 rounded-full bg-primary/10">source</span>}
                {r.dayDiff !== 0 && !r.isSource && (
                  <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", r.dayDiff > 0 ? "text-amber-500 bg-amber-500/10" : "text-blue-400 bg-blue-400/10")}>
                    {r.dayDiff > 0 ? `+${r.dayDiff}d` : `${r.dayDiff}d`}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">{r.tz} · {r.offset}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{r.date}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-mono font-bold text-foreground">{r.time}</span>
              {!r.isSource && (
                <button onClick={() => setTargets(prev => prev.filter(t => t !== r.tz))}
                  className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors opacity-50 hover:opacity-100">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add timezone */}
      <div className="flex items-center gap-2">
        <select value={addTZ} onChange={e => setAddTZ(e.target.value)}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" id="tz-add-select">
          <option value="">Add a timezone…</option>
          {allTZs.filter(tz => tz !== sourceTZ && !targets.includes(tz)).map(tz => (
            <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
          ))}
        </select>
        <Button onClick={addTarget} disabled={!addTZ} id="tz-add-btn" className="shrink-0">
          <Plus className="h-4 w-4" />Add
        </Button>
      </div>
    </div>
  );
}
