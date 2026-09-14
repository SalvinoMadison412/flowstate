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

/**
 * Sub-country zones. `guessTimeZone` only knows countries, which is fine for
 * France but wrong by up to 3 hours for the two countries we actually sell
 * into: the US (Arizona vs New York) and Australia (Perth vs Sydney).
 *
 * States that straddle two zones map to the side our leads are actually in
 * (TN -> Central because Nashville is the target metro, not Knoxville).
 * The booking form always lets you override the guess.
 */
const US_STATE_TZ: Record<string, string> = {
  // Pacific
  CA: "America/Los_Angeles", WA: "America/Los_Angeles",
  OR: "America/Los_Angeles", NV: "America/Los_Angeles",
  // Arizona — no DST, which is exactly why it can't share Denver's zone
  AZ: "America/Phoenix",
  // Mountain
  CO: "America/Denver", UT: "America/Denver", MT: "America/Denver",
  ID: "America/Denver", WY: "America/Denver", NM: "America/Denver",
  // Central
  TX: "America/Chicago", TN: "America/Chicago", IL: "America/Chicago",
  MO: "America/Chicago", LA: "America/Chicago", MN: "America/Chicago",
  WI: "America/Chicago", AL: "America/Chicago", OK: "America/Chicago",
  KS: "America/Chicago", NE: "America/Chicago", IA: "America/Chicago",
  AR: "America/Chicago", MS: "America/Chicago", ND: "America/Chicago",
  SD: "America/Chicago",
  // Eastern
  NY: "America/New_York", NJ: "America/New_York", PA: "America/New_York",
  CT: "America/New_York", RI: "America/New_York", MA: "America/New_York",
  NH: "America/New_York", VT: "America/New_York", ME: "America/New_York",
  DE: "America/New_York", MD: "America/New_York", DC: "America/New_York",
  VA: "America/New_York", WV: "America/New_York", NC: "America/New_York",
  SC: "America/New_York", GA: "America/New_York", FL: "America/New_York",
  OH: "America/New_York", MI: "America/New_York", IN: "America/New_York",
  KY: "America/New_York",
  // Non-contiguous
  AK: "America/Anchorage", HI: "Pacific/Honolulu",
};

/** Cities in countries whose single country-level guess would be wrong. */
const CITY_TZ: Record<string, string> = {
  // Australia — Brisbane observes no DST, Perth is 3h behind Sydney in summer
  sydney: "Australia/Sydney", melbourne: "Australia/Melbourne",
  canberra: "Australia/Sydney", hobart: "Australia/Hobart",
  brisbane: "Australia/Brisbane", "gold coast": "Australia/Brisbane",
  adelaide: "Australia/Adelaide", perth: "Australia/Perth",
  darwin: "Australia/Darwin",
  // Canada
  toronto: "America/Toronto", montreal: "America/Toronto",
  vancouver: "America/Vancouver", calgary: "America/Edmonton",
  edmonton: "America/Edmonton", winnipeg: "America/Winnipeg",
};

/**
 * The place a scraped lead came from. The sourcing routine writes
 * `notes` as "Sourced Phoenix AZ · cafe · Google Maps 2026-09-08." — there is
 * no address column on crm_leads, so this string is the only location we hold.
 */
export function sourcedPlace(notes: string | null | undefined): string | null {
  const m = /sourced\s+(.+?)\s*·/i.exec(notes ?? "");
  return m ? m[1].trim() : null;
}

/**
 * Best zone for a lead: its city/state if we know where it was sourced,
 * otherwise its country. `null` = no idea, caller falls back to your own zone.
 */
export function zoneForLead(lead: {
  country?: string | null;
  notes?: string | null;
}): string | null {
  const place = sourcedPlace(lead.notes);
  if (place) {
    const st = /\b([A-Za-z]{2})$/.exec(place);
    const byState = st ? US_STATE_TZ[st[1].toUpperCase()] : undefined;
    if (byState) return byState;
    const city = place.replace(/\s+[A-Za-z]{2}$/, "").trim().toLowerCase();
    const byCity = CITY_TZ[city] ?? CITY_TZ[place.toLowerCase()];
    if (byCity) return byCity;
  }
  return guessTimeZone(lead.country);
}
