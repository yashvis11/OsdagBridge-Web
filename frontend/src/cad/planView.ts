/**
 * planView.ts
 *
 * Plan (top view of the bridge) drawing of the bridge: girders, cross bracing, end diaphragms,
 * centre lines of bearing and dimension lines, slanted by the skew angle.
 *
 * Drawing flow:
 *   - buildPlan(p) turns the input values into a PlanModel (metres). Girder positions
 *     come from computeLayout() in layout.ts, and the number of bracing panels from the
 *     desktop rule in defaults.py: count = max(1, ceil(span / 3.0 - 1)), panels = count + 1.
 *   - drawPlan(ctx, model, view, hover) converts metres to pixels.
 *   - Each element also registers a HitZone. CadCanvas tests the mouse against them
 *     and passes the hovered type back in, so all elements of that type highlight
 *     together, as on the desktop.
 *
 * Notes:
 *   - Sizes, colours and line widths are copied from the desktop code (see style.ts).
 *   - No KEY_* strings appear here. CadViews.tsx reads them from the store's backend
 *     constants and passes short field names (span, skew, girders, ...).
 */
import type { CadModel, FormValues, HitZone, HoverState, View } from "../types/cad";
import { num, fmt, lbl } from "./num";
import { computeLayout } from "./layout";
import { toX, toY } from "./geometry";
import {
  line,
  dimH,
  dimV,
  lineShape,
  drawHoverLabel,
  resetLabels,
  textBox,
} from "./drawHelpers";
import { CAD, W, HOVER, HOVER_W, PICK_PAD, PLAN_DIM } from "./style";

export interface PlanModel extends CadModel {
  n: number;
  spacing: number;
  span: number;
  panels: number;
  bracingSpacing: number;
  width: number;
  girderY: number[];
  tanSkew: number;
  showSpan: boolean;
  showCarriageway: boolean;
  skewDeg: number;
}

// Plan view: horizontal = span, vertical = across the bridge, ends slanted by the skew angle.
//function to calculate bridge components for the plan view(bottom)
export function buildPlan(p: FormValues): PlanModel {
  const { n, girderX, hasCarriageway, labelSpacing } = computeLayout(p);
  const hasSpan = num(p.span, 0) > 0;
  const span = hasSpan ? num(p.span, 0) : 35; 
  const bracingCount = Math.round(num(p.bracingCount, 0));
  const count =
    bracingCount >= 1
      ? bracingCount
      : Math.max(
          1,
          Math.ceil(
            Number((span / num(p.bracingInitialSpacing, 3.0)).toFixed(9)) - 1,
          ),
        );
  const panels = hasSpan ? count + 1 : 10; 
  const girderY = girderX.map((_, i) => i * labelSpacing); 
  const width = Math.max(girderY[girderY.length - 1], 1);

  // Skew can be negative, so it can't go through num().
  const raw = Number(p.skew);
  const skew = Number.isFinite(raw) ? Math.max(-45, Math.min(45, raw)) : 0;
  const tanSkew = Math.tan((skew * Math.PI) / 180);
  const shift = -tanSkew * width;

  return {
    n,
    spacing: labelSpacing,
    span,
    panels,
    bracingSpacing: span / panels,
    width,
    girderY,
    tanSkew,
    bounds: {
      minX: Math.min(0, shift),
      maxX: span + Math.max(0, shift),
      minY: 0,
      maxY: width,
    },
    pad: {
      l: Math.abs(skew) > 0.1 ? 90 : 50,
      r: 150,
      t: Math.abs(skew) > 0.1 ? 135 : 60,
      b: 85,
    },
    minScale: 15, // px per metre; the plan view scrolls vertically when the bridge is very wide
    showSpan: hasSpan,
    showCarriageway: hasCarriageway,
    skewDeg: skew,
  };
}

