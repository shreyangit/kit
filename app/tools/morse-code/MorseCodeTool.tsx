"use client";
import * as React from "react";

const MORSE_MAP: Record<string, string> = {
  'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---',
  'K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-',
  'U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.',
  '.':'.-.-.-',',':'--..--','?':'..--..','!':'-.-.--','/':'-..-.','@':'.--.-.', ' ':'/'
};
const REVERSE = Object.fromEntries(Object.entries(MORSE_MAP).map(([k, v]) => [v, k]));

function textToMorse(t: string) { return t.toUpperCase().split('').map(c => MORSE_MAP[c] ?? '?').join(' '); }
function morseToText(m: string) { return m.split(' / ').map(w => w.split(' ').map(c => REVERSE[c] ?? '?').join('')).join(' '); }

async function playMorse(morse: string, wpm: number, freq: number) {
  const ctx = new AudioContext();
  const dot = 1.2 / wpm;
  let t = ctx.currentTime + 0.05;
  const play = (dur: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.005);
    gain.gain.setValueAtTime(0.5, t + dur - 0.005);
    gain.gain.linearRampToValueAtTime(0, t + dur);
    osc.start(t); osc.stop(t + dur);
    t += dur + dot;
  };
  for (const ch of morse) {
    if (ch === '.') play(dot);
    else if (ch === '-') play(dot * 3);
    else if (ch === ' ') t += dot * 2;
    else if (ch === '/') t += dot * 6;
  }
  return new Promise<void>(r => setTimeout(r, (t - ctx.currentTime) * 1000));
}

export function MorseCodeTool() {
  const [tab, setTab] = React.useState<'encode'|'decode'>('encode');
  const [input, setInput] = React.useState('HELLO WORLD');
  const [wpm, setWpm] = React.useState(15);
  const [freq, setFreq] = React.useState(700);
  const [playing, setPlaying] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const output = tab === 'encode' ? textToMorse(input) : morseToText(input);

  const copy = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const play = async () => {
    if (playing) return;
    const morse = tab === 'encode' ? output : input;
    setPlaying(true);
    try { await playMorse(morse, wpm, freq); } finally { setPlaying(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(['encode','decode'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setInput(t === 'encode' ? 'HELLO WORLD' : '.... . .-.. .-.. ---'); }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${tab===t ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
            {t === 'encode' ? 'Text → Morse' : 'Morse → Text'}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">{tab === 'encode' ? 'Text input' : 'Morse input (dots, dashes, / for spaces)'}</label>
          <textarea className="w-full h-32 rounded-md border bg-card px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-ring resize-none"
            value={input} onChange={e => setInput(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Output</label>
          <div className="h-32 rounded-md border bg-card px-3 py-2 text-sm font-mono overflow-auto whitespace-pre-wrap leading-relaxed">
            {output || <span className="text-muted-foreground">…</span>}
          </div>
        </div>
      </div>

      {/* Morse visual */}
      {tab === 'encode' && output && (
        <div className="rounded-lg border bg-card/50 p-3 flex flex-wrap gap-2 items-center">
          {output.split(' ').map((token, i) =>
            token === '/' ? <span key={i} className="text-muted-foreground text-xs mx-2">|</span> :
            <span key={i} className="flex gap-0.5">
              {token.split('').map((ch, j) =>
                ch === '.' ? <span key={j} className="w-2.5 h-2.5 rounded-full bg-foreground inline-block" /> :
                <span key={j} className="w-6 h-2.5 rounded bg-foreground inline-block" />
              )}
            </span>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="grid sm:grid-cols-2 gap-4 rounded-lg border bg-card/50 p-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Speed: {wpm} WPM</label>
          <input type="range" min={5} max={40} value={wpm} onChange={e => setWpm(+e.target.value)} className="w-full accent-foreground" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Frequency: {freq} Hz</label>
          <input type="range" min={400} max={900} value={freq} onChange={e => setFreq(+e.target.value)} className="w-full accent-foreground" />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={play} disabled={playing}
          className="px-4 py-2 rounded-md text-sm font-medium bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-opacity">
          {playing ? 'Playing…' : '▶ Play Audio'}
        </button>
        <button onClick={copy} className="px-4 py-2 rounded-md text-sm font-medium border border-border hover:border-foreground/30 transition-colors">
          {copied ? 'Copied!' : 'Copy Output'}
        </button>
        <button onClick={() => { const b = new Blob([output], {type:'text/plain'}); const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download='morse.txt'; a.click(); }}
          className="px-4 py-2 rounded-md text-sm font-medium border border-border hover:border-foreground/30 transition-colors">
          Download .txt
        </button>
      </div>
    </div>
  );
}
