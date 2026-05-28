// Network Speed Test — measurement engine
// =========================================
// Runs entirely in the browser against same-origin Cloudflare Pages Functions
// (/api/speedtest/down|up|meta), which execute on the nearest Cloudflare edge
// node. Methodology mirrors speed.cloudflare.com / LibreSpeed:
//
//   • Latency:   many tiny round-trips → min / average / jitter
//   • Download:  several parallel streaming connections for a fixed window,
//                sampled continuously; headline = high-percentile of the
//                stable-window samples (the connection's realistic capacity)
//   • Upload:    parallel XHR uploads (real upload-progress events)
//   • Bufferbloat: latency is re-probed *while* the link is saturated; the
//                increase over idle latency is the bufferbloat figure
//
// Bits use the decimal megabit (1 Mbps = 1,000,000 bits) — the same unit ISPs
// and every mainstream speed test quote.

export interface MetaInfo {
  ip: string;
  city: string | null;
  region: string | null;
  country: string | null;
  isp: string | null;
  asn: number | null;
  colo: string | null;
  httpProtocol: string | null;
}

export interface LatencyStats {
  min: number;
  avg: number;
  jitter: number;
  samples: number[];
}

export interface Sample {
  t: number; // ms since phase start
  mbps: number;
}

export type Phase = "idle" | "meta" | "latency" | "download" | "upload" | "done";

export interface SpeedTestResult {
  download: number; // Mbps
  upload: number; // Mbps
  downloadPeak: number;
  uploadPeak: number;
  latency: LatencyStats;
  loadedLatencyDown: number; // avg latency while downloading
  loadedLatencyUp: number; // avg latency while uploading
  bufferbloat: number; // ms increase under load over idle latency
  downSamples: Sample[];
  upSamples: Sample[];
  bytesDown: number;
  bytesUp: number;
  meta: MetaInfo | null;
  ts: number;
}

export interface Handlers {
  onPhase?: (phase: Phase, progress: number) => void;
  onMeta?: (meta: MetaInfo) => void;
  onLatencySample?: (rttMs: number, stats: LatencyStats) => void;
  onLiveSpeed?: (phase: "download" | "upload", mbps: number, samples: Sample[]) => void;
  onLoadedLatency?: (phase: "download" | "upload", rttMs: number) => void;
}

// ── tuning ──────────────────────────────────────────────────────────────────
const CFG = {
  latencyPings: 25,
  latencyGapMs: 25,
  download: { connections: 6, chunkBytes: 25 * 1024 * 1024, warmupMs: 2000, durationMs: 9000 },
  upload: { connections: 4, payloadBytes: 12 * 1024 * 1024, warmupMs: 2000, durationMs: 9000 },
  loadedProbeGapMs: 350,
  sampleEveryMs: 200,
};

const now = () => performance.now();
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const toMbps = (bytes: number, seconds: number) =>
  seconds > 0 ? (bytes * 8) / seconds / 1e6 : 0;
const round = (n: number, d = 1) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p));
  return sorted[idx];
}

export class SpeedTestError extends Error {
  code: "endpoint" | "network" | "aborted";
  constructor(code: "endpoint" | "network" | "aborted", message: string) {
    super(message);
    this.code = code;
    this.name = "SpeedTestError";
  }
}