// Skew angle indicator
function drawSkewIndicator(ctx: CanvasRenderingContext2D, rx: number, ry: number, skewDeg: number, showValue: boolean): void {
  const s = (skewDeg * Math.PI) / 180;
  const R = 70;                                        // arc radius

  ctx.save();
  ctx.strokeStyle = CAD.ink;
  ctx.fillStyle = CAD.ink;

  // 1. vertical reference line
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 3]);                            
  line(ctx, rx, ry, rx, ry - R - 20);
  ctx.setLineDash([]);

  // 2. the skewed line (solid, 2)
  ctx.lineWidth = 2;
  line(ctx, rx, ry, rx - R * Math.sin(s), ry - R * Math.cos(s));

  // 3. arc from the vertical to the skewed line (2.5). Canvas angles run clockwise from 3 o'clock,
  //    so "up" is -90 degrees and a positive skew turns anticlockwise.
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(rx, ry, R, -Math.PI / 2, -(Math.PI / 2 + s), s > 0);
  ctx.stroke();

  // 4. arrow at the end of the arc. t is the arc end angle (anticlockwise from 3 o'clock).
  const t = Math.PI / 2 + s;
  const ax = rx + R * Math.cos(t), ay = ry - R * Math.sin(t);
  const shaft = 12, head = 10, half = (18 * Math.PI) / 180;      // narrow head = sharp tip
  ctx.lineWidth = 2;
  line(ctx, ax - shaft * Math.cos(t), ay + shaft * Math.sin(t), ax, ay);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax - head * Math.cos(t - half), ay + head * Math.sin(t - half));
  ctx.lineTo(ax - head * Math.cos(t + half), ay + head * Math.sin(t + half));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 5. label, halfway round the arc, pushed left (more when the skew is negative)
  const lr = R + 25;
  const la = Math.PI / 2 + s / 2;
  const lx = rx + lr * Math.cos(la) - (skewDeg > 0 ? 10 : 70);
  const ly = ry - lr * Math.sin(la);
  const text = showValue ? `Skew = ${skewDeg >= 0 ? "+" : ""}${fmt(skewDeg, 1)}°` : "Skew";
  textBox(ctx, text, lx, ly - 8, "left", 0.94, CAD.ink, `bold ${CAD.font}`);
}

