"use client";
import * as React from "react";

function measureLatency(): Promise<number> {
  return new Promise(resolve => {
    const start = performance.now();
    fetch('/api/health', { cache: 'no-store' }).then(() => resolve(Math.round(performance.now() - start))).catch(() => resolve(-1));
  });
}

async function measureDownload(onProgress: (mbps: number, pct: number) => void): Promise<number> {
  // Measure using a medium-sized known resource (Next.js chunk)
  const url = '/_next/static/chunks/main.js?' + Math.random();
  const start = performance.now();
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const buffer = await res.arrayBuffer();
    const elapsed = (performance.now() - start) / 1000;
    const mbps = (buffer.byteLength * 8) / (1024 * 1024 * elapsed);
    onProgress(Math.round(mbps * 10) / 10, 100);
    return Math.round(mbps * 10) / 10;
  } catch {
    return 0;
  }
}

const SPEED_LABELS = [
  { min: 100, label: 'Excellent', color: '#4ade80' },
  { min: 25, label: 'Good', color: '#86efac' },
  { min: 10, label: 'Fair', color: '#fbbf24' },
  { min: 0, label: 'Slow', color: '#f87171' },
];

export function SpeedTestTool() {
  const [state, setState] = React.useState<'idle' | 'ping' | 'download' | 'done'>('idle');
  const [ping, setPing] = React.useState<number | null>(null);
  const [download, setDownload] = React.useState<number | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [history, setHistory] = React.useState<{ download: number; ping: number; ts: number }[]>([]);

  async function runTest() {
    setState('ping');
    const pings: number[] = [];
    for (let i = 0; i < 4; i++) { pings.push(await measureLatency()); await new Promise(r => setTimeout(r, 50)); }
    const avgPing = Math.round(pings.filter(p => p > 0).reduce((a, b) => a + b, 0) / pings.length);
    setPing(avgPing);
    setState('download');
    const dl = await measureDownload((mbps, pct) => { setDownload(mbps); setProgress(pct); });
    setHistory(h => [{ download: dl, ping: avgPing, ts: Date.now() }, ...h.slice(0, 4)]);
    setState('done');
  }

  const dlLabel = download !== null ? SPEED_LABELS.find(l => (download ?? 0) >= l.min) ?? SPEED_LABELS[SPEED_LABELS.length - 1] : null;

  return (
    <div className="space-y-6 max-w-lg mx-auto text-center">
      {/* Gauge */}
      <div className="rounded-2xl border bg-card p-8 space-y-4">
        <div>
          <div className="text-4xl font-bold tabular-nums" style={{ color: dlLabel?.color ?? 'inherit' }}>
            {state === 'idle' ? '—' : download !== null ? download.toFixed(1) : '…'}
          </div>
          <div className="text-sm text-muted-foreground">Mbps download</div>
        </div>
        {state !== 'idle' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-background p-3">
              <div className="text-lg font-semibold">{ping !== null ? `${ping}ms` : '…'}</div>
              <div className="text-xs text-muted-foreground">Ping</div>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <div className="text-lg font-semibold">{dlLabel?.label ?? '…'}</div>
              <div className="text-xs text-muted-foreground">Quality</div>
            </div>
          </div>
        )}
        {state === 'download' && (
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className="bg-foreground h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        <button onClick={runTest} disabled={state !== 'idle' && state !== 'done'}
          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-opacity">
          {state === 'idle' ? 'Start Speed Test' : state === 'ping' ? 'Measuring ping…' : state === 'download' ? 'Measuring download…' : 'Test Again'}
        </button>
        <p className="text-xs text-muted-foreground">Tests connection to this server. Results reflect your connection to kit.shreyannarula.com.</p>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-lg border bg-card/50 divide-y divide-border text-left">
          {history.map((h, i) => (
            <div key={i} className="flex items-center px-4 py-2.5 text-sm gap-4">
              <span className="text-muted-foreground text-xs">{new Date(h.ts).toLocaleTimeString()}</span>
              <span className="font-mono font-medium">{h.download} Mbps</span>
              <span className="text-muted-foreground">{h.ping}ms ping</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
