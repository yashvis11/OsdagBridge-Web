import { useMemo } from "react";
import { useBridgeStore } from "../../store/useBridgeStore";
import type { BridgeConstants } from "../../types/schema";
import CadCanvas from "./CadCanvas";
import { buildCrossSection, drawCrossSection } from "../../cad/crossSection";
import { buildPlan, drawPlan } from "../../cad/planView";

type Values = Record<string, unknown>;

// Constant NAME -> key string (the value comes from the backend, nothing is hardcoded here).
const keyOf = (c: BridgeConstants, name: string): string | undefined => {
  const v = c[name];
  return typeof v === "string" && v ? v : undefined;
};

// Constant NAME -> number (for the DEFAULT_* values).
const numOf = (c: BridgeConstants, name: string): number | undefined => {
  const v = c[name];
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
};

const read = (v: Values, key?: string): unknown => {
  if (!key) return undefined;
  const x = v[key];
  return x !== undefined && x !== null && x !== "" ? x : undefined;
};

// Reads constants + inputs from the store and renames them to the CAD's short field names.
function useCadInputs(): Values | null {
  const inputs = useBridgeStore((s) => s.inputs) as Values;
  const additional = useBridgeStore((s) => s.additionalInputs) as Values;
  const c = useBridgeStore((s) => s.constants);

  return useMemo(() => {
    if (!c) return null;                       // constants not loaded yet: draw nothing
    const v: Values = { ...additional, ...inputs };
    const get = (name: string) => read(v, keyOf(c, name));
    return {
      span: get("KEY_SPAN"),
      carriagewayWidth: get("KEY_CARRIAGEWAY_WIDTH"),
      footpath: get("KEY_FOOTPATH"),
      skew: get("KEY_SKEW_ANGLE"),
      girders: get("KEY_TS_NO_OF_GIRDERS"),
      overhang: get("KEY_TS_DECK_OVERHANG"),
      deckThicknessMm: get("KEY_TS_DECK_THICKNESS"),
      footpathWidth: get("KEY_TS_FOOTPATH_WIDTH"),
      footpathThicknessMm: get("KEY_TS_FOOTPATH_THICKNESS"),
      bracingSpacing: get("KEY_MP_CB_SPACING") ?? numOf(c, "DEFAULT_CROSS_BRACING_SPACING"),
      railingWidth: numOf(c, "DEFAULT_RAILING_WIDTH"),
      defaultGirderSpacing: numOf(c, "DEFAULT_GIRDER_SPACING"),
    };
  }, [inputs, additional, c]);
}

export function CrossSectionView() {
  const p = useCadInputs();
  const model = useMemo(() => (p ? buildCrossSection(p) : null), [p]);
  if (!model) return null;
  return <CadCanvas model={model} draw={drawCrossSection} />;
}

export function PlanView() {
  const p = useCadInputs();
  const model = useMemo(() => (p ? buildPlan(p) : null), [p]);
  if (!model) return null;
  return <CadCanvas model={model} draw={drawPlan} />;
}