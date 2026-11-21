// Used ONLY to draw a generic bridge while the user has entered nothing.
// Labels never show these numbers (see lbl() in drawHelpers.ts).

export const PLACEHOLDER = {
  span: 35, // desktop default span_length 35000 mm
  overall: 10.25, // 2 x 1.0 overhang + 3 x 2.75 spacing
  girders: 4,
  overhang: 1.0,
  deckMm: 250,
  footpathMm: 100,
};
