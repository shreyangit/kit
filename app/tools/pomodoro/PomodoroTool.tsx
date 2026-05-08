"use client";

import * as React from "react";
import { Play, Pause, RotateCcw, Settings, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Phase = "work" | "short-break" | "long-break";

const PHASE_META: Record<Phase, { label: string; emoji: string; color: string }> = {
  "work": { label: "Focus", emoji: "🍅", color: "text-rose-400" },
  "short-break": { label: "Short Break", emoji: "☕", color: "text-teal-400" },
  "long-break": { label: "Long Break", emoji: "🌿", color: "text-green-400" },
};

function playBell() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(830, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1.5);
  } catch { /* AudioContext not available */ }
}

export function PomodoroTool() {
  const [config, setConfig] = React.useState({ work: 25, shortBreak: 5, longBreak: 15, sessionsUntilLong: 4 });
  const [phase, setPhase] = React.useState<Phase>("work");
  const [secondsLeft, setSecondsLeft] = React.useState(25 * 60);
  const [running, setRunning] = React.useState(false);
  const [sessions, setSessions] = React.useState(0);
  const [task, setTask] = React.useState("");
  const [soundOn, setSoundOn] = React.useState(true);
  const [showSettings, setShowSettings] = React.useState(false);
  const [todayFocus, setTodayFocus] = React.useState(0); // seconds

  const phaseSeconds = { work: config.work * 60, "short-break": config.shortBreak * 60, "long-break": config.longBreak * 60 };
  const total = phaseSeconds[phase];

  // Timer tick
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(id);
          setRunning(false);
          if (soundOn) playBell();
          // Advance phase
          setPhase(cur => {
            if (cur === "work") {
              setSessions(prev => {
                const next = prev + 1;
                const nextPhase = next % config.sessionsUntilLong === 0 ? "long-break" : "short-break";
                setPhase(nextPhase);
                setSecondsLeft(phaseSeconds[nextPhase]);
                return next;
              });
              return cur; // will be overwritten
            } else {
              setPhase("work");
              setSecondsLeft(phaseSeconds.work);
              return "work";
            }
          });
          return 0;
        }
        if (phase === "work") setTodayFocus(f => f + 1);
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, soundOn]);

  // Update tab title
  React.useEffect(() => {
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const s = (secondsLeft % 60).toString().padStart(2, "0");
    const e = PHASE_META[phase].emoji;
    document.title = running ? `${e} ${m}:${s} — Pomodoro` : "Pomodoro — kit";
    return () => { document.title = "kit"; };
  }, [secondsLeft, running, phase]);

  // Keyboard shortcuts
  React.useEffect(() => {
    function h(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); setRunning(r => !r); }
      if (e.key === "r" || e.key === "R") reset();
    }
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  function reset() {
    setRunning(false);
    setSecondsLeft(phaseSeconds[phase]);
  }

  function switchPhase(p: Phase) {
    setPhase(p); setRunning(false); setSecondsLeft(phaseSeconds[p]);
  }

  function applyConfig(newCfg: typeof config) {
    setConfig(newCfg);
    setRunning(false);
    const newSecs = { work: newCfg.work * 60, "short-break": newCfg.shortBreak * 60, "long-break": newCfg.longBreak * 60 };
    setSecondsLeft(newSecs[phase]);
  }

  const progress = 1 - secondsLeft / total;
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
        id="pomodoro-task"
        type="text"
        value={task}
        onChange={e => setTask(e.target.value)}
        placeholder="What are you working on?"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-center"
      />

      {/* Phase tabs */}
      <div className="flex justify-center gap-1">
        {(["work", "short-break", "long-break"] as Phase[]).map(p => (
          <button key={p} id={`pomo-phase-${p}`} onClick={() => switchPhase(p)}
            className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              phase === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}>
            {PHASE_META[p].label}
          </button>
        ))}
      </div>

      {/* Session dots */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: config.sessionsUntilLong }, (_, i) => (
          <div key={i} className={cn("h-2 w-2 rounded-full transition-all", i < (sessions % config.sessionsUntilLong) ? "bg-primary" : "bg-border")} />
        ))}
      </div>

      {/* Circular timer */}
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <svg width="200" height="200" className="-rotate-90">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle
              cx="100" cy="100" r={radius} fill="none"
              stroke={phase === "work" ? "var(--primary)" : phase === "short-break" ? "#2dd4bf" : "#4ade80"}
              strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={stroke}
              strokeLinecap="round" className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-mono font-bold text-foreground">{mins}:{secs}</span>
            <span className={cn("text-xs font-medium mt-1", PHASE_META[phase].color)}>{PHASE_META[phase].emoji} {PHASE_META[phase].label}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button size="icon" variant="outline" onClick={reset} id="pomo-reset" aria-label="Reset">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            className="w-28"
            onClick={() => setRunning(r => !r)}
            id="pomo-playpause"
          >
            {running ? <><Pause className="h-5 w-5" />Pause</> : <><Play className="h-5 w-5" />Start</>}
          </Button>
          <Button size="icon" variant="outline" onClick={() => setSoundOn(s => !s)} id="pomo-sound" aria-label="Toggle sound">
            {soundOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="outline" onClick={() => setShowSettings(s => !s)} id="pomo-settings" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Session {sessions + 1}</span>
          {todayMins > 0 && <span>Today: {todayMins}m focused</span>}
          <span className="opacity-50">Space = pause · R = reset</span>
        </div>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-3 animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settings</p>
          {[
            { key: "work", label: "Focus duration" },
            { key: "shortBreak", label: "Short break" },
            { key: "longBreak", label: "Long break" },
            { key: "sessionsUntilLong", label: "Sessions until long break" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">{label}</label>
              <div className="flex items-center gap-2">
                <input type="number" min={1} max={120}
                  value={config[key as keyof typeof config]}
                  onChange={e => applyConfig({ ...config, [key]: +e.target.value })}
                  className="w-16 rounded border border-input bg-background px-2 py-1 text-sm font-mono text-center" />
                <span className="text-xs text-muted-foreground">{key === "sessionsUntilLong" ? "sessions" : "min"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
