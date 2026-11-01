import type { CadModel, FormValues, View } from "../types/cad";
import { num } from "./num";
import { computeLayout, type DeckLayout } from "./layout";
import { toX, toY } from "./geometry";
import { line, dimH, concretePattern } from "./drawHelpers";
import { CAD, W } from "./style"

export interface CrossSectionModel extends CadModel, DeckLayout {
  deckT: number; footpathT: number; girderDepth: number; barrierH: number;
  flangeW: number; flangeT: number; webT: number;
}

// Girder proportions are read off the desktop screenshot (flange ~0.7 m, depth ~1.45 m).
const ceil10 = (v: number) => Math.ceil(+(v / 0.01).toFixed(6)) * 0.01;   // desktop ceil_to_size_increment
// Approximate display exaggeration measured from the desktop screenshot.
// TODO: replace with girder_visual_scale['depth'] and ['flange_width'] from cad_cross_section.py
const VIS_DEPTH = 1.09, VIS_FLANGE_W = 1.6;

export function buildCrossSection(p: FormValues): CrossSectionModel {
  const layout = computeLayout(p);
  const span = num(p["geometry.span"], 20);
  const deckT = num(p["typical_section.deck_thickness"], 200) / 1000;
  const footpathT = num(p["typical_section.footpath_thickness"], 200) / 1000;
  const D = num(p["member_properties.girder_details.section_input.depth"], ceil10(span / 18));          // desktop: D = span / 18
  const bf = ceil10(0.3 * D);                               // desktop: bf = 0.3 D
  const girderDepth = D * VIS_DEPTH;
  const flangeW = bf * VIS_FLANGE_W;
  const barrierH = num(p.barrierHeight, 0.9);

  return {
    ...layout,
    deckT, footpathT, girderDepth, barrierH,
    flangeW, flangeT: 0.05, webT: 0.04,                     // TODO: tf = bf/24, tw = (D-2tf)/200 times visual scale
    bounds: { minX: 0, maxX: layout.overall, minY: -girderDepth, maxY: Math.max(deckT, footpathT) + barrierH },
    pad: { l: 50, r: 50, t: 50, b: 85 },
  };
}



// IRC-5 RCC crash barrier profile, metres (offsets from the inner edge).
const RIGHT_AT_MID = 0.300;   // desktop: 300 mm
const RIGHT_AT_TOP = 0.225;   // desktop: 225 mm
const LEFT_AT_TOP  = 0.050;   // desktop: 50 mm
const BASE_H = 0.10;          // TODO: y_base_top, check CrashBarrierGeometry in irc5_geometry.py
const MID_H  = 0.35;          // TODO: y_mid (350 mm in the plan view code), confirm
const BRACE_HALF_W = 2;       // TODO: half band width in px; desktop derives it from web_thickness

