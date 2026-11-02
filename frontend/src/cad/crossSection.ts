import type { CadModel, FormValues, HitZone, HoverState, View } from "../types/cad";
import { num, toM } from "./num";
import { computeLayout, type DeckLayout } from "./layout";
import { toX, toY } from "./geometry";
import { line, dimH, dimV, concretePattern, rectShape, polyShape, lineShape, drawHoverLabel } from "./drawHelpers";
import { CAD, W, HOVER, CROSS_DIM } from "./style";

export interface CrossSectionModel extends CadModel, DeckLayout {
  deckT: number; footpathT: number; girderDepth: number; barrierH: number;
  flangeW: number; flangeT: number; webT: number;
}

// Desktop CAD defaults (cad_cross_section.py: self.girder x girder_visual_scale, self.stiffener), metres.
const GIRDER_D = 0.500 * 3.0;
const FLANGE_W = 0.180 * 3.75;
const FLANGE_T = 0.022 * 4.05;
const WEB_T    = 0.015 * 3.75;
const STIFF_W  = 0.312;
const STIFF_CHAMFER = Math.min(STIFF_W, 0.022 * 3.0) * 1.3;
const RAIL_H = 1.1;                 // RailingGeometry height 1100 mm

export function buildCrossSection(p: FormValues): CrossSectionModel {
  const layout = computeLayout(p);
  const deckT = num(p.deckThicknessMm, 250) / 1000;            // desktop screenshots show 250 mm
  const footpathT = num(p.footpathThicknessMm, 100) / 1000;    // desktop shows 100 mm
  const barrierH = toM(num(p.barrierHeight, 0.9));             // IRC 5 RCC crash barrier total_height 900 mm
  const hasFp = layout.fpLeft || layout.fpRight;
  const LABEL_PAD = 170;                                       // room for the footpath-thickness label

  return {
    ...layout,
    deckT, footpathT, girderDepth: GIRDER_D, barrierH,
    flangeW: FLANGE_W, flangeT: FLANGE_T, webT: WEB_T,
    bounds: {
      minX: 0, maxX: layout.overall, minY: -GIRDER_D,
      maxY: Math.max(deckT + barrierH, hasFp ? footpathT + RAIL_H : 0),
    },
    pad: {
      l: layout.fpLeft ? LABEL_PAD : 50,
      r: !layout.fpLeft && layout.fpRight ? LABEL_PAD : 50,
      t: 50 + (layout.hasMedian ? 44 : 0),                     // extra row for the median dimension
      b: 85,
    },
  };
}

// IRC-5 RCC crash barrier profile, metres, offsets from the VERTICAL (outer) face.
const RIGHT_AT_MID = 0.300;
const RIGHT_AT_TOP = 0.225;
const LEFT_AT_TOP  = 0.050;
const BASE_H = 0.10;          // base_vertical 100 mm
const MID_H  = 0.35;          // mid_offset 350 mm (not verified in draw_crash_barrier)
const BRACE_HALF_W = 2;       // TODO: desktop derives the band width from web thickness

const lighten = (rgb: string, d: number): string => {
  const [r, g, b] = (rgb.match(/\d+/g) ?? ["0", "0", "0"]).map(Number);
  return `rgb(${Math.min(255, r + d)},${Math.min(255, g + d)},${Math.min(255, b + d)})`;
};

