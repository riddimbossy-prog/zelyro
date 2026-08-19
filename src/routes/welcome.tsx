import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/zelyro/copy";

export const Route = createFileRoute("/welcome")({ component: Welcome });

const pillars = [
  { t: "Stream on Zelyro", d: "A player that stays with you. Background audio, queue, and a catalog that is actually owned." },
  { t: "Promote on YouTube", d: "Paste an official YouTube URL. Zelyro pulls the title and thumbnail, then sends fans to YouTube’s player — never a rip." },
  { t: "Sell & show up", d: "Artists set the price. Tickets with random QR codes. Zelyro Live PPV with short-lived tokens." },
  { t: "Belong", d: "A community that is not a clone of anyone’s feed — announcements, nights, and the work." },
];

export function Welcome() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link to="/" className="font-display text-2xl">
          {copy.app}
        </Link>
        <div className="flex gap-3">
          <Link to="/architecture" className="hidden text-sm text-muted-foreground md:inline">
            Architecture
          </Link>
          <Button asChild size="sm">
            <Link to="/">Open the catalog</Link>
          </Button>
        </div>
      </header>
      <section className="relative overflow-hidden px-6 py-16 md:px-12 md:py-24">
        <img src="/banners/hero.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="relative max-w-2xl">
          <p className="text-xs tracking-[0.25em] text-sand uppercase">London · New York · Lagos · Seoul · São Paulo · Accra</p>
          <h1 className="mt-4 font-display text-5xl font-medium md:text-7xl">{copy.tagline}</h1>
          <p className="mt-5 max-w-lg text-base text-muted-foreground md:text-lg">{copy.sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/">Listen</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/login">Create account</Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="grid gap-6 px-6 py-16 md:grid-cols-2 md:px-12">
        {pillars.map((p) => (
          <article key={p.t} className="rounded-[28px] bg-card p-8">
            <h2 className="font-display text-2xl">{p.t}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
          </article>
        ))}
      </section>
      <section className="px-6 pb-24 md:px-12">
        <div className="overflow-hidden rounded-[28px] bg-secondary md:grid md:grid-cols-2">
          <img src="/covers/gold-coast.jpg" alt="" className="h-64 w-full object-cover md:h-full" />
          <div className="p-8 md:p-12">
            <h2 className="font-display text-3xl">For artists</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Two distribution lanes. Upload a master to Zelyro for streaming, free or paid download.
              Or paste your official YouTube music link and run a promotion — discovery, profile, and
              Zelyro-measured clicks, never invented YouTube view counts. Register as a fan, artist,
              producer, or organizer. There is no DJ account type.
            </p>
            <Button className="mt-6" asChild>
              <Link to="/studio">Open Studio</Link>
            </Button>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          Apple App Store and Google Play listings ship with the Flutter clients. This web catalog is the
          same product, same database, same rules.
        </p>
      </section>
    </main>
  );
}
