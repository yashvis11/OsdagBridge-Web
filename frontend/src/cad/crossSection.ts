import type { CadModel, FormValues, View } from "../types/cad";
import { num } from "./num";
import { computeLayout, type DeckLayout } from "./layout";
import { toX, toY } from "./geometry";
import { line, dimH, concretePattern } from "./drawHelpers";

export interface CrossSectionModel extends CadModel, DeckLayout {
  deckT: number; footpathT: number; girderDepth: number; barrierH: number;
  flangeW: number; flangeT: number; webT: number;
}

export function buildCrossSection(p: FormValues): CrossSectionModel {
  const layout = computeLayout(p);
  const deckT = num(p.deckThicknessMm, 200) / 1000;          // desktop default 200 mm
  const footpathT = num(p.footpathThicknessMm, 200) / 1000;  // desktop default 200 mm
  const girderDepth = num(p.girderDepth, 1.2);               // placeholder
  const barrierH = num(p.barrierHeight, 1.0);                // placeholder

  return {
    ...layout,
    deckT, footpathT, girderDepth, barrierH,
    flangeW: 0.3, flangeT: 0.025, webT: 0.012,               // placeholders: desktop self.girder
    bounds: { minX: 0, maxX: layout.overall, minY: -girderDepth, maxY: Math.max(deckT, footpathT) + barrierH },
    // pad: { l: 60, r: 60, t: 70, b: 150 },
    pad: { l: 40, r: 40, t: 45, b: 95 },
  };
}

export function drawCrossSection(ctx: CanvasRenderingContext2D, m: CrossSectionModel, v: View): void {
  const S = v.scale;
  const X = (x: number) => toX(x, v);
  const Y = (y: number) => toY(y, v);

  // Rectangle given in metres: (x, yTop) is its top-left corner.
  const rect = (x: number, yTop: number, w: number, h: number, fill: string | CanvasPattern) => {
    ctx.fillStyle = fill;
    ctx.fillRect(X(x), Y(yTop), w * S, h * S);
    ctx.strokeRect(X(x), Y(yTop), w * S, h * S);
  };

  const barrier = (x0: number) => {
    ctx.beginPath();
    ctx.moveTo(X(x0), Y(m.deckT));
    ctx.lineTo(X(x0 + m.barrierW), Y(m.deckT));
    ctx.lineTo(X(x0 + m.barrierW * 0.75), Y(m.deckT + m.barrierH));
    ctx.lineTo(X(x0 + m.barrierW * 0.25), Y(m.deckT + m.barrierH));
    ctx.closePath();
    ctx.fillStyle = "#d9d9d9";
    ctx.fill();
    ctx.stroke();
  };

  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.5;

  // Layer order: later shapes paint over earlier ones.
  rect(0, m.deckT, m.overall, m.deckT, concretePattern(ctx));                          // deck slab
  if (m.fpLeft) rect(m.railW, m.footpathT, m.footpathW, m.footpathT, "#bbbbbb");       // footpaths
  if (m.fpRight) rect(m.overall - m.railW - m.footpathW, m.footpathT, m.footpathW, m.footpathT, "#bbbbbb");
  barrier(m.leftBarrierX);                                                             // crash barriers
  barrier(m.rightBarrierX);

  ctx.lineWidth = 1;                                                                   // girders (I-shape)
  m.girderX.forEach((gx) => {
    rect(gx - m.flangeW / 2, 0, m.flangeW, m.flangeT, "#d0d0d0");
    rect(gx - m.webT / 2, -m.flangeT, m.webT, m.girderDepth - 2 * m.flangeT, "#d0d0d0");
    rect(gx - m.flangeW / 2, -m.girderDepth + m.flangeT, m.flangeW, m.flangeT, "#d0d0d0");
  });

  ctx.strokeStyle = "#666";                                                            // X bracing
  ctx.lineWidth = 2;
  for (let i = 0; i < m.girderX.length - 1; i++) {
    const a = m.girderX[i];
    const b = m.girderX[i + 1];
    line(ctx, X(a), Y(-0.1), X(b), Y(-m.girderDepth + 0.1));
    line(ctx, X(a), Y(-m.girderDepth + 0.1), X(b), Y(-0.1));
  }

  // Dimensions last so nothing covers them.
  const bottomY = Y(-m.girderDepth);
  const topY = Y(m.deckT + m.barrierH) - 18;

  if (m.n > 2) {                       // second pair, like the desktop, so it clears the overhang label
    dimH(ctx, X(m.girderX[1]), X(m.girderX[2]), bottomY + 22, `Girder Spacing = ${m.spacing.toFixed(2)} m`, false);
  } else if (m.n === 2) {
    dimH(ctx, X(m.girderX[0]), X(m.girderX[1]), bottomY + 22, `Girder Spacing = ${m.spacing.toFixed(2)} m`, false);
  }
  dimH(ctx, X(0), X(m.girderX[0]), bottomY + 44, `Overhang = ${m.overhang.toFixed(2)} m`, false);
  dimH(ctx, X(0), X(m.overall), bottomY + 66, `Overall Bridge Width = ${m.overall.toFixed(2)} m`, false);

  if (m.fpLeft) {
    dimH(ctx, X(m.railW), X(m.leftBarrierX), topY, `Footpath Width = ${m.footpathW.toFixed(2)} m`);
  }
  if (m.fpRight) {
    dimH(ctx, X(m.rightBarrierX + m.barrierW), X(m.overall - m.railW), topY, `Footpath Width = ${m.footpathW.toFixed(2)} m`);
  }
  dimH(ctx, X(m.leftBarrierX + m.barrierW), X(m.rightBarrierX), topY, `Carriageway Width = ${m.carriagewayW.toFixed(2)} m`);

  ctx.fillStyle = "#000";
  ctx.font = "13px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(`Deck Thickness = ${Math.round(m.deckT * 1000)} mm`, X(m.overall / 2), Y(m.deckT) - 6);
}