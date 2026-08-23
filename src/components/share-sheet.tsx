import { useState } from "react";
import { Check, Copy, Radio, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useShareSheet } from "@/lib/verzzify/share";

export function ShareSheet() {
  const open = useShareSheet((s) => s.open);
  const payload = useShareSheet((s) => s.payload);
  const close = useShareSheet((s) => s.close);
  const [tpl, setTpl] = useState<"default" | "live" | "link">("default");
  if (!open || !payload) return null;

  const url =
    tpl === "live"
      ? `${payload.url}${payload.url.includes("?") ? "&" : "?"}src=live`
      : payload.url;

  async function share() {
    if (!payload) return;
    try {
      if (tpl === "link" || !navigator.share) {
        await navigator.clipboard.writeText(url);
        toast("Link copied");
        return;
      }
      await navigator.share({ title: payload.title, text: payload.subtitle, url });
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast("Link copied");
      } catch {
        toast("Could not share");
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-background/50 p-4 backdrop-blur-md sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close share" onClick={close} />
      <div className="glass relative w-full max-w-sm overflow-hidden rounded-[28px]">
        <button
          type="button"
          className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-secondary"
          onClick={close}
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        <div className="bg-secondary px-6 pt-10 pb-6">
          <div className="overflow-hidden rounded-2xl bg-background p-4">
            <p className="mb-3 text-right text-xs font-semibold tracking-widest text-primary uppercase">
              {payload.kind}
            </p>
            <img src={payload.coverUrl} alt="" className="mx-auto aspect-square w-4/5 rounded-xl object-cover" />
            <h2 className="mt-4 font-display text-2xl">{payload.title}</h2>
            {payload.subtitle && <p className="text-sm text-muted-foreground">{payload.subtitle}</p>}
          </div>
        </div>
        <div className="p-5">
          <p className="mb-3 text-sm font-medium">Choose templates</p>
          <div className="flex items-start justify-center gap-4">
            <Tpl
              active={tpl === "default"}
              label="Default"
              img={payload.coverUrl}
              onClick={() => setTpl("default")}
            />
            <Tpl
              active={tpl === "live"}
              label="Live streaming"
              img={payload.coverUrl}
              ring
              onClick={() => setTpl("live")}
            />
            <button type="button" onClick={() => setTpl("link")} className="flex w-16 flex-col items-center gap-2">
              <span
                className={cn(
                  "grid size-14 place-items-center rounded-full",
                  tpl === "link" ? "bg-primary text-primary-foreground" : "bg-secondary",
                )}
              >
                {tpl === "link" ? <Check className="size-5" /> : <Copy className="size-5" />}
              </span>
              <span className="text-center text-[11px] text-muted-foreground">Copy link</span>
            </button>
          </div>
          <Button className="mt-6 w-full" onClick={() => void share()}>
            {tpl === "live" ? (
              <>
                <Radio className="size-4" /> Share live
              </>
            ) : (
              "Share"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Tpl({
  active,
  label,
  img,
  ring,
  onClick,
}: {
  active: boolean;
  label: string;
  img: string;
  ring?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-16 flex-col items-center gap-2">
      <span className={cn("relative size-14 overflow-hidden rounded-full", active && "ring-2 ring-primary ring-offset-2 ring-offset-card")}>
        <img src={img} alt="" className="size-full object-cover" />
        {ring && <span className="absolute inset-0 rounded-full ring-2 ring-primary/70" />}
      </span>
      <span className="text-center text-[11px] text-muted-foreground">{label}</span>
    </button>
  );
}
