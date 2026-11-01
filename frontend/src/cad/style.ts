// // All values come from the desktop's cad_cross_section.py / cad_top_view.py
// export const CAD = {
//   girder: "rgb(179,180,160)",
//   crossBracing: "rgb(235,236,211)",
//   crossBracingEdge: "rgb(107,107,96)",   // Qt .darker(220) of crossBracing
//   endDiaphragm: "rgb(134,134,100)",
//   concrete: "rgb(225,225,225)",
//   wearingCoat: "rgb(40,40,40)",
//   ink: "rgb(0,0,0)",
//   outlineGrey: "rgb(120,120,120)",
//   dimExt: "rgb(100,100,100)",
//   textBg: "rgba(255,255,255,0.9)",
//   font: "12px Arial, sans-serif",          // Qt 'Arial', 9 pt
// } as const;

// export const W = {
//   girderEdge: 1.5,
//   bracingEdge: 1.5,
//   deckEdge: 1.0,
//   barrierEdge: 1.5,
//   dim: 0.8,
// } as const;
export const CAD = {
  girder: "rgb(179,180,160)",
  stiffener: "rgb(210,210,205)",
  crossBracing: "rgb(235,236,211)",
  crossBracingEdge: "rgb(107,107,96)",
  endDiaphragm: "rgb(134,134,100)",
  bearing: "rgb(90,90,90)",
  concrete: "rgb(225,225,225)",
  wearingCoat: "rgb(40,40,40)",
  ink: "rgb(0,0,0)",
  outlineGrey: "rgb(120,120,120)",
  dimExt: "rgb(100,100,100)",
  font: "12px Arial, sans-serif",
} as const;

export const W = {
  girderEdge: 1.5, stiffenerEdge: 1.0, bracingEdge: 1.5, deckEdge: 1.0,
  barrierEdge: 1.5, dim: 0.8,
  planGirder: 2.5, planDiaphragm: 3.0, planBearing: 1.5, planBracing: 1.8,
} as const;

// per-view dimension style (from each file's draw_dimension_arrow)
export interface DimStyle { len: number; half: number; bgAlpha: number; above: number; below: number }
export const CROSS_DIM: DimStyle = { len: 4, half: 2, bgAlpha: 1.0,  above: 13, below: 11 };
export const PLAN_DIM:  DimStyle = { len: 6, half: 2, bgAlpha: 0.94, above: 15, below: 7  };