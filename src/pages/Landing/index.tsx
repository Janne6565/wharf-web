import { Features } from "./Features";
import { Hero } from "./Hero";
import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";
import { Security } from "./Security";

// Public marketing landing page served at `/`. Rendered on the server (this
// route intentionally omits `ssr: false`), so the copy ships in the initial HTML.
export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-subtle">
      <LandingNav />
      <Hero />
      <Features />
      <Security />
      <LandingFooter />
    </div>
  );
}
