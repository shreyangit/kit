"use client";

import * as React from "react";

type InputMode = "number" | "text" | "float32" | "color";

function linearise(c: number): number {
  const n = c / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}
function delinearise(c: number): number {
  return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055));
}

function decodeFloat32(n: number) {
  const buf = new ArrayBuffer(4);
  new Float32Array(buf)[0] = n;
  const u = new Uint32Array(buf)[0];
  const bits = u.toString(2).padStart(32, "0");
  const sign = bits[0];
  const expBits = bits.slice(1, 9);
  const mantBits = bits.slice(9);
  const expVal = parseInt(expBits, 2);
  const bias = expVal - 127;
  const bytes = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0").toUpperCase());
  return { sign, expBits, mantBits, expVal, bias, bytes };
}

function decodeUTF8(text: string) {
  const encoder = new TextEncoder();
  return Array.from(text).map(char => {
    const cp = char.codePointAt(0)!;
    const bytes = Array.from(encoder.encode(char)).map(b => b.toString(16).padStart(2, "0").toUpperCase());
    const bin = bytes.map(b => parseInt(b, 16).toString(2).padStart(8, "0"));
    return { char, codePoint: cp, hex: `U+${cp.toString(16).padStart(4, "0").toUpperCase()}`, bytes, bin };
  });
}

const GROUP_COLORS = { sign: "#f87171", exp: "#fbbf24", mant: "#4ade80" };

function BitCell({ bit, color }: { bit: string; color: string }) {
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 text-xs font-mono font-semibold rounded-sm border"
      style={{ background: `${color}22`, borderColor: `${color}55`, color }}
    >
      {bit}
    </span>
  );
}

