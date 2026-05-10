"use client";
import * as React from "react";

function calcSpecificity(selector: string) {
  let b = 0, c = 0, d = 0;
  let s = selector
    .replace(/::?not\(([^)]*)\)/g, '$1')
    .replace(/::?[a-z-]+/gi, match => {
      if (match.startsWith('::') || ['::before','::after','::first-line','::first-letter','::placeholder','::selection'].includes(match.toLowerCase())) { d++; return ''; }
      c++; return '';
    });
  const ids = s.match(/#[a-zA-Z_-][\w-]*/g); b += ids?.length ?? 0; s = s.replace(/#[a-zA-Z_-][\w-]*/g, '');
  const cls = s.match(/\.[a-zA-Z_-][\w-]*/g); c += cls?.length ?? 0; s = s.replace(/\.[a-zA-Z_-][\w-]*/g, '');
  const attrs = s.match(/\[[^\]]+\]/g); c += attrs?.length ?? 0; s = s.replace(/\[[^\]]+\]/g, '');
  const els = s.match(/[a-zA-Z][a-zA-Z0-9]*/g); d += els?.length ?? 0;
  return { b, c, d, total: `0,${b},${c},${d}`, numeric: b * 100 + c * 10 + d };
}

const EXAMPLES = [
  { label: 'Element', sel: 'div' },
  { label: 'Class', sel: '.active' },
  { label: 'ID', sel: '#header' },
  { label: 'Compound', sel: 'nav ul li a.active' },
  { label: 'Complex', sel: '#main .nav > li:hover' },
];

export function CssSpecificityTool() {
  const [sel1, setSel1] = React.useState('nav ul li a.active');
  const [sel2, setSel2] = React.useState('#main .nav > li:hover');
  const [compare, setCompare] = React.useState(false);
  const [copied, setCopied] = React.useState('');

  const s1 = calcSpecificity(sel1);
  const s2 = calcSpecificity(sel2);
  const winner = compare ? (s1.numeric > s2.numeric ? 1 : s1.numeric < s2.numeric ? 2 : 0) : null;

  const ScoreDisplay = ({ score, label, sel }: { score: ReturnType<typeof calcSpecificity>; label: string; sel: string }) => (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="font-mono text-sm text-muted-foreground">{sel || <span className="opacity-40">…</span>}</div>
      <div className="flex items-center gap-2">
        {[
          { val: 0, label: 'A', desc: 'Inline', color: '#f87171' },
          { val: score.b, label: 'B', desc: 'ID', color: '#fbbf24' },
          { val: score.c, label: 'C', desc: 'Class', color: '#60a5fa' },
          { val: score.d, label: 'D', desc: 'Element', color: '#4ade80' },
        ].map(g => (
          <div key={g.label} className="flex flex-col items-center gap-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-lg font-bold border-2"
              style={{ borderColor: `${g.color}66`, background: `${g.color}22`, color: g.color }}>
              {g.val}
            </div>
            <span className="text-[10px] text-muted-foreground">{g.desc}</span>
          </div>
        ))}
        <div className="ml-auto text-right">
          <div className="text-lg font-mono font-bold">{score.total}</div>
          <div className="text-xs text-muted-foreground">specificity</div>
        </div>
      </div>
      {winner !== null && (
        <div className={`text-center text-sm font-medium py-1 rounded-md ${label === 'Selector 1' && winner === 1 ? 'text-foreground bg-foreground/10' : label === 'Selector 2' && winner === 2 ? 'text-foreground bg-foreground/10' : winner === 0 ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
          {winner === 0 ? 'Tie' : (label === 'Selector 1' && winner === 1) || (label === 'Selector 2' && winner === 2) ? '🏆 Wins' : 'Loses'}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="block text-xs text-muted-foreground mb-1.5">CSS Selector</label>
        <input className="w-full rounded-md border bg-card px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-ring"
          value={sel1} onChange={e => setSel1(e.target.value)} placeholder=".nav > li:hover" />
        <ScoreDisplay score={s1} label="Selector 1" sel={sel1} />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setCompare(c => !c)} className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${compare ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground'}`}>
          {compare ? 'Hide Comparison' : '+ Compare Two Selectors'}
        </button>
      </div>

      {compare && (
        <div className="space-y-2">
          <label className="block text-xs text-muted-foreground mb-1.5">Second Selector</label>
          <input className="w-full rounded-md border bg-card px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-ring"
            value={sel2} onChange={e => setSel2(e.target.value)} placeholder="#header .menu a" />
          <ScoreDisplay score={s2} label="Selector 2" sel={sel2} />
        </div>
      )}

      {/* Quick examples */}
      <div>
        <div className="text-xs text-muted-foreground mb-2">Quick examples</div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map(ex => (
            <button key={ex.sel} onClick={() => setSel1(ex.sel)}
              className="px-2.5 py-1 rounded-md text-xs font-mono border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors">
              {ex.sel}
            </button>
          ))}
        </div>
      </div>

      {/* Reference table */}
      <div className="rounded-lg border bg-card/50 overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="border-b"><th className="text-left p-3 text-muted-foreground">Selector type</th><th className="p-3 text-muted-foreground">Score</th><th className="p-3 text-muted-foreground text-right">Example</th></tr></thead>
          <tbody>
            {[
              ['Universal *','0,0,0,0','*'],['Element','0,0,0,1','div'],['Class','0,0,1,0','.active'],
              ['Attribute','0,0,1,0','[type="text"]'],['Pseudo-class','0,0,1,0',':hover'],
              ['ID','0,1,0,0','#header'],['Inline style','1,0,0,0','style="…"'],
            ].map(([type, score, ex]) => (
              <tr key={type} className="border-b last:border-0">
                <td className="p-3">{type}</td>
                <td className="p-3 text-center font-mono">{score}</td>
                <td className="p-3 text-right font-mono text-muted-foreground">{ex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
