import { useEffect, useState, type ReactNode } from "react";
import { Copy, Download, Share2, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  nestedFrame,
  renderShareCard,
  shareCaption,
  shareUrlFor,
  useShareSheet,
  type SharePayload,
  type ShareTemplate,
} from "@/lib/verzzify/share";
import { setYtOverlayHidden } from "@/lib/verzzify/yt-player";

export function ShareSheet() {
  const open = useShareSheet((s) => s.open);
  const payload = useShareSheet((s) => s.payload);
  const close = useShareSheet((s) => s.close);
  const [tpl, setTpl] = useState<ShareTemplate>("card");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTpl("card");
  }, [payload?.url]);

  useEffect(() => {
    setYtOverlayHidden(open);
    return () => setYtOverlayHidden(false);
  }, [open]);

  if (!open || !payload) return null;

  const url = shareUrlFor(payload, tpl);
  const caption = shareCaption(payload, url);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    toast("VerzZify link copied");
  }

  async function cardFile() {
    const blob = await renderShareCard(payload!, tpl);
    return new File([blob], "verzzify-share.png", { type: "image/png" });
  }

  async function saveCard() {
    setBusy(true);
    try {
      const file = await cardFile();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(file);
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Share card saved");
    } catch {
      toast("Could not make the card");
    } finally {
      setBusy(false);
    }
  }

  function openDest(href: string) {
    window.open(href, "_blank", "noopener,noreferrer");
    close();
  }

  async function nativeShare() {
    setBusy(true);
    try {
      const canNative = typeof navigator.share === "function" && window.isSecureContext && !nestedFrame();
      if (!canNative) {
        await copyLink();
        close();
        return;
      }
      let file: File | null = null;
      try {
        file = await cardFile();
      } catch {
        file = null;
      }
      const data: ShareData = { title: `VerzZify · ${payload!.title}`, text: caption, url };
      if (file && navigator.canShare?.({ files: [file] })) data.files = [file];
      await navigator.share(data);
      close();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        close();
        return;
      }
      try {
        await copyLink();
        close();
      } catch {
        toast("Could not share");
      }
    } finally {
      setBusy(false);
    }
  }

  const dests: { id: string; label: string; bg: string; onClick: () => void; icon: ReactNode }[] = [
    {
      id: "wa",
      label: "WhatsApp",
      bg: "bg-[#25D366]",
      icon: <WaIcon />,
      onClick: () => openDest(`https://wa.me/?text=${encodeURIComponent(caption)}`),
    },
    {
      id: "x",
      label: "X",
      bg: "bg-black",
      icon: <XLogo />,
      onClick: () => openDest(`https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`),
    },
    {
      id: "fb",
      label: "Facebook",
      bg: "bg-[#1877F2]",
      icon: <FbIcon />,
      onClick: () => openDest(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`),
    },
    {
      id: "tg",
      label: "Telegram",
      bg: "bg-[#229ED9]",
      icon: <TgIcon />,
      onClick: () =>
        openDest(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(caption)}`),
    },
    {
      id: "sms",
      label: "SMS",
      bg: "bg-emerald-600",
      icon: <SmsIcon />,
      onClick: () => openDest(`sms:?&body=${encodeURIComponent(caption)}`),
    },
    {
      id: "copy",
      label: "Copy",
      bg: "bg-white/15",
      icon: <Copy className="size-5" />,
      onClick: () => void copyLink(),
    },
    {
      id: "save",
      label: "Save card",
      bg: "bg-fuchsia-700",
      icon: <Download className="size-5" />,
      onClick: () => void saveCard(),
    },
    {
      id: "more",
      label: "More",
      bg: "bg-primary",
      icon: <Share2 className="size-5" />,
      onClick: () => void nativeShare(),
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/75 p-3 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close share" onClick={close} />
      <div className="relative z-10 max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-[28px] border border-white/10 bg-[#11081c] shadow-2xl">
        <button
          type="button"
          className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-black/40"
          onClick={close}
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="px-5 pt-8 pb-4">
          <SharePreview payload={payload} tpl={tpl} url={url} />
        </div>

        <div className="px-5 pb-2">
          <p className="mb-3 text-sm font-semibold">VerzZify card</p>
          <div className="flex gap-3">
            {(
              [
                ["card", "Square"],
                ["story", "Story"],
                ["now", "Now playing"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTpl(id)}
                className={cn(
                  "flex-1 rounded-2xl border px-2 py-3 text-center text-xs font-semibold",
                  tpl === id
                    ? "border-primary bg-primary/20 text-white"
                    : "border-white/10 bg-white/5 text-muted-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pt-4 pb-6">
          <p className="mb-3 text-sm font-semibold">Share to</p>
          <div className="grid grid-cols-4 gap-3">
            {dests.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={d.onClick}
                className="flex flex-col items-center gap-1.5"
                disabled={busy}
              >
                <span className={cn("grid size-12 place-items-center rounded-full text-white", d.bg)}>{d.icon}</span>
                <span className="text-center text-[11px] text-muted-foreground">{d.label}</span>
              </button>
            ))}
          </div>
          <Button className="mt-5 w-full" disabled={busy} onClick={() => void nativeShare()}>
            {busy ? "Preparing…" : "Share on VerzZify"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SharePreview({
  payload,
  tpl,
  url,
}: {
  payload: SharePayload;
  tpl: ShareTemplate;
  url: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[22px] bg-[#07010d] text-center shadow-lg ring-1 ring-fuchsia-500/30",
        tpl === "story" ? "px-5 pt-5 pb-4" : "px-5 pt-5 pb-5",
      )}
    >
      <img src="/logo.png?v=5" alt="VerzZify" className="mx-auto h-8 w-auto object-contain" />
      <p className="mt-2 text-[10px] font-bold tracking-[0.22em] text-fuchsia-400 uppercase">
        {tpl === "now" ? "Now playing on VerzZify" : "Listen on VerzZify"}
      </p>
      <div className="relative mx-auto mt-3 aspect-square w-[78%] overflow-hidden rounded-2xl">
        <img src={payload.coverUrl} alt="" className="size-full object-cover" />
        {tpl === "now" ? (
          <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
            ● LIVE
          </span>
        ) : null}
        <img
          src="/icon-256.png?v=5"
          alt=""
          className="absolute right-2 bottom-2 size-8 rounded-md object-cover ring-1 ring-white/30"
        />
      </div>
      <h2 className="mt-3 font-display text-xl leading-tight">{payload.title}</h2>
      {payload.subtitle ? <p className="mt-1 text-sm text-muted-foreground">{payload.subtitle}</p> : null}
      <p className="mt-2 truncate text-[10px] text-fuchsia-300/80">{url.replace(/^https?:\/\//, "")}</p>
    </div>
  );
}

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.84c0 1.96.52 3.86 1.5 5.54L2 22l4.78-1.55a10 10 0 0 0 5.26 1.48h.01c5.46 0 9.89-4.4 9.89-9.85C21.94 6.4 17.5 2 12.04 2zm5.76 13.98c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.12.1-1.8-.11-.42-.13-.95-.31-1.64-.6-2.88-1.25-4.76-4.15-4.9-4.34-.15-.2-1.2-1.6-1.2-3.05 0-1.46.76-2.17 1.03-2.47.27-.3.6-.37.8-.37h.57c.18 0 .43-.07.67.51.24.6.82 2.06.89 2.21.07.15.12.33.02.53-.1.2-.15.33-.3.5-.15.18-.31.4-.44.53-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.36 1.46.3.15.47.13.64-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.72.81 2.01.96.3.15.5.22.57.34.08.13.08.73-.16 1.41z" />
    </svg>
  );
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
      <path d="M18.9 2H22l-6.8 7.77L23.3 22h-6.5l-5.1-6.67L5.9 22H2.8l7.27-8.3L.9 2h6.66l4.6 6.13L18.9 2zm-1.14 18h1.8L6.4 3.9H4.46L17.76 20z" />
    </svg>
  );
}

function FbIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
      <path d="M14.5 8.5V6.8c0-.7.5-1.3 1.2-1.3H17V3h-2.1C12.3 3 11 4.7 11 6.8v1.7H9v2.7h2V21h3.2v-9.8h2.2l.6-2.7h-2.5z" />
    </svg>
  );
}

function TgIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
      <path d="M21.5 3.4 2.8 10.6c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 11.1-7c.5-.3 1-.1.6.2l-9 8.2-.3 4.8c.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.2-1.6z" />
    </svg>
  );
}

function SmsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
      <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z" />
    </svg>
  );
}