export function drawCrossSection(
  ctx: CanvasRenderingContext2D, m: CrossSectionModel, v: View, hover: HoverState | null
): HitZone[] {
  const S = v.scale;
  const X = (x: number) => toX(x, v);
  const Y = (y: number) => toY(y, v);
  const zones: HitZone[] = [];
  const hot = (id: string) => hover?.id === id;

  const rect = (x: number, yTop: number, w: number, h: number, fill: string | CanvasPattern) => {
    ctx.fillStyle = fill;
    ctx.fillRect(X(x), Y(yTop), w * S, h * S);
    ctx.strokeRect(X(x), Y(yTop), w * S, h * S);
  };

  const trace = (pts: [number, number][]) => {
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
  };

  const poly = (pts: [number, number][], fill: string) => {     // world coordinates
    trace(pts.map(([px, py]) => [X(px), Y(py)] as [number, number]));
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.stroke();
  };

  // 7-point barrier. xi = the VERTICAL face, d = +1 (extends right of xi) or -1 (extends left of xi).
  // The sloped, road-side face is the far side, as in the desktop.
  const barrier = (id: string, label: string, xi: number, d: 1 | -1) => {
    const yb = m.deckT, ybt = yb + BASE_H, ymid = yb + MID_H, ytop = yb + m.barrierH;
    const wp: [number, number][] = [
      [0, yb], [m.barrierW, yb], [m.barrierW, ybt],
      [RIGHT_AT_MID, ymid], [RIGHT_AT_TOP, ytop], [LEFT_AT_TOP, ytop], [0, ybt],
    ];
    const pts = wp.map(([dx, y]) => [X(xi + d * dx), Y(y)] as [number, number]);
    trace(pts);
    ctx.fillStyle = hot(id) ? HOVER.fill : concretePattern(ctx);
    ctx.fill();
    ctx.strokeStyle = CAD.outlineGrey;
    ctx.lineWidth = W.barrierEdge;
    ctx.stroke();
    zones.push({
      id, label, shape: polyShape(pts),
      anchor: [X(xi + d * (LEFT_AT_TOP + RIGHT_AT_TOP) / 2), Y(ytop)], dx: 0, dy: -18,
    });
  };

  // bracing band: pale fill + two darker edge lines
  const band = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const ox = (-dy / len) * BRACE_HALF_W, oy = (dx / len) * BRACE_HALF_W;
    ctx.fillStyle = hot("cross_bracing") ? HOVER.bracingFill : CAD.crossBracing;
    ctx.beginPath();
    ctx.moveTo(x1 + ox, y1 + oy); ctx.lineTo(x2 + ox, y2 + oy);
    ctx.lineTo(x2 - ox, y2 - oy); ctx.lineTo(x1 - ox, y1 - oy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = CAD.crossBracingEdge;
    ctx.lineWidth = W.bracingEdge;
    line(ctx, x1 + ox, y1 + oy, x2 + ox, y2 + oy);
    line(ctx, x1 - ox, y1 - oy, x2 - ox, y2 - oy);
    zones.push({
      id: "cross_bracing", label: "Cross Bracing", shape: lineShape(x1, y1, x2, y2, 6),
      anchor: [(x1 + x2) / 2, (y1 + y2) / 2], dx: 50, dy: 34,
    });
  };

  // 1. deck: full height under the carriageways, notched down to the footpath thickness under footpaths
  const xL = m.leftBarrierX, xR = m.rightBarrierX + m.barrierW;
  const hL = m.fpLeft ? m.footpathT : m.deckT;
  const hR = m.fpRight ? m.footpathT : m.deckT;
  const deckPts: [number, number][] = [
    [0, 0], [m.overall, 0], [m.overall, hR], [xR, hR], [xR, m.deckT], [xL, m.deckT], [xL, hL], [0, hL],
  ];
  const deckScreen = deckPts.map(([px, py]) => [X(px), Y(py)] as [number, number]);
  trace(deckScreen);
  ctx.fillStyle = concretePattern(ctx);
  ctx.fill();
  if (hot("deck")) { ctx.fillStyle = HOVER.deckOverlay; ctx.fill(); }
  ctx.strokeStyle = CAD.outlineGrey;
  ctx.lineWidth = W.deckEdge;
  ctx.stroke();
  zones.push({
    id: "deck", label: "Deck", shape: polyShape(deckScreen),
    anchor: [X(m.overall / 2), Y(0)], dx: 70, dy: 40,
  });

  // wearing coat: only over the carriageways
  ctx.strokeStyle = CAD.wearingCoat;       // TODO: desktop draws a cambered band; thickness not known
  ctx.lineWidth = 3;
  [m.cw1, m.cw2].forEach((cw) => {
    if (cw) line(ctx, X(cw[0]), Y(m.deckT), X(cw[1]), Y(m.deckT));
  });

  // 2. footpaths and railings (railing drawing is approximated from the screenshot)
  const fps: { fx: number; rx: number }[] = [];
  if (m.fpLeft) fps.push({ fx: m.railW, rx: 0 });
  if (m.fpRight) fps.push({ fx: m.overall - m.railW - m.footpathW, rx: m.overall - m.railW });
  fps.forEach(({ fx, rx }) => {
    const sx = X(fx), sy = Y(m.footpathT), sw = m.footpathW * S, sh = m.footpathT * S;
    if (hot("footpath")) {
      ctx.fillStyle = HOVER.fill; ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = CAD.outlineGrey; ctx.lineWidth = W.deckEdge; ctx.strokeRect(sx, sy, sw, sh);
    }
    zones.push({
      id: "footpath", label: "Footpath", shape: rectShape(sx, sy - 6, sw, sh + 6),
      anchor: [sx + sw / 2, sy + sh / 2], dx: 0, dy: -45,
    });

    const rx0 = X(rx), ry = Y(m.footpathT + RAIL_H), rw = m.railW * S, rh = RAIL_H * S;
    ctx.fillStyle = hot("railing") ? HOVER.fill : CAD.railing;
    ctx.fillRect(rx0, ry, rw, rh);
    ctx.strokeStyle = CAD.ink; ctx.lineWidth = 1;
    ctx.strokeRect(rx0, ry, rw, rh);
    const sq = rw * 0.6;
    [0.2, 0.47, 0.72].forEach((f) => {                       // three rails seen end-on
      ctx.fillStyle = "rgb(150,150,150)";
      ctx.fillRect(rx0 + (rw - sq) / 2, ry + rh * f - sq / 2, sq, sq);
      ctx.lineWidth = 0.8;
      ctx.strokeRect(rx0 + (rw - sq) / 2, ry + rh * f - sq / 2, sq, sq);
    });
    zones.push({
      id: "railing", label: "Railing", shape: rectShape(rx0, ry, rw, rh),
      anchor: [rx0 + rw / 2, ry + rh / 2], dx: rx === 0 ? -50 : 50, dy: -14,
    });
  });

  // 3. outer crash barriers: vertical face outside, sloped face towards the road
  barrier("crash_barrier", "Crash Barrier", m.leftBarrierX, 1);
  barrier("crash_barrier", "Crash Barrier", m.rightBarrierX + m.barrierW, -1);

  // 3b. median: two back-to-back barriers with a gap (RCC crash barrier median; other types not drawn yet)
  if (m.hasMedian) {
    barrier("median", "Median", m.medianX0 + m.barrierW, -1);
    barrier("median", "Median", m.medianX1 - m.barrierW, 1);
  }

  // 4. girders: three rects + chamfered stiffeners (desktop draw_i_section + draw_stiffeners)
  const bfTop = m.flangeW, bfBot = m.flangeW;
  const tfTop = m.flangeT, tfBot = m.flangeT;
  const tw = m.webT;
  const webH = m.girderDepth - tfTop - tfBot;
  const sT = -tfTop;
  const sB = -m.girderDepth + tfBot;
  const girderFill = hot("girder") ? lighten(CAD.girder, HOVER.girderLighten) : CAD.girder;

  m.girderX.forEach((gx) => {
    ctx.strokeStyle = CAD.ink;
    ctx.lineWidth = W.girderEdge;
    rect(gx - bfBot / 2, -m.girderDepth + tfBot, bfBot, tfBot, girderFill);   // bottom flange
    rect(gx - tw / 2, -tfTop, tw, webH, girderFill);                          // web
    rect(gx - bfTop / 2, 0, bfTop, tfTop, girderFill);                        // top flange

    ctx.lineWidth = W.stiffenerEdge;
    const c = STIFF_CHAMFER;
    const lx1 = gx - tw / 2 - STIFF_W, rx1 = gx - tw / 2;
    poly([[lx1, sT], [rx1 - c, sT], [rx1, sT - c],
          [rx1, sB + c], [rx1 - c, sB], [lx1, sB]], CAD.stiffener);
    const lx2 = gx + tw / 2, rx2 = lx2 + STIFF_W;
    poly([[lx2 + c, sT], [rx2, sT], [rx2, sB],
          [lx2 + c, sB], [lx2, sB + c], [lx2, sT - c]], CAD.stiffener);

    zones.push({
      id: "girder", label: "Girder",
      shape: rectShape(X(gx - bfTop / 2), Y(0), bfTop * S, m.girderDepth * S),
      anchor: [X(gx), Y(-m.girderDepth / 2)], dx: 55, dy: 38,
    });
  });

  // 5. X-bracing bands (web face to web face, drawn over the stiffeners)
  for (let i = 0; i < m.girderX.length - 1; i++) {
    const a = X(m.girderX[i] + m.webT / 2);
    const b = X(m.girderX[i + 1] - m.webT / 2);
    const top = Y(-m.flangeT - 0.05);
    const bot = Y(-m.girderDepth + m.flangeT + 0.05);
    band(a, top, b, bot);
    band(a, bot, b, top);
  }

  // 6. dimensions
  const topY = Y(m.deckT + m.barrierH) - 24;
  const deckTopY = Y(m.deckT);
  const fpTopY = Y(m.footpathT);
  const gBottom = Y(-m.girderDepth);

  if (m.fpLeft) {
    dimH(ctx, X(m.railW), X(m.leftBarrierX), topY, `Footpath Width = ${m.footpathW.toFixed(2)} m`, false, fpTopY);
  }
  if (m.fpRight) {
    dimH(ctx, X(m.rightBarrierX + m.barrierW), X(m.overall - m.railW), topY,
         `Footpath Width = ${m.footpathW.toFixed(2)} m`, false, fpTopY);
  }
  dimH(ctx, X(m.cw1[0]), X(m.cw1[1]), topY, `Carriageway Width = ${m.carriagewayW.toFixed(2)} m`, false, deckTopY);
  if (m.cw2) {
    dimH(ctx, X(m.cw2[0]), X(m.cw2[1]), topY, `Carriageway Width = ${m.carriagewayW.toFixed(2)} m`, false, deckTopY);
  }
  if (m.hasMedian) {
    dimH(ctx, X(m.medianX0), X(m.medianX1), topY - 44, `Median = ${m.medianW.toFixed(2)} m`, false, deckTopY);
  }

  // footpath thickness: small vertical dimension just outside the bridge
  if (m.fpLeft) {
    dimV(ctx, X(0) - 10, Y(m.footpathT), Y(0),
         `Footpath\nThickness = ${Math.round(m.footpathT * 1000)} mm`, CROSS_DIM, "left");
  } else if (m.fpRight) {
    dimV(ctx, X(m.overall) + 10, Y(m.footpathT), Y(0),
         `Footpath\nThickness = ${Math.round(m.footpathT * 1000)} mm`, CROSS_DIM, "right");
  }

  dimH(ctx, X(0), X(m.girderX[0]), gBottom + 28, `Overhang = ${m.overhang.toFixed(2)} m`, true, gBottom);
  if (m.n > 2) {
    dimH(ctx, X(m.girderX[1]), X(m.girderX[2]), gBottom + 28, `Girder Spacing = ${m.spacing.toFixed(2)} m`, true, gBottom);
  } else if (m.n === 2) {
    dimH(ctx, X(m.girderX[0]), X(m.girderX[1]), gBottom + 28, `Girder Spacing = ${m.spacing.toFixed(2)} m`, true, gBottom);
  }
  dimH(ctx, X(0), X(m.overall), gBottom + 66, `Overall Bridge Width = ${m.overall.toFixed(2)} m`, true, gBottom);

  ctx.fillStyle = CAD.ink;
  ctx.font = CAD.font;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(`Deck Thickness = ${Math.round(m.deckT * 1000)} mm`,
               X((m.cw1[0] + m.cw1[1]) / 2), Y(m.deckT) - 10);

  // hover label last, on top of everything
  if (hover && zones[hover.zone]?.id === hover.id) drawHoverLabel(ctx, zones[hover.zone]);
  return zones;
}