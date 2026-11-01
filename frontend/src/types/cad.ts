export interface View { scale: number; ox: number; oy: number }
export interface Bounds { minX: number; maxX: number; minY: number; maxY: number }
export interface Pad { l: number; r: number; t: number; b: number }

export interface CadModel { bounds: Bounds; pad: Pad }

export type DrawFn<M extends CadModel> = (
  ctx: CanvasRenderingContext2D,
  model: M,
  view: View
) => void;

export type FormValues = Record<string, unknown>;