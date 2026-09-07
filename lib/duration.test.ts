/**
 * Self-check for duration formatting.
 * Run: npx tsx lib/duration.test.ts   (or `npm run test:duration`)
 */
import assert from "node:assert/strict";
import { formatDuration, stopwatch } from "./duration";

assert.equal(formatDuration(0), "0:00");
assert.equal(formatDuration(45), "0:45");
assert.equal(formatDuration(90), "1m");
assert.equal(formatDuration(725), "12m");
assert.equal(formatDuration(3600), "1h 00m");
assert.equal(formatDuration(3860), "1h 04m");
assert.equal(formatDuration(-5), "0:00");

assert.equal(stopwatch(0), "0:00");
assert.equal(stopwatch(9), "0:09");
assert.equal(stopwatch(65), "1:05");
assert.equal(stopwatch(3661), "61:01");

console.log("duration: all checks passed");
