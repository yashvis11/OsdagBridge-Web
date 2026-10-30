/**
 * bridgeInputs.ts
 *
 * Canonical OsdagBridge input keys, widget type constants, and accessors.
 *
 * These constants mirror the Desktop KEY_* and TYPE_* vocabulary where the
 * web schema uses the same identifiers (for example, KEY_SPAN).
 *
 * Keeping them together prevents field components from duplicating schema keys.
 */

// ── Desktop Type Constants (osdagbridge.core.utils.common) ───────────────────
export const TYPE_TITLE        = 'title';
export const TYPE_BUTTON       = 'button';
export const TYPE_COMBOBOX     = 'combobox';
export const TYPE_COMBO_BOX    = 'combo_box';
export const TYPE_TEXTBOX      = 'textbox';
export const TYPE_LINE_EDIT    = 'line_edit';
export const TYPE_NOTE         = 'note';
export const TYPE_CHECKBOX     = 'checkbox';
export const TYPE_PERCENT_BAR  = 'percent_bar';
export const TYPE_RADIO_GRID   = 'radio_grid';

// ── Desktop Key Constants (osdagbridge.core.utils.common) ────────────────────
export const KEY_SPAN                    = 'geometry.span';
export const KEY_CARRIAGEWAY_WIDTH       = 'geometry.carriageway_width';
export const KEY_SKEW_ANGLE              = 'geometry.skew_angle';
export const KEY_STRUCTURE_TYPE          = 'structure.type';
export const KEY_INCLUDE_MEDIAN          = 'geometry.include_median';
export const KEY_FOOTPATH                = 'geometry.footpath';
export const KEY_DESIGN_MODE             = 'geometry.design_mode';
export const KEY_PROJECT_LOCATION        = 'project.location';

export const KEY_MATERIAL_GIRDER         = 'material.girder';
export const KEY_MATERIAL_CROSS_BRACING  = 'material.cross_bracing';
export const KEY_MATERIAL_END_DIAPHRAGM  = 'material.end_diaphragm';
export const KEY_MATERIAL_DECK           = 'material.deck';

// Additional Inputs — Typical Section Details
export const KEY_TS_NO_OF_GIRDERS        = 'typical_section.no_of_girders';
export const KEY_GIRDER_SPACING          = 'typical_section.girder_spacing';
export const KEY_DECK_OVERHANG           = 'typical_section.deck_overhang';
export const KEY_OVERALL_BRIDGE_WIDTH    = 'typical_section.overall_bridge_width';

// Additional Inputs — Loading (project location populates these)
export const KEY_BASIC_WIND_SPEED        = 'loading.wind_load.basic_wind_speed';
export const KEY_SEISMIC_ZONE            = 'loading.seismic_load.seismic_zone';
export const KEY_MAX_TEMPERATURE         = 'loading.temperature_load.highest_max_temp';
export const KEY_MIN_TEMPERATURE         = 'loading.temperature_load.lowest_min_temp';

// ── Canonical Input Keys Map ──────────────────────────────────────────────────
export const INPUT_KEYS = {
  module: 'module.plate_girder',
  structureType: KEY_STRUCTURE_TYPE,
  span: KEY_SPAN,
  carriagewayWidth: KEY_CARRIAGEWAY_WIDTH,
  includeMedian: KEY_INCLUDE_MEDIAN,
  footpath: KEY_FOOTPATH,
  skewAngle: KEY_SKEW_ANGLE,
  designMode: KEY_DESIGN_MODE,
  projectLocation: KEY_PROJECT_LOCATION,
  girder: KEY_MATERIAL_GIRDER,
  crossBracing: KEY_MATERIAL_CROSS_BRACING,
  endDiaphragm: KEY_MATERIAL_END_DIAPHRAGM,
  deck: KEY_MATERIAL_DECK,

  // Additional Inputs — Typical Section Details
  noOfGirders: KEY_TS_NO_OF_GIRDERS,
  girderSpacing: KEY_GIRDER_SPACING,
  deckOverhang: KEY_DECK_OVERHANG,
  overallWidth: KEY_OVERALL_BRIDGE_WIDTH,

  // Additional Inputs — Loading (project location populates these)
  windSpeed: KEY_BASIC_WIND_SPEED,
  seismicZone: KEY_SEISMIC_ZONE,
  maxTemp: KEY_MAX_TEMPERATURE,
  minTemp: KEY_MIN_TEMPERATURE,
} as const;

