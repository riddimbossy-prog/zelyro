import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile, updateMyProfile } from "@/lib/sheba/queries";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/profile")({ component: Profile });

function Profile() {
  const { user, isPending } = useCurrentUserState();
  const q = useQuery({ queryKey: ["me"], queryFn: () => getMyProfile(), enabled: Boolean(user) });
  const p = q.data;
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("GH");
  const [city, setCity] = useState("");
  const ready = Boolean(p);
  if (isPending) return <div className="h-40 animate-pulse rounded-3xl bg-secondary" />;
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl">Profile</h1>
      <div className="mt-6 flex items-center gap-4">
        <UserButton />
      </div>
      {ready && (
        <form
          className="mt-8 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await updateMyProfile({
                data: {
                  displayName: displayName || p!.displayName,
                  bio: bio || p!.bio || "",
                  country,
                  city,
                },
              });
              toast("Saved");
            } catch {
              toast("Could not save");
            }
          }}
        >
          <Label>Display name</Label>
          <Input defaultValue={p!.displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <Label>Bio</Label>
          <Input defaultValue={p!.bio ?? ""} onChange={(e) => setBio(e.target.value)} />
          <Label>Country</Label>
          <Input defaultValue={p!.country ?? "GH"} onChange={(e) => setCountry(e.target.value)} />
          <Label>City</Label>
          <Input defaultValue={p!.city ?? ""} onChange={(e) => setCity(e.target.value)} />
          <Button type="submit">Save</Button>
        </form>
      )}
      <div className="mt-10 flex flex-col gap-3 text-sm">
        <Link to="/studio" className="text-primary">
          Creator Studio
        </Link>
        <Link to="/library" className="text-primary">
          Library and tickets
        </Link>
        <Link to="/architecture">Architecture</Link>
        <Link to="/welcome">About Sheba</Link>
      </div>
    </div>
  );
}
