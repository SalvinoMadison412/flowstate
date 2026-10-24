import type { Metadata, Viewport } from "next";
import { Inter_Tight, Inter, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Variable font (no weight list) so intermediate weights like 575 work.
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-manrope",
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
  email: "salvino@flowstateaiagents.com",
  telephone: "+1-629-281-8264",
  sameAs: ["https://www.instagram.com/flowstate.agents", "https://www.youtube.com/channel/UCSzJ1MweDDLcGezsNY1juLw"],
  description:
    "Builds AI voice agents, automations and AI workflows for local businesses.",
  founder: {
    "@type": "Person",
    name: "Salvino Kevin Madison",
    sameAs: "https://www.linkedin.com/in/salvino-madison",
  },
  member: {
    "@type": "Person",
    name: "Sherwin Judas Madison",
    jobTitle: "Compliance & Finance",
    sameAs: "https://www.linkedin.com/in/sherwin-judas-madison-b7b649338/",
  },
  knowsAbout: ["AI voice agents", "Business automation", "AI workflows"],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Flow State — AI voice agents and automations",
    template: "%s — Flow State",
  },
  description:
    "Flow State builds AI voice agents, automations and AI workflows for local businesses. Talk to a live voice agent in your browser.",
  keywords: [
    "AI voice agent",
    "AI receptionist",
    "business automation",
    "AI workflows",
    "AI phone answering",
    "AI booking assistant",
  ],
  authors: [{ name: "Flow State" }],
  creator: "Flow State",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Flow State — AI voice agents and automations",
    description:
      "Meet the AI that answers your phone. Talk to a live voice agent, then see the automations that take busywork off your team.",
    siteName: "Flow State",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flow State — AI voice agents and automations",
    description:
      "Meet the AI that answers your phone.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${manrope.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
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