type Inputs = Record<string, any>;
type AdditionalInputs = Record<string, any> | undefined;

// ── CAD Fallback Defaults (mirrors desktop cad_cross_section.py / cad_top_view.py params) ──
// These are the values shown in the CAD drawing BEFORE the user enters any basic input.
// They must NOT be shown in input fields as entered values.
export const CAD_DEFAULTS = {
  SPAN_MM: 35000,               // mm — matches desktop self.params['span_length']
  CARRIAGEWAY_WIDTH_MM: 10500,  // mm — matches desktop self.params['carriageway_width']
  NUM_GIRDERS: 4,               // matches desktop self.params['num_girders']
  GIRDER_SPACING_MM: 2750,      // mm — DEFAULT_GIRDER_SPACING from common.py
  DECK_OVERHANG_MM: 1000,       // mm — matches desktop self.params['deck_overhang']
  DECK_THICKNESS_MM: 200,       // mm
  CROSS_BRACING_SPACING_MM: 3500, // mm
} as const;

const SPAN_DEFAULT_M       = CAD_DEFAULTS.SPAN_MM / 1000;
const WIDTH_DEFAULT_M      = CAD_DEFAULTS.CARRIAGEWAY_WIDTH_MM / 1000;
const GIRDERS_DEFAULT      = CAD_DEFAULTS.NUM_GIRDERS;
const GIRDER_SPACING_DEFAULT_M = CAD_DEFAULTS.GIRDER_SPACING_MM / 1000;
const DECK_OVERHANG_DEFAULT_M  = CAD_DEFAULTS.DECK_OVERHANG_MM / 1000;

/** Returns true if the user has explicitly entered a span value (not the fallback). */
export function hasUserSpan(inputs: Inputs): boolean {
  const v = inputs[INPUT_KEYS.span];
  return v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) && Number(v) > 0;
}

/** Returns span in meters; uses CAD fallback default when input is blank/null. */
export function getSpan(inputs: Inputs): number {
  const v = Number(inputs[INPUT_KEYS.span]);
  return Number.isFinite(v) && v > 0 ? v : SPAN_DEFAULT_M;
}

/** Returns true if the user has explicitly entered a carriageway width. */
export function hasUserCarriagewayWidth(inputs: Inputs): boolean {
  const v = inputs[INPUT_KEYS.carriagewayWidth];
  return v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) && Number(v) > 0;
}

/** Returns carriageway width in meters; uses CAD fallback default when input is blank/null. */
export function getCarriagewayWidth(inputs: Inputs): number {
  const v = Number(inputs[INPUT_KEYS.carriagewayWidth]);
  return Number.isFinite(v) && v > 0 ? v : WIDTH_DEFAULT_M;
}

/** Returns number of girders; prefers additionalInputs, then CAD fallback default. */
export function getNoOfGirders(inputs: Inputs, additionalInputs?: AdditionalInputs): number {
  const fromAdditional = Number(additionalInputs?.[INPUT_KEYS.noOfGirders]);
  if (Number.isFinite(fromAdditional) && fromAdditional > 0) return fromAdditional;
  const v = Number(inputs[INPUT_KEYS.noOfGirders]);
  return Number.isFinite(v) && v > 0 ? v : GIRDERS_DEFAULT;
}

/**
 * Returns girder spacing in meters.
 * Uses DEFAULT_GIRDER_SPACING fallback (2.75 m) matching desktop cad_top_view.py
 * self.params['girder_spacing'] = 2750.
 * Does NOT derive spacing from carriageway width.
 */
export function getGirderSpacing(inputs: Inputs, additionalInputs?: AdditionalInputs): number {
  const fromAdditional = Number(additionalInputs?.[INPUT_KEYS.girderSpacing]);
  if (Number.isFinite(fromAdditional) && fromAdditional > 0) return fromAdditional;
  return GIRDER_SPACING_DEFAULT_M;
}

/** Returns deck overhang in meters; prefers additionalInputs, then CAD fallback default. */
export function getDeckOverhang(inputs: Inputs, additionalInputs?: AdditionalInputs): number {
  const fromAdditional = Number(additionalInputs?.[INPUT_KEYS.deckOverhang]);
  if (Number.isFinite(fromAdditional) && fromAdditional > 0) return fromAdditional;
  return DECK_OVERHANG_DEFAULT_M;
}

/** Returns deck thickness in meters. */
export function getDeckThickness(): number {
  return CAD_DEFAULTS.DECK_THICKNESS_MM / 1000;
}
