import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateMyProfile } from "@/lib/zelyro/queries";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { MackProfileView } from "@/components/mack-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/profile")({
  loader: () => getMyProfile(),
  component: Profile,
});

function Profile() {
  const { user, isPending } = useCurrentUserState();
  const qc = useQueryClient();
  const initial = Route.useLoaderData();
  const q = useQuery({
    queryKey: ["me"],
    queryFn: () => getMyProfile(),
    initialData: initial ?? undefined,
    enabled: Boolean(user),
  });
  const p = q.data;
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");

  if (isPending) return <div className="h-80 animate-pulse rounded-3xl bg-secondary" />;
  if (!user) return <RedirectToSignIn />;
  if (!p) return <p className="py-16 text-muted-foreground">Profile could not load.</p>;

  return (
    <MackProfileView
      name={p.displayName}
      slug={p.username}
      avatarUrl={p.avatarUrl}
      bannerUrl={p.bannerUrl}
      bio={p.bio}
      city={p.city}
      country={p.country}
      verified={p.verified}
      totalPlays={p.totalPlays}
      followers={p.followers}
      followingCount={p.followingCount}
      genres={p.genres ?? p.favoriteGenres}
      monthlyListeners={p.monthlyListeners}
      tracks={p.tracks}
      albums={p.albums}
      liked={p.liked}
      playlists={p.playlists}
      following={p.following}
      suggested={p.suggested}
      posts={p.posts}
      live={p.live}
      chartRanks={p.chartRanks}
      videoCall={p.videoCall}
      isOwner
      about={
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await updateMyProfile({
                data: {
                  displayName: displayName || p.displayName,
                  bio: bio || p.bio || "",
                  country: country || p.country || "US",
                  city: city || p.city || "",
                },
              });
              toast("Saved");
              void qc.invalidateQueries({ queryKey: ["me"] });
            } catch {
              toast("Could not save");
            }
          }}
        >
          <div className="md:col-span-2">
            <p className="font-display text-2xl">About</p>
            <p className="mt-1 text-sm text-muted-foreground">This is how listeners see you on VerzZify.</p>
          </div>
          <div>
            <Label>Display name</Label>
            <Input className="mt-1" defaultValue={p.displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <Label>Handle</Label>
            <Input className="mt-1" defaultValue={`@${p.username}`} readOnly />
          </div>
          <div className="md:col-span-2">
            <Label>Bio</Label>
            <Input className="mt-1" defaultValue={p.bio ?? ""} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div>
            <Label>Country</Label>
            <Input className="mt-1" defaultValue={p.country ?? ""} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div>
            <Label>City</Label>
            <Input className="mt-1" defaultValue={p.city ?? ""} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <Button type="submit">Save</Button>
            <Link to="/studio" className="text-sm text-primary">
              Creator Studio
            </Link>
            <Link to="/library" className="text-sm text-muted-foreground">
              Library
            </Link>
          </div>
        </form>
      }
    />
  );
}
