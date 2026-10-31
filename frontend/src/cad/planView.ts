import type { CadModel, FormValues, View } from "../types/cad";
import { num } from "./num";
import { computeLayout } from "./layout";
import { toX, toY } from "./geometry";
import { line, dimH, dimV, dimHSide } from "./drawHelpers";

export interface PlanModel extends CadModel {
  n: number; spacing: number; span: number;
  panels: number; bracingSpacing: number; width: number; girderY: number[];
}

// Plan view: horizontal = span, vertical = across the bridge.
export function buildPlan(p: FormValues): PlanModel {
  const { n, spacing, girderX } = computeLayout(p);          // same layout as the cross-section
  const span = num(p.span, 20);
  // Bracing must split the span into whole panels (e.g. 20 / 7 = 2.86 m).
  const panels = Math.max(1, Math.round(span / num(p.bracingSpacing, 3.5)));  // desktop default 3.5 m
  const girderY = girderX.map((x) => x - girderX[0]);
  const width = Math.max(girderY[girderY.length - 1], 1);

  return {
    n, spacing, span, panels, bracingSpacing: span / panels, width, girderY,
    bounds: { minX: 0, maxX: span, minY: 0, maxY: width },
    pad: { l: 40, r: 200, t: 55, b: 75 },
  };
}

export function drawPlan(ctx: CanvasRenderingContext2D, m: PlanModel, v: View): void {
  const X = (x: number) => toX(x, v);
  const Y = (y: number) => toY(y, v);

  ctx.strokeStyle = "#aaa";                                  // cross bracing
  ctx.lineWidth = 1.5;
  for (let k = 0; k <= m.panels; k++) {
    line(ctx, X(k * m.bracingSpacing), Y(0), X(k * m.bracingSpacing), Y(m.width));
  }

  ctx.strokeStyle = "#555";                                  // girders
  ctx.lineWidth = 3;
  m.girderY.forEach((y) => line(ctx, X(0), Y(y), X(m.span), Y(y)));

  ctx.strokeStyle = "#000";                                  // "CL of Bearing" marks
  ctx.fillStyle = "#000";
  ctx.lineWidth = 1;
  ctx.font = "13px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  [0, m.span].forEach((x) => {
    line(ctx, X(x), Y(m.width) - 30, X(x), Y(m.width) - 10);
    ctx.fillText("CL of Bearing", X(x), Y(m.width) - 34);
  });

  dimHSide(ctx, X(0), X(m.bracingSpacing), Y(0) + 22, `Bracing Spacing = ${m.bracingSpacing.toFixed(2)} m`);
  dimH(ctx, X(0), X(m.span), Y(0) + 48, `Span Length = ${m.span.toFixed(1)} m`, false);
  if (m.n > 1) {
    dimV(ctx, X(m.span) + 30, Y(m.girderY[0]), Y(m.girderY[1]), `Girder Spacing = ${m.spacing.toFixed(2)} m`);
  }
}