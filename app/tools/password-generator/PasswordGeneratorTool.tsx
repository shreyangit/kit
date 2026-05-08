"use client";

import * as React from "react";
import { Copy, RefreshCw, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Options {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

function generatePassword(options: Options): string {
  let chars = "";
  if (options.uppercase)
    chars += options.excludeAmbiguous
      ? "ABCDEFGHJKMNPQRSTUVWXYZ"
      : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (options.lowercase)
    chars += options.excludeAmbiguous
      ? "abcdefghjkmnpqrstuvwxyz"
      : "abcdefghijklmnopqrstuvwxyz";
  if (options.numbers)
    chars += options.excludeAmbiguous ? "23456789" : "0123456789";
  if (options.symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
  if (!chars) chars = "abcdefghijklmnopqrstuvwxyz";

  const array = new Uint32Array(options.length);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => chars[n % chars.length]).join("");
}

function calcEntropy(options: Options): number {
  let poolSize = 0;
  if (options.uppercase) poolSize += options.excludeAmbiguous ? 23 : 26;
  if (options.lowercase) poolSize += options.excludeAmbiguous ? 23 : 26;
  if (options.numbers) poolSize += options.excludeAmbiguous ? 8 : 10;
  if (options.symbols) poolSize += 29;
  if (poolSize === 0) return 0;
  return Math.round(options.length * Math.log2(poolSize));
}

function strengthFromEntropy(bits: number): {
  label: string;
  color: string;
  width: string;
} {
  if (bits >= 128) return { label: "Very Strong", color: "bg-green-500", width: "w-full" };
  if (bits >= 80) return { label: "Strong", color: "bg-green-400", width: "w-4/5" };
  if (bits >= 56) return { label: "Good", color: "bg-yellow-500", width: "w-3/5" };
  if (bits >= 36) return { label: "Weak", color: "bg-orange-500", width: "w-2/5" };
  return { label: "Very Weak", color: "bg-red-500", width: "w-1/5" };
}

const TOGGLE_OPTIONS = [
  { key: "uppercase" as const, label: "A–Z", description: "Uppercase letters" },
  { key: "lowercase" as const, label: "a–z", description: "Lowercase letters" },
  { key: "numbers" as const, label: "0–9", description: "Numbers" },
  { key: "symbols" as const, label: "#!@", description: "Symbols" },
];

export function PasswordGeneratorTool() {
  const [options, setOptions] = React.useState<Options>({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
  });
  const [passwords, setPasswords] = React.useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = React.useState<number | null>(null);

  function generate(count = 1) {
    const newPws = Array.from({ length: count }, () => generatePassword(options));
    setPasswords(newPws);
  }

  React.useEffect(() => {
    generate(1);
  }, []);

  React.useEffect(() => {
    generate(passwords.length || 1);
  }, [options]);

  const entropy = calcEntropy(options);
  const strength = strengthFromEntropy(entropy);
  const allOff = !options.uppercase && !options.lowercase && !options.numbers && !options.symbols;

  async function handleCopy(pw: string, idx: number) {
    await navigator.clipboard.writeText(pw);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  function setOpt<K extends keyof Options>(key: K, val: Options[K]) {
    setOptions((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {allOff && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-600 dark:text-amber-400">
          All character sets are off. Lowercase letters are used as fallback. Turn at least one on.
        </div>
      )}
      {/* Strength display */}
      <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-semibold ${strength.color.replace("bg-", "text-")}`}>
            {strength.label}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {entropy} bits entropy
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", strength.color, strength.width)}
          />
        </div>
      </div>

      {/* Generated passwords */}
      <div className="space-y-2">
        {passwords.map((pw, idx) => (
          <div
            key={idx}
            className="group flex items-center gap-3 rounded-md border border-border/60 bg-card px-4 py-3 hover:border-primary/40 transition-colors"
          >
            <p
              className="flex-1 font-mono text-sm text-foreground tracking-wider min-w-0 break-all"
              id={`password-${idx}`}
            >
              {pw}
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleCopy(pw, idx)}
                  id={`copy-pw-${idx}`}
                >
                  {copiedIdx === idx ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy</TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => generate(passwords.length)} id="pw-regenerate-btn">
          <RefreshCw className="h-4 w-4" />
          Regenerate
        </Button>
        <Button
          variant="outline"
          onClick={() => setPasswords((prev) => [...prev, generatePassword(options)])}
          id="pw-add-btn"
          disabled={passwords.length >= 10}
        >
          <Plus className="h-4 w-4" />
          Add one
        </Button>
        {passwords.length > 1 && (
          <Button
            variant="ghost"
            onClick={() => setPasswords([generatePassword(options)])}
            id="pw-clear-extra-btn"
            className="text-muted-foreground"
          >
            <Trash2 className="h-4 w-4" />
            Keep one
          </Button>
        )}
      </div>

      {/* Settings */}
      <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-5">
        {/* Length */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Length</span>
            <span className="text-sm font-mono text-primary">{options.length}</span>
          </div>
          <Slider
            id="pw-length-slider"
            min={8}
            max={64}
            step={1}
            value={[options.length]}
            onValueChange={([v]) => setOpt("length", v)}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>8</span>
            <span>64</span>
          </div>
        </div>

        {/* Character set toggles */}
        <div className="grid grid-cols-2 gap-3">
          {TOGGLE_OPTIONS.map(({ key, label, description }) => (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono">{label}</span>
                  <Switch
                    id={`pw-toggle-${key}`}
                    checked={options[key]}
                    onCheckedChange={(v) => setOpt(key, v)}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>{description}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Exclude ambiguous */}
        <div className="flex items-center justify-between border-t border-border/60 pt-4">
          <Tooltip>
            <TooltipTrigger>
              <span className="text-sm cursor-help">
                Exclude ambiguous
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Removes characters that look similar: 0, O, l, 1, I
            </TooltipContent>
          </Tooltip>
          <Switch
            id="pw-exclude-ambiguous"
            checked={options.excludeAmbiguous}
            onCheckedChange={(v) => setOpt("excludeAmbiguous", v)}
          />
        </div>
      </div>
    </div>
  );
}
