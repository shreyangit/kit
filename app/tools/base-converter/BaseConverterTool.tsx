"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const FROM_BASES = [
  { value: "2", label: "Base 2 — Binary" },
  { value: "8", label: "Base 8 — Octal" },
  { value: "10", label: "Base 10 — Decimal" },
  { value: "16", label: "Base 16 — Hex" },
];

const OUTPUTS = [
  { key: "binary", label: "Binary", base: 2, prefix: "0b" },
  { key: "octal", label: "Octal", base: 8, prefix: "0o" },
  { key: "decimal", label: "Decimal", base: 10, prefix: "" },
  { key: "hex", label: "Hexadecimal", base: 16, prefix: "0x" },
  { key: "base32", label: "Base 32", base: 32, prefix: "" },
  { key: "base36", label: "Base 36", base: 36, prefix: "" },
];

// Group binary in 4s, hex in 2s
function formatGroup(s: string, groupSize: number): string {
  const neg = s.startsWith("-");
  const digits = neg ? s.slice(1) : s;
  const padded = digits.length % groupSize === 0 ? digits : "0".repeat(groupSize - (digits.length % groupSize)) + digits;
  const groups: string[] = [];
  for (let i = 0; i < padded.length; i += groupSize) groups.push(padded.slice(i, i + groupSize));
  return (neg ? "-" : "") + groups.join(" ");
}

function convert(input: string, fromBase: number): Record<string, string> | string {
  const clean = input.trim().replace(/[\s_]/g, "").toLowerCase();
  if (!clean) return {};
  const neg = clean.startsWith("-");
  const digits = neg ? clean.slice(1) : clean;
  const validChars = "0123456789abcdefghijklmnopqrstuvwxyz".slice(0, fromBase);
  for (const c of digits) {
    if (!validChars.includes(c)) return `Character "${c}" is not valid in base ${fromBase}`;
  }
  try {
    // Build decimal value using BigInt
    let val = 0n;
    const base = BigInt(fromBase);
    for (const c of digits) val = val * base + BigInt(parseInt(c, fromBase));
    if (neg) val = -val;
    const abs = val < 0n ? -val : val;
    const prefix = val < 0n ? "-" : "";
    const result: Record<string, string> = {};
    OUTPUTS.forEach(o => {
      result[o.key] = prefix + abs.toString(o.base);
      if (o.base === 16) result[o.key] = (prefix + abs.toString(16)).toUpperCase();
      if (o.base === 32) result[o.key] = (prefix + abs.toString(32)).toUpperCase();
      if (o.base === 36) result[o.key] = (prefix + abs.toString(36)).toUpperCase();
    });
    return result;
  } catch {
    return "Number too large or invalid";
  }
}

function CopyBtn({ text, id }: { text: string; id: string }) {
  const [ok, setOk] = React.useState(false);
  async function copy() { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1400); }
  return (
    <button onClick={copy} id={id} className="p-1 rounded hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100" aria-label="Copy">
      {ok ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
    </button>
  );
}

const QUICK = [
  { label: "255 (hex FF)", value: "255", base: "10" },
  { label: "0xFF", value: "FF", base: "16" },
  { label: "1010 1111 (binary)", value: "10101111", base: "2" },
  { label: "127.0.0.1 last octet", value: "1", base: "10" },
];

export function BaseConverterTool() {
  const [input, setInput] = React.useState("255");
  const [fromBase, setFromBase] = React.useState("10");
  const [grouped, setGrouped] = React.useState(true);

  const result = React.useMemo(() => convert(input, parseInt(fromBase)), [input, fromBase]);
  const isError = typeof result === "string";

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Input row */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={fromBase} onValueChange={setFromBase}>
            <SelectTrigger id="base-from" className="w-48 text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FROM_BASES.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <Switch id="base-group" checked={grouped} onCheckedChange={setGrouped} />
            Group digits
          </label>
        </div>
        <input
          id="base-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={fromBase === "2" ? "10101111" : fromBase === "16" ? "FF3A" : fromBase === "8" ? "377" : "255"}
          className={cn(
            "w-full rounded-md border bg-background px-3 py-2.5 font-mono text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
            isError && input ? "border-destructive focus:ring-destructive" : "border-input"
          )}
          spellCheck={false}
          autoComplete="off"
        />
        {isError && input && <p className="text-xs text-destructive font-mono">{result}</p>}
      </div>

      {/* Quick presets */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK.map(q => (
          <button
            key={q.label}
            onClick={() => { setInput(q.value); setFromBase(q.base); }}
            className="px-2.5 py-1 rounded text-[10px] bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Output grid */}
      {!isError && typeof result === "object" && Object.keys(result).length > 0 && (
        <div className="space-y-1.5">
          {OUTPUTS.map(o => {
            const raw = result[o.key] ?? "";
            const display = grouped
              ? o.base === 2 ? formatGroup(raw, 4)
              : o.base === 16 ? formatGroup(raw, 2)
              : raw
              : raw;
            return (
              <div key={o.key} className="group flex items-center gap-3 rounded-md border border-border/60 bg-card px-4 py-3 hover:border-primary/30 transition-colors">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-24 shrink-0">{o.label}</span>
                <span className="font-mono text-sm text-foreground flex-1 break-all" id={`base-output-${o.key}`}>{display || "—"}</span>
                {raw && <CopyBtn text={raw} id={`base-copy-${o.key}`} />}
              </div>
            );
          })}
        </div>
      )}

      {/* Explanation when empty */}
      {!input && (
        <div className="rounded-lg border border-dashed border-border/60 py-12 text-center">
          <p className="text-sm text-muted-foreground">Enter a number above to convert between all bases simultaneously.</p>
        </div>
      )}
    </div>
  );
}
