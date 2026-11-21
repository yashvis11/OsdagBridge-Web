/**
 * drawHelpers.ts
 *
 * Small drawing helpers shared by both views: lines, arrowheads, dimension lines
 * with their labels, the concrete texture, and the hit testing used for hover.
 *
 * Elements included:
 *   - dimH / dimV / dimHSide draw a dimension line, ticks, arrowheads and a label
 *     box. Arrow and label sizes come from the DimStyle passed in (see style.ts).
 *   - Labels avoid overlapping: a label that would land on one already placed in
 *     this frame moves to a free row. resetLabels() must be called at the start of
 *     each draw.
 *   - concretePattern() builds the speckled concrete fill once and reuses it.
 *     
 *   - hits(), lineShape() and drawHoverLabel() support hover: CadCanvas tests the
 *     mouse against each HitZone, and the label is drawn on top of the drawing.
 *
 */
import { CAD, W, HOVER, CROSS_DIM, type DimStyle } from "./style";
import type { HitShape, HitZone } from "../types/cad";

type Ctx = CanvasRenderingContext2D;

//function to draw lines
export function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// Desktop arrowhead: tip + two back points.
export function arrow(ctx: Ctx, x: number, y: number, dx: number, dy: number, len: number, half: number): void {
  const a = Math.atan2(dy, dx);  //the direction of the arrow
  const bx = x - len * Math.cos(a), by = y - len * Math.sin(a);  //finding the center of the base of the arrow
  const px = -Math.sin(a) * half, py = Math.cos(a) * half;  //distance from the center to the left and right wings of the arrow
  //to draw and fill the triangle
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(bx + px, by + py); ctx.lineTo(bx - px, by - py);
  ctx.closePath(); ctx.fill();
}

//style for the dimension lines and their fonts
function dimStyle(ctx: Ctx): void {
  ctx.strokeStyle = CAD.ink; ctx.fillStyle = CAD.ink; ctx.lineWidth = W.dim; ctx.font = CAD.font;
}

