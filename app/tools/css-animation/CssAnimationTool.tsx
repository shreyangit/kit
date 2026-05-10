"use client";
import * as React from "react";

const PRESETS = [
  { label: 'Fade In', name: 'fadeIn', keyframes: '@keyframes fadeIn {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}', animation: 'animation: fadeIn 0.6s ease-out;' },
  { label: 'Slide Up', name: 'slideUp', keyframes: '@keyframes slideUp {\n  from { transform: translateY(20px); opacity: 0; }\n  to { transform: translateY(0); opacity: 1; }\n}', animation: 'animation: slideUp 0.5s ease-out;' },
  { label: 'Bounce', name: 'bounce', keyframes: '@keyframes bounce {\n  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-20px); }\n}', animation: 'animation: bounce 0.8s ease-in-out infinite;' },
  { label: 'Pulse', name: 'pulse', keyframes: '@keyframes pulse {\n  0%, 100% { transform: scale(1); }\n  50% { transform: scale(1.05); }\n}', animation: 'animation: pulse 1s ease-in-out infinite;' },
  { label: 'Spin', name: 'spin', keyframes: '@keyframes spin {\n  from { transform: rotate(0deg); }\n  to { transform: rotate(360deg); }\n}', animation: 'animation: spin 1s linear infinite;' },
  { label: 'Shake', name: 'shake', keyframes: '@keyframes shake {\n  0%, 100% { transform: translateX(0); }\n  20% { transform: translateX(-10px); }\n  40% { transform: translateX(10px); }\n  60% { transform: translateX(-8px); }\n  80% { transform: translateX(8px); }\n}', animation: 'animation: shake 0.6s ease-in-out;' },
  { label: 'Float', name: 'float', keyframes: '@keyframes float {\n  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-20px); }\n}', animation: 'animation: float 3s ease-in-out infinite;' },
];

export function CssAnimationTool() {
  const [selected, setSelected] = React.useState(PRESETS[0]);
  const [duration, setDuration] = React.useState(600);
  const [easing, setEasing] = React.useState('ease-out');
  const [iterations, setIterations] = React.useState('1');
  const [delay, setDelay] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [copied, setCopied] = React.useState('');
  const previewRef = React.useRef<HTMLDivElement>(null);

  const animProperty = `animation: ${selected.name} ${duration}ms ${easing} ${delay}ms ${iterations};`;
  const fullCSS = `${selected.keyframes}\n\n.element {\n  ${animProperty}\n}`;

  const play = () => {
    if (!previewRef.current) return;
    setPlaying(true);
    const el = previewRef.current;
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = '';
    el.style.animationName = selected.name;
    el.style.animationDuration = `${duration}ms`;
    el.style.animationTimingFunction = easing;
    el.style.animationDelay = `${delay}ms`;
    el.style.animationIterationCount = iterations;
    el.style.animationFillMode = 'both';
    setTimeout(() => setPlaying(false), duration + delay + 100);
  };

  const copy = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500); };

  return (
    <div className="space-y-5">
      {/* Inject keyframes */}
      <style>{PRESETS.map(p => p.keyframes).join('\n')}</style>

      {/* Presets */}
      <div>
        <div className="text-xs text-muted-foreground mb-2">Presets</div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => setSelected(p)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${selected.name === p.name ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Controls */}
        <div className="space-y-4">
          <div><label className="block text-xs text-muted-foreground mb-1">Duration: {duration}ms</label>
            <input type="range" min={100} max={3000} step={100} value={duration} onChange={e => setDuration(+e.target.value)} className="w-full accent-foreground" /></div>
          <div><label className="block text-xs text-muted-foreground mb-1">Delay: {delay}ms</label>
            <input type="range" min={0} max={2000} step={100} value={delay} onChange={e => setDelay(+e.target.value)} className="w-full accent-foreground" /></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Easing</label>
            <select className="w-full rounded-md border bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              value={easing} onChange={e => setEasing(e.target.value)}>
              {['linear','ease','ease-in','ease-out','ease-in-out','cubic-bezier(0.34, 1.56, 0.64, 1)'].map(e => <option key={e} value={e}>{e}</option>)}
            </select></div>
          <div><label className="block text-xs text-muted-foreground mb-1.5">Iterations</label>
            <select className="w-full rounded-md border bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              value={iterations} onChange={e => setIterations(e.target.value)}>
              {['1','2','3','infinite'].map(i => <option key={i} value={i}>{i}</option>)}
            </select></div>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-full h-48 rounded-lg border bg-card/30 flex items-center justify-center">
            <div ref={previewRef} className="w-20 h-20 rounded-xl bg-foreground/20 border border-foreground/30 flex items-center justify-center text-xs text-muted-foreground">
              element
            </div>
          </div>
          <button onClick={play} disabled={playing}
            className="px-4 py-2 rounded-md text-sm font-medium bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-opacity w-full">
            {playing ? 'Playing…' : '▶ Play Animation'}
          </button>
        </div>
      </div>

      {/* Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">CSS output</label>
          <div className="flex gap-3">
            <button onClick={() => copy(animProperty, 'prop')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{copied === 'prop' ? 'Copied!' : 'Copy property'}</button>
            <button onClick={() => copy(fullCSS, 'full')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{copied === 'full' ? 'Copied!' : 'Copy full CSS'}</button>
          </div>
        </div>
        <pre className="rounded-lg border bg-card p-4 font-mono text-xs overflow-x-auto">{fullCSS}</pre>
      </div>
    </div>
  );
}
