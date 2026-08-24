import { Link } from "@tanstack/react-router";
import { GENRES } from "@/lib/verzzify/genres";

export function GenreChips({ active }: { active?: string }) {
  return (
    <div className="mt-6">
      <p className="text-xs font-extrabold tracking-[0.22em] text-primary uppercase">Browse by genre</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Tap a scene — VerzZify fills the page with popular artists and songs near you.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {GENRES.map((g) => {
          const isOn = active === g.slug;
          return (
            <Link
              key={g.slug}
              to="/genre/$slug"
              params={{ slug: g.slug }}
              className="group relative select-none rounded-[22px] p-[3px] transition-transform duration-150 active:translate-y-1 active:scale-[0.97]"
              style={{
                background: g.gradient,
                boxShadow: isOn
                  ? `0 0 0 2px #fff, 0 10px 28px ${g.glow}`
                  : `0 6px 0 rgba(0,0,0,0.35), 0 12px 24px ${g.glow}`,
              }}
            >
              <span
                className="flex h-[4.25rem] flex-col items-center justify-center gap-1 rounded-[19px] px-2 text-center text-white"
                style={{
                  background: "linear-gradient(180deg,rgba(255,255,255,0.22),rgba(0,0,0,0.18))",
                  textShadow: "0 1px 2px rgba(0,0,0,0.45)",
                }}
              >
                <span className="text-xl leading-none drop-shadow">{g.emoji}</span>
                <span className="text-[13px] font-extrabold tracking-wide">{g.name}</span>
              </span>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-3 top-1 h-3 rounded-full opacity-50 group-hover:opacity-70"
                style={{
                  background: "linear-gradient(180deg,rgba(255,255,255,0.55),transparent)",
                }}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
