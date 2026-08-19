import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminCampaigns, moderateCampaign } from "@/lib/zelyro/promotions";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin")({ component: AdminPromotions });

function AdminPromotions() {
  const { user, isPending } = useCurrentUserState();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-promos"],
    queryFn: () => getAdminCampaigns(),
    enabled: Boolean(user),
  });
  if (isPending) return <div className="h-40 animate-pulse rounded-3xl bg-secondary" />;
  if (!user) return <RedirectToSignIn />;

  if (q.error) {
    return (
      <div className="max-w-lg rounded-3xl bg-card p-6">
        <h1 className="font-display text-3xl">Promotions desk</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This queue is for admin and super-admin accounts. Sign in with an administrator profile to
          approve, reject, pause, or feature campaigns — and to investigate reports of spam, impersonation,
          or copyright complaints.
        </p>
        <Link to="/studio" className="mt-4 inline-block text-sm underline">
          Back to Studio
        </Link>
      </div>
    );
  }

  const campaigns = q.data?.campaigns ?? [];
  const reports = q.data?.reports ?? [];

  async function act(id: string, action: "approve" | "reject" | "pause" | "feature" | "remove") {
    try {
      await moderateCampaign({ data: { campaignId: id, action } });
      toast(action);
      void qc.invalidateQueries({ queryKey: ["admin-promos"] });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-sand uppercase">Admin</p>
      <h1 className="font-display text-3xl">Promotions</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Review YouTube and catalog campaigns. Block misleading links, spam, fraudulent videos,
        impersonation, and copyright complaints.
      </p>
      {reports.length > 0 && (
        <section className="mt-8 rounded-3xl bg-card p-5">
          <h2 className="font-display text-xl">Open reports</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {reports.map((r) => (
              <li key={r.id}>
                {r.reason} · campaign {r.target_id}
              </li>
            ))}
          </ul>
        </section>
      )}
      <ul className="mt-8 space-y-3">
        {campaigns.map((c) => (
          <li key={c.campaignId} className="rounded-3xl bg-card p-4">
            <div className="flex flex-wrap gap-4">
              {c.video.thumbnailUrl && (
                <img src={c.video.thumbnailUrl} alt="" className="size-20 rounded-xl object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs tracking-widest text-sand uppercase">
                  {c.contentType} · {c.status.replaceAll("_", " ")}
                  {c.featured ? " · featured" : ""}
                </p>
                <p className="font-medium">{c.campaignName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.video.title} · {c.video.channelName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.zelyroArtistName} · {c.impressions} impressions · {c.clicks} clicks ·{" "}
                  {formatMoney(c.spentCents)} / {formatMoney(c.budgetCents)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => void act(c.campaignId, "approve")}>
                  Approve
                </Button>
                <Button size="sm" variant="subtle" onClick={() => void act(c.campaignId, "feature")}>
                  Feature
                </Button>
                <Button size="sm" variant="outline" onClick={() => void act(c.campaignId, "pause")}>
                  Pause
                </Button>
                <Button size="sm" variant="outline" onClick={() => void act(c.campaignId, "reject")}>
                  Reject
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void act(c.campaignId, "remove")}>
                  Remove
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
