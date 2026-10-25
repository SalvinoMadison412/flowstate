/**
 * The caller's IP for rate limiting. The first x-forwarded-for entry is
 * whatever the client sent, so faking it gave every request a fresh limit.
 * Railway's edge sets x-real-ip and appends the real address to the END of
 * x-forwarded-for, so read those instead.
 */
export function clientIp(req: Request): string {
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",").pop()?.trim() || "unknown";
}
