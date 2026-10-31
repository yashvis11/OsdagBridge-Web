import type { FormValues } from "../types/cad";
import { num } from "./num";

export interface DeckLayout {
  n: number; overhang: number; spacing: number; overall: number;
  carriagewayW: number; barrierW: number; railW: number;
  footpathW: number; fpLeft: boolean; fpRight: boolean;
  leftBarrierX: number; rightBarrierX: number;
  girderX: number[];
}

// Desktop rules (all in metres):
//   left to right: railing | footpath | barrier | carriageway | barrier | footpath | railing
//   deck width   = carriageway + 2*barrier + footpaths*(footpath + railing)
//   girders      = first at `overhang`, last at `overall - overhang`, evenly spaced
export function computeLayout(p: FormValues): DeckLayout {
  const n = Math.max(1, Math.round(num(p.girders, 4)));       // desktop default 4
  const overhang = num(p.overhang, 1.0);                      // desktop default 1000 mm
  const carriagewayW = num(p.carriagewayWidth, 10);
  const barrierW = num(p.barrierWidth, 0.5);                  // KEY_CB_WIDTH default 500 mm
  const railW = num(p.railingWidth, 0.275, true);             // fits the desktop screenshot (12.78 m); confirm
  const footpathW = num(p.footpathWidth, 1.5, true);

  const cfg = String(p.footpath ?? "Single Side");            // None | Single Side | Both Sides
  const fpLeft = footpathW > 0 && (cfg === "Single Side" || cfg === "Both Sides");
  const fpRight = footpathW > 0 && cfg === "Both Sides";
  const fpBlock = footpathW + railW;                          // footpath plus its railing

  const overall = carriagewayW + 2 * barrierW + (fpLeft ? fpBlock : 0) + (fpRight ? fpBlock : 0);
  const leftBarrierX = fpLeft ? fpBlock : 0;
  const rightBarrierX = overall - (fpRight ? fpBlock : 0) - barrierW;

  const spacing = n > 1 ? (overall - 2 * overhang) / (n - 1) : 0;   // derived, not typed
  const girderX = n > 1
    ? Array.from({ length: n }, (_, i) => overhang + i * spacing)
    : [overall / 2];

  return {
    n, overhang, spacing, overall, carriagewayW, barrierW, railW,
    footpathW, fpLeft, fpRight, leftBarrierX, rightBarrierX, girderX,
  };
}