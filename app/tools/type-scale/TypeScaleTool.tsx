"use client";
import * as React from "react";

// Type Scale generator — pure JS, no deps
const RATIOS: Record<string, number> = {
  'Minor Second': 1.067, 'Major Second': 1.125, 'Minor Third': 1.200,
  'Major Third': 1.250, 'Perfect Fourth': 1.333, 'Augmented Fourth': 1.414,
  'Perfect Fifth': 1.500, 'Golden Ratio': 1.618, 'Octave': 2.000,
};

const STEP_LABELS = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'];

interface Step { label: string; px: number; rem: number; step: number; }

function generateScale(base: number, ratio: number, up: number, down: number): Step[] {
  const steps: Step[] = [];
  for (let i = -down; i <= up; i++) {
    const px = base * Math.pow(ratio, i);
    const labelIdx = down + i;
    steps.push({
      label: STEP_LABELS[Math.min(labelIdx, STEP_LABELS.length - 1)] ?? `step${i}`,
      px: Math.round(px * 100) / 100,
      rem: Math.round((px / 16) * 1000) / 1000,
      step: i,
    });
  }
  return steps;
}

export function TypeScaleTool() {
  const [base, setBase] = React.useState(16);
  const [ratioName, setRatioName] = React.useState('Perfect Fourth');
  const [customRatio, setCustomRatio] = React.useState(1.333);
  const [useCustom, setUseCustom] = React.useState(false);
  const [up, setUp] = React.useState(6);
  const [down, setDown] = React.useState(2);
  const [unit, setUnit] = React.useState<'rem' | 'px'>('rem');
  const [outTab, setOutTab] = React.useState<'css' | 'tailwind' | 'json'>('css');
  const [copied, setCopied] = React.useState(false);

  const ratio = useCustom ? customRatio : RATIOS[ratioName];
  const steps = React.useMemo(() => generateScale(base, ratio, up, down), [base, ratio, up, down]);

  const cssVars = `:root {\n${steps.map(s => `  --font-size-${s.label}: ${unit === 'rem' ? s.rem + 'rem' : s.px + 'px'};`).join('\n')}\n}`;
  const tailwindConf = `// tailwind.config.js\ntheme: {\n  fontSize: {\n${steps.map(s => `    '${s.label}': '${s.rem}rem',`).join('\n')}\n  }\n}`;
  const jsonOut = JSON.stringify(Object.fromEntries(steps.map(s => [s.label, { px: s.px, rem: s.rem }])), null, 2);

  const outputMap = { css: cssVars, tailwind: tailwindConf, json: jsonOut };
  const copy = () => { navigator.clipboard.writeText(outputMap[outTab]); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Base size: {base}px</label>
          <input type="range" min={12} max={24} value={base} onChange={e => setBase(+e.target.value)} className="w-full accent-foreground" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Ratio: {ratio.toFixed(3)}</label>
          <select className="w-full rounded-md border bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            value={ratioName} onChange={e => { setRatioName(e.target.value); setUseCustom(false); }}>
            {Object.keys(RATIOS).map(r => <option key={r} value={r}>{r} ({RATIOS[r]})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Steps up: {up}</label>
          <input type="range" min={1} max={8} value={up} onChange={e => setUp(+e.target.value)} className="w-full accent-foreground" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Steps down: {down}</label>
          <input type="range" min={0} max={4} value={down} onChange={e => setDown(+e.target.value)} className="w-full accent-foreground" />
        </div>
      </div>

      {/* Live preview */}
      <div className="rounded-lg border bg-card/50 p-4 space-y-2 overflow-x-auto">
        <div className="text-xs text-muted-foreground mb-3">Live preview</div>
        {[...steps].reverse().map(s => (
          <div key={s.label} className="flex items-baseline gap-3">
            <span className="text-xs text-muted-foreground w-8 shrink-0">{s.label}</span>
            <span style={{ fontSize: `${s.rem}rem`, lineHeight: 1.2 }} className="font-medium truncate">
              The quick brown fox
            </span>
            <span className="text-xs text-muted-foreground shrink-0 ml-auto">{unit === 'rem' ? `${s.rem}rem` : `${s.px}px`}</span>
          </div>
        ))}
      </div>

      {/* Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1.5">
            {(['css', 'tailwind', 'json'] as const).map(t => (
              <button key={t} onClick={() => setOutTab(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${outTab === t ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
                {t === 'css' ? 'CSS Vars' : t === 'tailwind' ? 'Tailwind' : 'JSON'}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => setUnit(u => u === 'rem' ? 'px' : 'rem')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Unit: {unit}
            </button>
            <button onClick={copy} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{copied ? 'Copied!' : 'Copy'}</button>
          </div>
        </div>
        <pre className="rounded-lg border bg-card p-4 font-mono text-xs overflow-x-auto max-h-64">{outputMap[outTab]}</pre>
      </div>
    </div>
  );
}
