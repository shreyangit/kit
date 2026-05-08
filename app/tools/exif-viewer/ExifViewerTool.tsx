"use client";

import * as React from "react";
import { ShieldAlert, Download, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadBlob } from "@/lib/utils/download";
import { cn } from "@/lib/utils";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatVal(k: string, v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (k.includes("Time") || k.includes("Date") || v instanceof Date) {
    try { return new Date(v as string).toLocaleString(); } catch { return String(v); }
  }
  if (k === "ExposureTime" && typeof v === "number") return `1/${Math.round(1 / v)}s`;
  if (k === "FNumber" && typeof v === "number") return `f/${v}`;
  if (k === "FocalLength" && typeof v === "number") return `${v}mm`;
  if (k === "ISO" && typeof v === "number") return String(v);
  if (typeof v === "number") return v.toFixed(v % 1 !== 0 ? 4 : 0);
  return String(v);
}

const GROUPS: { label: string; keys: string[]; icon: string }[] = [
  { label: "Camera", icon: "📷", keys: ["Make", "Model", "LensModel", "FNumber", "ExposureTime", "ISO", "FocalLength", "Flash", "ExposureMode", "WhiteBalance", "MeteringMode"] },
  { label: "Image", icon: "🖼️", keys: ["ImageWidth", "ImageHeight", "ColorSpace", "Orientation", "BitsPerSample", "Compression"] },
  { label: "Date & Time", icon: "📅", keys: ["DateTimeOriginal", "DateTime", "DateTimeDigitized", "OffsetTimeOriginal"] },
  { label: "GPS", icon: "📍", keys: ["latitude", "longitude", "GPSAltitude", "GPSSpeed", "GPSImgDirection"] },
  { label: "Copyright", icon: "©", keys: ["Artist", "Copyright", "Software", "HostComputer", "ProcessingSoftware"] },
];

