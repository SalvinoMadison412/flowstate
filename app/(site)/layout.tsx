import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/sections/Footer";
import { VoiceCallProvider } from "@/lib/useVoiceCall";

// Shared by every marketing page. Living in the layout means a call with
// Maoshi keeps going while the visitor clicks between pages.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <VoiceCallProvider>
      <Nav />
      <main>{children}</main>
      <Footer />
    </VoiceCallProvider>
  );
}
