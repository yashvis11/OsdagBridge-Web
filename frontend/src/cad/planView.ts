import type { CadModel, FormValues, View } from "../types/cad";
import { num } from "./num";
import { computeLayout } from "./layout";
import { toX, toY } from "./geometry";
import { line, dimH, dimV } from "./drawHelpers";
import { CAD, W, PLAN_DIM } from "./style";

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


export function drawPlan(ctx: CanvasRenderingContext2D, m: PlanModel, v: View): void {
  const X = (x: number) => toX(x, v);
  const Y = (y: number) => toY(y, v);
  const sx = (y: number) => -m.tanSkew * y;            // skew shift at height y
  const gy = m.girderY;

  // cross bracing: one segment per girder pair, interior stations only
  ctx.strokeStyle = CAD.crossBracing;
  ctx.lineWidth = W.planBracing;
  for (let k = 1; k < m.panels; k++) {
    const x0 = k * m.bracingSpacing;
    for (let i = 0; i < gy.length - 1; i++) {
      line(ctx, X(x0 + sx(gy[i])), Y(gy[i]), X(x0 + sx(gy[i + 1])), Y(gy[i + 1]));
    }
  }

  // girders
  ctx.strokeStyle = CAD.girder;
  ctx.lineWidth = W.planGirder;
  gy.forEach((y) => line(ctx, X(sx(y)), Y(y), X(m.span + sx(y)), Y(y)));

  // end diaphragms: double line offset ±2 px, one segment per girder pair
  if (m.n > 1) {
    ctx.strokeStyle = CAD.endDiaphragm;
    ctx.lineWidth = W.planDiaphragm;
    [0, m.span].forEach((x0) => {
      for (let i = 0; i < gy.length - 1; i++) {
        const ax = X(x0 + sx(gy[i])), ay = Y(gy[i]);
        const bx = X(x0 + sx(gy[i + 1])), by = Y(gy[i + 1]);
        const len = Math.hypot(bx - ax, by - ay) || 1;
        const px = (-(by - ay) / len) * 2, py = ((bx - ax) / len) * 2;
        line(ctx, ax + px, ay + py, bx + px, by + py);
        line(ctx, ax - px, ay - py, bx - px, by - py);
      }
    });
  }

  // CL of bearing: dashed 12/12 (Qt dash [8,8] x pen width 1.5)
  const ext = Math.max(30 / v.scale, 0.3 * m.spacing);
  ctx.save();
  ctx.strokeStyle = CAD.bearing;
  ctx.lineWidth = W.planBearing;
  ctx.setLineDash([12, 12]);
  [0, m.span].forEach((x) => {
    line(ctx, X(x + sx(-ext)), Y(-ext), X(x + sx(m.width + ext)), Y(m.width + ext));
  });
  ctx.restore();

  ctx.fillStyle = CAD.ink;
  ctx.font = CAD.font;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  [0, m.span].forEach((x) => ctx.fillText("CL of Bearing", X(x + sx(m.width + ext)), Y(m.width + ext) - 4));

  // dimensions
  dimH(ctx, X(0), X(m.bracingSpacing), Y(0) + 38, `Bracing Spacing = ${m.bracingSpacing.toFixed(2)} m`, true, undefined, PLAN_DIM);
  dimH(ctx, X(0), X(m.span), Y(0) + 72, `Span Length = ${m.span.toFixed(1)} m`, true, undefined, PLAN_DIM);
  if (m.n > 1) {
    dimV(ctx, X(m.span + Math.max(0, sx(m.width))) + 34, Y(gy[0]), Y(gy[1]),
         `Girder\nSpacing\n= ${m.spacing.toFixed(2)} m`, PLAN_DIM);
  }
}