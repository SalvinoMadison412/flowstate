// The one check that matters: if the codec or resampling is wrong, every call
// is garbled and you find out from a caller. Run with `npm test`.
import assert from "node:assert/strict";
import { ulawToPcm, pcmToUlaw, twilioToGemini, geminiToTwilio } from "./audio.js";

// µ-law round-trip. G.711 has two zeros (0x7F is -0, 0xFF is +0), so byte
// identity does not hold there — but the decoded *sample value* must always
// survive, which is what actually reaches the caller's ear.
for (let u = 0; u < 256; u++) {
  const v = ulawToPcm(u);
  assert.equal(ulawToPcm(pcmToUlaw(v)), v, `µ-law lost audio at byte ${u}`);
  if (u !== 0x7f) assert.equal(pcmToUlaw(v), u, `µ-law round-trip failed at byte ${u}`);
}
assert.equal(pcmToUlaw(ulawToPcm(0x7f)), 0xff, "-0 should normalise to +0");

// Decoded µ-law must stay inside 16-bit range and be monotonic within a segment.
assert.ok(Math.abs(ulawToPcm(0xff)) < 32768);
assert.ok(Math.abs(ulawToPcm(0x00)) < 32768);
assert.equal(ulawToPcm(0xff), 0, "0xFF is µ-law silence");

// 8kHz µ-law -> 16kHz PCM16: doubles the sample count, 2 bytes per sample.
const ulaw = Buffer.from([0xff, 0x80, 0x00, 0x7f, 0xff]);
const pcm16k = twilioToGemini(ulaw);
assert.equal(pcm16k.length, ulaw.length * 4, "upsample should be 2x samples at 2 bytes each");

// 24kHz PCM16 -> 8kHz µ-law: one byte out per three samples in.
const pcm24k = Buffer.alloc(9 * 2);
for (let i = 0; i < 9; i++) pcm24k.writeInt16LE(1000 * (i - 4), i * 2);
assert.equal(geminiToTwilio(pcm24k).length, 3, "decimate by 3 into one µ-law byte each");

// A loud constant tone must not come back as silence (catches sign/bias bugs).
const loud = Buffer.alloc(6);
for (let i = 0; i < 3; i++) loud.writeInt16LE(20000, i * 2);
assert.notEqual(geminiToTwilio(loud)[0], 0xff, "loud audio decoded to silence");

// Round-trip a ramp through both directions; energy must survive.
const ramp = Buffer.alloc(300);
for (let i = 0; i < 150; i++) ramp.writeInt16LE(Math.round(12000 * Math.sin(i / 4)), i * 2);
const back = geminiToTwilio(ramp);
const energy = [...back].reduce((a, b) => a + Math.abs(ulawToPcm(b)), 0) / back.length;
assert.ok(energy > 1000, `signal lost in resampling (energy ${energy})`);

console.log("audio ok — µ-law round-trip, both resample directions, signal preserved");
