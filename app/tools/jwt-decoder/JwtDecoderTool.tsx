"use client";

import * as React from "react";
import { Copy, Check, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface JWTPayload {
  // Standard claims
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  // anything else
  [key: string]: unknown;
}

interface Decoded {
  header: Record<string, unknown>;
  payload: JWTPayload;
  signature: string;
  isExpired: boolean;
  isNotYetValid: boolean;
  expiresAt: Date | null;
  issuedAt: Date | null;
}

function base64UrlDecode(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "===".slice((b64.length + 3) % 4);
  return decodeURIComponent(
    atob(padded).split("").map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
  );
}

function decodeJWT(token: string): Decoded | string {
  try {
    const parts = token.trim().split(".");
    if (parts.length !== 3) return "Not a valid JWT — must have 3 parts separated by dots.";
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload: JWTPayload = JSON.parse(base64UrlDecode(parts[1]));
    const signature = parts[2];
    const now = Math.floor(Date.now() / 1000);
    return {
      header,
      payload,
      signature,
      isExpired: !!payload.exp && payload.exp < now,
      isNotYetValid: !!payload.nbf && payload.nbf > now,
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
      issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
    };
  } catch (e) {
    return `Decode failed: ${(e as Error).message}`;
  }
}

function JsonBlock({ data, id }: { data: unknown; id?: string }) {
  const [copied, setCopied] = React.useState(false);
  const str = JSON.stringify(data, null, 2);
  async function copy() { await navigator.clipboard.writeText(str); setCopied(true); setTimeout(() => setCopied(false), 1400); }
  return (
    <div className="relative group rounded-lg border border-border/60 bg-secondary/20 overflow-hidden" id={id}>
      <pre className="p-4 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all leading-relaxed max-h-48">{str}</pre>
      <button onClick={copy} aria-label="Copy" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-secondary/80">
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
    </div>
  );
}

function ClaimRow({ label, value, highlight }: { label: string; value: string; highlight?: "warn" | "ok" | "err" }) {
  const color = highlight === "ok" ? "text-green-500" : highlight === "warn" ? "text-amber-500" : highlight === "err" ? "text-destructive" : "text-foreground";
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-24 shrink-0 pt-0.5">{label}</span>
      <span className={cn("font-mono text-xs break-all", color)}>{value}</span>
    </div>
  );
}

const SAMPLE_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export function JwtDecoderTool() {
  const [input, setInput] = React.useState("");

  const decoded = React.useMemo(() => {
    if (!input.trim()) return null;
    return decodeJWT(input.trim());
  }, [input]);

  const isError = typeof decoded === "string";
  const result = typeof decoded === "object" && decoded !== null ? decoded : null;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Info banner */}
      <div className="rounded-lg border border-border/60 bg-secondary/10 px-4 py-3 text-xs text-muted-foreground flex items-start gap-2">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span>Decoding is 100% client-side. Your token never leaves your browser. <strong>Never share JWTs</strong> with online tools you don&apos;t trust.</span>
      </div>

      {/* Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Paste your JWT</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setInput(SAMPLE_JWT)} id="jwt-sample">
            Load sample
          </Button>
        </div>
        <Textarea
          id="jwt-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
          className="h-28 font-mono text-xs leading-relaxed"
          spellCheck={false}
        />
        {isError && <p className="text-xs text-destructive">{decoded}</p>}
      </div>

      {/* Token parts visual */}
      {input.trim() && !isError && (
        <div className="flex flex-wrap gap-1 text-[11px] font-mono break-all leading-relaxed">
          {input.trim().split(".").map((part, i) => (
            <span key={i} className={cn("rounded px-1", i === 0 ? "bg-rose-500/20 text-rose-400" : i === 1 ? "bg-violet-500/20 text-violet-400" : "bg-teal-500/20 text-teal-400")}>
              {part}
              {i < 2 && <span className="text-muted-foreground">.</span>}
            </span>
          ))}
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            {result.isExpired ? (
              <div className="flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" /> Expired
              </div>
            ) : result.expiresAt ? (
              <div className="flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-500">
                <ShieldCheck className="h-3.5 w-3.5" /> Valid (not expired)
              </div>
            ) : null}
            {result.isNotYetValid && (
              <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-500">
                <Clock className="h-3.5 w-3.5" /> Not yet valid (nbf)
              </div>
            )}
          </div>

          {/* Standard claims */}
          {(result.payload.sub || result.payload.iss || result.payload.aud || result.payload.exp || result.payload.iat) && (
            <div className="rounded-lg border border-border/60 bg-card px-4 py-3 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Standard Claims</p>
              {result.payload.sub && <ClaimRow label="Subject" value={String(result.payload.sub)} />}
              {result.payload.iss && <ClaimRow label="Issuer" value={String(result.payload.iss)} />}
              {result.payload.aud && <ClaimRow label="Audience" value={Array.isArray(result.payload.aud) ? result.payload.aud.join(", ") : String(result.payload.aud)} />}
              {result.issuedAt && <ClaimRow label="Issued at" value={result.issuedAt.toLocaleString()} />}
              {result.expiresAt && (
                <ClaimRow
                  label="Expires at"
                  value={result.expiresAt.toLocaleString()}
                  highlight={result.isExpired ? "err" : "ok"}
                />
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs text-rose-400 font-semibold">Header</p>
              <JsonBlock data={result.header} id="jwt-header" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-violet-400 font-semibold">Payload</p>
              <JsonBlock data={result.payload} id="jwt-payload" />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-teal-400 font-semibold">Signature <span className="text-muted-foreground font-normal text-[10px]">(not verified — browser cannot verify without the secret)</span></p>
            <div className="rounded-lg border border-border/60 bg-secondary/20 px-4 py-3">
              <p className="font-mono text-xs text-teal-400 break-all">{result.signature}</p>
            </div>
          </div>
        </div>
      )}

      {!input && (
        <div className="rounded-lg border border-dashed border-border/60 py-12 text-center">
          <p className="text-sm text-muted-foreground">Paste a JWT above to decode it instantly.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Header · Payload · Signature — all parts visualised.</p>
        </div>
      )}
    </div>
  );
}
