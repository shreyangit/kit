"use client";

import * as React from "react";
import { Copy, Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ── Unit definitions ──────────────────────────────────────────────────────

interface Unit {
  id: string;
  label: string;
  symbol: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  units: Unit[];
}

const lin = (factor: number): Pick<Unit, "toBase" | "fromBase"> => ({
  toBase: (v) => v * factor,
  fromBase: (v) => v / factor,
});

const CATEGORIES: Category[] = [
  {
    id: "length", label: "Length", icon: "↔",
    units: [
      { id: "mm", label: "Millimetre", symbol: "mm", ...lin(0.001) },
      { id: "cm", label: "Centimetre", symbol: "cm", ...lin(0.01) },
      { id: "m", label: "Metre", symbol: "m", ...lin(1) },
      { id: "km", label: "Kilometre", symbol: "km", ...lin(1000) },
      { id: "in", label: "Inch", symbol: "in", ...lin(0.0254) },
      { id: "ft", label: "Foot", symbol: "ft", ...lin(0.3048) },
      { id: "yd", label: "Yard", symbol: "yd", ...lin(0.9144) },
      { id: "mi", label: "Mile", symbol: "mi", ...lin(1609.344) },
      { id: "nmi", label: "Nautical Mile", symbol: "nmi", ...lin(1852) },
      { id: "ly", label: "Light-year", symbol: "ly", ...lin(9.461e15) },
    ],
  },
  {
    id: "weight", label: "Weight", icon: "⚖",
    units: [
      { id: "mg", label: "Milligram", symbol: "mg", ...lin(0.001) },
      { id: "g", label: "Gram", symbol: "g", ...lin(1) },
      { id: "kg", label: "Kilogram", symbol: "kg", ...lin(1000) },
      { id: "t", label: "Metric Ton", symbol: "t", ...lin(1e6) },
      { id: "oz", label: "Ounce", symbol: "oz", ...lin(28.3495) },
      { id: "lb", label: "Pound", symbol: "lb", ...lin(453.592) },
      { id: "st", label: "Stone", symbol: "st", ...lin(6350.29) },
    ],
  },
  {
    id: "temperature", label: "Temperature", icon: "🌡",
    units: [
      {
        id: "c", label: "Celsius", symbol: "°C",
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        id: "f", label: "Fahrenheit", symbol: "°F",
        toBase: (v) => (v - 32) * 5 / 9,
        fromBase: (v) => v * 9 / 5 + 32,
      },
      {
        id: "k", label: "Kelvin", symbol: "K",
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15,
      },
      {
        id: "r", label: "Rankine", symbol: "°R",
        toBase: (v) => (v - 491.67) * 5 / 9,
        fromBase: (v) => (v + 273.15) * 9 / 5,
      },
    ],
  },
  {
    id: "area", label: "Area", icon: "▭",
    units: [
      { id: "mm2", label: "mm²", symbol: "mm²", ...lin(1e-6) },
      { id: "cm2", label: "cm²", symbol: "cm²", ...lin(1e-4) },
      { id: "m2", label: "m²", symbol: "m²", ...lin(1) },
      { id: "km2", label: "km²", symbol: "km²", ...lin(1e6) },
      { id: "ha", label: "Hectare", symbol: "ha", ...lin(1e4) },
      { id: "ac", label: "Acre", symbol: "ac", ...lin(4046.86) },
      { id: "ft2", label: "ft²", symbol: "ft²", ...lin(0.092903) },
      { id: "yd2", label: "yd²", symbol: "yd²", ...lin(0.836127) },
      { id: "mi2", label: "mi²", symbol: "mi²", ...lin(2589988) },
    ],
  },
  {
    id: "volume", label: "Volume", icon: "⬡",
    units: [
      { id: "ml", label: "Millilitre", symbol: "mL", ...lin(0.001) },
      { id: "l", label: "Litre", symbol: "L", ...lin(1) },
      { id: "m3", label: "Cubic Metre", symbol: "m³", ...lin(1000) },
      { id: "tsp", label: "Teaspoon (US)", symbol: "tsp", ...lin(0.00492892) },
      { id: "tbsp", label: "Tablespoon (US)", symbol: "tbsp", ...lin(0.0147868) },
      { id: "floz", label: "Fl. oz (US)", symbol: "fl oz", ...lin(0.0295735) },
      { id: "cup", label: "Cup (US)", symbol: "cup", ...lin(0.236588) },
      { id: "pt", label: "Pint (US)", symbol: "pt", ...lin(0.473176) },
      { id: "qt", label: "Quart (US)", symbol: "qt", ...lin(0.946353) },
      { id: "gal", label: "Gallon (US)", symbol: "gal", ...lin(3.78541) },
    ],
  },
  {
    id: "speed", label: "Speed", icon: "⚡",
    units: [
      { id: "mps", label: "Metres/sec", symbol: "m/s", ...lin(1) },
      { id: "kmh", label: "Km/hour", symbol: "km/h", ...lin(1 / 3.6) },
      { id: "mph", label: "Miles/hour", symbol: "mph", ...lin(0.44704) },
      { id: "kn", label: "Knot", symbol: "kn", ...lin(0.514444) },
      { id: "fps", label: "Feet/sec", symbol: "ft/s", ...lin(0.3048) },
      { id: "mach", label: "Mach (sea level)", symbol: "M", ...lin(340.29) },
    ],
  },
  {
    id: "data", label: "Data", icon: "💾",
    units: [
      { id: "bit", label: "Bit", symbol: "bit", ...lin(0.125) },
      { id: "byte", label: "Byte", symbol: "B", ...lin(1) },
      { id: "kb", label: "Kilobyte", symbol: "KB", ...lin(1024) },
      { id: "mb", label: "Megabyte", symbol: "MB", ...lin(1024 ** 2) },
      { id: "gb", label: "Gigabyte", symbol: "GB", ...lin(1024 ** 3) },
      { id: "tb", label: "Terabyte", symbol: "TB", ...lin(1024 ** 4) },
      { id: "pb", label: "Petabyte", symbol: "PB", ...lin(1024 ** 5) },
      { id: "kbit", label: "Kilobit", symbol: "Kbit", ...lin(125) },
      { id: "mbit", label: "Megabit", symbol: "Mbit", ...lin(125000) },
      { id: "gbit", label: "Gigabit", symbol: "Gbit", ...lin(1.25e8) },
    ],
  },
  {
    id: "time", label: "Time", icon: "⏱",
    units: [
      { id: "ns", label: "Nanosecond", symbol: "ns", ...lin(1e-9) },
      { id: "ms", label: "Millisecond", symbol: "ms", ...lin(0.001) },
      { id: "s", label: "Second", symbol: "s", ...lin(1) },
      { id: "min", label: "Minute", symbol: "min", ...lin(60) },
      { id: "h", label: "Hour", symbol: "h", ...lin(3600) },
      { id: "d", label: "Day", symbol: "d", ...lin(86400) },
      { id: "wk", label: "Week", symbol: "wk", ...lin(604800) },
      { id: "mo", label: "Month (avg)", symbol: "mo", ...lin(2629800) },
      { id: "yr", label: "Year", symbol: "yr", ...lin(31557600) },
    ],
  },
];

// ── Formatting ─────────────────────────────────────────────────────────────

function fmt(v: number): string {
  if (!isFinite(v)) return "—";
  if (v === 0) return "0";
  const abs = Math.abs(v);
  if (abs >= 1e15 || (abs < 1e-6 && abs > 0)) return v.toExponential(6).replace(/\.?0+e/, "e");
  if (abs >= 1e9) return v.toLocaleString(undefined, { maximumSignificantDigits: 8 });
  if (abs >= 1) return parseFloat(v.toPrecision(8)).toString();
  return parseFloat(v.toPrecision(6)).toString();
}

// ── Row ────────────────────────────────────────────────────────────────────

function UnitRow({
  unit, value, isSource, onClick, id,
}: { unit: Unit; value: number | null; isSource: boolean; onClick: () => void; id: string }) {
  const [copied, setCopied] = React.useState(false);
  const display = value !== null ? fmt(value) : "";

  async function copy(e: React.MouseEvent) {
    e.stopPropagation();
    if (!display) return;
    await navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      id={id}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-all",
        isSource
          ? "border-primary/60 bg-primary/5"
          : "border-border/60 bg-card hover:border-primary/30 hover:bg-secondary/20"
      )}
    >
      <div className="w-10 text-right shrink-0">
        <span className="text-[10px] font-mono text-muted-foreground">{unit.symbol}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-mono text-sm truncate", isSource ? "text-primary font-semibold" : "text-foreground")}>
          {display || <span className="text-muted-foreground">—</span>}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">{unit.label}</p>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={copy}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary shrink-0"
            aria-label={`Copy ${unit.label} value`}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent>Copy value</TooltipContent>
      </Tooltip>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

export function UnitConverterTool() {
  const [activeCat, setActiveCat] = React.useState("length");
  const [sourceUnit, setSourceUnit] = React.useState("m");
  const [inputVal, setInputVal] = React.useState("1");
  const [filter, setFilter] = React.useState("");

  const category = CATEGORIES.find((c) => c.id === activeCat)!;

  // When category changes, reset to first unit
  React.useEffect(() => {
    setSourceUnit(category.units[0].id);
    setFilter("");
  }, [activeCat, category.units]);

  const source = category.units.find((u) => u.id === sourceUnit)!;

  const baseValue = React.useMemo(() => {
    const n = parseFloat(inputVal);
    if (isNaN(n)) return null;
    return source.toBase(n);
  }, [inputVal, source]);

  const filteredUnits = React.useMemo(() => {
    if (!filter.trim()) return category.units;
    const q = filter.toLowerCase();
    return category.units.filter((u) => u.label.toLowerCase().includes(q) || u.symbol.toLowerCase().includes(q));
  }, [category.units, filter]);

  function selectUnit(id: string) {
    // When clicking a unit, convert current display value and make it the source
    const targetUnit = category.units.find((u) => u.id === id)!;
    if (baseValue !== null) {
      const converted = targetUnit.fromBase(baseValue);
      setInputVal(fmt(converted));
    }
    setSourceUnit(id);
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Category tabs (horizontal scroll on mobile) */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            id={`cat-${cat.id}`}
            onClick={() => setActiveCat(cat.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors shrink-0",
              activeCat === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3">
        <input
          id="unit-value-input"
          type="number"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          className="flex-1 bg-transparent font-mono text-xl text-foreground placeholder:text-muted-foreground focus:outline-none"
          placeholder="0"
          autoFocus
        />
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-primary">{source.symbol}</p>
          <p className="text-[10px] text-muted-foreground">{source.label}</p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Click any unit below to set it as the source. Results update instantly.
      </p>

      {/* Filter */}
      {category.units.length > 6 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            id="unit-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter units…"
            className="pl-8 text-sm h-9"
          />
        </div>
      )}

      {/* Unit list */}
      <div className="grid gap-1.5 grid-cols-1 sm:grid-cols-2">
        {filteredUnits.map((unit) => {
          const converted = baseValue !== null ? unit.fromBase(baseValue) : null;
          return (
            <UnitRow
              key={unit.id}
              id={`unit-row-${unit.id}`}
              unit={unit}
              value={converted}
              isSource={unit.id === sourceUnit}
              onClick={() => selectUnit(unit.id)}
            />
          );
        })}
      </div>

      {filteredUnits.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No units match &ldquo;{filter}&rdquo;</p>
      )}
    </div>
  );
}
