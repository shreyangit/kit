"use client";

import * as React from "react";
import { Play, Pause, RotateCcw, Settings, Bell, BellOff, SkipForward, Flame, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Phase = "work" | "short-break" | "long-break";

const PHASE_META: Record<Phase, { label: string; color: string; ring: string }> = {
  "work": { label: "Focus", color: "text-rose-400", ring: "var(--primary)" },
  "short-break": { label: "Short Break", color: "text-teal-400", ring: "#2dd4bf" },
  "long-break": { label: "Long Break", color: "text-green-400", ring: "#4ade80" },
};

interface Config {
  work: number; shortBreak: number; longBreak: number; sessionsUntilLong: number;
  autoStartBreaks: boolean; autoStartPomodoros: boolean;
}
const DEFAULT_CONFIG: Config = {
  work: 25, shortBreak: 5, longBreak: 15, sessionsUntilLong: 4,
  autoStartBreaks: false, autoStartPomodoros: false,
};

const STORE_KEY = "kit-pomodoro-v1";
const CONFIG_KEY = "kit-pomodoro-config-v1";
const todayStr = () => new Date().toISOString().slice(0, 10);

function playBell() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(830, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1.6);
  } catch { /* no audio */ }
}

export function PomodoroTool() {
  const [config, setConfig] = React.useState<Config>(DEFAULT_CONFIG);
  const [phase, setPhase] = React.useState<Phase>("work");
  const [secondsLeft, setSecondsLeft] = React.useState(DEFAULT_CONFIG.work * 60);
  const [running, setRunning] = React.useState(false);
  const [sessions, setSessions] = React.useState(0); // completed work sessions this run/day
  const [task, setTask] = React.useState("");
  const [soundOn, setSoundOn] = React.useState(true);
  const [notifyOn, setNotifyOn] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [todayFocus, setTodayFocus] = React.useState(0); // seconds
  const [hydrated, setHydrated] = React.useState(false);

  const phaseSeconds = React.useCallback(
    (p: Phase) => ({ work: config.work, "short-break": config.shortBreak, "long-break": config.longBreak }[p] * 60),
    [config],
  );

  // refs to avoid stale closures inside the interval
  const endTimeRef = React.useRef<number>(0);
  const prevRemainingRef = React.useRef<number>(secondsLeft);
  const phaseRef = React.useRef<Phase>(phase);
  const configRef = React.useRef<Config>(config);
  const sessionsRef = React.useRef<number>(sessions);
  const soundRef = React.useRef(soundOn);
  const notifyRef = React.useRef(notifyOn);
  React.useEffect(() => { phaseRef.current = phase; }, [phase]);
  React.useEffect(() => { configRef.current = config; }, [config]);
  React.useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
  React.useEffect(() => { soundRef.current = soundOn; }, [soundOn]);
  React.useEffect(() => { notifyRef.current = notifyOn; }, [notifyOn]);

  // ── hydrate from storage ────────────────────────────────────────────────
  React.useEffect(() => {
    try {
      const cfgRaw = localStorage.getItem(CONFIG_KEY);
      if (cfgRaw) {
        const cfg = { ...DEFAULT_CONFIG, ...JSON.parse(cfgRaw) } as Config;
        setConfig(cfg);
        setSecondsLeft(cfg.work * 60);
        prevRemainingRef.current = cfg.work * 60;
      }
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as { date: string; focus: number; sessions: number };
        if (s.date === todayStr()) { setTodayFocus(s.focus || 0); setSessions(s.sessions || 0); }
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  // persist daily stats
  React.useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ date: todayStr(), focus: Math.round(todayFocus), sessions })); } catch { /* ignore */ }
  }, [todayFocus, sessions, hydrated]);

  // persist config
  React.useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); } catch { /* ignore */ }
  }, [config, hydrated]);

  const notify = React.useCallback((title: string, body: string) => {
    if (soundRef.current) playBell();
    if (notifyRef.current && typeof Notification !== "undefined" && Notification.permission === "granted") {
      try { new Notification(title, { body, icon: "/icon.svg", silent: !soundRef.current }); } catch { /* ignore */ }
    }
  }, []);

  // advance to the next phase; countWork=false when skipping
  const advance = React.useCallback((countWork: boolean) => {
    const cfg = configRef.current;
    const cur = phaseRef.current;
    let next: Phase;
    if (cur === "work") {
      const completed = countWork ? sessionsRef.current + 1 : sessionsRef.current;
      if (countWork) setSessions(completed);
      next = completed % cfg.sessionsUntilLong === 0 && completed > 0 ? "long-break" : "short-break";
      if (countWork) {
        notify("Focus complete 🎉", next === "long-break" ? "Great work — take a long break." : "Nice! Time for a short break.");
      }
    } else {
      next = "work";
      if (countWork) notify("Break over ⏱️", "Back to focus — you've got this.");
    }
    const secs = { work: cfg.work, "short-break": cfg.shortBreak, "long-break": cfg.longBreak }[next] * 60;
    phaseRef.current = next;
    prevRemainingRef.current = secs;
    setPhase(next);
    setSecondsLeft(secs);

    const auto = next === "work" ? cfg.autoStartPomodoros : cfg.autoStartBreaks;
    if (auto && countWork) {
      endTimeRef.current = Date.now() + secs * 1000;
      setRunning(true);
    } else {
      setRunning(false);
    }
  }, [notify]);

  // ── ticking interval (wall-clock based → drift-free & background-safe) ────
  React.useEffect(() => {
    if (!running) return;
    const tick = () => {
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      // accumulate actual focus seconds elapsed (handles tab-throttling jumps)
      if (phaseRef.current === "work") {
        const delta = prevRemainingRef.current - remaining;
        if (delta > 0) setTodayFocus((f) => f + delta);
      }
      prevRemainingRef.current = remaining;
      setSecondsLeft(remaining);
      if (remaining <= 0) advance(true);
    };
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running, advance]);

  // tab title
  React.useEffect(() => {
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const s = (secondsLeft % 60).toString().padStart(2, "0");
    document.title = running ? `${m}:${s} · ${PHASE_META[phase].label}` : "Pomodoro — kit";
    return () => { document.title = "kit"; };
  }, [secondsLeft, running, phase]);

  // keyboard shortcuts
  React.useEffect(() => {
    function h(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); toggle(); }
      else if (e.key === "r" || e.key === "R") reset();
      else if (e.key === "s" || e.key === "S") advance(false);
    }
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  function toggle() {
    setRunning((r) => {
      const next = !r;
      if (next) {
        const secs = prevRemainingRef.current > 0 ? prevRemainingRef.current : phaseSeconds(phaseRef.current);
        if (prevRemainingRef.current <= 0) { setSecondsLeft(secs); prevRemainingRef.current = secs; }
        endTimeRef.current = Date.now() + secs * 1000;
      }
      return next;
    });
  }

  function reset() {
    setRunning(false);
    const secs = phaseSeconds(phaseRef.current);
    prevRemainingRef.current = secs;
    setSecondsLeft(secs);
  }

  function switchPhase(p: Phase) {
    setRunning(false);
    phaseRef.current = p;
    const secs = phaseSeconds(p);
    prevRemainingRef.current = secs;
    setPhase(p);
    setSecondsLeft(secs);
  }

  function updateConfig(patch: Partial<Config>) {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      // if a duration for the current phase changed and we're idle, reflect it
      if (!running) {
        const secs = { work: next.work, "short-break": next.shortBreak, "long-break": next.longBreak }[phaseRef.current] * 60;
        prevRemainingRef.current = secs;
        setSecondsLeft(secs);
      }
      return next;
    });
  }

  async function toggleNotify(on: boolean) {
    if (on && typeof Notification !== "undefined") {
      try {
        const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
        setNotifyOn(perm === "granted");
        return;
      } catch { setNotifyOn(false); return; }
    }
    setNotifyOn(false);
  }

  const total = phaseSeconds(phase);
  const progress = total > 0 ? 1 - secondsLeft / total : 0;
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const stroke = circumference * (1 - progress);
  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const secs = (secondsLeft % 60).toString().padStart(2, "0");
  const todayMins = Math.floor(todayFocus / 60);

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Task input */}
      <input
        id="pomodoro-task" type="text" value={task} onChange={(e) => setTask(e.target.value)}
        placeholder="What are you working on?"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-center"
      />

      {/* Phase tabs */}
      <div className="flex justify-center gap-1">
        {(["work", "short-break", "long-break"] as Phase[]).map((p) => (
          <button key={p} id={`pomo-phase-${p}`} onClick={() => switchPhase(p)}
            className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              phase === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80")}>
            {PHASE_META[p].label}
          </button>
        ))}
      </div>

      {/* Session dots */}
      <div className="flex justify-center items-center gap-2">
        {Array.from({ length: config.sessionsUntilLong }, (_, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div className={cn("h-2 w-2 rounded-full transition-all", i < (sessions % config.sessionsUntilLong) ? "bg-primary" : "bg-border")} />
            </TooltipTrigger>
            <TooltipContent>{i < (sessions % config.sessionsUntilLong) ? "Completed" : "Upcoming"} focus session</TooltipContent>
          </Tooltip>
        ))}
        <span className="ml-1 text-[10px] text-muted-foreground">until long break</span>
      </div>

      {/* Circular timer */}
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <svg width="200" height="200" className="-rotate-90">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle cx="100" cy="100" r={radius} fill="none" stroke={PHASE_META[phase].ring}
              strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={stroke}
              strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.3s linear, stroke 0.3s" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center" aria-live="polite">
            <span className="text-5xl font-mono font-bold text-foreground tabular-nums">{mins}:{secs}</span>
            <span className={cn("text-xs font-medium mt-1", PHASE_META[phase].color)}>{PHASE_META[phase].label}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="outline" onClick={reset} id="pomo-reset" aria-label="Reset (R)"><RotateCcw className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent>Reset timer (R)</TooltipContent>
          </Tooltip>
          <Button size="lg" className="w-28" onClick={toggle} id="pomo-playpause">
            {running ? <><Pause className="h-5 w-5" />Pause</> : <><Play className="h-5 w-5" />Start</>}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="outline" onClick={() => advance(false)} id="pomo-skip" aria-label="Skip (S)"><SkipForward className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent>Skip to next phase (S)</TooltipContent>
          </Tooltip>
        </div>

        {/* Secondary controls */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSoundOn((s) => !s)} id="pomo-sound" aria-label="Toggle sound">
                {soundOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{soundOn ? "Sound on" : "Sound off"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowSettings((s) => !s)} id="pomo-settings" aria-label="Settings"><Settings className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </div>

        <p className="text-[10px] text-muted-foreground/70">Space = start/pause · R = reset · S = skip</p>
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={CheckCircle2} label="Sessions" value={String(sessions)} hint="Focus sessions you've completed today." />
        <Stat icon={Clock} label="Focus time" value={todayMins >= 60 ? `${Math.floor(todayMins / 60)}h ${todayMins % 60}m` : `${todayMins}m`} hint="Total time focused today (persists across reloads, resets at midnight)." />
        <Stat icon={Flame} label="Streak" value={`${sessions % config.sessionsUntilLong}/${config.sessionsUntilLong}`} hint="Progress toward your next long break." />
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-4 animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Durations</p>
          {([
            { key: "work", label: "Focus duration", unit: "min" },
            { key: "shortBreak", label: "Short break", unit: "min" },
            { key: "longBreak", label: "Long break", unit: "min" },
            { key: "sessionsUntilLong", label: "Sessions until long break", unit: "" },
          ] as const).map(({ key, label, unit }) => (
            <div key={key} className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">{label}</label>
              <div className="flex items-center gap-2">
                <input type="number" min={1} max={120} value={config[key]}
                  onChange={(e) => updateConfig({ [key]: Math.max(1, Math.min(120, +e.target.value || 1)) } as Partial<Config>)}
                  className="w-16 rounded border border-input bg-background px-2 py-1 text-sm font-mono text-center" />
                {unit && <span className="text-xs text-muted-foreground w-8">{unit}</span>}
              </div>
            </div>
          ))}

          <div className="pt-2 border-t space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Automation</p>
            <ToggleRow label="Auto-start breaks" hint="Begin breaks automatically when a focus session ends." checked={config.autoStartBreaks} onChange={(v) => updateConfig({ autoStartBreaks: v })} />
            <ToggleRow label="Auto-start focus" hint="Begin the next focus session automatically when a break ends." checked={config.autoStartPomodoros} onChange={(v) => updateConfig({ autoStartPomodoros: v })} />
            <ToggleRow label="Desktop notifications" hint="Show a system notification when each phase ends (asks permission)." checked={notifyOn} onChange={toggleNotify} />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: React.ElementType; label: string; value: string; hint: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="rounded-lg border border-border/60 bg-card px-3 py-2.5 text-center cursor-default">
          <Icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <div className="text-lg font-semibold tabular-nums">{value}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-[200px] text-center">{hint}</TooltipContent>
    </Tooltip>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Tooltip>
        <TooltipTrigger asChild>
          <label className="text-sm text-muted-foreground cursor-help">{label}</label>
        </TooltipTrigger>
        <TooltipContent className="max-w-[220px] text-center">{hint}</TooltipContent>
      </Tooltip>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
