import { create } from "zustand";

export type SharePayload = {
  kind: "Song" | "Live" | "Event" | "Album";
  title: string;
  subtitle?: string;
  coverUrl: string;
  url: string;
};

export type ShareTemplate = "classic" | "poster" | "neon" | "billboard" | "stack" | "story" | "now";

export const SHARE_DESIGNS: { id: ShareTemplate; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "poster", label: "Poster" },
  { id: "neon", label: "Neon" },
  { id: "billboard", label: "Billboard" },
  { id: "stack", label: "Stack" },
  { id: "story", label: "Story" },
  { id: "now", label: "Now playing" },
];

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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
    if (ctx.measureText(next).width <= maxW) line = next;
    else {
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

function fillCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (!img) {
    ctx.fillStyle = "#1c1030";
    ctx.fillRect(x, y, w, h);
    return;
  }
  const s = Math.max(w / img.width, h / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function blurBg(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, W: number, H: number) {
  ctx.fillStyle = "#07010d";
  ctx.fillRect(0, 0, W, H);
  if (!img) return;
  ctx.save();
  ctx.filter = "blur(48px)";
  ctx.globalAlpha = 0.4;
  const s = Math.max(W / img.width, H / img.height);
  ctx.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
  ctx.restore();
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  mark: HTMLImageElement | null,
  W: number,
  y: number,
  h: number,
) {
  if (logo) {
    const scale = h / logo.height;
    const lw = logo.width * scale;
    ctx.drawImage(logo, (W - lw) / 2, y, lw, h);
  } else if (mark) {
    ctx.drawImage(mark, (W - h) / 2, y, h, h);
  }
}

type PaintArgs = {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  payload: SharePayload;
  cover: HTMLImageElement | null;
  logo: HTMLImageElement | null;
  mark: HTMLImageElement | null;
};

function paintClassic({ ctx, W, H, payload, cover, logo, mark }: PaintArgs, live = false) {
  blurBg(ctx, cover, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(7,1,13,0.3)");
  g.addColorStop(1, "#07010d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  drawLogo(ctx, logo, mark, W, 72, 78);
  ctx.fillStyle = "#e879f9";
  ctx.font = "700 26px Montserrat, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(live ? "NOW PLAYING ON VERZZIFY" : "LISTEN ON VERZZIFY", W / 2, 186);
  const size = 720;
  const x = (W - size) / 2;
  const y = 230;
  ctx.save();
  roundRect(ctx, x, y, size, size, 48);
  ctx.clip();
  fillCover(ctx, cover, x, y, size, size);
  ctx.restore();
  if (live) {
    ctx.fillStyle = "#c026d3";
    roundRect(ctx, x + 28, y + 28, 240, 60, 30);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "800 24px Montserrat, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("●  LIVE", x + 62, y + 68);
  }
  if (mark) ctx.drawImage(mark, x + size - 100, y + size - 100, 72, 72);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = "800 52px Montserrat, Arial, sans-serif";
  const lines = wrapLines(ctx, payload.title, W - 140, 3);
  lines.forEach((line, i) => ctx.fillText(line, W / 2, y + size + 80 + i * 62));
  if (payload.subtitle) {
    ctx.fillStyle = "#c4b5d6";
    ctx.font = "600 32px Nunito Sans, Arial, sans-serif";
    ctx.fillText(payload.subtitle, W / 2, y + size + 80 + lines.length * 62);
  }
  ctx.fillStyle = "#e879f9";
  ctx.font = "700 28px Montserrat, Arial, sans-serif";
  ctx.fillText("verzzify.com", W / 2, H - 70);
}

function paintPoster({ ctx, W, H, payload, cover, logo, mark }: PaintArgs) {
  fillCover(ctx, cover, 0, 0, W, H);
  const g = ctx.createLinearGradient(0, H * 0.35, 0, H);
  g.addColorStop(0, "rgba(7,1,13,0)");
  g.addColorStop(0.45, "rgba(7,1,13,0.55)");
  g.addColorStop(1, "#07010d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  if (logo) {
    const scale = 64 / logo.height;
    ctx.drawImage(logo, 56, 56, logo.width * scale, 64);
  }
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.font = "800 64px Montserrat, Arial, sans-serif";
  const lines = wrapLines(ctx, payload.title, W - 120, 3);
  const top = H - 280 - (lines.length - 1) * 72;
  lines.forEach((line, i) => ctx.fillText(line, 56, top + i * 72));
  ctx.fillStyle = "#e879f9";
  ctx.font = "700 30px Nunito Sans, Arial, sans-serif";
  ctx.fillText(payload.subtitle ? `${payload.subtitle}  ·  VerzZify` : "Listen on VerzZify", 56, H - 120);
  if (mark) ctx.drawImage(mark, W - 140, H - 160, 84, 84);
}

function paintNeon({ ctx, W, H, payload, cover, logo, mark }: PaintArgs) {
  ctx.fillStyle = "#05000a";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#e879f9";
  ctx.shadowColor = "#c026d3";
  ctx.shadowBlur = 40;
  ctx.lineWidth = 8;
  roundRect(ctx, 48, 48, W - 96, H - 96, 40);
  ctx.stroke();
  ctx.shadowBlur = 0;
  drawLogo(ctx, logo, mark, W, 90, 70);
  const size = 640;
  const x = (W - size) / 2;
  const y = 210;
  ctx.save();
  ctx.shadowColor = "#c026d3";
  ctx.shadowBlur = 50;
  roundRect(ctx, x, y, size, size, 36);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.clip();
  fillCover(ctx, cover, x, y, size, size);
  ctx.restore();
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = "800 48px Montserrat, Arial, sans-serif";
  const lines = wrapLines(ctx, payload.title, W - 160, 2);
  lines.forEach((line, i) => ctx.fillText(line, W / 2, y + size + 80 + i * 58));
  ctx.fillStyle = "#e879f9";
  ctx.font = "700 26px Montserrat, Arial, sans-serif";
  ctx.fillText("VERZZIFY  ·  STREAM IT HERE", W / 2, H - 90);
}

function paintBillboard({ ctx, W, H, payload, cover, logo, mark }: PaintArgs) {
  ctx.fillStyle = "#c026d3";
  ctx.fillRect(0, 0, W, H);
  fillCover(ctx, cover, 0, 0, W, H * 0.58);
  ctx.fillStyle = "#07010d";
  ctx.fillRect(0, H * 0.52, W, H * 0.48);
  ctx.fillStyle = "#e879f9";
  ctx.fillRect(0, H * 0.52, W, 10);
  if (logo) {
    const scale = 56 / logo.height;
    ctx.drawImage(logo, 48, H * 0.52 + 36, logo.width * scale, 56);
  }
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.font = "800 58px Montserrat, Arial, sans-serif";
  const lines = wrapLines(ctx, payload.title, W - 100, 2);
  lines.forEach((line, i) => ctx.fillText(line, 48, H * 0.52 + 140 + i * 66));
  ctx.fillStyle = "#f5d0fe";
  ctx.font = "600 28px Nunito Sans, Arial, sans-serif";
  ctx.fillText(payload.subtitle ?? "VerzZify exclusive", 48, H - 80);
  if (mark) ctx.drawImage(mark, W - 140, H - 140, 88, 88);
}

function paintStack({ ctx, W, H, payload, cover, logo, mark }: PaintArgs) {
  blurBg(ctx, cover, W, H);
  const size = 680;
  const x = (W - size) / 2;
  const y = 220;
  ctx.save();
  ctx.translate(W / 2, y + size / 2);
  ctx.rotate((-8 * Math.PI) / 180);
  ctx.translate(-W / 2, -(y + size / 2));
  ctx.globalAlpha = 0.45;
  roundRect(ctx, x + 40, y - 20, size, size, 36);
  ctx.fillStyle = "#1c1030";
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, x, y, size, size, 36);
  ctx.clip();
  fillCover(ctx, cover, x, y, size, size);
  ctx.restore();
  ctx.fillStyle = "#07010d";
  roundRect(ctx, 80, H - 280, W - 160, 180, 28);
  ctx.fill();
  drawLogo(ctx, logo, mark, W, 80, 64);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = "800 40px Montserrat, Arial, sans-serif";
  const lines = wrapLines(ctx, payload.title, W - 220, 2);
  lines.forEach((line, i) => ctx.fillText(line, W / 2, H - 200 + i * 50));
  ctx.fillStyle = "#e879f9";
  ctx.font = "700 22px Montserrat, Arial, sans-serif";
  ctx.fillText("verzzify.com", W / 2, H - 120);
}

function paintStory(args: PaintArgs) {
  paintPoster(args);
}

export async function renderShareCard(payload: SharePayload, tpl: ShareTemplate): Promise<Blob> {
  const W = 1080;
  const H = tpl === "story" ? 1920 : tpl === "billboard" ? 1080 : tpl === "poster" ? 1620 : 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const cover = payload.coverUrl ? await loadImage(payload.coverUrl) : null;
  const logo = await loadImage("/logo.png?v=5", false);
  const mark = await loadImage("/icon-256.png?v=5", false);
  const args: PaintArgs = { ctx, W, H, payload, cover, logo, mark };

  const paint = () => {
    if (tpl === "poster") paintPoster(args);
    else if (tpl === "neon") paintNeon(args);
    else if (tpl === "billboard") paintBillboard(args);
    else if (tpl === "stack") paintStack(args);
    else if (tpl === "story") paintStory(args);
    else if (tpl === "now") paintClassic(args, true);
    else paintClassic(args, false);
  };

  try {
    paint();
    return await blobOf(canvas);
  } catch {
    args.cover = null;
    paint();
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
