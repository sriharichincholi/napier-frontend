export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function duration(min: number | null): string | null {
  if (!min) return null;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

export const stopsLabel = (stops: number) => (stops === 0 ? "Non-stop" : `${stops} stop${stops > 1 ? "s" : ""}`);

/** Local YYYY-MM-DD, `offset` days from today. */
export function isoDate(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
