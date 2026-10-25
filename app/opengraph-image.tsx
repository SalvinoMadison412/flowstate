import { ImageResponse } from "next/og";

// The link preview card shown when the site is shared (LinkedIn, iMessage,
// WhatsApp, X). Rendered once at build time; nested pages inherit it.
export const alt = "Flow State: AI voice agents and automations";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Kaushan Script for the wordmark (matching the nav) and Inter Tight for the
// copy. Google serves TTF to a plain fetch. Both must load, or the renderer
// borrows the wordmark's glyphs for the copy. ponytail: build-time network
// fetch; if it fails the card falls back to the default font rather than
// breaking the build.
async function googleFont(query: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?${query}`)).text();
    const url = css.match(/src: url\((.+?)\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const [font, sans] = await Promise.all([
    googleFont("family=Kaushan+Script&text=Flowstate"),
    googleFont("family=Inter+Tight:wght@500"),
  ]);
  const fonts = font && sans
    ? [
        { name: "Kaushan", data: font, style: "normal" as const, weight: 400 as const },
        { name: "Inter Tight", data: sans, style: "normal" as const, weight: 500 as const },
      ]
    : [];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "#ffffff",
          fontFamily: fonts.length ? "Inter Tight" : undefined,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: fonts.length ? "Kaushan" : undefined,
            fontSize: 150,
            lineHeight: 1.15,
            paddingBottom: 12,
            backgroundImage: "linear-gradient(90deg, #0b1d3a, #0f6e78 60%, #1a8fa3)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Flowstate
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 52, color: "#1b1a18", letterSpacing: "-0.02em" }}>
          Meet the AI that answers your phone.
        </div>
        <div style={{ display: "flex", marginTop: 18, fontSize: 30, color: "#55534e" }}>
          AI voice agents and automations · flowsstateagents.com
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
