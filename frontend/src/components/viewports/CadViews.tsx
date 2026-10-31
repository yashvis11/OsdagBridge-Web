import { useMemo } from "react";
import { useBridgeStore } from "../../store/useBridgeStore";
import CadCanvas from "./CadCanvas";
import { buildCrossSection, drawCrossSection } from "../../cad/crossSection";
import { buildPlan, drawPlan } from "../../cad/planView";

type Values = Record<string, unknown>;

// Returns the first key that has a value. Schema keys come first, the
// store's older starter keys second.
const pick = (v: Values, ...keys: string[]): unknown => {
  for (const k of keys) {
    if (v[k] !== undefined && v[k] !== null && v[k] !== "") return v[k];
  }
  return undefined;
};

const useValues = (): Values => useBridgeStore((s) => s.inputs) as Values;

export function CrossSectionView() {
  const v = useValues();
  const model = useMemo(() => buildCrossSection({
    carriagewayWidth: pick(v, "geometry.carriageway_width", "Carriageway_Width"),
    footpath: pick(v, "geometry.footpath", "Footpath"),
    girders: pick(v, "typical_section.no_of_girders", "No_Of_Girders"),
    overhang: pick(v, "typical_section.deck_overhang"),
    deckThicknessMm: pick(v, "typical_section.deck_thickness"),
    footpathWidth: pick(v, "typical_section.footpath_width"),
    footpathThicknessMm: pick(v, "typical_section.footpath_thickness"),
  }), [v]);
  return <CadCanvas model={model} draw={drawCrossSection} />;
}

export function PlanView() {
  const v = useValues();
  const model = useMemo(() => buildPlan({
    span: pick(v, "geometry.span", "Span"),
    carriagewayWidth: pick(v, "geometry.carriageway_width", "Carriageway_Width"),
    footpath: pick(v, "geometry.footpath", "Footpath"),
    girders: pick(v, "typical_section.no_of_girders", "No_Of_Girders"),
    overhang: pick(v, "typical_section.deck_overhang"),
    footpathWidth: pick(v, "typical_section.footpath_width"),
  }), [v]);
  return <CadCanvas model={model} draw={drawPlan} />;
}