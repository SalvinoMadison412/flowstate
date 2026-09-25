import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Fallback display face — used until/unless Cal Sans (CDN, see <head> below)
// loads. Both are wide, heavy grotesques.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const SITE_URL = "https://www.flowsstateagents.com";
const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Flow State",
  url: SITE_URL,
  email: "flowstate.agents@gmail.com",
  description:
    "Builds AI voice agents that answer business phones, and runs Meta Ads, Google Ads, and GEO (Generative Engine Optimization) for local businesses.",
  founder: [
    { "@type": "Person", name: "Salvino Kevin Madison" },
    { "@type": "Person", name: "Sherwin Judas Madison" },
  ],
  knowsAbout: ["AI voice agents", "Meta Ads", "Google Ads", "Generative Engine Optimization"],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Flow State — AI voice agents, Meta Ads, Google Ads, and GEO",
    template: "%s — Flow State",
  },
  description:
    "Flow State builds AI voice agents that answer your phone, and runs the Meta Ads, Google Ads, and GEO (Generative Engine Optimization) that make it ring. Talk to a live one in your browser.",
  keywords: [
    "AI voice agent",
    "AI receptionist",
    "Meta Ads agency",
    "Google Ads agency",
    "generative engine optimization",
    "GEO",
    "paid social",
    "paid search",
    "AI search optimization",
    "ChatGPT citations",
  ],
  authors: [{ name: "Flow State" }],
  creator: "Flow State",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Flow State — AI voice agents, Meta Ads, Google Ads, and GEO",
    description:
      "Meet the AI that answers your phone. Talk to a live voice agent, then see how we fill your calendar with Meta Ads, Google Ads, and GEO.",
    siteName: "Flow State",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flow State — AI voice agents, Meta Ads, Google Ads, and GEO",
    description:
      "Get found by AI. Get clicked on Google. Get discovered on Meta.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Primary display face — Cal Sans */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/cal-sans@1.0.1/index.css"
        />
      </head>
      <body className="bg-bg font-sans text-text-primary antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
        />
        {/* Without JS the reveal classes never get `.is-visible` — force
            everything visible so content stays fully rendered and crawlable. */}
        <noscript>
          <style>{`.reveal,.reveal-stagger>*{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
