// A "notebook day" rolls over at 12:00 AM (midnight) local time.
// Returns a YYYY-MM-DD string.
export function dayKeyFor(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return dayKeyFor(new Date());
}

export function addDays(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 12, 0, 0); // Set to noon to avoid any edge cases
  dt.setDate(dt.getDate() + delta);
  return dayKeyFor(dt);
}

export function formatDayLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

// Milliseconds until the next midnight local time.
export function msUntilNext2AM(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0); // next midnight
  return next.getTime() - now.getTime();
}
