// Custom QR renderer
// ===================
// `qrcode` only draws plain black squares. To support module styles (rounded /
// dots), styled finder "eyes", colour gradients, a transparent background and a
// centre logo, we read the raw module matrix from QRCode.create() and paint it
// ourselves — to a <canvas> (for PNG + clipboard) and to an SVG string (vector
// download). Both share the same geometry so they look identical.

import QRCode from "qrcode";

export type ModuleStyle = "square" | "rounded" | "dots";
export type ECL = "L" | "M" | "Q" | "H";

export interface RenderOptions {
  size: number; // output pixels (canvas)
  margin: number; // quiet zone, in modules
  moduleStyle: ModuleStyle;
  fg: string;
  fgGradient: string | null; // null = solid fg
  gradientAngle: number; // degrees
  bg: string;
  transparent: boolean;
  logoDataUrl: string | null;
  logoScale: number; // fraction of the code area (0.12–0.3)
}

interface Matrix {
  size: number;
  get: (r: number, c: number) => boolean;
}

export function buildMatrix(content: string, ecl: ECL): Matrix {
  const qr = QRCode.create(content, { errorCorrectionLevel: ecl });
  const size = qr.modules.size;
  const data = qr.modules.data;
  return { size, get: (r, c) => !!data[r * size + c] };
}

function isFinder(r: number, c: number, n: number): boolean {
  return (
    (r < 7 && c < 7) || // top-left
    (r < 7 && c >= n - 7) || // top-right
    (r >= n - 7 && c < 7) // bottom-left
  );
}

const finderOrigins = (n: number) => [
  [0, 0],
  [0, n - 7],
  [n - 7, 0],
];