export function drawCrossSection(ctx: CanvasRenderingContext2D, m: CrossSectionModel, v: View): void {
  const S = v.scale;
  const X = (x: number) => toX(x, v);
  const Y = (y: number) => toY(y, v);

  const rect = (x: number, yTop: number, w: number, h: number, fill: string | CanvasPattern) => {
    ctx.fillStyle = fill;
    ctx.fillRect(X(x), Y(yTop), w * S, h * S);
    ctx.strokeRect(X(x), Y(yTop), w * S, h * S);
  };

  // 7-point barrier. xi = inner edge, d = +1 (right barrier) or -1 (left barrier).
  const barrier = (xi: number, d: 1 | -1) => {
    const yb = m.deckT, ybt = yb + BASE_H, ymid = yb + MID_H, ytop = yb + m.barrierH;
    const pts: [number, number][] = [
      [0, yb], [m.barrierW, yb], [m.barrierW, ybt],
      [RIGHT_AT_MID, ymid], [RIGHT_AT_TOP, ytop], [LEFT_AT_TOP, ytop], [0, ybt],
    ];
    ctx.beginPath();
    pts.forEach(([dx, y], i) => {
      const px = X(xi + d * dx), py = Y(y);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = concretePattern(ctx);
    ctx.fill();
    ctx.strokeStyle = CAD.outlineGrey;
    ctx.lineWidth = W.barrierEdge;
    ctx.stroke();
  };

  // bracing band: pale fill + two darker edge lines
  const band = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const ox = (-dy / len) * BRACE_HALF_W, oy = (dx / len) * BRACE_HALF_W;
    ctx.fillStyle = CAD.crossBracing;
    ctx.beginPath();
    ctx.moveTo(x1 + ox, y1 + oy); ctx.lineTo(x2 + ox, y2 + oy);
    ctx.lineTo(x2 - ox, y2 - oy); ctx.lineTo(x1 - ox, y1 - oy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = CAD.crossBracingEdge;
    ctx.lineWidth = W.bracingEdge;
    line(ctx, x1 + ox, y1 + oy, x2 + ox, y2 + oy);
    line(ctx, x1 - ox, y1 - oy, x2 - ox, y2 - oy);
  };

  // 1. deck: textured fill, grey outline on three sides, dark wearing coat on top
  ctx.fillStyle = concretePattern(ctx);
  ctx.fillRect(X(0), Y(m.deckT), m.overall * S, m.deckT * S);
  ctx.strokeStyle = CAD.outlineGrey;
  ctx.lineWidth = W.deckEdge;
  line(ctx, X(0), Y(0), X(m.overall), Y(0));
  line(ctx, X(0), Y(m.deckT), X(0), Y(0));
  line(ctx, X(m.overall), Y(m.deckT), X(m.overall), Y(0));
  ctx.strokeStyle = CAD.wearingCoat;         // TODO: desktop uses a filled band; thickness not in dump
  ctx.lineWidth = 3;
  line(ctx, X(0), Y(m.deckT), X(m.overall), Y(m.deckT));

  // 2. footpaths
  ctx.strokeStyle = CAD.outlineGrey;
  ctx.lineWidth = W.deckEdge;
  if (m.fpLeft) rect(m.railW, m.footpathT, m.footpathW, m.footpathT, concretePattern(ctx));
  if (m.fpRight) rect(m.overall - m.railW - m.footpathW, m.footpathT, m.footpathW, m.footpathT, concretePattern(ctx));

  // 3. barriers
  barrier(m.leftBarrierX + m.barrierW, -1);
  barrier(m.rightBarrierX, 1);

  
   // 4. girders: bottom flange, web, top flange (desktop draw_i_section)
   // 4. girders: three rects + chamfered stiffeners (desktop draw_i_section + draw_stiffeners)
  const bfTop = m.flangeW, bfBot = m.flangeW;
  const tfTop = m.flangeT, tfBot = m.flangeT;
  const tw = m.webT;
  const webH = m.girderDepth - tfTop - tfBot;
  const stiffW = (m.flangeW - m.webT) / 2;            // TODO: desktop uses self.stiffener['width']
  const chamfer = Math.min(stiffW, tfTop) * 1.3;      // same formula as the desktop
  const sT = -tfTop;                                  // stiffener top (world y)
  const sB = -m.girderDepth + tfBot;                  // stiffener bottom

  const poly = (pts: [number, number][], fill: string) => {
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(X(px), Y(py)) : ctx.moveTo(X(px), Y(py))));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.stroke();
  };

  m.girderX.forEach((gx) => {
    ctx.strokeStyle = CAD.ink;
    ctx.lineWidth = W.girderEdge;
    rect(gx - bfBot / 2, -m.girderDepth + tfBot, bfBot, tfBot, CAD.girder);   // bottom flange
    rect(gx - tw / 2, -tfTop, tw, webH, CAD.girder);                          // web
    rect(gx - bfTop / 2, 0, bfTop, tfTop, CAD.girder);                        // top flange

    ctx.lineWidth = W.stiffenerEdge;
    const lx1 = gx - tw / 2 - stiffW, rx1 = gx - tw / 2;                      // left stiffener
    poly([[lx1, sT], [rx1 - chamfer, sT], [rx1, sT - chamfer],
          [rx1, sB + chamfer], [rx1 - chamfer, sB], [lx1, sB]], CAD.stiffener);
    const lx2 = gx + tw / 2, rx2 = lx2 + stiffW;                              // right stiffener
    poly([[lx2 + chamfer, sT], [rx2, sT], [rx2, sB],
          [lx2 + chamfer, sB], [lx2, sB + chamfer], [lx2, sT - chamfer]], CAD.stiffener);
  });

  // 5. X-bracing bands
  for (let i = 0; i < m.girderX.length - 1; i++) {
    const a = X(m.girderX[i] + m.webT / 2);
    const b = X(m.girderX[i + 1] - m.webT / 2);
    const top = Y(-m.flangeT - 0.05);
    const bot = Y(-m.girderDepth + m.flangeT + 0.05);
    band(a, top, b, bot);
    band(a, bot, b, top);
  }

  // 6. dimensions (unchanged)
  const topY = Y(m.deckT + m.barrierH) - 24;
  const deckTopY = Y(m.deckT);
  const gBottom = Y(-m.girderDepth);

  if (m.fpLeft) {
    dimH(ctx, X(m.railW), X(m.leftBarrierX), topY, `Footpath Width = ${m.footpathW.toFixed(2)} m`, false, deckTopY);
  }
  if (m.fpRight) {
    dimH(ctx, X(m.rightBarrierX + m.barrierW), X(m.overall - m.railW), topY,
         `Footpath Width = ${m.footpathW.toFixed(2)} m`, false, deckTopY);
  }
  dimH(ctx, X(m.leftBarrierX + m.barrierW), X(m.rightBarrierX), topY,
       `Carriageway Width = ${m.carriagewayW.toFixed(2)} m`, false, deckTopY);

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
  ctx.fillText(`Deck Thickness = ${Math.round(m.deckT * 1000)} mm`, X(m.overall / 2), Y(m.deckT) - 10);
}