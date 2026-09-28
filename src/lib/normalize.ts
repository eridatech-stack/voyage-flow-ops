// Normalize Drizzle MySQL results - converts Date to string, decimal string to number
export function normalizeDate(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  if (typeof d === "string") return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function normalizeTime(t: string | null | undefined): string | null {
  if (!t) return null;
  return String(t).slice(0, 5);
}

export function normalizeDecimal(n: string | number | null | undefined): number {
  if (n == null) return 0;
  return Number(n);
}
