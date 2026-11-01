import type { FormValues } from "../types/cad";
import { num } from "./num";

export interface DeckLayout {
  n: number; overhang: number; spacing: number; overall: number;
  carriagewayW: number; barrierW: number; railW: number;
  footpathW: number; fpLeft: boolean; fpRight: boolean;
  leftBarrierX: number; rightBarrierX: number;
  girderX: number[];
}

// TODO: replace with DEFAULT_GIRDER_SPACING from desktop common.py and the real rule for default n.
const DEFAULT_GIRDER_SPACING = 2.5;

export function computeLayout(p: FormValues): DeckLayout {
  const carriagewayW = num(p.carriagewayWidth, 10);
  const barrierW = num(p.barrierWidth, 0.45);                 // IRC 5 RCC crash barrier bottom_width
  const rawRail = num(p.railingWidth, 0.375, true);           // desktop default 375 mm
  const railW = rawRail > 10 ? rawRail / 1000 : rawRail;      // desktop mm-to-m rule
  const footpathW = num(p.footpathWidth, 1.5, true);

  const cfg = String(p.footpath ?? "Single Side");            // None | Single Side | Both Sides
  const fpLeft = footpathW > 0 && (cfg === "Single Side" || cfg === "Both Sides");
  const fpRight = footpathW > 0 && cfg === "Both Sides";
  const fpBlock = footpathW + railW;

  const overall = carriagewayW + 2 * barrierW + (fpLeft ? fpBlock : 0) + (fpRight ? fpBlock : 0);
  const leftBarrierX = fpLeft ? fpBlock : 0;
  const rightBarrierX = overall - (fpRight ? fpBlock : 0) - barrierW;

  // desktop BridgeConfigurationSolver: "girders" case, or "overhang" case if the user typed one
  const nGiven = Math.round(num(p.girders, 0));
  const n = nGiven >= 2 ? nGiven : Math.max(2, Math.ceil(overall / DEFAULT_GIRDER_SPACING));
  const overhangGiven = num(p.overhang, 0);
  const overhang = overhangGiven > 0 ? overhangGiven : overall / n / 2;
  const spacing = overhangGiven > 0 ? (overall - 2 * overhang) / (n - 1) : overall / n;
  const girderX = Array.from({ length: n }, (_, i) => overhang + i * spacing);

  return {
    n, overhang, spacing, overall, carriagewayW, barrierW, railW,
    footpathW, fpLeft, fpRight, leftBarrierX, rightBarrierX, girderX,
  };
}