"use client";

import * as React from "react";
import {
  Play,
  Square,
  Download,
  Upload,
  Activity,
  Gauge as GaugeIcon,
  Waves,
  Wifi,
  Server,
  MapPin,
  Share2,
  Check,
  Trash2,
  Info,
  Clapperboard,
  Gamepad2,
  Video,
  Cloud,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  runSpeedTest,
  SpeedTestError,
  type Phase,
  type SpeedTestResult,
  type MetaInfo,
} from "./engine";

// ── presentation helpers ─────────────────────────────────────────────────────
const PALETTE = {
  excellent: "#10b981",
  good: "#22c55e",
  fair: "#f59e0b",
  slow: "#ef4444",
  idle: "var(--muted-foreground)",
};

function downloadQuality(mbps: number) {
  if (mbps >= 100) return { label: "Excellent", color: PALETTE.excellent };
  if (mbps >= 25) return { label: "Good", color: PALETTE.good };
  if (mbps >= 10) return { label: "Fair", color: PALETTE.fair };
  if (mbps > 0) return { label: "Slow", color: PALETTE.slow };
  return { label: "—", color: PALETTE.idle };
}

function bufferbloatGrade(ms: number) {
  if (ms <= 0) return { grade: "—", color: PALETTE.idle, label: "Not measured" };
  if (ms < 30) return { grade: "A+", color: PALETTE.excellent, label: "No bufferbloat" };
  if (ms < 60) return { grade: "A", color: PALETTE.excellent, label: "Excellent" };
  if (ms < 100) return { grade: "B", color: PALETTE.good, label: "Good" };
  if (ms < 200) return { grade: "C", color: PALETTE.fair, label: "Moderate" };
  if (ms < 400) return { grade: "D", color: PALETTE.fair, label: "Noticeable lag under load" };
  return { grade: "F", color: PALETTE.slow, label: "Severe lag under load" };
}

