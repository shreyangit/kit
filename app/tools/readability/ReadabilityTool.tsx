"use client";
import * as React from "react";

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const m = word.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}
function isComplex(w: string) { return countSyllables(w) >= 3 && !w.endsWith('ing') && !w.endsWith('es') && !w.endsWith('ed'); }
function hasPassive(s: string) { return /\b(is|are|was|were|be|been|being)\s+\w+ed\b/i.test(s); }

function analyse(text: string) {
  if (!text.trim()) return null;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3);
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length < 3 || sentences.length < 1) return null;
  const W = words.length, S = Math.max(sentences.length, 1);
  const Syl = words.reduce((n, w) => n + countSyllables(w), 0);
  const CW = words.filter(isComplex).length;
  const letters = words.join('').replace(/[^a-zA-Z]/g,'').length;
  const ASL = W / S, ASW = Syl / W;
  const L = letters / W * 100, SS = S / W * 100;
  const flesch = Math.min(100, Math.max(0, Math.round((206.835 - 1.015 * ASL - 84.6 * ASW) * 10) / 10));
  const fkgl = Math.round((0.39 * ASL + 11.8 * ASW - 15.59) * 10) / 10;
  const fog = Math.round((0.4 * (ASL + 100 * CW / W)) * 10) / 10;
  const smog = Math.round((3 + Math.sqrt(CW * (30 / S))) * 10) / 10;
  const cli = Math.round((0.0588 * L - 0.296 * SS - 15.8) * 10) / 10;
  const ari = Math.round((4.71 * (letters / W) + 0.5 * ASL - 21.43) * 10) / 10;
  const avg = Math.round(((fkgl + fog + smog + cli + ari) / 5) * 10) / 10;
  const gl = (g: number) => g <= 6 ? '6th grade' : g <= 8 ? '8th grade' : g <= 10 ? '10th grade' : g <= 12 ? '12th grade' : g <= 14 ? 'College' : 'Post-grad';
  const flGrade = flesch >= 70 ? 'Easy' : flesch >= 50 ? 'Moderate' : 'Difficult';
  const suggestions: string[] = [];
  if (ASL > 20) suggestions.push('Long sentences detected — consider breaking them up.');
  if (CW / W > 0.15) suggestions.push('High complex word ratio — try simpler alternatives.');
  if (sentences.filter(hasPassive).length / S > 0.2) suggestions.push('Many passive sentences — favour active voice.');
  if (flesch < 60) suggestions.push('Flesch score below 60 — hard for general audiences.');
  return { flesch, flGrade, fkgl, fog, smog, cli, ari, avg, W, S, Syl, CW, letters, ASL: Math.round(ASL * 10)/10, gl, suggestions };
}

export function ReadabilityTool() {
  const [text, setText] = React.useState('The implementation of complex algorithmic structures necessitates a comprehensive understanding of fundamental computational principles. Software engineers must navigate intricate codebases while maintaining extensibility and scalability considerations.');
  const r = React.useMemo(() => analyse(text), [text]);

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs text-muted-foreground mb-1.5">Paste your text</label>
        <textarea className="w-full h-40 rounded-md border bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-y"
          value={text} onChange={e => setText(e.target.value)} placeholder="Paste an article, email, or blog post…" />
        <div className="mt-1 text-xs text-muted-foreground">{text.trim().split(/\s+/).filter(Boolean).length} words</div>
      </div>

      {r ? (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card/50 p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">Average Grade Level</div>
            <div className="text-4xl font-bold">{r.avg}</div>
            <div className="text-sm text-muted-foreground mt-1">{r.gl(r.avg)}</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Flesch Ease', val: r.flesch, grade: r.flGrade, color: r.flesch >= 70 ? '#4ade80' : r.flesch >= 50 ? '#fbbf24' : '#f87171' },
              { label: 'Flesch-Kincaid', val: r.fkgl, grade: r.gl(r.fkgl), color: '#60a5fa' },
              { label: 'Gunning Fog', val: r.fog, grade: r.gl(r.fog), color: '#a78bfa' },
              { label: 'SMOG', val: r.smog, grade: r.gl(r.smog), color: '#f472b6' },
              { label: 'Coleman-Liau', val: r.cli, grade: r.gl(r.cli), color: '#fb923c' },
              { label: 'ARI', val: r.ari, grade: r.gl(r.ari), color: '#34d399' },
            ].map(s => (
              <div key={s.label} className="rounded-lg border bg-card p-3 space-y-1">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-xl font-bold" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs font-medium">{s.grade}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[['Words', r.W], ['Sentences', r.S], ['Syllables', r.Syl], ['Complex words', r.CW]].map(([l, v]) => (
              <div key={String(l)} className="rounded-lg border bg-card p-3">
                <div className="text-xs text-muted-foreground mb-0.5">{l}</div>
                <div className="font-mono text-sm font-semibold">{v}</div>
              </div>
            ))}
          </div>
          {r.suggestions.length > 0 && (
            <div className="rounded-lg border bg-card/50 p-4 space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Suggestions</div>
              {r.suggestions.map((s, i) => (
                <div key={i} className="text-sm flex gap-2"><span className="text-muted-foreground shrink-0">→</span>{s}</div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-muted-foreground text-sm py-8">Paste at least a few sentences to see scores.</div>
      )}
    </div>
  );
}
