import type { Bounds, Pad, View } from "../types/cad";

// World units are metres with y pointing UP; the screen has y pointing DOWN.
export const toX = (x: number, v: View): number => v.ox + x * v.scale;
export const toY = (y: number, v: View): number => v.oy - y * v.scale;

// Picks a scale and offsets so the whole drawing fits the canvas, centred.
export function fitView(
  bounds: Bounds, w: number, h: number,
  pad: Pad = { l: 60, r: 60, t: 60, b: 60 }
): View {
  const bw = Math.max(bounds.maxX - bounds.minX, 0.001);
  const bh = Math.max(bounds.maxY - bounds.minY, 0.001);
  const availW = Math.max(w - pad.l - pad.r, 10);
  const availH = Math.max(h - pad.t - pad.b, 10);
  const scale = Math.min(availW / bw, availH / bh);

  return {
    scale,
    ox: pad.l + (availW - bw * scale) / 2 - bounds.minX * scale,
    oy: h - pad.b - (availH - bh * scale) / 2 + bounds.minY * scale,
  };
}