"use client";

import * as React from "react";
import { Download, Copy, Check, RotateCcw, ImagePlus, X, AlertTriangle, Info, Square, Grid2x2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { downloadText, downloadBlob } from "@/lib/utils/download";
import { cn } from "@/lib/utils";
import {
  buildMatrix,
  renderToCanvas,
  renderToSvg,
  contrastRatio,
  type ECL,
  type ModuleStyle,
  type RenderOptions,
} from "./renderer";

const ECL_LABELS: Record<ECL, string> = {
  L: "Low · 7%",
  M: "Medium · 15%",
  Q: "Quartile · 25%",
  H: "High · 30%",
};

// ── Content builders ────────────────────────────────────────────────────────
interface URLData { url: string }
interface TextData { text: string }
interface EmailData { to: string; subject: string; body: string }
interface PhoneData { phone: string }
interface SMSData { phone: string; message: string }
interface WifiData { ssid: string; password: string; security: "WPA" | "WEP" | "nopass"; hidden: boolean }
interface VCardData { name: string; phone: string; email: string; org: string; url: string; note: string }

function buildURL(d: URLData) { return d.url.trim(); }
function buildText(d: TextData) { return d.text; }
function buildEmail(d: EmailData) {
  let s = `mailto:${d.to}`;
  const params = [];
  if (d.subject) params.push(`subject=${encodeURIComponent(d.subject)}`);
  if (d.body) params.push(`body=${encodeURIComponent(d.body)}`);
  if (params.length) s += "?" + params.join("&");
  return s;
}
function buildPhone(d: PhoneData) { return `tel:${d.phone.replace(/\s/g, "")}`; }
function buildSMS(d: SMSData) { return `sms:${d.phone}${d.message ? `?body=${encodeURIComponent(d.message)}` : ""}`; }
function buildWifi(d: WifiData) {
  const esc = (v: string) => v.replace(/[\\;,":]/g, (c) => `\\${c}`);
  return `WIFI:S:${esc(d.ssid)};T:${d.security};P:${esc(d.password)};H:${d.hidden ? "true" : "false"};;`;
}
function buildVCard(d: VCardData) {
  return [
    "BEGIN:VCARD", "VERSION:3.0",
    d.name && `FN:${d.name}`,
    d.phone && `TEL:${d.phone}`,
    d.email && `EMAIL:${d.email}`,
    d.org && `ORG:${d.org}`,
    d.url && `URL:${d.url}`,
    d.note && `NOTE:${d.note}`,
    "END:VCARD",
  ].filter(Boolean).join("\n");
}

function Field({ label, id, type = "text", value, onChange, placeholder, className }: {
  label: string; id: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium" htmlFor={id}>{label}</label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="text-sm" />
    </div>
  );
}

type TabType = "url" | "text" | "email" | "phone" | "sms" | "wifi" | "vcard";

const STYLE_OPTIONS: { value: ModuleStyle; label: string; icon: React.ElementType }[] = [
  { value: "square", label: "Square", icon: Square },
  { value: "rounded", label: "Rounded", icon: Grid2x2 },
  { value: "dots", label: "Dots", icon: Circle },
];

interface Preset { name: string; fg: string; grad: string | null; bg: string }
const PRESETS: Preset[] = [
  { name: "Classic", fg: "#000000", grad: null, bg: "#ffffff" },
  { name: "Midnight", fg: "#0f172a", grad: null, bg: "#ffffff" },
  { name: "Ocean", fg: "#2563eb", grad: "#06b6d4", bg: "#ffffff" },
  { name: "Sunset", fg: "#db2777", grad: "#f59e0b", bg: "#ffffff" },
  { name: "Forest", fg: "#166534", grad: "#65a30d", bg: "#ffffff" },
  { name: "Grape", fg: "#7c3aed", grad: "#db2777", bg: "#ffffff" },
];

const relLum = (hex: string) => {
  const h = hex.replace("#", "");
  const c = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  const r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255;
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

export function QrCodeTool() {
  const [activeType, setActiveType] = React.useState<TabType>("url");

  const [urlData, setUrlData] = React.useState<URLData>({ url: "" });
  const [textData, setTextData] = React.useState<TextData>({ text: "" });
  const [emailData, setEmailData] = React.useState<EmailData>({ to: "", subject: "", body: "" });
  const [phoneData, setPhoneData] = React.useState<PhoneData>({ phone: "" });
  const [smsData, setSmsData] = React.useState<SMSData>({ phone: "", message: "" });
  const [wifiData, setWifiData] = React.useState<WifiData>({ ssid: "", password: "", security: "WPA", hidden: false });
  const [vcardData, setVcardData] = React.useState<VCardData>({ name: "", phone: "", email: "", org: "", url: "", note: "" });

  // QR appearance
  const [size, setSize] = React.useState(512);
  const [ecl, setEcl] = React.useState<ECL>("M");
  const [moduleStyle, setModuleStyle] = React.useState<ModuleStyle>("square");
  const [fgColor, setFgColor] = React.useState("#000000");
  const [gradientOn, setGradientOn] = React.useState(false);
  const [gradColor, setGradColor] = React.useState("#2563eb");
  const [gradAngle, setGradAngle] = React.useState(45);
  const [bgColor, setBgColor] = React.useState("#ffffff");
  const [transparent, setTransparent] = React.useState(false);
  const [margin, setMargin] = React.useState(4);
  const [logoDataUrl, setLogoDataUrl] = React.useState<string | null>(null);
  const [logoScale, setLogoScale] = React.useState(22); // %

  // Output state
  const [svgStr, setSvgStr] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);
  const [copiedPng, setCopiedPng] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const logoImgRef = React.useRef<HTMLImageElement | null>(null);
  const logoFileRef = React.useRef<HTMLInputElement>(null);

  const content = React.useMemo((): string => {
    try {
      switch (activeType) {
        case "url": return buildURL(urlData);
        case "text": return buildText(textData);
        case "email": return buildEmail(emailData);
        case "phone": return buildPhone(phoneData);
        case "sms": return buildSMS(smsData);
        case "wifi": return buildWifi(wifiData);
        case "vcard": return buildVCard(vcardData);
      }
    } catch { return ""; }
  }, [activeType, urlData, textData, emailData, phoneData, smsData, wifiData, vcardData]);

  const opts: RenderOptions = React.useMemo(() => ({
    size,
    margin,
    moduleStyle,
    fg: fgColor,
    fgGradient: gradientOn ? gradColor : null,
    gradientAngle: gradAngle,
    bg: bgColor,
    transparent,
    logoDataUrl,
    logoScale: logoScale / 100,
  }), [size, margin, moduleStyle, fgColor, gradientOn, gradColor, gradAngle, bgColor, transparent, logoDataUrl, logoScale]);

  // Render whenever content or appearance changes
  React.useEffect(() => {
    if (!content.trim()) {
      setReady(false);
      setSvgStr(null);
      setError(null);
      return;
    }
    try {
      const matrix = buildMatrix(content, ecl);
      if (canvasRef.current) renderToCanvas(canvasRef.current, matrix, opts, logoImgRef.current);
      setSvgStr(renderToSvg(matrix, opts));
      setReady(true);
      setError(null);
    } catch (e) {
      const msg = (e as Error).message || "";
      setError(/overflow|too (big|long)|capacity/i.test(msg) ? "Too much data for one QR code. Shorten the content or lower the error-correction level." : msg);
      setReady(false);
    }
  }, [content, ecl, opts]);

  function onLogoSelect(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        logoImgRef.current = img;
        setLogoDataUrl(dataUrl);
        setEcl("H"); // logos cover modules — max error correction keeps it scannable
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    logoImgRef.current = null;
    setLogoDataUrl(null);
  }

  function applyPreset(p: Preset) {
    setFgColor(p.fg);
    setBgColor(p.bg);
    setTransparent(false);
    if (p.grad) { setGradientOn(true); setGradColor(p.grad); }
    else setGradientOn(false);
  }

  async function handleDownloadPng() {
    if (!canvasRef.current || !ready) return;
    canvasRef.current.toBlob((blob) => { if (blob) downloadBlob(blob, "qrcode.png"); }, "image/png");
  }
  function handleDownloadSvg() {
    if (!svgStr) return;
    downloadText(svgStr, "qrcode.svg", "image/svg+xml");
  }
  async function handleCopyPng() {
    if (!canvasRef.current || !ready) return;
    try {
      const blob: Blob | null = await new Promise((res) => canvasRef.current!.toBlob(res, "image/png"));
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopiedPng(true);
      setTimeout(() => setCopiedPng(false), 1500);
    } catch { /* unsupported */ }
  }

  function handleReset() {
    setUrlData({ url: "" }); setTextData({ text: "" });
    setEmailData({ to: "", subject: "", body: "" }); setPhoneData({ phone: "" });
    setSmsData({ phone: "", message: "" });
    setWifiData({ ssid: "", password: "", security: "WPA", hidden: false });
    setVcardData({ name: "", phone: "", email: "", org: "", url: "", note: "" });
    removeLogo();
  }

  // Scannability diagnostics
  const contrast = contrastRatio(fgColor, transparent ? "#ffffff" : bgColor);
  const inverted = relLum(fgColor) > relLum(transparent ? "#ffffff" : bgColor);
  const warnings: string[] = [];
  if (inverted) warnings.push("Foreground is lighter than the background — many scanners only read dark-on-light. Consider swapping the colours.");
  if (!inverted && contrast < 3) warnings.push("Low contrast between foreground and background may prevent scanning.");
  if (logoDataUrl && logoScale > 30) warnings.push("Logo is large — keep it under ~30% of the code so enough data remains readable.");
  if (logoDataUrl && ecl !== "H") warnings.push("Use High error correction with a logo for reliable scanning.");
  const charCount = content.length;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: inputs */}
      <div className="flex-1 space-y-5 min-w-0">
        <Tabs value={activeType} onValueChange={(v) => setActiveType(v as TabType)} id="qr-type-tabs">
          <TabsList className="flex-wrap h-auto gap-1">
            {(["url", "text", "email", "phone", "sms", "wifi", "vcard"] as TabType[]).map((t) => (
              <TabsTrigger key={t} value={t} id={`qr-tab-${t}`} className="capitalize">{t === "vcard" ? "vCard" : t}</TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-4 space-y-3">
            <TabsContent value="url">
              <Field label="URL" id="qr-url" type="url" value={urlData.url} onChange={(v) => setUrlData({ url: v })} placeholder="https://example.com" />
            </TabsContent>
            <TabsContent value="text">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Text</label>
                <textarea id="qr-text" value={textData.text} onChange={(e) => setTextData({ text: e.target.value })}
                  placeholder="Enter any text…"
                  className="w-full h-28 rounded-md border border-input bg-background px-3 py-2 text-sm font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>
            </TabsContent>
            <TabsContent value="email" className="space-y-3">
              <Field label="To" id="qr-email-to" type="email" value={emailData.to} onChange={(v) => setEmailData((p) => ({ ...p, to: v }))} placeholder="user@example.com" />
              <Field label="Subject" id="qr-email-subject" value={emailData.subject} onChange={(v) => setEmailData((p) => ({ ...p, subject: v }))} placeholder="Hello…" />
              <Field label="Body" id="qr-email-body" value={emailData.body} onChange={(v) => setEmailData((p) => ({ ...p, body: v }))} placeholder="Message…" />
            </TabsContent>
            <TabsContent value="phone">
              <Field label="Phone number" id="qr-phone" type="tel" value={phoneData.phone} onChange={(v) => setPhoneData({ phone: v })} placeholder="+1 555 000 0000" />
            </TabsContent>
            <TabsContent value="sms" className="space-y-3">
              <Field label="Phone number" id="qr-sms-phone" type="tel" value={smsData.phone} onChange={(v) => setSmsData((p) => ({ ...p, phone: v }))} placeholder="+1 555 000 0000" />
              <Field label="Message (optional)" id="qr-sms-msg" value={smsData.message} onChange={(v) => setSmsData((p) => ({ ...p, message: v }))} placeholder="Hi there!" />
            </TabsContent>
            <TabsContent value="wifi" className="space-y-3">
              <Field label="Network name (SSID)" id="qr-wifi-ssid" value={wifiData.ssid} onChange={(v) => setWifiData((p) => ({ ...p, ssid: v }))} placeholder="MyWiFiNetwork" />
              <Field label="Password" id="qr-wifi-pwd" type="password" value={wifiData.password} onChange={(v) => setWifiData((p) => ({ ...p, password: v }))} placeholder="••••••••" />
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Security</label>
                <Select value={wifiData.security} onValueChange={(v) => setWifiData((p) => ({ ...p, security: v as "WPA" | "WEP" | "nopass" }))}>
                  <SelectTrigger id="qr-wifi-security" className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WPA">WPA/WPA2</SelectItem>
                    <SelectItem value="WEP">WEP</SelectItem>
                    <SelectItem value="nopass">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={wifiData.hidden} onChange={(e) => setWifiData((p) => ({ ...p, hidden: e.target.checked }))} className="rounded" id="qr-wifi-hidden" />
                Hidden network
              </label>
            </TabsContent>
            <TabsContent value="vcard" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full name" id="qr-vcard-name" value={vcardData.name} onChange={(v) => setVcardData((p) => ({ ...p, name: v }))} placeholder="Jane Doe" className="col-span-2" />
                <Field label="Phone" id="qr-vcard-phone" type="tel" value={vcardData.phone} onChange={(v) => setVcardData((p) => ({ ...p, phone: v }))} placeholder="+1 555…" />
                <Field label="Email" id="qr-vcard-email" type="email" value={vcardData.email} onChange={(v) => setVcardData((p) => ({ ...p, email: v }))} placeholder="jane@…" />
                <Field label="Organisation" id="qr-vcard-org" value={vcardData.org} onChange={(v) => setVcardData((p) => ({ ...p, org: v }))} placeholder="Acme Inc." />
                <Field label="Website" id="qr-vcard-url" type="url" value={vcardData.url} onChange={(v) => setVcardData((p) => ({ ...p, url: v }))} placeholder="https://…" />
                <Field label="Note" id="qr-vcard-note" value={vcardData.note} onChange={(v) => setVcardData((p) => ({ ...p, note: v }))} placeholder="Optional note…" className="col-span-2" />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Style */}
        <div className="rounded-lg border border-border/60 bg-card px-4 py-4 space-y-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Style</span>

          {/* Module shape */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Module shape</label>
            <div className="flex gap-1.5">
              {STYLE_OPTIONS.map((s) => (
                <button key={s.value} id={`qr-style-${s.value}`} onClick={() => setModuleStyle(s.value)}
                  className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                    moduleStyle === s.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80")}>
                  <s.icon className="h-3.5 w-3.5" />{s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color presets */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Presets</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Tooltip key={p.name}>
                  <TooltipTrigger asChild>
                    <button onClick={() => applyPreset(p)} aria-label={p.name}
                      className="h-7 w-7 rounded-md border border-border shadow-sm transition-transform hover:scale-110"
                      style={{ background: p.grad ? `linear-gradient(135deg, ${p.fg}, ${p.grad})` : p.fg }} />
                  </TooltipTrigger>
                  <TooltipContent>{p.name}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Foreground</label>
              <div className="flex items-center gap-2">
                <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} id="qr-fg-color" className="h-9 w-9 rounded cursor-pointer border border-border" />
                {gradientOn && (
                  <>
                    <span className="text-muted-foreground text-xs">→</span>
                    <input type="color" value={gradColor} onChange={(e) => setGradColor(e.target.value)} id="qr-grad-color" className="h-9 w-9 rounded cursor-pointer border border-border" />
                  </>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Background</label>
              <div className="flex items-center gap-2">
                <input type="color" value={bgColor} disabled={transparent} onChange={(e) => setBgColor(e.target.value)} id="qr-bg-color"
                  className={cn("h-9 w-9 rounded cursor-pointer border border-border", transparent && "opacity-40 cursor-not-allowed")} />
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                  <Switch checked={transparent} onCheckedChange={setTransparent} id="qr-transparent" /> Transparent
                </label>
              </div>
            </div>
          </div>

          {/* Gradient toggle + angle */}
          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <Switch checked={gradientOn} onCheckedChange={setGradientOn} id="qr-gradient" />
              <span className="text-muted-foreground">Gradient foreground</span>
            </label>
            {gradientOn && (
              <div className="flex items-center gap-2 flex-1 max-w-[180px]">
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{gradAngle}°</span>
                <Slider min={0} max={360} step={15} value={[gradAngle]} onValueChange={([v]) => setGradAngle(v)} id="qr-grad-angle" />
              </div>
            )}
          </div>

          {/* Logo */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Center logo</label>
            {!logoDataUrl ? (
              <button onClick={() => logoFileRef.current?.click()} id="qr-logo-btn"
                className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border/60 py-2.5 text-xs text-muted-foreground hover:border-primary/40 transition-colors">
                <ImagePlus className="h-4 w-4" /> Add logo (PNG/SVG)
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoDataUrl} alt="logo" className="h-9 w-9 rounded border border-border object-contain bg-white" />
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">Size {logoScale}%</span>
                    <Slider min={12} max={35} step={1} value={[logoScale]} onValueChange={([v]) => setLogoScale(v)} id="qr-logo-size" />
                  </div>
                  <button onClick={removeLogo} aria-label="Remove logo" className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                </div>
              </div>
            )}
            <input ref={logoFileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) onLogoSelect(f); e.target.value = ""; }} />
          </div>

          {/* Size / quiet zone / ECL */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5">Export size
                <Tooltip><TooltipTrigger asChild><button aria-label="About size" className="text-muted-foreground/60 hover:text-foreground"><Info className="h-3 w-3" /></button></TooltipTrigger>
                  <TooltipContent>Pixel size of the PNG. SVG is resolution-independent.</TooltipContent></Tooltip>
              </span>
              <span className="font-mono text-primary">{size}px</span>
            </div>
            <Slider id="qr-size" min={128} max={2048} step={64} value={[size]} onValueChange={([v]) => setSize(v)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">Quiet zone
                <Tooltip><TooltipTrigger asChild><button aria-label="About quiet zone" className="text-muted-foreground/60 hover:text-foreground"><Info className="h-3 w-3" /></button></TooltipTrigger>
                  <TooltipContent className="max-w-[200px] text-center">The blank margin around the code. The spec recommends at least 4 modules so scanners can find it.</TooltipContent></Tooltip>
              </label>
              <div className="flex items-center gap-2">
                <Slider min={0} max={8} step={1} value={[margin]} onValueChange={([v]) => setMargin(v)} id="qr-margin" />
                <span className="text-xs font-mono text-muted-foreground w-4">{margin}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">Error correction
                <Tooltip><TooltipTrigger asChild><button aria-label="About error correction" className="text-muted-foreground/60 hover:text-foreground"><Info className="h-3 w-3" /></button></TooltipTrigger>
                  <TooltipContent className="max-w-[220px] text-center">Higher levels let the code still scan when partly damaged or covered by a logo — at the cost of denser modules.</TooltipContent></Tooltip>
              </label>
              <Select value={ecl} onValueChange={(v) => setEcl(v as ECL)}>
                <SelectTrigger id="qr-ecl" className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["L", "M", "Q", "H"] as ECL[]).map((l) => <SelectItem key={l} value={l}>{ECL_LABELS[l]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="lg:w-72 space-y-4">
        <div className="sticky top-20 space-y-3">
          <div className="rounded-lg border border-border/60 bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preview</span>
              {ready && content && <span className="text-[10px] font-mono text-muted-foreground">{charCount} chars</span>}
            </div>

            {/* checkerboard shows transparency */}
            <div
              className="rounded-lg flex items-center justify-center aspect-square w-full overflow-hidden border border-border/40"
              style={transparent
                ? { backgroundImage: "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)", backgroundSize: "16px 16px", backgroundPosition: "0 0,0 8px,8px -8px,-8px 0", backgroundColor: "#fff" }
                : { backgroundColor: bgColor }}
              id="qr-preview"
            >
              <canvas ref={canvasRef} className={cn("w-full h-full object-contain", !ready && "hidden")} />
              {!ready && (
                <p className="text-xs text-muted-foreground text-center px-4">
                  {error ? <span className="text-destructive text-[11px]">{error}</span> : "Fill in the fields to generate a QR code."}
                </p>
              )}
            </div>

            {/* Scannability status */}
            {ready && (
              warnings.length === 0 ? (
                <div className="flex items-center gap-1.5 text-[11px] text-green-500">
                  <Check className="h-3.5 w-3.5" /> Looks scannable
                </div>
              ) : (
                <div className="space-y-1">
                  {warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-amber-500">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" /> <span>{w}</span>
                    </div>
                  ))}
                </div>
              )
            )}

            {ready && (
              <div className="space-y-2">
                <Button className="w-full" onClick={handleDownloadPng} id="qr-download-png">
                  <Download className="h-4 w-4" /> Download PNG
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleDownloadSvg} id="qr-download-svg">
                    <Download className="h-4 w-4" /> SVG
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleCopyPng} id="qr-copy-png">
                    {copiedPng ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    {copiedPng ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={handleReset} id="qr-reset">
                  <RotateCcw className="h-3 w-3" /> Reset
                </Button>
              </div>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground/80 leading-relaxed text-center px-2">
            Tip: test your styled code with a real phone before printing. Always keep good contrast and a quiet zone.
          </p>
        </div>
      </div>
    </div>
  );
}