export function BinaryVisualiserTool() {
  const [mode, setMode] = React.useState<InputMode>("number");
  const [input, setInput] = React.useState("42");
  const TABS: { id: InputMode; label: string }[] = [
    { id: "number", label: "Integer" },
    { id: "float32", label: "Float32" },
    { id: "text", label: "UTF-8 Text" },
    { id: "color", label: "Colour (Hex)" },
  ];

  const num = Number(input);
  const isValidNum = !isNaN(num) && isFinite(num);

  function renderNumber() {
    if (!isValidNum) return <p className="text-muted-foreground text-sm">Enter a valid integer.</p>;
    const val = Math.abs(Math.trunc(num));
    const bin = val.toString(2);
    const padded = bin.padStart(Math.ceil(bin.length / 8) * 8, "0");
    const hex = val.toString(16).toUpperCase();
    const oct = val.toString(8);
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[["Binary", `0b${padded}`], ["Hex", `0x${hex}`], ["Octal", `0o${oct}`]].map(([label, val]) => (
            <div key={label} className="rounded-lg border bg-card p-3">
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className="font-mono text-sm font-medium break-all">{val}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-2">Bit layout (MSB → LSB)</div>
          <div className="flex flex-wrap gap-1">
            {padded.split("").map((b, i) => (
              <BitCell key={i} bit={b} color={b === "1" ? "#e8e8ed" : "#4a4a55"} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[["Decimal", num.toString()], ["Bit count", `${padded.length} bits`]].map(([l, v]) => (
            <div key={l} className="rounded-lg border bg-card p-3">
              <div className="text-xs text-muted-foreground mb-1">{l}</div>
              <div className="font-mono text-sm font-medium">{v}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderFloat() {
    if (!isValidNum) return <p className="text-muted-foreground text-sm">Enter a valid number.</p>;
    const { sign, expBits, mantBits, expVal, bias, bytes } = decodeFloat32(num);
    return (
      <div className="space-y-4">
        <div className="text-xs text-muted-foreground mb-1">IEEE 754 Float32 — 32 bits</div>
        <div className="flex flex-wrap gap-1">
          <BitCell bit={sign} color={GROUP_COLORS.sign} />
          {expBits.split("").map((b, i) => <BitCell key={`e${i}`} bit={b} color={GROUP_COLORS.exp} />)}
          {mantBits.split("").map((b, i) => <BitCell key={`m${i}`} bit={b} color={GROUP_COLORS.mant} />)}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Sign", color: GROUP_COLORS.sign, value: sign === "0" ? "+1" : "−1" },
            { label: "Exponent", color: GROUP_COLORS.exp, value: `${expVal} (2^${bias})` },
            { label: "Mantissa", color: GROUP_COLORS.mant, value: `1.${mantBits.slice(0,8)}…` },
          ].map(g => (
            <div key={g.label} className="rounded-lg border p-3" style={{ borderColor: `${g.color}44`, background: `${g.color}11` }}>
              <div className="text-xs mb-1" style={{ color: g.color }}>{g.label}</div>
              <div className="font-mono text-sm">{g.value}</div>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          Bytes (hex, little-endian): <span className="font-mono">{bytes.join(" ")}</span>
        </div>
      </div>
    );
  }

  function renderText() {
    if (!input.trim()) return <p className="text-muted-foreground text-sm">Enter some text.</p>;
    const chars = decodeUTF8(input.slice(0, 20));
    return (
      <div className="space-y-3">
        {chars.map((c, i) => (
          <div key={i} className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl font-mono">{c.char}</span>
              <span className="text-xs text-muted-foreground">{c.hex}</span>
              <span className="text-xs text-muted-foreground">Code point: {c.codePoint}</span>
            </div>
            <div className="flex flex-wrap gap-1 mb-1">
              {c.bin.map((byte, j) => (
                <span key={j} className="font-mono text-xs">
                  {byte.split("").map((b, k) => (
                    <BitCell key={k} bit={b} color={b === "1" ? "#e8e8ed" : "#4a4a55"} />
                  ))}
                  {j < c.bin.length - 1 && <span className="mx-1 text-muted-foreground">·</span>}
                </span>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">Hex bytes: {c.bytes.join(" ")}</div>
          </div>
        ))}
        {input.length > 20 && <p className="text-xs text-muted-foreground">Showing first 20 characters.</p>}
      </div>
    );
  }

  function renderColor() {
    const hex = input.replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return <p className="text-muted-foreground text-sm">Enter a valid 6-digit hex colour (e.g. #ff6b35).</p>;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const channels = [
      { label: "Red", val: r, color: GROUP_COLORS.sign },
      { label: "Green", val: g, color: GROUP_COLORS.mant },
      { label: "Blue", val: b, color: "#60a5fa" },
    ];
    return (
      <div className="space-y-4">
        <div className="w-full h-16 rounded-lg border" style={{ background: `#${hex}` }} />
        {channels.map(ch => (
          <div key={ch.label} className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span style={{ color: ch.color }}>{ch.label}</span>
              <span>{ch.val}</span>
              <span className="font-mono">{ch.val.toString(16).padStart(2, "0").toUpperCase()}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {ch.val.toString(2).padStart(8, "0").split("").map((bit, i) => (
                <BitCell key={i} bit={bit} color={ch.color} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const renderers: Record<InputMode, () => React.ReactNode> = {
    number: renderNumber,
    float32: renderFloat,
    text: renderText,
    color: renderColor,
  };

  return (
    <div className="space-y-5">
      {/* Mode tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setMode(t.id); setInput(t.id === "color" ? "#ff6b35" : t.id === "text" ? "Hi" : "42"); }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
              mode === t.id ? "bg-foreground text-background border-foreground" : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Input */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1.5">
          {mode === "number" ? "Integer value" : mode === "float32" ? "Float value" : mode === "text" ? "Text (up to 20 chars)" : "Hex colour"}
        </label>
        <input
          className="w-full rounded-md border bg-card px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-ring"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={mode === "color" ? "#ff6b35" : mode === "text" ? "Hello" : "42"}
        />
      </div>
      {/* Output */}
      <div className="rounded-lg border bg-card/50 p-4">
        {renderers[mode]()}
      </div>
    </div>
  );
}
