import type { FormValues } from "../types/cad";
import { num, toM } from "./num";

export interface DeckLayout {
  n: number; overhang: number; spacing: number; overall: number;
  carriagewayW: number; barrierW: number; railW: number;
  footpathW: number; fpLeft: boolean; fpRight: boolean;
  leftBarrierX: number; rightBarrierX: number;
  girderX: number[];
}



export function computeLayout(p: FormValues): DeckLayout {
  const carriagewayW = num(p.carriagewayWidth, 10);
  const barrierW = toM(num(p.barrierWidth, 0.45));            // IRC 5 RCC crash barrier bottom_width 450 mm
  const railW = toM(num(p.railingWidth, 0.375, true));        // desktop DEFAULT_RAILING_WIDTH
  const footpathW = toM(num(p.footpathWidth, 1.5, true));

  const cfg = String(p.footpath ?? "None");                   // None | Single Side | Both Sides
  const fpLeft = footpathW > 0 && (cfg === "Single Side" || cfg === "Both Sides");
  const fpRight = footpathW > 0 && cfg === "Both Sides";
  const fpBlock = footpathW + railW;

  const overall = carriagewayW + 2 * barrierW + (fpLeft ? fpBlock : 0) + (fpRight ? fpBlock : 0);
  const leftBarrierX = fpLeft ? fpBlock : 0;
  const rightBarrierX = overall - (fpRight ? fpBlock : 0) - barrierW;

  // desktop BridgeConfigurationSolver: "girders" case (overhang = spacing / 2, n * spacing = overall),
  // or the "overhang" case when the user typed an overhang
  const nGiven = Math.round(num(p.girders, 0));
    // TODO: the default-n rule is a guess; replace it with the desktop's (defaults.py ~lines 905-985)
  const n = nGiven >= 2 ? nGiven : Math.max(2, Math.ceil(overall / num(p.defaultGirderSpacing, 2.5)));
  const overhangGiven = toM(num(p.overhang, 0));
  const overhang = overhangGiven > 0 ? overhangGiven : overall / n / 2;
  const spacing = overhangGiven > 0 ? (overall - 2 * overhang) / (n - 1) : overall / n;
  const girderX = Array.from({ length: n }, (_, i) => overhang + i * spacing);

  return {
    n, overhang, spacing, overall, carriagewayW, barrierW, railW,
    footpathW, fpLeft, fpRight, leftBarrierX, rightBarrierX, girderX,
  };
}