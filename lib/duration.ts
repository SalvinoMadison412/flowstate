/** Duration formatting for the lead timer. Pure — tested in duration.test.ts. */

/** Compact human total: "0:45", "12m", "1h 04m". For logged / summed time. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m`;
  return `0:${String(s % 60).padStart(2, "0")}`;
}

/** Live mm:ss for the running stopwatch. */
export function stopwatch(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
