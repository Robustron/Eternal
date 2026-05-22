// A "notebook day" rolls over at 2:00 AM local time.
// Returns a YYYY-MM-DD string.
export function dayKeyFor(date: Date): string {
  const d = new Date(date);
  // Before 2 AM, we still belong to the previous day.
  if (d.getHours() < 2) d.setDate(d.getDate() - 1);
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
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return dayKeyFor(dt);
}

export function formatDayLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const today = todayKey();
  if (key === today) return "today";
  const yest = addDays(today, -1);
  if (key === yest) return "yesterday";
  return dt.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

// Milliseconds until the next 2 AM local time.
export function msUntilNext2AM(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(2, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}
