import assert from "node:assert/strict";
import { guessTimeZone, isValidZone, zonedTimeToUtc } from "./timezone";

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

console.log("timezone.test.ts ok");
