import { useState, type MouseEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UserCheck, UserPlus } from "lucide-react";
import { toggleFollow } from "@/lib/verzzify/queries";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function FollowButton({
  artistId,
  artistName,
  initial = false,
  size = "default",
  className,
}: {
  artistId: string;
  artistName?: string;
  initial?: boolean;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const qc = useQueryClient();
  const [following, setFollowing] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function onClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const r = await toggleFollow({ data: artistId });
      setFollowing(r.following);
      toast(
        r.following
          ? `Following ${artistName ?? "this artist"} — new songs show up on Home`
          : `Unfollowed ${artistName ?? "artist"}`,
      );
      void qc.invalidateQueries({ queryKey: ["artist"] });
      void qc.invalidateQueries({ queryKey: ["me"] });
      void qc.invalidateQueries({ queryKey: ["library"] });
    } catch {
      toast("Could not follow right now");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={following ? "subtle" : "default"}
      className={cn(following && "ring-1 ring-primary/40", className)}
      onClick={onClick}
      disabled={busy}
      aria-pressed={following}
    >
      {following ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
      {following ? "Following" : "Follow"}
    </Button>
  );
}
