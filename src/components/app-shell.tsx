import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Compass,
  FolderDown,
  House,
  Search,
  Users,
  UserRound,
  Mic2,
  Trophy,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { copy } from "@/lib/verzzify/copy";
import { cn } from "@/lib/utils";
import { FullPlayer, MiniPlayer } from "@/components/player";
import { VerzZifySearch } from "@/components/verzzify-search";
import { ShareSheet } from "@/components/share-sheet";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { UserButton } from "@/lib/auth/gates";
import { useDownloads } from "@/lib/verzzify/downloads";
import { useEffect } from "react";

const nav = [
  { to: "/", label: copy.nav.home, icon: House },
  { to: "/discover", label: copy.nav.discover, icon: Compass },
  { to: "/charts", label: copy.nav.charts, icon: Trophy },
  { to: "/library", label: copy.nav.library, icon: FolderDown },
  { to: "/community", label: copy.nav.community, icon: Users },
  { to: "/studio", label: copy.nav.studio, icon: Mic2 },
  { to: "/profile", label: copy.nav.profile, icon: UserRound },
] as const;

const tabs = nav.filter((item) => item.to !== "/charts" && item.to !== "/studio");

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isPending } = useCurrentUserState();
  const isCall = pathname.startsWith("/video/");

  useEffect(() => {
    void useDownloads.getState().hydrate();
  }, []);

  if (isCall) {
    return (
      <div className="min-h-dvh bg-background text-foreground">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh overflow-hidden bg-transparent text-foreground">
      <aside className="glass z-20 hidden h-full w-56 shrink-0 flex-col border-r-0 px-4 py-6 md:flex lg:w-60">
        <BrandMark />
        <p className="mt-1 px-2 text-[11px] tracking-[0.18em] text-primary uppercase">{copy.domain}</p>
        <p className="mt-1 px-2 text-xs text-muted-foreground">{copy.tagline}</p>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "nav-chip flex h-11 items-center gap-3 rounded-xl px-3 text-sm",
                  active ? "nav-chip-active" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
          <Link
            to="/search"
            className={cn(
              "nav-chip flex h-11 items-center gap-3 rounded-xl px-3 text-sm",
              pathname.startsWith("/search")
                ? "nav-chip-active"
                : "text-muted-foreground",
            )}
          >
            <Search className="size-4" />
            {copy.nav.search}
          </Link>
        </nav>
        <div className="mt-4 px-2">
          {isPending ? (
            <div className="h-8 w-28 animate-pulse rounded-full bg-secondary" />
          ) : user ? (
            <UserButton />
          ) : (
            <Link to="/login" className="text-sm font-medium text-primary">
              {copy.auth.signIn}
            </Link>
          )}
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="glass z-40 shrink-0 border-0 px-4 py-2.5 md:px-8">
          <div className="flex items-center gap-3">
            <BrandMark compact className="md:hidden" />
            {pathname.startsWith("/community") || pathname.startsWith("/search") ? (
              <div className="min-w-0 flex-1" />
            ) : (
              <VerzZifySearch />
            )}
          </div>
        </header>
        <main className="page-rise min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pb-8 md:px-8">
          <Outlet />
          <footer className="mt-16 flex flex-wrap gap-4 pb-4 text-xs text-muted-foreground">
            <Link to="/welcome">About</Link>
            <a href="https://verzzify.com" className="hover:text-foreground">
              verzzify.com
            </a>
            <Link to="/charts">Charts</Link>
            <Link to="/architecture">Architecture</Link>
            <Link to="/news">Journal</Link>
            <Link to="/legal">Legal</Link>
            <Link to="/admin">Admin</Link>
            <Link to="/library">Library</Link>
          </footer>
        </main>
        <div className="z-30 shrink-0">
          <MiniPlayer />
          <nav className="glass flex items-end border-0 px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] md:hidden">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              const raised = item.to === "/community";
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px]",
                    raised ? "-mt-5" : "h-14",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid place-items-center",
                      raised && "fab-glow size-14 rounded-full bg-primary text-primary-foreground",
                    )}
                  >
                    <Icon className={cn(raised ? "size-6" : "size-5")} />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <FullPlayer />
      <ShareSheet />
    </div>
  );
}
