/**
 * layout.ts
 *
 * Shared layout used by both views: overall bridge width, carriageway, median and
 * footpath positions, girder count, spacing, overhang and girder x-positions.
 *
 * Rules copied from the desktop (defaults.py, initial_sizing.py):
 *   - Overall width = carriageway(s) + 2 barriers + median + footpath blocks
 *     (footpath + railing).
 *   - Girder count n = max(2, ceil(overall / 2.5)).
 *   - Spacing = overall / n and overhang = spacing / 2. If an overhang is given,
 *     spacing = (overall - 2 * overhang) / (n - 1).
 *
 * Notes:
 *   - Both views call computeLayout(), so a change here changes both.
 *   - Widths above 10 are treated as millimetres (toM in num.ts), as on the desktop.
 *   - Defaults used when the form does not supply a value: barrier 0.45 m, railing
 *     0.375 m, footpath 1.5 m, median 1.2 m.
 */

import type { FormValues } from "../types/cad";
import { num, toM } from "./num";

export interface DeckLayout {
  n: number;
  overhang: number;
  spacing: number;
  overall: number;
  carriagewayW: number;
  barrierW: number;
  railW: number;
  footpathW: number;
  fpLeft: boolean;
  fpRight: boolean;
  hasMedian: boolean;
  medianW: number;
  medianX0: number;
  medianX1: number;
  cw1: [number, number];
  cw2: [number, number] | null; // carriageway x-ranges
  leftBarrierX: number;
  rightBarrierX: number;
  girderX: number[];
  hasCarriageway: boolean;
  labelSpacing: number;
  labelOverhang: number;
}

const PLACEHOLDER = { n: 4, spacing: 2.75, overhang: 1.0 };
export function computeLayout(p: FormValues): DeckLayout {
  const hasCarriageway = num(p.carriagewayWidth, 0) > 0; // false until the user types a value
  const hasSpan = num(p.span, 0) > 0;
  const solved = hasSpan && hasCarriageway; 
  const carriagewayW = hasCarriageway ? num(p.carriagewayWidth, 0) : 9.35; 
  const barrierW = toM(num(p.barrierWidth, 0.45));
  const railW = toM(num(p.railingWidth, 0.375, true));
  const footpathW = toM(num(p.footpathWidth, 1.5, true));

  const hasMedian = String(p.includeMedian ?? "No") === "Yes";
  const medianW = hasMedian ? toM(num(p.medianWidth, 1.2)) : 0;

  const cfg = String(p.footpath ?? "None"); // None | Single Side | Both Sides
  const fpLeft =
    footpathW > 0 && (cfg === "Single Side" || cfg === "Both Sides");
  const fpRight = footpathW > 0 && cfg === "Both Sides";
  const fpBlock = footpathW + railW; // footpath plus its railing
  const blockL = fpLeft ? fpBlock : 0;
  const blockR = fpRight ? fpBlock : 0;

  // left to right: [railing|footpath] barrier carriageway [median carriageway] barrier [footpath|railing]
  const leftBarrierX = blockL;
  const cw1: [number, number] = [
    leftBarrierX + barrierW,
    leftBarrierX + barrierW + carriagewayW,
  ]; //the start and end coordinates of carriageway
  const medianX0 = cw1[1]; //start of the median = end of the carriageway
  const medianX1 = medianX0 + medianW; //end of the median
  const cw2: [number, number] | null = hasMedian
    ? [medianX1, medianX1 + carriagewayW]
    : null; //second carriageway width when median is included
  const rightBarrierX = (cw2 ?? cw1)[1]; //either starts at end of carriageway 1 or cw2
  const overall = rightBarrierX + barrierW + blockR;

  //calculation of girders, girder spacing and overhang
  const nGiven = Math.round(num(p.girders, 0)) || (solved ? 0 : PLACEHOLDER.n);
  const ratio = Number((overall / num(p.defaultGirderSpacing, 2.5)).toFixed(9));
  const n = nGiven >= 2 ? nGiven : Math.max(2, Math.ceil(ratio)); //no of girders
  const overhangGiven =
    toM(num(p.overhang, 0)) || (solved ? 0 : PLACEHOLDER.overhang);
  const overhang = overhangGiven > 0 ? overhangGiven : overall / n / 2;
  const spacing =
    overhangGiven > 0 ? (overall - 2 * overhang) / (n - 1) : overall / n;
  const girderX = Array.from({ length: n }, (_, i) => overhang + i * spacing);
  const labelSpacing = solved ? spacing : PLACEHOLDER.spacing;
  const labelOverhang = solved ? overhang : PLACEHOLDER.overhang;

  return {
    n,
    overhang,
    spacing,
    overall,
    hasCarriageway,
    carriagewayW,
    barrierW,
    railW,
    footpathW,
    fpLeft,
    fpRight,
    hasMedian,
    medianW,
    medianX0,
    medianX1,
    cw1,
    cw2,
    leftBarrierX,
    rightBarrierX,
    girderX,
    labelSpacing,
    labelOverhang,
  };
}