import assert from "node:assert/strict";
import {
  guessTimeZone,
  isValidZone,
  zonedTimeToUtc,
  zoneForLead,
  sourcedPlace,
  formatInZone,
} from "./timezone";

const iso = (d: string, t: string, tz: string) =>
  zonedTimeToUtc(d, t, tz).toISOString();

// Wall time in the client's zone → the right UTC instant, across DST.
assert.equal(iso("2026-01-14", "15:00", "America/New_York"), "2026-01-14T20:00:00.000Z"); // EST -5
assert.equal(iso("2026-08-14", "15:00", "America/New_York"), "2026-08-14T19:00:00.000Z"); // EDT -4
assert.equal(iso("2026-08-14", "15:00", "Europe/Paris"), "2026-08-14T13:00:00.000Z"); // CEST +2
assert.equal(iso("2026-01-14", "15:00", "Europe/Paris"), "2026-01-14T14:00:00.000Z"); // CET +1
assert.equal(iso("2026-08-14", "15:00", "Asia/Kolkata"), "2026-08-14T09:30:00.000Z"); // +5:30
assert.equal(iso("2026-08-14", "15:00", "Australia/Sydney"), "2026-08-14T05:00:00.000Z"); // AEST +10
assert.equal(iso("2026-12-14", "15:00", "Australia/Sydney"), "2026-12-14T04:00:00.000Z"); // AEDT +11
assert.equal(iso("2026-06-01", "09:00", "UTC"), "2026-06-01T09:00:00.000Z");

// Country → zone guess.
assert.equal(guessTimeZone("France"), "Europe/Paris");
assert.equal(guessTimeZone("IN"), "Asia/Kolkata");
assert.equal(guessTimeZone("united states"), "America/New_York");
assert.equal(guessTimeZone("Australia"), "Australia/Sydney");
assert.equal(guessTimeZone(null), null);
assert.equal(guessTimeZone("Narnia"), null);

assert.ok(isValidZone("Europe/Paris"));
assert.ok(!isValidZone("Europe/Nowhere"));

// Where a scraped lead was sourced, out of the notes string.
assert.equal(sourcedPlace("Sourced Phoenix AZ · cafe · Google Maps 2026-09-08."), "Phoenix AZ");
assert.equal(sourcedPlace("Sourced Perth · hair salon · Google Maps 2026-09-14. IG @x."), "Perth");
assert.equal(sourcedPlace("no location here"), null);
assert.equal(sourcedPlace(null), null);

// Sub-country zones: the whole point is that country alone is wrong for US + AU.
const lead = (notes: string | null, country: string | null = null) => ({ notes, country });

// Arizona does not observe DST — it must not collapse into Denver or New York.
assert.equal(zoneForLead(lead("Sourced Phoenix AZ · cafe · Google Maps 2026-09-08.")), "America/Phoenix");
assert.equal(zoneForLead(lead("Sourced Austin TX · cafe · x")), "America/Chicago");
assert.equal(zoneForLead(lead("Sourced Denver CO · florist · x")), "America/Denver");
assert.equal(zoneForLead(lead("Sourced Santa Barbara CA · cafe · x")), "America/Los_Angeles");
assert.equal(zoneForLead(lead("Sourced Brooklyn NY · boutique · x")), "America/New_York");
assert.equal(zoneForLead(lead("Sourced Nashville TN · hair salon · x")), "America/Chicago");

// Australia spans 3 hours and Brisbane skips DST.
assert.equal(zoneForLead(lead("Sourced Perth · cafe · x")), "Australia/Perth");
assert.equal(zoneForLead(lead("Sourced Brisbane · cafe · x")), "Australia/Brisbane");
assert.equal(zoneForLead(lead("Sourced Gold Coast · cafe · x")), "Australia/Brisbane");
assert.equal(zoneForLead(lead("Sourced Sydney · cafe · x")), "Australia/Sydney");

// Falls back to country when the notes carry no usable place.
assert.equal(zoneForLead(lead(null, "France")), "Europe/Paris");
assert.equal(zoneForLead(lead("no place", "Italy")), "Europe/Rome");
assert.equal(zoneForLead(lead(null, null)), null);

// A European city we have no city entry for still resolves via its country.
assert.equal(zoneForLead(lead("Sourced Lisbon · cafe · x", "Portugal")), "Europe/Lisbon");

// Real payoff: 11:00 for an Arizona client, shown in IST.
const az = zoneForLead(lead("Sourced Phoenix AZ · cafe · x"))!;
assert.equal(zonedTimeToUtc("2026-09-15", "11:00", az).toISOString(), "2026-09-15T18:00:00.000Z");
assert.ok(formatInZone(zonedTimeToUtc("2026-09-15", "11:00", az), "Asia/Kolkata").includes("11:30 PM"));

console.log("timezone.test.ts ok");
