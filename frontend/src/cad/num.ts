// Safe number conversion: empty, null or invalid input falls back to a default.
export function num(value: unknown, fallback: number, allowZero = false): number {
  const n = Number(value);
  if (value === "" || value === null || value === undefined || !Number.isFinite(n)) return fallback;
  return allowZero ? (n >= 0 ? n : fallback) : (n > 0 ? n : fallback);
}

// mm-or-m guard: values above 10 are treated as millimetres (same rule as the desktop _railing_width_m).
export const toM = (v: number): number => (v > 10 ? v / 1000 : v);