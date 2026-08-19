import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Compass,
  House,
  Library,
  Search,
  Users,
  UserRound,
  Mic2,
} from "lucide-react";
import { copy } from "@/lib/zelyro/copy";
import { cn } from "@/lib/utils";
import { FullPlayer, MiniPlayer } from "@/components/player";
import { YoutubePlayerOverlay } from "@/components/youtube-player";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { UserButton } from "@/lib/auth/gates";

const nav = [
  { to: "/", label: copy.nav.home, icon: House },
  { to: "/discover", label: copy.nav.discover, icon: Compass },
  { to: "/library", label: copy.nav.library, icon: Library },
  { to: "/community", label: copy.nav.community, icon: Users },
  { to: "/profile", label: copy.nav.profile, icon: UserRound },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isPending } = useCurrentUserState();

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border px-4 py-6 md:flex lg:w-60">
        <Link to="/" className="px-2 font-display text-2xl tracking-tight">
          {copy.app}
        </Link>
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
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-sm",
                  active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
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
              "flex h-11 items-center gap-3 rounded-xl px-3 text-sm",
              pathname.startsWith("/search")
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <Search className="size-4" />
            {copy.nav.search}
          </Link>
          <Link
            to="/studio"
            className="mt-auto flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground hover:bg-secondary"
          >
            <Mic2 className="size-4" />
            {copy.nav.studio}
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
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-2 md:px-8">
          <Link to="/" className="font-display text-xl md:hidden">
            {copy.app}
          </Link>
          <Link
            to="/search"
            className="ml-auto flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-secondary px-4 text-sm text-muted-foreground md:max-w-md"
          >
            <Search className="size-4 shrink-0" />
            <span className="truncate">Search songs, artists, YouTube, events</span>
          </Link>
        </header>
        <main className="min-w-0 flex-1 px-4 pb-36 md:px-8 md:pb-28">
          <Outlet />
          <footer className="mt-16 flex flex-wrap gap-4 pb-4 text-xs text-muted-foreground">
            <Link to="/welcome">About</Link>
            <Link to="/architecture">Architecture</Link>
            <Link to="/news">Journal</Link>
            <Link to="/legal">Legal</Link>
            <Link to="/admin">Admin</Link>
          </footer>
        </main>
        <div className="sticky bottom-0 z-30 md:bottom-0">
          <MiniPlayer />
          <nav className="flex border-t border-border bg-card md:hidden">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[10px]",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <FullPlayer />
      <YoutubePlayerOverlay />
    </div>
  );
}
