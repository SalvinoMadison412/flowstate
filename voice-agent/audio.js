// G.711 µ-law codec + resampling between Twilio's 8kHz µ-law and Gemini's PCM.
//
// Twilio media streams are 8kHz 8-bit µ-law, mono.
// Gemini Live wants 16kHz 16-bit PCM in, and sends 24kHz 16-bit PCM out.
// No npm audio library: this is ~60 lines of arithmetic and a dependency would
// be bigger than the code.

const BIAS = 0x84;
const CLIP = 32635;

/** One µ-law byte -> one signed 16-bit sample. */
export function ulawToPcm(u) {
  u = ~u & 0xff;
  let t = ((u & 0x0f) << 3) + BIAS;
  t <<= (u & 0x70) >> 4;
  return u & 0x80 ? BIAS - t : t - BIAS;
}

/** One signed 16-bit sample -> one µ-law byte. */
export function pcmToUlaw(s) {
  let sign = 0;
  if (s < 0) {
    s = -s;
    sign = 0x80;
  }
  if (s > CLIP) s = CLIP;
  s += BIAS;
  let exponent = 7;
  for (let mask = 0x4000; (s & mask) === 0 && exponent > 0; exponent--, mask >>= 1);
  const mantissa = (s >> (exponent + 3)) & 0x0f;
  return ~(sign | (exponent << 4) | mantissa) & 0xff;
}

/** Twilio µ-law 8kHz buffer -> Gemini PCM16 16kHz buffer (2x linear upsample). */
export function twilioToGemini(ulawBuf) {
  const n = ulawBuf.length;
  const out = Buffer.allocUnsafe(n * 4); // 2 samples out, 2 bytes each
  let prev = n ? ulawToPcm(ulawBuf[0]) : 0;
  for (let i = 0; i < n; i++) {
    const cur = ulawToPcm(ulawBuf[i]);
    out.writeInt16LE(((prev + cur) / 2) | 0, i * 4); // interpolated
    out.writeInt16LE(cur, i * 4 + 2); // real
    prev = cur;
  }
  return out;
}

/** Gemini PCM16 24kHz buffer -> Twilio µ-law 8kHz buffer (decimate by 3). */
export function geminiToTwilio(pcmBuf) {
  const samples = pcmBuf.length >> 1;
  const groups = Math.floor(samples / 3);
  const out = Buffer.allocUnsafe(groups);
  for (let g = 0; g < groups; g++) {
    const i = g * 6;
    // ponytail: 3-tap box average, not a real anti-alias filter. Cheap and the
    // artefacts vanish under 8kHz telephony. Swap for a proper FIR only if
    // callers complain the voice sounds tinny.
    const avg =
      (pcmBuf.readInt16LE(i) + pcmBuf.readInt16LE(i + 2) + pcmBuf.readInt16LE(i + 4)) / 3;
    out[g] = pcmToUlaw(avg | 0);
  }
  return out;
}