// ── single round-trip latency probe ─────────────────────────────────────────
async function ping(signal: AbortSignal): Promise<number> {
  const start = now();
  const res = await fetch(`/api/speedtest/down?bytes=0&r=${Math.random()}`, {
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new SpeedTestError("endpoint", `Unexpected status ${res.status}`);
  await res.arrayBuffer();
  return now() - start;
}

async function measureLatency(signal: AbortSignal, h: Handlers): Promise<LatencyStats> {
  // one warm-up round-trip (DNS/TLS/connection) — discarded
  await ping(signal);

  const samples: number[] = [];
  for (let i = 0; i < CFG.latencyPings && !signal.aborted; i++) {
    try {
      samples.push(await ping(signal));
    } catch (e) {
      if ((e as SpeedTestError).code === "endpoint") throw e;
    }
    const stats = computeLatency(samples);
    h.onLatencySample?.(samples[samples.length - 1] ?? 0, stats);
    h.onPhase?.("latency", (i + 1) / CFG.latencyPings);
    await sleep(CFG.latencyGapMs);
  }
  return computeLatency(samples);
}

function computeLatency(samples: number[]): LatencyStats {
  if (samples.length === 0) return { min: 0, avg: 0, jitter: 0, samples: [] };
  const min = Math.min(...samples);
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  // jitter = mean absolute difference between consecutive probes (RFC 3550 idea)
  let jitterSum = 0;
  for (let i = 1; i < samples.length; i++) jitterSum += Math.abs(samples[i] - samples[i - 1]);
  const jitter = samples.length > 1 ? jitterSum / (samples.length - 1) : 0;
  return { min: round(min), avg: round(avg), jitter: round(jitter), samples };
}

// ── shared sampler: turns a running byte counter into a live throughput feed ─
function createSampler(
  getBytes: () => number,
  emit: (mbps: number, samples: Sample[]) => void,
) {
  const samples: Sample[] = [];
  const startedAt = now();
  let lastBytes = 0;
  let lastT = startedAt;
  const id = setInterval(() => {
    const t = now();
    const dt = (t - lastT) / 1000;
    const total = getBytes();
    const mbps = toMbps(total - lastBytes, dt);
    samples.push({ t: t - startedAt, mbps });
    lastBytes = total;
    lastT = t;
    emit(mbps, samples);
  }, CFG.sampleEveryMs);
  return {
    samples,
    startedAt,
    stop: () => clearInterval(id),
  };
}

// ── latency-under-load probe loop (bufferbloat) ──────────────────────────────
function startLoadedLatencyProbe(
  phase: "download" | "upload",
  signal: AbortSignal,
  h: Handlers,
  collect: number[],
) {
  let active = true;
  (async () => {
    while (active && !signal.aborted) {
      try {
        const rtt = await ping(signal);
        collect.push(rtt);
        h.onLoadedLatency?.(phase, rtt);
      } catch {
        /* ignore — the link is busy */
      }
      await sleep(CFG.loadedProbeGapMs);
    }
  })();
  return () => {
    active = false;
  };
}

// ── download ─────────────────────────────────────────────────────────────────
async function measureDownload(
  signal: AbortSignal,
  h: Handlers,
): Promise<{ speed: number; peak: number; samples: Sample[]; bytes: number; loaded: number }> {
  const { connections, chunkBytes, warmupMs, durationMs } = CFG.download;

  // probe the endpoint once so we fail fast & clearly if it isn't deployed
  const probe = await fetch(`/api/speedtest/down?bytes=1024&r=${Math.random()}`, {
    cache: "no-store",
    signal,
  });
  if (!probe.ok) throw new SpeedTestError("endpoint", `Download endpoint returned ${probe.status}`);
  await probe.arrayBuffer();

  let totalBytes = 0;
  const local = new AbortController();
  const onAbort = () => local.abort();
  signal.addEventListener("abort", onAbort);

  const loaded: number[] = [];
  const stopProbe = startLoadedLatencyProbe("download", local.signal, h, loaded);

  const sampler = createSampler(
    () => totalBytes,
    (mbps, samples) => {
      const elapsed = now() - sampler.startedAt;
      h.onPhase?.("download", Math.min(1, elapsed / durationMs));
      h.onLiveSpeed?.("download", mbps, samples);
    },
  );

  const stopTimer = setTimeout(() => local.abort(), durationMs);

  async function worker() {
    while (!local.signal.aborted) {
      try {
        const res = await fetch(`/api/speedtest/down?bytes=${chunkBytes}&r=${Math.random()}`, {
          cache: "no-store",
          signal: local.signal,
        });
        if (!res.body) {
          totalBytes += (await res.arrayBuffer()).byteLength;
          continue;
        }
        const reader = res.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) totalBytes += value.length;
        }
      } catch {
        if (local.signal.aborted) break;
      }
    }
  }

  await Promise.all(Array.from({ length: connections }, worker));

  clearTimeout(stopTimer);
  sampler.stop();
  stopProbe();
  signal.removeEventListener("abort", onAbort);

  if (signal.aborted) throw new SpeedTestError("aborted", "Test cancelled");

  const stable = sampler.samples.filter((s) => s.t >= warmupMs).map((s) => s.mbps);
  // headline = 90th-percentile of the stable window (realistic capacity);
  // guarded so a single spike can't exceed the observed peak.
  const peak = sampler.samples.reduce((m, s) => Math.max(m, s.mbps), 0);
  const speed = stable.length ? Math.min(percentile(stable, 0.9), peak) : peak;
  const loadedAvg = loaded.length ? loaded.reduce((a, b) => a + b, 0) / loaded.length : 0;

  return {
    speed: round(speed),
    peak: round(peak),
    samples: sampler.samples,
    bytes: totalBytes,
    loaded: round(loadedAvg),
  };
}

