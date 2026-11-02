import type { FormValues } from "../types/cad";
import { num, toM } from "./num";

export interface DeckLayout {
  n: number; overhang: number; spacing: number; overall: number;
  carriagewayW: number; barrierW: number; railW: number;
  footpathW: number; fpLeft: boolean; fpRight: boolean;
  hasMedian: boolean; medianW: number; medianX0: number; medianX1: number;
  cw1: [number, number]; cw2: [number, number] | null;   // carriageway x-ranges
  leftBarrierX: number; rightBarrierX: number;
  girderX: number[];
}

export function computeLayout(p: FormValues): DeckLayout {
  const carriagewayW = num(p.carriagewayWidth, 10);                // each way
  const barrierW = toM(num(p.barrierWidth, 0.45));                 // IRC 5 RCC crash barrier bottom_width 450 mm
  const railW = toM(num(p.railingWidth, 0.375, true));
  const footpathW = toM(num(p.footpathWidth, 1.5, true));

  const hasMedian = String(p.includeMedian ?? "No") === "Yes";
  const medianW = hasMedian ? toM(num(p.medianWidth, 1.2)) : 0;    // desktop MedianGeometry width 1200 mm

  const cfg = String(p.footpath ?? "None");                        // None | Single Side | Both Sides
  const fpLeft = footpathW > 0 && (cfg === "Single Side" || cfg === "Both Sides");
  const fpRight = footpathW > 0 && cfg === "Both Sides";
  const fpBlock = footpathW + railW;                               // footpath plus its railing
  const blockL = fpLeft ? fpBlock : 0;
  const blockR = fpRight ? fpBlock : 0;

  // left to right: [railing|footpath] barrier carriageway [median carriageway] barrier [footpath|railing]
  const leftBarrierX = blockL;
  const cw1: [number, number] = [leftBarrierX + barrierW, leftBarrierX + barrierW + carriagewayW];
  const medianX0 = cw1[1];
  const medianX1 = medianX0 + medianW;
  const cw2: [number, number] | null = hasMedian ? [medianX1, medianX1 + carriagewayW] : null;
  const rightBarrierX = (cw2 ?? cw1)[1];
  const overall = rightBarrierX + barrierW + blockR;

  // desktop BridgeConfigurationSolver: "girders" case (overhang = spacing / 2, n * spacing = overall),
  // or the "overhang" case when the user typed an overhang
  // TODO: the default-n rule is a guess (fits 4 desktop screenshots); the real one is in defaults.py
  const nGiven = Math.round(num(p.girders, 0));
  const n = nGiven >= 2 ? nGiven : Math.max(2, Math.ceil(overall / num(p.defaultGirderSpacing, 2.5)));
  const overhangGiven = toM(num(p.overhang, 0));
  const overhang = overhangGiven > 0 ? overhangGiven : overall / n / 2;
  const spacing = overhangGiven > 0 ? (overall - 2 * overhang) / (n - 1) : overall / n;
  const girderX = Array.from({ length: n }, (_, i) => overhang + i * spacing);

  return {
    n, overhang, spacing, overall, carriagewayW, barrierW, railW,
    footpathW, fpLeft, fpRight, hasMedian, medianW, medianX0, medianX1, cw1, cw2,
    leftBarrierX, rightBarrierX, girderX,
  };
}