"use client";
import * as React from "react";
import { Upload, X, Download, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { downloadBlob } from "@/lib/utils/download";

type PageSize = "A4" | "Letter" | "A3" | "Legal" | "fit-to-image";
type Orientation = "portrait" | "landscape" | "auto";
type ImageFit = "fit" | "fill" | "stretch";

interface ImgItem { id: string; file: File; url: string; }

function fmtSize(b: number) { return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`; }

async function convertToPng(file: File): Promise<Blob> {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext("2d")!.drawImage(img, 0, 0);
      c.toBlob(b => { URL.revokeObjectURL(url); res(b!); }, "image/png");
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Invalid image")); };
    img.src = url;
  });
}

export function ImageToPdfTool() {
  const [items, setItems] = React.useState<ImgItem[]>([]);
  const [pageSize, setPageSize] = React.useState<PageSize>("A4");
  const [orientation, setOrientation] = React.useState<Orientation>("portrait");
  const [fit, setFit] = React.useState<ImageFit>("fit");
  const [margin, setMargin] = React.useState(36);
  const [status, setStatus] = React.useState<"idle" | "processing" | "done" | "error">("idle");
  const [progress, setProgress] = React.useState(0);
  const [msg, setMsg] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    const newItems: ImgItem[] = Array.from(files).map(f => ({
      id: Math.random().toString(36).slice(2), file: f, url: URL.createObjectURL(f),
    }));
    setItems(prev => [...prev, ...newItems]);
  }

  function remove(id: string) {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter(i => i.id !== id);
    });
  }

  function move(id: string, dir: -1 | 1) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  }

  async function generate() {
    if (!items.length) return;
    setStatus("processing"); setProgress(0);
    try {
      const { PDFDocument, PageSizes } = await import("pdf-lib");
      const PAGE_DIMS: Record<Exclude<PageSize, "fit-to-image">, [number, number]> = {
        A4: PageSizes.A4, A3: PageSizes.A3, Letter: PageSizes.Letter, Legal: PageSizes.Legal,
      };
      const pdfDoc = await PDFDocument.create();
      for (let i = 0; i < items.length; i++) {
        setProgress(Math.round((i / items.length) * 90));
        const { file } = items[i];
        let image;
        const isJpeg = file.type === "image/jpeg" || file.type === "image/jpg";
        const isPng = file.type === "image/png";
        if (isJpeg) image = await pdfDoc.embedJpg((new Uint8Array(await file.arrayBuffer())) as any);
        else if (isPng) image = await pdfDoc.embedPng((new Uint8Array(await file.arrayBuffer())) as any);
        else {
          const png = await convertToPng(file);
          image = await pdfDoc.embedPng((new Uint8Array(await png.arrayBuffer())) as any);
        }
        const { width: iw, height: ih } = image.size();
        let pw: number, ph: number;
        if (pageSize === "fit-to-image") { pw = iw; ph = ih; }
        else {
          const [bw, bh] = PAGE_DIMS[pageSize];
          const orient = orientation === "auto" ? (iw > ih ? "landscape" : "portrait") : orientation;
          pw = orient === "landscape" ? bh : bw;
          ph = orient === "landscape" ? bw : bh;
        }
        const page = pdfDoc.addPage([pw, ph]);
        const m = pageSize === "fit-to-image" ? 0 : margin;
        const aw = pw - m * 2, ah = ph - m * 2;
        let dw: number, dh: number;
        const ia = iw / ih, pa = aw / ah;
        if (fit === "stretch") { dw = aw; dh = ah; }
        else if (fit === "fit") {
          if (ia > pa) { dw = aw; dh = aw / ia; } else { dh = ah; dw = ah * ia; }
        } else {
          if (ia > pa) { dh = ah; dw = ah * ia; } else { dw = aw; dh = aw / ia; }
        }
        const x = m + (aw - dw) / 2, y = m + (ah - dh) / 2;
        page.drawImage(image, { x, y, width: dw, height: dh });
      }
      setProgress(95);
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      downloadBlob(blob, "images.pdf");
      setStatus("done"); setProgress(100);
    } catch (e) { setMsg((e as Error).message); setStatus("error"); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Drop zone */}
      <button onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        className="w-full rounded-lg border-2 border-dashed border-border/60 bg-secondary/10 hover:border-foreground/20 py-10 flex flex-col items-center gap-2 cursor-pointer transition-colors" id="pdf-img-dropzone">
        <Upload className="h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium">Drop images or tap to add</p>
        <p className="text-xs text-muted-foreground">JPG, PNG, WebP · multiple files · drag to reorder below</p>
      </button>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only"
        onChange={e => { if (e.target.files) addFiles(e.target.files); }} />

      {/* Image list */}
      {items.length > 0 && (
        <div className="space-y-1.5">
          {items.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5">
              <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              <img src={item.url} alt="" className="h-10 w-10 rounded object-cover border border-border/40 shrink-0" />
              <span className="text-xs text-muted-foreground flex-1 truncate">{item.file.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">{fmtSize(item.file.size)}</span>
              <div className="flex gap-0.5">
                <button onClick={() => move(item.id, -1)} disabled={idx === 0}
                  className="p-1 rounded hover:bg-secondary disabled:opacity-30 transition-colors">
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => move(item.id, 1)} disabled={idx === items.length - 1}
                  className="p-1 rounded hover:bg-secondary disabled:opacity-30 transition-colors">
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => remove(item.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Options */}
      {items.length > 0 && (
        <div className="rounded-lg border border-border/60 bg-card px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Page size</p>
              <select id="pdf-pagesize" value={pageSize} onChange={e => setPageSize(e.target.value as PageSize)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                {(["A4", "Letter", "A3", "Legal", "fit-to-image"] as PageSize[]).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {pageSize !== "fit-to-image" && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Orientation</p>
                <select id="pdf-orient" value={orientation} onChange={e => setOrientation(e.target.value as Orientation)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                  <option value="auto">Auto (per image)</option>
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Image fit</p>
              <select id="pdf-fit" value={fit} onChange={e => setFit(e.target.value as ImageFit)}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="fit">Fit (letterbox)</option>
                <option value="fill">Fill (crop)</option>
                <option value="stretch">Stretch</option>
              </select>
            </div>
          </div>
          {pageSize !== "fit-to-image" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Margin</span><span>{margin}pt ({(margin / 72).toFixed(2)}")</span>
              </div>
              <Slider min={0} max={72} step={4} value={[margin]} onValueChange={([v]) => setMargin(v)} id="pdf-margin" />
            </div>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-2">
          <Button onClick={generate} disabled={status === "processing"} id="pdf-generate" className="gap-1.5">
            <Download className="h-4 w-4" />
            {status === "processing" ? `Processing… ${progress}%` : `Generate PDF (${items.length} image${items.length > 1 ? "s" : ""})`}
          </Button>
          {status === "done" && <p className="text-xs text-muted-foreground">PDF downloaded.</p>}
          {status === "error" && <p className="text-xs text-destructive">{msg}</p>}
        </div>
      )}
    </div>
  );
}
