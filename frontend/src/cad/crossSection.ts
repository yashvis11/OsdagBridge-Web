import type { CadModel, FormValues, View } from "../types/cad";
import { num } from "./num";
import { computeLayout, type DeckLayout } from "./layout";
import { toX, toY } from "./geometry";
import { line, dimH, concretePattern } from "./drawHelpers";

export interface CrossSectionModel extends CadModel, DeckLayout {
  deckT: number; footpathT: number; girderDepth: number; barrierH: number;
  flangeW: number; flangeT: number; webT: number;
}

// Girder proportions are read off the desktop screenshot (flange ~0.7 m, depth ~1.45 m).
export function buildCrossSection(p: FormValues): CrossSectionModel {
  const layout = computeLayout(p);
  const deckT = num(p.deckThicknessMm, 200) / 1000;
  const footpathT = num(p.footpathThicknessMm, 200) / 1000;
  const girderDepth = num(p.girderDepth, 1.45);
  const barrierH = num(p.barrierHeight, 0.9);

  return {
    ...layout,
    deckT, footpathT, girderDepth, barrierH,
    flangeW: 0.7, flangeT: 0.05, webT: 0.04,
    bounds: { minX: 0, maxX: layout.overall, minY: -girderDepth, maxY: Math.max(deckT, footpathT) + barrierH },
    pad: { l: 50, r: 50, t: 50, b: 85 },
  };
}

const GIRDER = "#c9c9bd";
const GIRDER_EDGE = "#4a4a40";
const BRACING = "#8d8d78";

export function drawCrossSection(ctx: CanvasRenderingContext2D, m: CrossSectionModel, v: View): void {
  const S = v.scale;
  const X = (x: number) => toX(x, v);
  const Y = (y: number) => toY(y, v);

  const rect = (x: number, yTop: number, w: number, h: number, fill: string | CanvasPattern) => {
    ctx.fillStyle = fill;
    ctx.fillRect(X(x), Y(yTop), w * S, h * S);
    ctx.strokeRect(X(x), Y(yTop), w * S, h * S);
  };

  // Crash barrier: vertical outer face, sloping inner face. side = -1 (left) or 1 (right).
  const barrier = (x0: number, side: 1 | -1) => {
    const w = m.barrierW;
    const outer = side === -1 ? x0 : x0 + w;
    const inner = side === -1 ? x0 + w : x0;
    ctx.beginPath();
    ctx.moveTo(X(outer), Y(m.deckT));
    ctx.lineTo(X(inner), Y(m.deckT));
    ctx.lineTo(X(inner - side * w * 0.45), Y(m.deckT + m.barrierH * 0.45));
    ctx.lineTo(X(outer + side * w * 0.2), Y(m.deckT + m.barrierH));
    ctx.lineTo(X(outer), Y(m.deckT + m.barrierH));
    ctx.closePath();
    ctx.fillStyle = concretePattern(ctx);
    ctx.fill();
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  };

  // 1. deck slab with a heavy top edge
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 1.2;
  rect(0, m.deckT, m.overall, m.deckT, concretePattern(ctx));
  ctx.lineWidth = 2.5;
  line(ctx, X(0), Y(m.deckT), X(m.overall), Y(m.deckT));

  // 2. footpaths
  ctx.lineWidth = 1.2;
  if (m.fpLeft) rect(m.railW, m.footpathT, m.footpathW, m.footpathT, "#bdbdbd");
  if (m.fpRight) rect(m.overall - m.railW - m.footpathW, m.footpathT, m.footpathW, m.footpathT, "#bdbdbd");

  // 3. barriers
  barrier(m.leftBarrierX, -1);
  barrier(m.rightBarrierX, 1);

  // 4. girders: two flanges and a web, drawn as one filled body with a centre web line
  ctx.lineWidth = 1.2;
  m.girderX.forEach((gx) => {
    ctx.strokeStyle = GIRDER_EDGE;
    rect(gx - m.flangeW / 2, 0, m.flangeW, m.girderDepth, GIRDER);                 // body
    rect(gx - m.flangeW / 2, 0, m.flangeW, m.flangeT, "#b3b3a0");                  // top flange
    rect(gx - m.flangeW / 2, -m.girderDepth + m.flangeT, m.flangeW, m.flangeT, "#b3b3a0"); // bottom flange
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1.5;
    line(ctx, X(gx - m.webT / 2), Y(-m.flangeT), X(gx - m.webT / 2), Y(-m.girderDepth + m.flangeT));
    line(ctx, X(gx + m.webT / 2), Y(-m.flangeT), X(gx + m.webT / 2), Y(-m.girderDepth + m.flangeT));
    ctx.lineWidth = 1.2;
  });

  // 5. X-bracing from girder face to girder face
  ctx.strokeStyle = BRACING;
  ctx.lineWidth = 3;
  for (let i = 0; i < m.girderX.length - 1; i++) {
    const a = m.girderX[i] + m.flangeW / 2;
    const b = m.girderX[i + 1] - m.flangeW / 2;
    const top = -m.flangeT - 0.05;
    const bot = -m.girderDepth + m.flangeT + 0.05;
    line(ctx, X(a), Y(top), X(b), Y(bot));
    line(ctx, X(a), Y(bot), X(b), Y(top));
  }

  // 6. dimensions: top row (label below the line), bottom rows (label above the line)
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

  ctx.fillStyle = "#000";
  ctx.font = "13px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(`Deck Thickness = ${Math.round(m.deckT * 1000)} mm`, X(m.overall / 2), Y(m.deckT) - 10);
}