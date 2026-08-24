import { useEffect, useState } from "react";
import { Check, Copy, Radio, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { nestedFrame, useShareSheet } from "@/lib/verzzify/share";
import { setYtOverlayHidden } from "@/lib/verzzify/yt-player";

export function ShareSheet() {
  const open = useShareSheet((s) => s.open);
  const payload = useShareSheet((s) => s.payload);
  const close = useShareSheet((s) => s.close);
  const [tpl, setTpl] = useState<"default" | "live" | "link">("default");

  useEffect(() => {
    setTpl("default");
  }, [payload?.url]);

  useEffect(() => {
    setYtOverlayHidden(open);
    return () => setYtOverlayHidden(false);
  }, [open]);

  if (!open || !payload) return null;

  const url =
    tpl === "live"
      ? `${payload.url}${payload.url.includes("?") ? "&" : "?"}src=live`
      : payload.url;

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    toast("Link copied");
  }

  async function share() {
    if (!payload) return;
    const canNative =
      tpl !== "link" &&
      typeof navigator.share === "function" &&
      window.isSecureContext &&
      !nestedFrame();
    try {
      if (!canNative) {
        await copyLink();
        close();
        return;
      }
      await navigator.share({
        title: payload.title,
        text: payload.subtitle ? `${payload.title} — ${payload.subtitle}` : payload.title,
        url,
      });
      close();
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "AbortError") {
        close();
        return;
      }
      try {
        await copyLink();
        close();
      } catch {
        toast("Could not share");
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close share" onClick={close} />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-[28px] border border-white/10 bg-[#140a22] shadow-2xl">
        <button
          type="button"
          className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-white/10"
          onClick={close}
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        <div className="bg-[#1c1030] px-6 pt-10 pb-6">
          <div className="overflow-hidden rounded-2xl bg-[#0f0818] p-4">
            <p className="mb-3 text-right text-xs font-semibold tracking-widest text-primary uppercase">
              {payload.kind}
            </p>
            <img src={payload.coverUrl} alt="" className="mx-auto aspect-square w-4/5 rounded-xl object-cover" />
            <h2 className="mt-4 font-display text-2xl">{payload.title}</h2>
            {payload.subtitle && <p className="text-sm text-muted-foreground">{payload.subtitle}</p>}
            <p className="mt-3 truncate text-[11px] text-muted-foreground">{url}</p>
          </div>
        </div>
        <div className="p-5">
          <p className="mb-3 text-sm font-medium">Share as</p>
          <div className="flex items-start justify-center gap-4">
            <Tpl
              active={tpl === "default"}
              label="Default"
              img={payload.coverUrl}
              onClick={() => setTpl("default")}
            />
            <Tpl
              active={tpl === "live"}
              label="Now playing"
              img={payload.coverUrl}
              ring
              onClick={() => setTpl("live")}
            />
            <button
              type="button"
              onClick={() => {
                setTpl("link");
                void navigator.clipboard.writeText(payload.url).then(
                  () => toast("Link copied"),
                  () => toast("Could not copy"),
                );
              }}
              className="flex w-16 flex-col items-center gap-2"
            >
              <span
                className={cn(
                  "grid size-14 place-items-center rounded-full",
                  tpl === "link" ? "bg-primary text-primary-foreground" : "bg-white/10",
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
                <Radio className="size-4" /> Share now playing
              </>
            ) : tpl === "link" ? (
              "Copy link"
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
      <span className={cn("relative size-14 overflow-hidden rounded-full", active && "ring-2 ring-primary ring-offset-2 ring-offset-[#140a22]")}>
        <img src={img} alt="" className="size-full object-cover" />
        {ring && <span className="absolute inset-0 rounded-full ring-2 ring-primary/70" />}
      </span>
      <span className="text-center text-[11px] text-muted-foreground">{label}</span>
    </button>
  );
}