export function ExifViewerTool() {
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [exif, setExif] = React.useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [tab, setTab] = React.useState<"view" | "remove">("view");
  const [strippedBlob, setStrippedBlob] = React.useState<Blob | null>(null);
  const [stripping, setStripping] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }; }, [previewUrl]);

  async function handleFile(f: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f); setPreviewUrl(URL.createObjectURL(f));
    setExif(null); setStrippedBlob(null); setLoading(true);
    try {
      const exifr = await import("exifr");
      const data = await exifr.parse(f, { exif: true, gps: true, iptc: true, xmp: true, icc: false, translateKeys: true, translateValues: true, reviveValues: true });
      setExif(data ?? {});
    } catch { setExif({}); }
    finally { setLoading(false); }
  }

  async function stripMetadata() {
    if (!file) return;
    setStripping(true);
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = url; });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      await new Promise<void>(res => {
        canvas.toBlob(blob => { if (blob) setStrippedBlob(blob); res(); },
          file.type === "image/jpeg" ? "image/jpeg" : "image/png", 0.95);
      });
    } finally { setStripping(false); }
  }

  const hasGps = exif && (exif.latitude !== undefined || exif.longitude !== undefined);
  const lat = exif?.latitude as number | undefined;
  const lon = exif?.longitude as number | undefined;

  const allKeys = exif ? Object.keys(exif) : [];
  const groupedKeys = GROUPS.flatMap(g => g.keys);
  const extraKeys = allKeys.filter(k => !groupedKeys.includes(k) && k !== "undefined");

  function reset() { if (previewUrl) URL.revokeObjectURL(previewUrl); setFile(null); setPreviewUrl(null); setExif(null); setStrippedBlob(null); }

  return (
    <div className="space-y-5 max-w-3xl">
      {!file ? (
        <button onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="w-full rounded-lg border-2 border-dashed border-border/60 bg-secondary/10 hover:border-primary/40 hover:bg-secondary/20 transition-colors py-14 flex flex-col items-center gap-3 cursor-pointer" id="exif-dropzone">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">Drop image or tap to select</p>
            <p className="text-xs text-muted-foreground mt-0.5">JPG, JPEG, TIFF, WebP, HEIC · max 50 MB</p>
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-md border border-border/60 bg-card px-4 py-3">
          {previewUrl && <img src={previewUrl} alt="preview" className="h-10 w-10 rounded object-cover shrink-0" />}
          <span className="text-sm truncate flex-1">{file.name} · {formatSize(file.size)}</span>
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1 shrink-0"><RefreshCw className="h-3.5 w-3.5" />Change</Button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/tiff,image/webp" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="inline-block h-4 w-4 rounded-full border-2 border-border border-t-primary animate-spin" />Reading metadata…</div>}

      {exif !== null && (
        <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="view" id="exif-tab-view">View Metadata</TabsTrigger>
            <TabsTrigger value="remove" id="exif-tab-remove">Remove Metadata</TabsTrigger>
          </TabsList>

          {tab === "view" && (
            <div className="mt-4 space-y-4">
              {/* GPS Warning */}
              {hasGps && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 flex gap-3">
                  <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">This image contains your location</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Lat: {lat?.toFixed(5)}° · Lon: {lon?.toFixed(5)}° — visible to anyone who downloads this image.
                    </p>
                    {lat && lon && (
                      <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=14`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary underline mt-1 inline-block">View on OpenStreetMap →</a>
                    )}
                  </div>
                </div>
              )}

              {Object.keys(exif).length === 0 ? (
                <p className="text-sm text-muted-foreground">No metadata found. This is common for screenshots, PNGs, and stripped images.</p>
              ) : (
                GROUPS.map(g => {
                  const present = g.keys.filter(k => exif[k] !== undefined);
                  if (!present.length) return null;
                  return (
                    <div key={g.label} className="rounded-lg border border-border/60 overflow-hidden">
                      <div className="px-4 py-2.5 bg-secondary/20 border-b border-border/60">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.icon} {g.label}</span>
                      </div>
                      <div className="divide-y divide-border/40">
                        {present.map(k => (
                          <div key={k} className="flex items-start gap-4 px-4 py-2.5">
                            <span className="text-xs text-muted-foreground font-mono w-36 shrink-0 pt-0.5">{k}</span>
                            <span className={cn("text-xs break-all", k === "latitude" || k === "longitude" ? "text-destructive font-semibold" : "text-foreground")}>
                              {formatVal(k, exif[k])}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Other fields */}
              {extraKeys.length > 0 && (
                <details className="rounded-lg border border-border/60 overflow-hidden">
                  <summary className="px-4 py-2.5 bg-secondary/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer">
                    Other fields ({extraKeys.length})
                  </summary>
                  <div className="divide-y divide-border/40">
                    {extraKeys.map(k => (
                      <div key={k} className="flex items-start gap-4 px-4 py-2">
                        <span className="text-xs text-muted-foreground font-mono w-36 shrink-0">{k}</span>
                        <span className="text-xs break-all">{formatVal(k, exif[k])}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}

          {tab === "remove" && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">Strip all metadata (EXIF, GPS, IPTC, XMP) by re-encoding the image via Canvas. The output file will have no embedded metadata.</p>
              {file && (
                <div className="rounded-lg border border-border/60 bg-card px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Original: </span><span className="font-mono">{formatSize(file.size)}</span>
                    {strippedBlob && <> → <span className="font-mono text-green-500">{formatSize(strippedBlob.size)}</span>
                      <span className="text-xs text-muted-foreground ml-2">({Math.abs(Math.round((1 - strippedBlob.size / file.size) * 100))}% change)</span></>}
                  </div>
                  <div className="flex gap-2">
                    {!strippedBlob ? (
                      <Button onClick={stripMetadata} disabled={stripping} id="exif-strip">
                        {stripping ? "Processing…" : "Remove All Metadata & Download"}
                      </Button>
                    ) : (
                      <Button onClick={() => downloadBlob(strippedBlob!, file.name.replace(/(\.[^.]+)$/, "_clean$1"))} id="exif-download">
                        <Download className="h-4 w-4" />Download Clean Image
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Tabs>
      )}
    </div>
  );
}
