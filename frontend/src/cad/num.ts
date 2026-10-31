// Safe number conversion: empty, null or invalid input falls back to a default.
export function num(value: unknown, fallback: number, allowZero = false): number {
  const n = Number(value);
  if (value === "" || value === null || value === undefined || !Number.isFinite(n)) return fallback;
  return allowZero ? (n >= 0 ? n : fallback) : (n > 0 ? n : fallback);
}