//setup for the text above the dimension lines
export function textBox(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  align: CanvasTextAlign,
  alpha: number,
  color: string = CAD.ink,
  font: string = CAD.font,
): void {
  ctx.font = font;
  const w = ctx.measureText(text).width,
    h = 16,
    pad = 2;
  const left = align === "center" ? x - w / 2 : align === "left" ? x : x - w;
  ctx.fillStyle = `rgba(${CAD.bgRgb},${alpha})`;
  ctx.fillRect(left - pad, y - h / 2, w + 2 * pad, h);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

const TICK = 6;

//to make sure labels do not overlap
//---------
const LABEL_H = 16;
let placed: { xa: number; xb: number; ya: number; yb: number }[] = [];  //an array of coordinates of previous labels
export const resetLabels = (): void => { placed = []; }; //to clear the array when needed

function labelY(xa: number, xb: number, candidates: number[]): number {  //function to check if any two labels overlap
  for (const y of candidates) {
    const ya = y - LABEL_H / 2, yb = y + LABEL_H / 2;
    const clash = placed.some((b) => xa < b.xb && xb > b.xa && ya < b.yb && yb > b.ya);
    if (!clash) { placed.push({ xa, xb, ya, yb }); return y; }
  }
  //fallback if all labels clash with the new label, the new label is still displayed
  const y = candidates[0];                       
  placed.push({ xa, xb, ya: y - LABEL_H / 2, yb: y + LABEL_H / 2 });
  return y;
}
//-----------

// Horizontal dimension, label centred above or below the line.
export function dimH(ctx: Ctx, x1: number, x2: number, y: number, label: string,
                     above = true, extY?: number, st: DimStyle = CROSS_DIM): void {
  ctx.save();
  if (extY !== undefined) {
    ctx.strokeStyle = CAD.dimExt; ctx.lineWidth = W.dim; ctx.setLineDash([1, 3]);   
    line(ctx, x1, extY, x1, y); line(ctx, x2, extY, x2, y);
    ctx.setLineDash([]);
  }
  dimStyle(ctx);
  line(ctx, x1, y, x2, y);
  line(ctx, x1, y - TICK, x1, y + TICK); line(ctx, x2, y - TICK, x2, y + TICK);
  arrow(ctx, x1, y, -1, 0, st.len, st.half); arrow(ctx, x2, y, 1, 0, st.len, st.half);
  const cx = (x1 + x2) / 2;
  const w = ctx.measureText(label).width + 8;                 
  const preferred = above ? y - st.above : y + st.below;      
  const opposite = above ? y + st.below : y - st.above;       
  const dir = above ? 1 : -1;                                 
  const ty = labelY(cx - w / 2, cx + w / 2,
    [preferred, opposite, opposite + dir * LABEL_H, opposite + dir * 2 * LABEL_H]);
  textBox(ctx, label, cx, ty, "center", st.bgAlpha);
  ctx.restore();
}

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

// Vertical dimension; label to the right of the line, or to the left (right-aligned).
export function dimV(ctx: Ctx, x: number, y1: number, y2: number, label: string,
                     st: DimStyle = CROSS_DIM, side: "left" | "right" = "right"): void {
  ctx.save();
  dimStyle(ctx);
  const dir = y2 > y1 ? 1 : -1;
  line(ctx, x, y1, x, y2);
  line(ctx, x - TICK, y1, x + TICK, y1); line(ctx, x - TICK, y2, x + TICK, y2);
  arrow(ctx, x, y1, 0, -dir, st.len, st.half); arrow(ctx, x, y2, 0, dir, st.len, st.half);
  const rows = label.split("\n"), mid = (y1 + y2) / 2;
  rows.forEach((r, i) => {
    const ry = mid + (i - (rows.length - 1) / 2) * 16;
    if (side === "right") textBox(ctx, r, x + 12, ry, "left", st.bgAlpha);
    else textBox(ctx, r, x - 12, ry, "right", st.bgAlpha);
  });
  ctx.restore();
}

// ---- Concrete stipple  ----
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
        if (v) g.lineTo(px, py); else g.moveTo(px, py);
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
  for (const dx of [-SIZE, 0, SIZE]) for (const dy of [-SIZE, 0, SIZE]) content(dx, dy);   

  g.fillStyle = "rgba(100,95,88,0.04)";                     
  g.fillRect(0, 0, SIZE, SIZE);

  const pat = ctx.createPattern(tile, "repeat");
  if (!pat) return CAD.concrete;
  pat.setTransform(new DOMMatrix().scale(1 / dpr));
  cached = { dpr, pat };
  return pat;
}

// ---- hit testing + hover label ----
export const rectShape = (x: number, y: number, w: number, h: number): HitShape => ({ kind: "rect", x, y, w, h });
export const polyShape = (pts: [number, number][]): HitShape => ({ kind: "poly", pts });
// Shows "Name = value" only when the value is real; otherwise just "Name".
export const lbl = (name: string, known: boolean, value: string): string =>
  known ? `${name} = ${value}` : name;

export function lineShape(x1: number, y1: number, x2: number, y2: number, pad: number): HitShape {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  const ox = (-dy / len) * pad, oy = (dx / len) * pad;
  return polyShape([[x1 + ox, y1 + oy], [x2 + ox, y2 + oy], [x2 - ox, y2 - oy], [x1 - ox, y1 - oy]]);
}

export function hits(s: HitShape, px: number, py: number): boolean {
  if (s.kind === "rect") return px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h;
  let inside = false;
  const p = s.pts;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Dotted leader from the dot to the label, label box drawn on top.
export function drawHoverLabel(ctx: Ctx, z: HitZone): void {
  const [ax, ay] = z.anchor;
  const lx = ax + z.dx, ly = ay + z.dy;
  ctx.save();
  ctx.strokeStyle = HOVER.leader; ctx.lineWidth = 1; ctx.setLineDash([1, 3]);
  line(ctx, ax, ay, lx, ly);
  ctx.setLineDash([]);
  ctx.fillStyle = HOVER.leader;
  ctx.beginPath(); ctx.arc(ax, ay, 3, 0, Math.PI * 2); ctx.fill();
  textBox(ctx, z.label, lx, ly, "center", 1, HOVER.label);
  ctx.restore();
}