// ── canvas ────────────────────────────────────────────────────────────────
export function renderToCanvas(
  canvas: HTMLCanvasElement,
  matrix: Matrix,
  opts: RenderOptions,
  logoImg: HTMLImageElement | null,
) {
  const n = matrix.size;
  const count = n + opts.margin * 2;
  const cell = Math.max(1, Math.floor(opts.size / count));
  const px = cell * count;
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, px, px);

  if (!opts.transparent) {
    ctx.fillStyle = opts.bg;
    ctx.fillRect(0, 0, px, px);
  }

  // foreground paint (solid or gradient)
  let paint: string | CanvasGradient = opts.fg;
  if (opts.fgGradient) {
    const a = (opts.gradientAngle * Math.PI) / 180;
    const x = Math.cos(a) * px;
    const y = Math.sin(a) * px;
    const g = ctx.createLinearGradient(0, 0, x, y);
    g.addColorStop(0, opts.fg);
    g.addColorStop(1, opts.fgGradient);
    paint = g;
  }
  ctx.fillStyle = paint;
  ctx.strokeStyle = paint;

  const off = opts.margin * cell;
  const square = opts.moduleStyle === "square";

  // data modules
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!matrix.get(r, c)) continue;
      if (!square && isFinder(r, c, n)) continue; // eyes drawn separately
      const x = off + c * cell;
      const y = off + r * cell;
      if (opts.moduleStyle === "dots") {
        ctx.beginPath();
        ctx.arc(x + cell / 2, y + cell / 2, cell * 0.46, 0, Math.PI * 2);
        ctx.fill();
      } else if (opts.moduleStyle === "rounded") {
        roundRectPath(ctx, x, y, cell, cell, cell * 0.32);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, cell + 0.5, cell + 0.5);
      }
    }
  }

  // styled eyes for non-square styles
  if (!square) {
    const radius = opts.moduleStyle === "dots" ? cell * 2.2 : cell * 1.6;
    ctx.lineWidth = cell;
    for (const [or, oc] of finderOrigins(n)) {
      const x = off + oc * cell;
      const y = off + or * cell;
      // outer ring (stroke = transparent-safe, no "hole" needed)
      roundRectPath(ctx, x + cell * 0.5, y + cell * 0.5, cell * 6, cell * 6, radius);
      ctx.stroke();
      // centre
      roundRectPath(ctx, x + cell * 2, y + cell * 2, cell * 3, cell * 3, cell * (opts.moduleStyle === "dots" ? 1.5 : 0.7));
      ctx.fill();
    }
  }

  // centre logo
  if (logoImg) {
    const codePx = n * cell;
    const logoSize = Math.round(codePx * opts.logoScale);
    const lx = Math.round((px - logoSize) / 2);
    const ly = Math.round((px - logoSize) / 2);
    const pad = Math.round(logoSize * 0.12);
    ctx.fillStyle = opts.transparent ? "#ffffff" : opts.bg;
    roundRectPath(ctx, lx - pad, ly - pad, logoSize + pad * 2, logoSize + pad * 2, logoSize * 0.18);
    ctx.fill();
    try {
      ctx.drawImage(logoImg, lx, ly, logoSize, logoSize);
    } catch {
      /* tainted/broken image */
    }
  }
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// ── svg ──────────────────────────────────────────────────────────────────
export function renderToSvg(matrix: Matrix, opts: RenderOptions): string {
  const n = matrix.size;
  const count = n + opts.margin * 2;
  const off = opts.margin;
  const square = opts.moduleStyle === "square";
  const fill = opts.fgGradient ? "url(#qr-grad)" : opts.fg;

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.size}" height="${opts.size}" viewBox="0 0 ${count} ${count}" shape-rendering="${square ? "crispEdges" : "geometricPrecision"}">`,
  );

  if (opts.fgGradient) {
    const a = (opts.gradientAngle * Math.PI) / 180;
    const x2 = (Math.cos(a) * 0.5 + 0.5).toFixed(4);
    const y2 = (Math.sin(a) * 0.5 + 0.5).toFixed(4);
    const x1 = (0.5 - Math.cos(a) * 0.5).toFixed(4);
    const y1 = (0.5 - Math.sin(a) * 0.5).toFixed(4);
    parts.push(
      `<defs><linearGradient id="qr-grad" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0%" stop-color="${opts.fg}"/><stop offset="100%" stop-color="${opts.fgGradient}"/></linearGradient></defs>`,
    );
  }
  if (!opts.transparent) {
    parts.push(`<rect width="${count}" height="${count}" fill="${opts.bg}"/>`);
  }

  parts.push(`<g fill="${fill}">`);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!matrix.get(r, c)) continue;
      if (!square && isFinder(r, c, n)) continue;
      const x = off + c;
      const y = off + r;
      if (opts.moduleStyle === "dots") {
        parts.push(`<circle cx="${(x + 0.5).toFixed(3)}" cy="${(y + 0.5).toFixed(3)}" r="0.46"/>`);
      } else if (opts.moduleStyle === "rounded") {
        parts.push(`<rect x="${x}" y="${y}" width="1" height="1" rx="0.32"/>`);
      } else {
        parts.push(`<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`);
      }
    }
  }
  parts.push(`</g>`);

  if (!square) {
    const ringR = opts.moduleStyle === "dots" ? 2.2 : 1.6;
    const cR = opts.moduleStyle === "dots" ? 1.5 : 0.7;
    for (const [or, oc] of finderOrigins(n)) {
      const x = off + oc;
      const y = off + or;
      parts.push(
        `<rect x="${x + 0.5}" y="${y + 0.5}" width="6" height="6" rx="${ringR}" fill="none" stroke="${fill}" stroke-width="1"/>`,
      );
      parts.push(`<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="${cR}" fill="${fill}"/>`);
    }
  }

  if (opts.logoDataUrl) {
    const logoSize = n * opts.logoScale;
    const lx = (count - logoSize) / 2;
    const pad = logoSize * 0.12;
    parts.push(
      `<rect x="${lx - pad}" y="${lx - pad}" width="${logoSize + pad * 2}" height="${logoSize + pad * 2}" rx="${logoSize * 0.18}" fill="${opts.transparent ? "#ffffff" : opts.bg}"/>`,
    );
    parts.push(
      `<image href="${opts.logoDataUrl}" x="${lx}" y="${lx}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>`,
    );
  }

  parts.push(`</svg>`);
  return parts.join("");
}

// relative luminance contrast ratio between two hex colours
export function contrastRatio(fg: string, bg: string): number {
  const lum = (hex: string) => {
    const h = hex.replace("#", "");
    const c = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
    const r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255;
    const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const l1 = lum(fg), l2 = lum(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
