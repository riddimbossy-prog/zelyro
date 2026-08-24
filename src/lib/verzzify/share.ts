import { create } from "zustand";

export type SharePayload = {
  kind: "Song" | "Live" | "Event" | "Album";
  title: string;
  subtitle?: string;
  coverUrl: string;
  url: string;
};

export type ShareTemplate = "card" | "story" | "now";

type ShareState = {
  open: boolean;
  payload: SharePayload | null;
  show: (p: SharePayload) => void;
  close: () => void;
};

export function appOrigin() {
  if (typeof window === "undefined") return "https://verzzify.com";
  return window.location.origin;
}

export function shareWatchUrl(videoId: string) {
  return `${appOrigin()}/watch/${encodeURIComponent(videoId)}`;
}

export function shareTrackUrl(trackId: string) {
  if (trackId.startsWith("yt_")) return shareWatchUrl(trackId.slice(3));
  return `${appOrigin()}/track/${encodeURIComponent(trackId)}`;
}

export function nestedFrame() {
  try {
    return typeof window !== "undefined" && window.self !== window.top;
  } catch {
    return true;
  }
}

export function shareCaption(payload: SharePayload, url: string) {
  const by = payload.subtitle ? ` — ${payload.subtitle}` : "";
  return `Play “${payload.title}”${by} on VerzZify\n${url}`;
}

export function shareUrlFor(payload: SharePayload, tpl: ShareTemplate) {
  if (tpl !== "now") return payload.url;
  return `${payload.url}${payload.url.includes("?") ? "&" : "?"}src=now`;
}

function loadImage(src: string, cors = true): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (cors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxW) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (words.length && lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxW && last.length > 1) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

export async function renderShareCard(payload: SharePayload, tpl: ShareTemplate): Promise<Blob> {
  const story = tpl === "story";
  const W = 1080;
  const H = story ? 1920 : 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  ctx.fillStyle = "#07010d";
  ctx.fillRect(0, 0, W, H);

  const cover = payload.coverUrl ? await loadImage(payload.coverUrl) : null;
  const logo = await loadImage("/logo.png?v=5", false);
  const mark = await loadImage("/icon-256.png?v=5", false);

  function paint(art: HTMLImageElement | null) {
    ctx.fillStyle = "#07010d";
    ctx.fillRect(0, 0, W, H);

    if (art) {
      ctx.save();
      ctx.filter = "blur(48px)";
      ctx.globalAlpha = 0.35;
      const s = Math.max(W / art.width, H / art.height);
      ctx.drawImage(art, (W - art.width * s) / 2, (H - art.height * s) / 2, art.width * s, art.height * s);
      ctx.restore();
    }
    const fade = ctx.createLinearGradient(0, 0, 0, H);
    fade.addColorStop(0, "rgba(7,1,13,0.35)");
    fade.addColorStop(0.45, "rgba(7,1,13,0.55)");
    fade.addColorStop(1, "#07010d");
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, W, H);

    const logoH = story ? 92 : 78;
    if (logo) {
      const scale = logoH / logo.height;
      const lw = logo.width * scale;
      ctx.drawImage(logo, (W - lw) / 2, story ? 96 : 72, lw, logoH);
    } else if (mark) {
      ctx.drawImage(mark, (W - 96) / 2, 72, 96, 96);
    }

    ctx.fillStyle = "#e879f9";
    ctx.font = "700 28px Montserrat, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(tpl === "now" ? "NOW PLAYING ON VERZZIFY" : "LISTEN ON VERZZIFY", W / 2, story ? 230 : 186);

    const coverSize = story ? 760 : 720;
    const coverX = (W - coverSize) / 2;
    const coverY = story ? 300 : 240;
    ctx.save();
    roundRect(ctx, coverX, coverY, coverSize, coverSize, 48);
    ctx.clip();
    if (art) {
      const s = Math.max(coverSize / art.width, coverSize / art.height);
      const dw = art.width * s;
      const dh = art.height * s;
      ctx.drawImage(art, coverX + (coverSize - dw) / 2, coverY + (coverSize - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = "#1c1030";
      ctx.fillRect(coverX, coverY, coverSize, coverSize);
    }
    ctx.restore();

    if (tpl === "now") {
      ctx.fillStyle = "#c026d3";
      roundRect(ctx, coverX + 36, coverY + 36, 250, 64, 32);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "800 26px Montserrat, Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("●  LIVE", coverX + 70, coverY + 78);
    }

    if (mark) {
      ctx.drawImage(mark, coverX + coverSize - 108, coverY + coverSize - 108, 80, 80);
    }

    const textY = coverY + coverSize + (story ? 90 : 70);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 56px Montserrat, Arial, sans-serif";
    ctx.textAlign = "center";
    const titleLines = wrapLines(ctx, payload.title, W - 140, 3);
    titleLines.forEach((line, i) => ctx.fillText(line, W / 2, textY + i * 66));

    if (payload.subtitle) {
      ctx.fillStyle = "#c4b5d6";
      ctx.font = "600 34px Nunito Sans, Arial, sans-serif";
      ctx.fillText(payload.subtitle, W / 2, textY + titleLines.length * 66 + 16);
    }

    ctx.fillStyle = "#e879f9";
    ctx.font = "700 30px Montserrat, Arial, sans-serif";
    ctx.fillText("verzzify.com", W / 2, H - (story ? 120 : 80));
  }

  try {
    paint(cover);
    return await blobOf(canvas);
  } catch {
    paint(null);
    return await blobOf(canvas);
  }
}

function blobOf(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("blob"))), "image/png");
  });
}

export const useShareSheet = create<ShareState>((set) => ({
  open: false,
  payload: null,
  show: (payload) => set({ open: true, payload }),
  close: () => set({ open: false, payload: null }),
}));
