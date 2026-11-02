import type { CadModel, FormValues, HitZone, HoverState, View } from "../types/cad";
import { num } from "./num";
import { computeLayout } from "./layout";
import { toX, toY } from "./geometry";
import { line, dimH, dimV, lineShape, drawHoverLabel } from "./drawHelpers";
import { CAD, W, HOVER, HOVER_W, PICK_PAD, PLAN_DIM } from "./style";

export interface PlanModel extends CadModel {
  n: number; spacing: number; span: number;
  panels: number; bracingSpacing: number; width: number; girderY: number[];
  tanSkew: number;
}

// Plan view: horizontal = span, vertical = across the bridge, ends slanted by the skew angle.
export function buildPlan(p: FormValues): PlanModel {
  const { n, spacing, girderX } = computeLayout(p);
  const span = num(p.span, 20);
  // desktop shows 9 panels (2.78 m) for 25 m, which fits ceil(span / 3.0)
  const panels = Math.max(1, Math.ceil(span / num(p.bracingSpacing, 3.0)));
  const girderY = girderX.map((x) => x - girderX[0]);
  const width = Math.max(girderY[girderY.length - 1], 1);

  // Skew can be negative, so it can't go through num(). Clamp to a sensible range.
  const raw = Number(p.skew);
  const skew = Number.isFinite(raw) ? Math.max(-45, Math.min(45, raw)) : 0;
  const tanSkew = Math.tan((skew * Math.PI) / 180);
  const shift = -tanSkew * width;

  return {
    n, spacing, span, panels, bracingSpacing: span / panels, width, girderY, tanSkew,
    bounds: { minX: Math.min(0, shift), maxX: span + Math.max(0, shift), minY: 0, maxY: width },
    pad: { l: 50, r: 150, t: 60, b: 85 },
  };
}

export function drawPlan(
  ctx: CanvasRenderingContext2D, m: PlanModel, v: View, hover: HoverState | null
): HitZone[] {
  const X = (x: number) => toX(x, v);
  const Y = (y: number) => toY(y, v);
  const sx = (y: number) => -m.tanSkew * y;            // skew shift at height y
  const gy = m.girderY;
  const zones: HitZone[] = [];
  const hot = (id: string) => hover?.id === id;
  const mid = (a: number, b: number) => (a + b) / 2;

  // cross bracing: one segment per girder pair, interior stations only
  ctx.strokeStyle = hot("cross_bracing") ? HOVER.grey : CAD.crossBracing;
  ctx.lineWidth = hot("cross_bracing") ? HOVER_W.planBracing : W.planBracing;
  for (let k = 1; k < m.panels; k++) {
    const x0 = k * m.bracingSpacing;
    for (let i = 0; i < gy.length - 1; i++) {
      const ax = X(x0 + sx(gy[i])), ay = Y(gy[i]);
      const bx = X(x0 + sx(gy[i + 1])), by = Y(gy[i + 1]);
      line(ctx, ax, ay, bx, by);
      zones.push({
        id: "cross_bracing", label: "Cross Bracing", shape: lineShape(ax, ay, bx, by, PICK_PAD),
        anchor: [mid(ax, bx), mid(ay, by)], dx: -52, dy: -43,
      });
    }
  }

  // girders
  ctx.strokeStyle = hot("girder") ? HOVER.grey : CAD.girder;
  ctx.lineWidth = hot("girder") ? HOVER_W.planGirder : W.planGirder;
  gy.forEach((y) => {
    const ax = X(sx(y)), bx = X(m.span + sx(y)), py = Y(y);
    line(ctx, ax, py, bx, py);
    zones.push({
      id: "girder", label: "Girder", shape: lineShape(ax, py, bx, py, PICK_PAD),
      anchor: [mid(ax, bx), py], dx: -25, dy: -35,
    });
  });

  // end diaphragms: double line offset ±2 px, one segment per girder pair
  if (m.n > 1) {
    ctx.strokeStyle = hot("end_diaphragm") ? HOVER.grey : CAD.endDiaphragm;
    ctx.lineWidth = hot("end_diaphragm") ? HOVER_W.planDiaphragm : W.planDiaphragm;
    [0, m.span].forEach((x0) => {
      for (let i = 0; i < gy.length - 1; i++) {
        const ax = X(x0 + sx(gy[i])), ay = Y(gy[i]);
        const bx = X(x0 + sx(gy[i + 1])), by = Y(gy[i + 1]);
        const len = Math.hypot(bx - ax, by - ay) || 1;
        const px = (-(by - ay) / len) * 2, py = ((bx - ax) / len) * 2;
        line(ctx, ax + px, ay + py, bx + px, by + py);
        line(ctx, ax - px, ay - py, bx - px, by - py);
        zones.push({
          id: "end_diaphragm", label: "End Diaphragm", shape: lineShape(ax, ay, bx, by, PICK_PAD + 2),
          anchor: [mid(ax, bx), mid(ay, by)], dx: x0 === 0 ? -82 : 90, dy: 0,
        });
      }
    });
  }

  // CL of bearing: dashed 12/12 (Qt dash [8,8] x pen width 1.5), extends past the outer girders
  const ext = Math.max(30 / v.scale, 0.3 * m.spacing);
  ctx.save();
  ctx.strokeStyle = hot("bearing") ? HOVER.grey : CAD.bearing;
  ctx.lineWidth = hot("bearing") ? HOVER_W.planBearing : W.planBearing;
  ctx.setLineDash([12, 12]);
  [0, m.span].forEach((x) => {
    const ax = X(x + sx(-ext)), ay = Y(-ext), bx = X(x + sx(m.width + ext)), by = Y(m.width + ext);
    line(ctx, ax, ay, bx, by);
    zones.push({
      id: "bearing", label: "CL of Bearing", shape: lineShape(ax, ay, bx, by, PICK_PAD),
      anchor: [mid(ax, bx), mid(ay, by)], dx: x === 0 ? -80 : 80, dy: 0,
    });
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

  if (hover && zones[hover.zone]?.id === hover.id) drawHoverLabel(ctx, zones[hover.zone]);
  return zones;
}