// ── upload (XHR for real upload-progress events) ─────────────────────────────
function uploadOnce(
  payload: Blob,
  signal: AbortSignal,
  onChunk: (deltaBytes: number) => void,
): Promise<void> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    let last = 0;
    xhr.open("POST", `/api/speedtest/up?r=${Math.random()}`, true);
    xhr.upload.onprogress = (e) => {
      onChunk(e.loaded - last);
      last = e.loaded;
    };
    xhr.onload = () => resolve();
    xhr.onerror = () => resolve();
    xhr.onabort = () => resolve();
    const abort = () => xhr.abort();
    signal.addEventListener("abort", abort, { once: true });
    try {
      xhr.send(payload);
    } catch {
      resolve();
    }
  });
}

async function measureUpload(
  signal: AbortSignal,
  h: Handlers,
): Promise<{ speed: number; peak: number; samples: Sample[]; bytes: number; loaded: number }> {
  const { connections, payloadBytes, warmupMs, durationMs } = CFG.upload;
  const payload = new Blob([new Uint8Array(payloadBytes)]);

  let totalBytes = 0;
  const local = new AbortController();
  const onAbort = () => local.abort();
  signal.addEventListener("abort", onAbort);

  const loaded: number[] = [];
  const stopProbe = startLoadedLatencyProbe("upload", local.signal, h, loaded);

  const sampler = createSampler(
    () => totalBytes,
    (mbps, samples) => {
      const elapsed = now() - sampler.startedAt;
      h.onPhase?.("upload", Math.min(1, elapsed / durationMs));
      h.onLiveSpeed?.("upload", mbps, samples);
    },
  );

  const stopTimer = setTimeout(() => local.abort(), durationMs);

  async function worker() {
    while (!local.signal.aborted) {
      await uploadOnce(payload, local.signal, (delta) => {
        if (delta > 0) totalBytes += delta;
      });
    }
  }

  await Promise.all(Array.from({ length: connections }, worker));

  clearTimeout(stopTimer);
  sampler.stop();
  stopProbe();
  signal.removeEventListener("abort", onAbort);

  if (signal.aborted) throw new SpeedTestError("aborted", "Test cancelled");

  const stable = sampler.samples.filter((s) => s.t >= warmupMs).map((s) => s.mbps);
  const peak = sampler.samples.reduce((m, s) => Math.max(m, s.mbps), 0);
  const speed = stable.length ? Math.min(percentile(stable, 0.9), peak) : peak;
  const loadedAvg = loaded.length ? loaded.reduce((a, b) => a + b, 0) / loaded.length : 0;

  return {
    speed: round(speed),
    peak: round(peak),
    samples: sampler.samples,
    bytes: totalBytes,
    loaded: round(loadedAvg),
  };
}

async function fetchMeta(signal: AbortSignal): Promise<MetaInfo | null> {
  try {
    const res = await fetch(`/api/speedtest/meta?r=${Math.random()}`, {
      cache: "no-store",
      signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as MetaInfo;
  } catch {
    return null;
  }
}

// ── orchestrator ─────────────────────────────────────────────────────────────
export async function runSpeedTest(h: Handlers, signal: AbortSignal): Promise<SpeedTestResult> {
  h.onPhase?.("meta", 0);
  const meta = await fetchMeta(signal);
  if (meta) h.onMeta?.(meta);

  h.onPhase?.("latency", 0);
  const latency = await measureLatency(signal, h);

  h.onPhase?.("download", 0);
  const dl = await measureDownload(signal, h);

  h.onPhase?.("upload", 0);
  const ul = await measureUpload(signal, h);

  // bufferbloat = how much latency rose under load vs. the idle minimum
  const idle = latency.min || latency.avg;
  const worstLoaded = Math.max(dl.loaded, ul.loaded);
  const bufferbloat = worstLoaded > 0 ? round(Math.max(0, worstLoaded - idle)) : 0;

  h.onPhase?.("done", 1);

  return {
    download: dl.speed,
    upload: ul.speed,
    downloadPeak: dl.peak,
    uploadPeak: ul.peak,
    latency,
    loadedLatencyDown: dl.loaded,
    loadedLatencyUp: ul.loaded,
    bufferbloat,
    downSamples: dl.samples,
    upSamples: ul.samples,
    bytesDown: dl.bytes,
    bytesUp: ul.bytes,
    meta,
    ts: Date.now(),
  };
}
