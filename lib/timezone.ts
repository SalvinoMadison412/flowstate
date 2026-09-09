/**
 * Time-zone helpers for booking a meeting in the *client's* local time. You
 * enter "Mon 3pm" meaning 3pm where the client is; we work out the real UTC
 * instant so the Google Calendar invite lands right for both sides.
 *
 * Pure and no deps — the offset comes from `Intl`, which every current browser
 * and Node ships with the full IANA database for. See timezone.test.ts.
 */

/**
 * Best-guess IANA zone for a lead's `country` (an ISO-2 code or a name — the
 * import lets people type either). Countries that span zones map to their
 * busiest one; the booking form always lets you override. `null` = no guess,
 * fall back to your own zone.
 */
const COUNTRY_TZ: Record<string, string> = {
  in: "Asia/Kolkata",
  ind: "Asia/Kolkata",
  india: "Asia/Kolkata",
  fr: "Europe/Paris",
  france: "Europe/Paris",
  us: "America/New_York",
  usa: "America/New_York",
  "united states": "America/New_York",
  gb: "Europe/London",
  uk: "Europe/London",
  "united kingdom": "Europe/London",
  ie: "Europe/Dublin",
  ireland: "Europe/Dublin",
  de: "Europe/Berlin",
  germany: "Europe/Berlin",
  es: "Europe/Madrid",
  spain: "Europe/Madrid",
  it: "Europe/Rome",
  italy: "Europe/Rome",
  pt: "Europe/Lisbon",
  portugal: "Europe/Lisbon",
  nl: "Europe/Amsterdam",
  netherlands: "Europe/Amsterdam",
  be: "Europe/Brussels",
  belgium: "Europe/Brussels",
  ch: "Europe/Zurich",
  switzerland: "Europe/Zurich",
  au: "Australia/Sydney",
  australia: "Australia/Sydney",
  nz: "Pacific/Auckland",
  "new zealand": "Pacific/Auckland",
  ca: "America/Toronto",
  canada: "America/Toronto",
  ae: "Asia/Dubai",
  uae: "Asia/Dubai",
  "united arab emirates": "Asia/Dubai",
  sg: "Asia/Singapore",
  singapore: "Asia/Singapore",
};

export function guessTimeZone(country: string | null | undefined): string | null {
  if (!country) return null;
  return COUNTRY_TZ[country.trim().toLowerCase()] ?? null;
}

/** True if `tz` is an IANA zone this runtime knows. */
export function isValidZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** The zone's UTC offset, in ms, at the instant `t` (handles DST). */
function offsetAt(t: number, timeZone: string): number {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(new Date(t))
    .reduce<Record<string, string>>((o, x) => {
      o[x.type] = x.value;
      return o;
    }, {});
  const seen = Date.UTC(
    +p.year,
    +p.month - 1,
    +p.day,
    +p.hour,
    +p.minute,
    +p.second,
  );
  return seen - t;
}

/**
 * The UTC instant at which the wall clock reads `date` + `time` in `timeZone`.
 * `date` is "YYYY-MM-DD", `time` is "HH:MM".
 *
 * ponytail: near a DST change one wall time is skipped and one repeats; the
 * single refinement pass picks a sane side. Add a full disambiguation option
 * only if someone actually books into that one ambiguous hour.
 */
export function zonedTimeToUtc(
  date: string,
  time: string,
  timeZone: string,
): Date {
  const wall = new Date(`${date}T${time}:00Z`).getTime();
  let utc = wall - offsetAt(wall, timeZone);
  utc = wall - offsetAt(utc, timeZone);
  return new Date(utc);
}

/** "Fri, Aug 14, 3:00 PM GMT+2" — a Date shown in `timeZone`. */
export function formatInZone(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
}