export function drawPlan(
  ctx: CanvasRenderingContext2D,
  m: PlanModel,
  v: View,
  hover: HoverState | null,
): HitZone[] {
  const X = (x: number) => toX(x, v);
  const Y = (y: number) => toY(y, v);
  const sx = (y: number) => -m.tanSkew * y; // skew shift at height y
  const gy = m.girderY;
  const zones: HitZone[] = [];
  const hot = (id: string) => hover?.id === id;
  const mid = (a: number, b: number) => (a + b) / 2;
  resetLabels();

  // cross bracing: one segment per girder pair
  ctx.strokeStyle = hot("cross_bracing") ? HOVER.grey : CAD.crossBracing;
  ctx.lineWidth = hot("cross_bracing") ? HOVER_W.planBracing : W.planBracing;
  for (let k = 1; k < m.panels; k++) {
    const x0 = k * m.bracingSpacing;
    for (let i = 0; i < gy.length - 1; i++) {
      const ax = X(x0 + sx(gy[i])),
        ay = Y(gy[i]);
      const bx = X(x0 + sx(gy[i + 1])),
        by = Y(gy[i + 1]);
      line(ctx, ax, ay, bx, by);
      zones.push({
        id: "cross_bracing",
        label: "Cross Bracing",
        shape: lineShape(ax, ay, bx, by, PICK_PAD),
        anchor: [mid(ax, bx), mid(ay, by)],
        dx: -52,
        dy: -43,
      });
    }
  }

  // girders
  ctx.strokeStyle = hot("girder") ? HOVER.grey : CAD.girder;
  ctx.lineWidth = hot("girder") ? HOVER_W.planGirder : W.planGirder;
  gy.forEach((y) => {
    const ax = X(sx(y)),
      bx = X(m.span + sx(y)),
      py = Y(y);
    line(ctx, ax, py, bx, py);
    zones.push({
      id: "girder",
      label: "Girder",
      shape: lineShape(ax, py, bx, py, PICK_PAD),
      anchor: [mid(ax, bx), py],
      dx: -25,
      dy: -35,
    });
  });

  // end diaphragms
  if (m.n > 1) {
    ctx.strokeStyle = hot("end_diaphragm") ? HOVER.grey : CAD.endDiaphragm;
    ctx.lineWidth = hot("end_diaphragm")
      ? HOVER_W.planDiaphragm
      : W.planDiaphragm;
    [0, m.span].forEach((x0) => {
      for (let i = 0; i < gy.length - 1; i++) {
        const ax = X(x0 + sx(gy[i])),
          ay = Y(gy[i]);
        const bx = X(x0 + sx(gy[i + 1])),
          by = Y(gy[i + 1]);
        const len = Math.hypot(bx - ax, by - ay) || 1;
        const px = (-(by - ay) / len) * 2,
          py = ((bx - ax) / len) * 2;
        line(ctx, ax + px, ay + py, bx + px, by + py);
        line(ctx, ax - px, ay - py, bx - px, by - py);
        zones.push({
          id: "end_diaphragm",
          label: "End Diaphragm",
          shape: lineShape(ax, ay, bx, by, PICK_PAD + 2),
          anchor: [mid(ax, bx), mid(ay, by)],
          dx: x0 === 0 ? -82 : 90,
          dy: 0,
        });
      }
    });
  }

  // CL of bearing
  const ext = Math.max(30 / v.scale, 0.3 * m.spacing);
  ctx.save();
  ctx.strokeStyle = hot("bearing") ? HOVER.grey : CAD.bearing;
  ctx.lineWidth = hot("bearing") ? HOVER_W.planBearing : W.planBearing;
  ctx.setLineDash([12, 12]);
  [0, m.span].forEach((x) => {
    const ax = X(x + sx(-ext)),
      ay = Y(-ext),
      bx = X(x + sx(m.width + ext)),
      by = Y(m.width + ext);
    line(ctx, ax, ay, bx, by);

    const g0x = X(x + sx(0)),
      g0y = Y(0);
    const g1x = X(x + sx(m.width)),
      g1y = Y(m.width);
    const side = x === 0 ? -80 : 80;
    zones.push({
      id: "bearing",
      label: "CL of Bearing",
      shape: lineShape(ax, ay, g0x, g0y, PICK_PAD),
      anchor: [mid(ax, g0x), mid(ay, g0y)],
      dx: side,
      dy: 0,
    });
    zones.push({
      id: "bearing",
      label: "CL of Bearing",
      shape: lineShape(g1x, g1y, bx, by, PICK_PAD),
      anchor: [mid(g1x, bx), mid(g1y, by)],
      dx: side,
      dy: 0,
    });
  });
  ctx.restore();

  ctx.fillStyle = CAD.ink;
  ctx.font = CAD.font;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  [0, m.span].forEach((x) =>
    ctx.fillText(
      "CL of Bearing",
      X(x + sx(m.width + ext)),
      Y(m.width + ext) - 4,
    ),
  );

  // skew angle indicator, at the left end of the top girder 
  if (Math.abs(m.skewDeg) > 0.1) {
    drawSkewIndicator(
      ctx,
      X(sx(m.width)),
      Y(m.width),
      m.skewDeg,
      m.showCarriageway,
    );
  }

  // dimensions
  dimH(
    ctx,
    X(0),
    X(m.bracingSpacing),
    Y(0) + 38,
    lbl("Bracing Spacing", m.showSpan, `${fmt(m.bracingSpacing, 2)} m`),
    true,
    undefined,
    PLAN_DIM,
  );
  dimH(
    ctx,
    X(0),
    X(m.span),
    Y(0) + 72,
    lbl("Span Length", m.showSpan, `${fmt(m.span, 1)} m`),
    true,
    undefined,
    PLAN_DIM,
  );
  if (m.n > 1) {
    dimV(
      ctx,
      X(m.span + Math.max(0, sx(m.width))) + 34,
      Y(gy[0]),
      Y(gy[1]),
      m.showCarriageway
        ? `Girder\nSpacing\n= ${fmt(m.spacing, 2)} m`
        : "Girder\nSpacing",
      PLAN_DIM,
    );
  }

  if (hover && zones[hover.zone]?.id === hover.id)
    drawHoverLabel(ctx, zones[hover.zone]);
  return zones;
}