function fmtSpeed(v: number | null): string {
  if (v === null) return "—";
  if (v >= 100) return v.toFixed(0);
  if (v >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

function niceMax(v: number): number {
  const steps = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
  const target = v * 1.15;
  for (const s of steps) if (s >= target) return s;
  return steps[steps.length - 1];
}

// Cloudflare colo (data-center) codes → friendly city names (common ones).
const COLO: Record<string, string> = {
  AMS: "Amsterdam", ATL: "Atlanta", BOM: "Mumbai", BLR: "Bengaluru", CDG: "Paris",
  DEL: "New Delhi", DFW: "Dallas", DUB: "Dublin", EWR: "Newark", FRA: "Frankfurt",
  HKG: "Hong Kong", IAD: "Ashburn", ICN: "Seoul", JNB: "Johannesburg", LAX: "Los Angeles",
  LHR: "London", MAD: "Madrid", MAA: "Chennai", MXP: "Milan", NRT: "Tokyo",
  ORD: "Chicago", SEA: "Seattle", SFO: "San Francisco", SIN: "Singapore", SJC: "San José",
  SYD: "Sydney", YYZ: "Toronto", GRU: "São Paulo", CCU: "Kolkata", HYD: "Hyderabad",
};

// ── circular gauge ────────────────────────────────────────────────────────────
function Gauge({
  value,
  max,
  color,
  unit,
  title,
  caption,
}: {
  value: number | null;
  max: number;
  color: string;
  unit: string;
  title: string;
  caption?: string;
}) {
  const R = 84;
  const C = 2 * Math.PI * R;
  const ARC = 0.75; // 270° sweep
  const v = value ?? 0;
  const frac = max > 0 ? Math.min(1, Math.sqrt(v / max)) : 0;
  const track = ARC * C;

  return (
    <div className="relative mx-auto" style={{ width: 220, height: 220 }}>
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <g transform="rotate(135 100 100)">
          <circle
            cx="100" cy="100" r={R}
            fill="none" stroke="var(--border)" strokeWidth="12"
            strokeDasharray={`${track} ${C}`} strokeLinecap="round"
          />
          <circle
            cx="100" cy="100" r={R}
            fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={`${frac * track} ${C}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.25s ease, stroke 0.3s ease" }}
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{title}</span>
        <span
          className="text-5xl font-bold tabular-nums leading-none mt-1"
          style={{ color: value === null ? "var(--foreground)" : color }}
        >
          {value === null ? "—" : fmtSpeed(value)}
        </span>
        <span className="text-xs text-muted-foreground mt-1.5">{unit}</span>
        {caption && <span className="text-[11px] text-muted-foreground mt-1">{caption}</span>}
      </div>
    </div>
  );
}

// ── live sparkline ──────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) {
    return <div className="h-16 w-full rounded-md bg-secondary/30" />;
  }
  const W = 600;
  const H = 64;
  const max = Math.max(...data, 1);
  const step = W / (data.length - 1);
  const pts = data.map((d, i) => [i * step, H - (d / max) * (H - 6) - 3]);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-16 w-full">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ── small labelled metric with a help tooltip ─────────────────────────────────
function Metric({
  icon: Icon,
  label,
  value,
  unit,
  hint,
  color,
  active,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit?: string;
  hint: string;
  color?: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card px-4 py-3.5 transition-colors",
        active && "ring-1 ring-primary/40 border-primary/30",
      )}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button aria-label={`About ${label}`} className="text-muted-foreground/60 hover:text-foreground">
              <Info className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[220px] text-center leading-relaxed">{hint}</TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular-nums" style={{ color }}>
          {value}
        </span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

// ── phase stepper ─────────────────────────────────────────────────────────────
const STEPS: { key: Phase; label: string; icon: React.ElementType }[] = [
  { key: "latency", label: "Ping", icon: Activity },
  { key: "download", label: "Download", icon: Download },
  { key: "upload", label: "Upload", icon: Upload },
];

function Stepper({ phase }: { phase: Phase }) {
  const order: Phase[] = ["meta", "latency", "download", "upload", "done"];
  const idx = order.indexOf(phase);
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((s) => {
        const sIdx = order.indexOf(s.key);
        const done = idx > sIdx;
        const current = phase === s.key;
        return (
          <div
            key={s.key}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors",
              current && "bg-primary text-primary-foreground",
              done && !current && "text-foreground",
              !current && !done && "text-muted-foreground",
            )}
          >
            {done ? <Check className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
            <span>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── capability checklist ──────────────────────────────────────────────────────
function capabilities(r: SpeedTestResult) {
  const { download, upload, latency, bufferbloat } = r;
  return [
    {
      icon: Clapperboard,
      label: "4K / UHD streaming",
      ok: download >= 25,
      hint: "Netflix & YouTube recommend ~25 Mbps download for a single 4K stream.",
    },
    {
      icon: Video,
      label: "HD video calls",
      ok: upload >= 3 && download >= 3 && latency.avg < 200,
      hint: "Zoom/Meet group HD calls need ~3 Mbps up & down with stable latency.",
    },
    {
      icon: Gamepad2,
      label: "Competitive gaming",
      ok: latency.avg < 60 && latency.jitter < 15 && bufferbloat < 100,
      hint: "Online gaming wants low ping (<60 ms), low jitter and little bufferbloat.",
    },
    {
      icon: Cloud,
      label: "Large file transfers",
      ok: download >= 100,
      hint: "100+ Mbps moves large downloads and cloud backups quickly.",
    },
  ];
}

// ── history persistence ───────────────────────────────────────────────────────
const HISTORY_KEY = "kit-speedtest-history-v1";
interface HistoryEntry {
  ts: number;
  download: number;
  upload: number;
  ping: number;
  jitter: number;
  bufferbloat: number;
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

// ── overall progress weighting across phases ───────────────────────────────────
function overallProgress(phase: Phase, p: number): number {
  switch (phase) {
    case "meta": return 0.02;
    case "latency": return 0.02 + p * 0.13;
    case "download": return 0.15 + p * 0.42;
    case "upload": return 0.57 + p * 0.42;
    case "done": return 1;
    default: return 0;
  }
}

// ── main component ──────────────────────────────────────────────────────────
export function SpeedTestTool() {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [progress, setProgress] = React.useState(0);
  const [liveSpeed, setLiveSpeed] = React.useState<number | null>(null);
  const [liveSamples, setLiveSamples] = React.useState<number[]>([]);
  const [livePing, setLivePing] = React.useState<number | null>(null);
  const [liveLoadedPing, setLiveLoadedPing] = React.useState<number | null>(null);
  const [result, setResult] = React.useState<SpeedTestResult | null>(null);
  const [meta, setMeta] = React.useState<MetaInfo | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [display, setDisplay] = React.useState<"download" | "upload">("download");
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [copied, setCopied] = React.useState(false);

  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    // localStorage is unavailable during static prerender, so history must be
    // hydrated on mount. (Lazy useState init would run on the server and break.)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(loadHistory());
    return () => abortRef.current?.abort();
  }, []);

  const running = phase !== "idle" && phase !== "done";

  async function start() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setResult(null);
    setMeta(null);
    setLiveSpeed(null);
    setLiveSamples([]);
    setLivePing(null);
    setLiveLoadedPing(null);
    setProgress(0);
    setDisplay("download");
    setPhase("meta");

    try {
      const res = await runSpeedTest(
        {
          onPhase: (ph, p) => {
            setPhase(ph);
            setProgress(overallProgress(ph, p));
            if (ph === "download" || ph === "upload") {
              setDisplay(ph);
              setLiveSamples([]);
              setLiveSpeed(0);
            }
          },
          onMeta: setMeta,
          onLatencySample: (_rtt, stats) => setLivePing(stats.avg),
          onLiveSpeed: (_ph, mbps, samples) => {
            setLiveSpeed(mbps);
            setLiveSamples(samples.map((s) => s.mbps));
          },
          onLoadedLatency: (_ph, rtt) => setLiveLoadedPing(Math.round(rtt)),
        },
        controller.signal,
      );

      setResult(res);
      setPhase("done");
      setProgress(1);

      const entry: HistoryEntry = {
        ts: res.ts,
        download: res.download,
        upload: res.upload,
        ping: res.latency.avg,
        jitter: res.latency.jitter,
        bufferbloat: res.bufferbloat,
      };
      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, 10);
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {
          /* storage unavailable */
        }
        return next;
      });
    } catch (e) {
      const err = e as SpeedTestError;
      if (err.code === "aborted") {
        setPhase("idle");
        return;
      }
      if (err.code === "endpoint") {
        setError(
          "Speed-test endpoints aren't responding. They run as Cloudflare Pages Functions and are only available on the deployed site (not in local dev).",
        );
      } else {
        setError("Something went wrong while testing. Check your connection and try again.");
      }
      setPhase("idle");
    }
  }

  function stop() {
    abortRef.current?.abort();
    setPhase("idle");
  }

  function clearHistory() {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
  }

  async function copyResults() {
    if (!result) return;
    const lines = [
      `Network Speed Test — kit.shreyannarula.com`,
      `Download:    ${fmtSpeed(result.download)} Mbps`,
      `Upload:      ${fmtSpeed(result.upload)} Mbps`,
      `Ping:        ${result.latency.avg} ms (min ${result.latency.min} ms)`,
      `Jitter:      ${result.latency.jitter} ms`,
      `Bufferbloat: +${result.bufferbloat} ms (${bufferbloatGrade(result.bufferbloat).grade})`,
      meta?.isp ? `ISP:         ${meta.isp}` : "",
      meta?.colo ? `Server:      ${COLO[meta.colo] ?? meta.colo} (Cloudflare ${meta.colo})` : "",
      `When:        ${new Date(result.ts).toLocaleString()}`,
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  // gauge derivation
  const showUpload = display === "upload";
  const gaugeValue = running
    ? liveSpeed // live instantaneous throughput during download/upload (null in ping/meta)
    : result
      ? showUpload
        ? result.upload
        : result.download
      : null;

  const gaugeColor = showUpload ? PALETTE.good : downloadQuality(gaugeValue ?? 0).color;
  const gaugeMax = niceMax(Math.max(gaugeValue ?? 0, result?.downloadPeak ?? 0, liveSpeed ?? 0, 10));
  const gaugeCaption =
    phase === "latency"
      ? "Measuring latency…"
      : phase === "download"
        ? "Measuring download…"
        : phase === "upload"
          ? "Measuring upload…"
          : phase === "meta"
            ? "Finding your nearest server…"
            : result
              ? showUpload
                ? "Upload"
                : "Download"
              : "Ready";

  const bloat = result ? bufferbloatGrade(result.bufferbloat) : null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Main test card */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        {/* progress bar */}
        <div className="h-1 w-full bg-secondary/60">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${Math.round(progress * 100)}%`, opacity: running ? 1 : 0 }}
          />
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* stepper */}
          {(running || result) && <Stepper phase={phase} />}

          {/* gauge */}
          <Gauge
            value={gaugeValue}
            max={gaugeMax}
            color={running ? (phase === "upload" ? PALETTE.good : phase === "download" ? downloadQuality(liveSpeed ?? 0).color : PALETTE.idle) : gaugeColor}
            unit="Mbps"
            title={running ? (phase === "upload" ? "Upload" : "Download") : showUpload ? "Upload" : "Download"}
            caption={gaugeCaption}
          />

          {/* live sparkline while running */}
          {running && (phase === "download" || phase === "upload") && (
            <div className="space-y-1">
              <Sparkline data={liveSamples} color={phase === "upload" ? PALETTE.good : downloadQuality(liveSpeed ?? 0).color} />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {livePing !== null ? `${livePing} ms idle` : "…"}
                  {liveLoadedPing !== null && (
                    <span className="text-muted-foreground/70">· {liveLoadedPing} ms under load</span>
                  )}
                </span>
                <span>live throughput</span>
              </div>
            </div>
          )}

          {/* result toggle (download/upload gauge) */}
          {result && !running && (
            <div className="flex justify-center gap-1.5">
              <button
                onClick={() => setDisplay("download")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  !showUpload ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Download className="h-3.5 w-3.5" /> {fmtSpeed(result.download)} down
              </button>
              <button
                onClick={() => setDisplay("upload")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  showUpload ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Upload className="h-3.5 w-3.5" /> {fmtSpeed(result.upload)} up
              </button>
            </div>
          )}

          {/* action button */}
          <div className="flex items-center justify-center gap-2">
            {!running ? (
              <Button size="lg" onClick={start} className="px-8 gap-2" id="speedtest-start">
                <Play className="h-4 w-4" />
                {result ? "Test again" : "Start speed test"}
              </Button>
            ) : (
              <Button size="lg" variant="outline" onClick={stop} className="px-8 gap-2" id="speedtest-stop">
                <Square className="h-4 w-4" /> Stop
              </Button>
            )}
            {result && !running && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={copyResults} aria-label="Copy results">
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copied ? "Copied!" : "Copy results"}</TooltipContent>
              </Tooltip>
            )}
          </div>

          {error && (
            <p className="text-center text-xs text-destructive max-w-md mx-auto leading-relaxed">{error}</p>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      {result && !running && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Metric
              icon={Download}
              label="Download"
              value={fmtSpeed(result.download)}
              unit="Mbps"
              color={downloadQuality(result.download).color}
              hint={`How fast you pull data down. Peak observed ${fmtSpeed(result.downloadPeak)} Mbps.`}
            />
            <Metric
              icon={Upload}
              label="Upload"
              value={fmtSpeed(result.upload)}
              unit="Mbps"
              color={PALETTE.good}
              hint={`How fast you push data up — matters for video calls, uploads & backups. Peak ${fmtSpeed(result.uploadPeak)} Mbps.`}
            />
            <Metric
              icon={Activity}
              label="Ping"
              value={String(result.latency.avg)}
              unit="ms"
              hint={`Round-trip time to the server. Lower is snappier. Best sample was ${result.latency.min} ms.`}
            />
            <Metric
              icon={Waves}
              label="Jitter"
              value={String(result.latency.jitter)}
              unit="ms"
              hint="Variation between consecutive pings. High jitter causes stutter in calls & games."
            />
          </div>

          {/* Bufferbloat */}
          <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-2xl font-bold"
              style={{ color: bloat!.color, backgroundColor: `${bloat!.color}1a` }}
            >
              {bloat!.grade}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <GaugeIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Bufferbloat &amp; latency under load</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button aria-label="About bufferbloat" className="text-muted-foreground/60 hover:text-foreground">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[260px] text-center leading-relaxed">
                    Bufferbloat is how much your latency rises when the connection is busy. High
                    bufferbloat makes calls and games lag while something else is downloading — even
                    on a fast line.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{bloat!.label}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                <span>Idle ping: <span className="font-mono text-foreground">{result.latency.min} ms</span></span>
                <span>Loaded (down): <span className="font-mono text-foreground">{result.loadedLatencyDown} ms</span></span>
                <span>Loaded (up): <span className="font-mono text-foreground">{result.loadedLatencyUp} ms</span></span>
                <span>Increase: <span className="font-mono text-foreground">+{result.bufferbloat} ms</span></span>
              </div>
            </div>
          </div>

          {/* Capability checklist */}
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-1.5 mb-3">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">What your connection handles</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {capabilities(result).map((c) => (
                <Tooltip key={c.label}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2.5 rounded-lg border border-border/60 px-3 py-2.5">
                      <c.icon className={cn("h-4 w-4 shrink-0", c.ok ? "text-green-500" : "text-muted-foreground/50")} />
                      <span className={cn("text-sm flex-1", !c.ok && "text-muted-foreground")}>{c.label}</span>
                      {c.ok ? (
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60 shrink-0">limited</span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[220px] text-center leading-relaxed">{c.hint}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Connection info */}
      {meta && (
        <div className="rounded-2xl border bg-card/60 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <InfoCell
            icon={Wifi}
            label="Your IP"
            value={meta.ip || "—"}
            hint="Your public IP as seen by the edge server. Nothing is stored."
          />
          <InfoCell
            icon={Server}
            label="ISP"
            value={meta.isp || "Unknown"}
            hint="The network (ISP / ASN) your connection is on, reported by Cloudflare."
          />
          <InfoCell
            icon={MapPin}
            label="Test server"
            value={meta.colo ? `${COLO[meta.colo] ?? meta.colo} · ${meta.colo}` : "Cloudflare edge"}
            hint="The nearest Cloudflare data center serving this test. Distance to it affects your ping."
          />
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-2xl border bg-card/60 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b">
            <span className="text-sm font-medium">Recent tests</span>
            <Button variant="ghost" size="sm" onClick={clearHistory} className="h-7 gap-1 text-xs text-muted-foreground">
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          </div>
          <div className="divide-y divide-border">
            {history.map((h) => (
              <div key={h.ts} className="grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-2.5 text-sm">
                <span className="text-xs text-muted-foreground truncate">
                  {new Date(h.ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="flex items-center gap-1 font-mono text-xs">
                  <Download className="h-3 w-3 text-muted-foreground" /> {fmtSpeed(h.download)}
                </span>
                <span className="flex items-center gap-1 font-mono text-xs">
                  <Upload className="h-3 w-3 text-muted-foreground" /> {fmtSpeed(h.upload)}
                </span>
                <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" /> {h.ping}ms
                </span>
                <span className="hidden sm:flex items-center gap-1 font-mono text-xs text-muted-foreground">
                  <GaugeIcon className="h-3 w-3" /> +{h.bufferbloat}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Methodology note */}
      <p className="text-center text-[11px] text-muted-foreground/80 leading-relaxed max-w-xl mx-auto">
        Tests run against the nearest Cloudflare edge node using multiple parallel connections,
        the same approach professional speed tests use. Download &amp; upload report the 90th-percentile
        of sustained throughput. Results reflect your real path to the internet — actual speeds to a
        specific website may vary.
      </p>
    </div>
  );
}

function InfoCell({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          {label}
          <Tooltip>
            <TooltipTrigger asChild>
              <button aria-label={`About ${label}`} className="text-muted-foreground/60 hover:text-foreground">
                <Info className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[220px] text-center leading-relaxed">{hint}</TooltipContent>
          </Tooltip>
        </div>
        <p className="text-sm font-medium truncate" title={value}>{value}</p>
      </div>
    </div>
  );
}
