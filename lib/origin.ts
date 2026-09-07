/**
 * The India / foreign split for the cold-call list. Cold calling used to be
 * India-only; now it spans India and every other market, and the two need to
 * be worked and measured apart. Pure — no supabase import — so the rules stay
 * unit-testable (see origin.test.ts).
 */

export type Origin = "india" | "foreign";

/** `country` values that put a lead in the India bucket — ISO code or name. */
export const INDIA_COUNTRY = ["in", "ind", "india"];

export function isIndia(country: string | null | undefined): boolean {
  return !!country && INDIA_COUNTRY.includes(country.trim().toLowerCase());
}

/** India = country is IN/India; foreign = anything else, blank origin included. */
export function matchOrigin(
  country: string | null | undefined,
  origin: Origin,
): boolean {
  return origin === "india" ? isIndia(country) : !isIndia(country);
}

/** Flag for a lead's origin: 🇮🇳 for India, 🌐 for every other market. */
export function originFlag(country: string | null | undefined): string {
  return isIndia(country) ? "🇮🇳" : "🌐";
}

/**
 * PostgREST `.or()` argument for one market. Foreign deliberately keeps rows
 * with a blank country so a lead whose origin nobody filled in never vanishes
 * from both lists — it shows under foreign until someone sets it.
 */
export function originFilter(origin: Origin): string {
  if (origin === "india")
    return INDIA_COUNTRY.map((c) => `country.ilike.${c}`).join(",");
  const notIndia = INDIA_COUNTRY.map((c) => `country.not.ilike.${c}`).join(",");
  return `country.is.null,and(${notIndia})`;
}
