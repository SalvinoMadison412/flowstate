/**
 * Self-check for the India / foreign cold-call split.
 * Run: npx tsx lib/origin.test.ts   (or `npm run test:origin`)
 */
import assert from "node:assert/strict";
import { isIndia, matchOrigin, originFilter } from "./origin";

// isIndia: ISO code or name, any casing/whitespace
assert.equal(isIndia("IN"), true);
assert.equal(isIndia("India"), true);
assert.equal(isIndia("  india "), true);
assert.equal(isIndia("US"), false);
assert.equal(isIndia("Indiana"), false); // not a substring match
assert.equal(isIndia(null), false);
assert.equal(isIndia(""), false);

// matchOrigin: unknown origin counts as foreign, never as India
assert.equal(matchOrigin("FR", "foreign"), true);
assert.equal(matchOrigin("FR", "india"), false);
assert.equal(matchOrigin("in", "india"), true);
assert.equal(matchOrigin(null, "foreign"), true);
assert.equal(matchOrigin(null, "india"), false);

// originFilter: India matches the codes; foreign keeps blank-origin rows
assert.ok(originFilter("india").includes("country.ilike.in"));
assert.ok(originFilter("foreign").startsWith("country.is.null,and("));
assert.ok(originFilter("foreign").includes("country.not.ilike.india"));

console.log("origin: all checks passed");
