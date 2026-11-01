import { CAD, W, CROSS_DIM, type DimStyle } from "./style";

type Ctx = CanvasRenderingContext2D;



export function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// Desktop arrowhead: tip + two back points, half-height = length / 2.
export function arrow(ctx: Ctx, x: number, y: number, dx: number, dy: number, len: number, half: number): void {
  const a = Math.atan2(dy, dx);
  const bx = x - len * Math.cos(a), by = y - len * Math.sin(a);
  const px = -Math.sin(a) * half, py = Math.cos(a) * half;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(bx + px, by + py); ctx.lineTo(bx - px, by - py);
  ctx.closePath(); ctx.fill();
}

function dimStyle(ctx: Ctx): void {
  ctx.strokeStyle = CAD.ink; ctx.fillStyle = CAD.ink; ctx.lineWidth = W.dim; ctx.font = CAD.font;
}

// Label on a white 90% box (the desktop's draw_text_with_background).
function textBox(ctx: Ctx, text: string, x: number, y: number, align: CanvasTextAlign, alpha: number): void {
  ctx.font = CAD.font;
  const w = ctx.measureText(text).width, h = 16, pad = 2;
  const left = align === "center" ? x - w / 2 : align === "left" ? x : x - w;
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.fillRect(left - pad, y - h / 2, w + 2 * pad, h);
  ctx.fillStyle = CAD.ink; ctx.textAlign = align; ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

const TICK = 6;

// Horizontal dimension, label centred above or below the line.
export function dimH(ctx: Ctx, x1: number, x2: number, y: number, label: string,
                     above = true, extY?: number, st: DimStyle = CROSS_DIM): void {
  ctx.save();
  if (extY !== undefined) {
    ctx.strokeStyle = CAD.dimExt; ctx.lineWidth = W.dim; ctx.setLineDash([1, 3]);   // Qt.DotLine
    line(ctx, x1, extY, x1, y); line(ctx, x2, extY, x2, y);
    ctx.setLineDash([]);
  }
  dimStyle(ctx);
  line(ctx, x1, y, x2, y);
  line(ctx, x1, y - TICK, x1, y + TICK); line(ctx, x2, y - TICK, x2, y + TICK);
  arrow(ctx, x1, y, -1, 0, st.len, st.half); arrow(ctx, x2, y, 1, 0, st.len, st.half);
  textBox(ctx, label, (x1 + x2) / 2, above ? y - st.above : y + st.below, "center", st.bgAlpha);
  ctx.restore();
}

// Horizontal dimension with the label to the right (short dimensions).
// Horizontal dimension with the label to the right (short dimensions).
export function dimHSide(ctx: Ctx, x1: number, x2: number, y: number, label: string, st: DimStyle = CROSS_DIM): void {
  ctx.save();
  dimStyle(ctx);
  line(ctx, x1, y, x2, y);
  line(ctx, x1, y - TICK, x1, y + TICK);
  line(ctx, x2, y - TICK, x2, y + TICK);
  arrow(ctx, x1, y, -1, 0, st.len, st.half);
  arrow(ctx, x2, y, 1, 0, st.len, st.half);
  textBox(ctx, label, x2 + 8, y, "left", st.bgAlpha);
  ctx.restore();
}

// Vertical dimension, label to the right of the line.
export function dimV(ctx: Ctx, x: number, y1: number, y2: number, label: string, st: DimStyle = CROSS_DIM): void {
  ctx.save();
  dimStyle(ctx);
  const dir = y2 > y1 ? 1 : -1;
  line(ctx, x, y1, x, y2);
  line(ctx, x - TICK, y1, x + TICK, y1); line(ctx, x - TICK, y2, x + TICK, y2);
  arrow(ctx, x, y1, 0, -dir, st.len, st.half); arrow(ctx, x, y2, 0, dir, st.len, st.half);
  const rows = label.split("\n"), mid = (y1 + y2) / 2;
  rows.forEach((r, i) => textBox(ctx, r, x + 12, mid + (i - (rows.length - 1) / 2) * 16, "left", st.bgAlpha));
  ctx.restore();
}

// ---- Concrete stipple (approximation of the desktop's create_concrete_brush) ----
function rng(seed: number) {            // mulberry32
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let cached: { dpr: number; pat: CanvasPattern } | null = null;

export function concretePattern(ctx: Ctx): CanvasPattern | string {
  const dpr = window.devicePixelRatio || 1;
  if (cached && cached.dpr === dpr) return cached.pat;

  const SIZE = 120, DOTS = 100, TRIS = 30;
  const tile = document.createElement("canvas");
  tile.width = tile.height = Math.round(SIZE * dpr);
  const g = tile.getContext("2d");
  if (!g) return CAD.concrete;
  g.scale(dpr, dpr);
  const r = rng(42);
  const rr = (a: number, b: number) => a + r() * (b - a);

  g.fillStyle = CAD.concrete;
  g.fillRect(0, 0, SIZE, SIZE);

  const content = (ox: number, oy: number) => {
    g.save(); g.translate(ox, oy);
    for (let i = 0; i < DOTS; i++) {                       // fine aggregate
      const h = Math.floor(rr(40, 110));
      g.fillStyle = `rgb(${h},${h},${h})`;
      g.beginPath(); g.arc(rr(0, SIZE), rr(0, SIZE), rr(0.6, 2.2), 0, Math.PI * 2); g.fill();
    }
    for (let i = 0; i < TRIS; i++) {                       // coarse aggregate
      const cx = rr(0, SIZE), cy = rr(0, SIZE), base = rr(0, Math.PI * 2);
      const h = Math.floor(rr(70, 140)), sat = Math.floor(rr(0, 10));
      g.beginPath();
      for (let v = 0; v < 3; v++) {
        const ang = base + v * (Math.PI * 2 / 3) + rr(-0.45, 0.45);
        const d = rr(SIZE * 0.032, SIZE * 0.072);
        const px = cx + Math.cos(ang) * d, py = cy + Math.sin(ang) * d;
        v ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.closePath();
      g.fillStyle = `rgb(${h + sat},${h},${h - sat})`;
      g.strokeStyle = `rgba(20,20,20,${rr(64, 140) / 255})`;
      g.lineWidth = rr(0.4, 0.8);
      g.fill(); g.stroke();
    }
    const scratches = Math.floor(SIZE * 0.3);               // micro-scratches
    for (let i = 0; i < scratches; i++) {
      const x = rr(0, SIZE), y = rr(0, SIZE), len = rr(2, SIZE * 0.08), a = rr(0, Math.PI * 2);
      g.strokeStyle = `rgba(90,85,80,${rr(10, 31) / 255})`;
      g.lineWidth = rr(0.3, 0.7);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
    }
    g.restore();
  };
  for (const dx of [-SIZE, 0, SIZE]) for (const dy of [-SIZE, 0, SIZE]) content(dx, dy);   // seamless wrap

  g.fillStyle = "rgba(100,95,88,0.04)";                     // wash
  g.fillRect(0, 0, SIZE, SIZE);

  const pat = ctx.createPattern(tile, "repeat");
  if (!pat) return CAD.concrete;
  pat.setTransform(new DOMMatrix().scale(1 / dpr));
  cached = { dpr, pat };
  return pat;
}