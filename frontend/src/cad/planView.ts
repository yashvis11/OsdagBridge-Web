import type { CadModel, FormValues, View } from "../types/cad";
import { num } from "./num";
import { computeLayout } from "./layout";
import { toX, toY } from "./geometry";
import { line, dimH, dimV } from "./drawHelpers";

export interface PlanModel extends CadModel {
  n: number; spacing: number; span: number;
  panels: number; bracingSpacing: number; width: number; girderY: number[];
  tanSkew: number;
}

// Plan view: horizontal = span, vertical = across the bridge, ends slanted by the skew angle.
export function buildPlan(p: FormValues): PlanModel {
  const { n, spacing, girderX } = computeLayout(p);
  const span = num(p.span, 20);
  const panels = Math.max(1, Math.round(span / num(p.bracingSpacing, 3.5)));
  const girderY = girderX.map((x) => x - girderX[0]);
  const width = Math.max(girderY[girderY.length - 1], 1);

  // Skew can be negative, so it can't go through num(). Clamp to a sensible range.
  const raw = Number(p.skew);
  const skew = Number.isFinite(raw) ? Math.max(-45, Math.min(45, raw)) : 0;
  const tanSkew = Math.tan((skew * Math.PI) / 180);
  const shift = -tanSkew * width;                      // x offset of the top girder (matches the desktop's direction)

  return {
    n, spacing, span, panels, bracingSpacing: span / panels, width, girderY, tanSkew,
    bounds: { minX: Math.min(0, shift), maxX: span + Math.max(0, shift), minY: 0, maxY: width },
    pad: { l: 50, r: 150, t: 60, b: 85 },
  };
}

const GIRDER = "#8f8f6e";
const BRACING = "#d2d2bf";

export function drawPlan(ctx: CanvasRenderingContext2D, m: PlanModel, v: View): void {
  const X = (x: number) => toX(x, v);
  const Y = (y: number) => toY(y, v);
  const sx = (y: number) => -m.tanSkew * y;            // skew shift at height y

  // cross bracing: slanted by the skew, one per panel boundary
  ctx.strokeStyle = BRACING;
  ctx.lineWidth = 1.5;
  for (let k = 0; k <= m.panels; k++) {
    const x0 = k * m.bracingSpacing;
    line(ctx, X(x0), Y(0), X(x0 + sx(m.width)), Y(m.width));
  }

  // girders: thick olive lines, each shifted by the skew at its own height
  ctx.strokeStyle = GIRDER;
  ctx.lineWidth = 3;
  m.girderY.forEach((y) => line(ctx, X(sx(y)), Y(y), X(m.span + sx(y)), Y(y)));

  // end supports: heavy slanted lines
  ctx.strokeStyle = "#6f6f55";
  ctx.lineWidth = 5;
  line(ctx, X(0), Y(0), X(sx(m.width)), Y(m.width));
  line(ctx, X(m.span), Y(0), X(m.span + sx(m.width)), Y(m.width));

  // "CL of Bearing": dashed slanted lines through each end, extended past the girders
  ctx.save();
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([8, 4]);
  const ext = 0.12 * m.width + 0.5;
  [0, m.span].forEach((x) => {
    line(ctx, X(x + sx(m.width + ext)), Y(m.width + ext), X(x + sx(m.width)), Y(m.width));
    line(ctx, X(x), Y(0), X(x + sx(-ext)), Y(-ext));
  });
  ctx.restore();

  ctx.fillStyle = "#000";
  ctx.font = "13px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  [0, m.span].forEach((x) => ctx.fillText("CL of Bearing", X(x + sx(m.width + ext)), Y(m.width + ext) - 4));

  // dimensions (labels above their lines, like the desktop)
  dimH(ctx, X(0), X(m.bracingSpacing), Y(0) + 38, `Bracing Spacing = ${m.bracingSpacing.toFixed(2)} m`, true);
  dimH(ctx, X(0), X(m.span), Y(0) + 72, `Span Length = ${m.span.toFixed(1)} m`, true);
  if (m.n > 1) {
    dimV(ctx, X(m.span + Math.max(0, sx(m.width))) + 34, Y(m.girderY[0]), Y(m.girderY[1]),
         `Girder\nSpacing\n= ${m.spacing.toFixed(2)} m`);
  }
}