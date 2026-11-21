/**
 * style.ts
 *
 * Colours, line widths and dimension styles for both views. Every drawing file
 * reads its look from here, so nothing is hardcoded in the draw functions.
 *
 * Elements included:
 *   - CAD / W: fill colours and pen widths copied from the desktop code.
 *   - HOVER / HOVER_W / PICK_PAD: highlight colours, highlighted line widths and
 *     the extra pixels around thin lines that count as hovering them.
 *   - CROSS_DIM / PLAN_DIM: arrow size, label background and label offsets for the
 *     dimension lines of each view
 */
export const CAD = {
  girder: "rgb(179,180,160)",
  stiffener: "rgb(210,210,205)",
  crossBracing: "rgb(235,236,211)",
  crossBracingEdge: "rgb(107,107,96)",
  endDiaphragm: "rgb(134,134,100)",
  bearing: "rgb(90,90,90)",
  concrete: "rgb(225,225,225)",
  wearingCoat: "rgb(40,40,40)",
  railing: "rgb(210,210,210)",
  ink: "rgb(0,0,0)",
  outlineGrey: "rgb(120,120,120)",
  dimExt: "rgb(100,100,100)",
  font: "12px Arial, sans-serif",
  bgRgb: "255,255,255", // pane colours used behind the labels
};

export const W = {
  girderEdge: 1.5,
  stiffenerEdge: 1.0,
  bracingEdge: 1.5,
  deckEdge: 1.0,
  barrierEdge: 1.5,
  dim: 0.8,
  planGirder: 2.5,
  planDiaphragm: 3.0,
  planBearing: 1.5,
  planBracing: 1.8,
} as const;

export const HOVER = {
  fill: "rgb(255,250,220)", // crash barrier / median / railing / footpath highlight
  deckOverlay: "rgba(255,255,255,0.5)",
  grey: "rgb(110,110,110)", // plan view highlight
  bracingFill: "rgb(150,150,130)",
  girderLighten: 70,
  leader: "rgb(100,100,100)",
  label: "rgb(90,90,90)",
} as const;

export const HOVER_W = {
  planGirder: 4.5,
  planDiaphragm: 4.0,
  planBracing: 3.5,
  planBearing: 2.5,
} as const;
export const PICK_PAD = 8;

export interface DimStyle {
  len: number;
  half: number;
  bgAlpha: number;
  above: number;
  below: number;
}
export const CROSS_DIM: DimStyle = {
  len: 4,
  half: 2,
  bgAlpha: 1.0,
  above: 13,
  below: 11,
};
export const PLAN_DIM: DimStyle = {
  len: 6,
  half: 2,
  bgAlpha: 0.94,
  above: 15,
  below: 7,
};

// Colours that depend on the theme. Light values are the desktop's. `bg` and `text` are the pane's
// computed CSS colours
const LIGHT_INK = "rgb(0,0,0)",
  LIGHT_BEARING = "rgb(90,90,90)",
  LIGHT_EXT = "rgb(100,100,100)";

export function setCadTheme(dark: boolean, bg: string, text: string): void {
  const m = bg.match(/\d+(\.\d+)?/g);  //extracts the colour numbers of the current background 
  CAD.bgRgb = m && m.length >= 3 ? `${m[0]},${m[1]},${m[2]}` : "255,255,255";  //sets the new background colour
  CAD.ink = dark ? text : LIGHT_INK;
  CAD.bearing = dark ? "rgb(170,170,170)" : LIGHT_BEARING;
  CAD.dimExt = dark ? "rgb(150,150,150)" : LIGHT_EXT;
}
