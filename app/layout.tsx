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

const SITE_URL = "https://flowstate.agency";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Flow State — Meta Ads, Google Ads, and GEO for the AI era",
    template: "%s — Flow State",
  },
  description:
    "Flow State is a marketing agency running Meta Ads, Google Ads, and GEO (Generative Engine Optimization). Get found by AI, get clicked on Google, get discovered on Meta.",
  keywords: [
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
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Flow State — Meta Ads, Google Ads, and GEO for the AI era",
    description:
      "Get found by AI. Get clicked on Google. Get discovered on Meta. One agency across all three channels.",
    siteName: "Flow State",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flow State — Meta Ads, Google Ads, and GEO for the AI era",
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
