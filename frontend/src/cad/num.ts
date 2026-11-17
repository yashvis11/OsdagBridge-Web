// Safe number conversion: empty, null or invalid input falls back to a default.
export function num(value: unknown, fallback: number, allowZero = false): number {
  const n = Number(value);
  if (value === "" || value === null || value === undefined || !Number.isFinite(n)) return fallback;
  return allowZero ? (n >= 0 ? n : fallback) : (n > 0 ? n : fallback);
}

// mm-or-m guard: values above 10 are treated as millimetres (same rule as the desktop _railing_width_m).
export const toM = (v: number): number => (v > 10 ? v / 1000 : v);
// Round half up on the decimal value (10.275 -> "10.28"), ignoring binary float noise.
export const fmt = (v: number, d = 2): string => (Math.round((v + 1e-9) * 10 ** d) / 10 ** d).toFixed(d);
// "Span Length = 25.0 m" once the value is known, just "Span Length" before the user enters it.
export const lbl = (name: string, show: boolean, value: string): string => (show ? `${name} = ${value}` : name);