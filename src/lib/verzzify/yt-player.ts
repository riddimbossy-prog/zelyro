import { create } from "zustand";
import { usePlayer } from "./player";
import type { YouTubeVideo } from "./types";

type Repeat = "off" | "all" | "one";

type YtState = {
  videoId: string | null;
  title: string | null;
  channel: string | null;
  channelId: string | null;
  watchUrl: string | null;
  thumbnailUrl: string | null;
  queue: YouTubeVideo[];
  index: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
  expanded: boolean;
  shuffle: boolean;
  repeat: Repeat;
  radioLoading: boolean;
  open: (d: { videoId: string; title: string; channel: string; watchUrl: string; channelId?: string | null }) => void;
  openQueue: (videos: YouTubeVideo[], index?: number) => void;
  playAt: (index: number) => void;
  toggle: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setExpanded: (v: boolean) => void;
  close: () => void;
};

let wrap: HTMLDivElement | null = null;
let frame: HTMLIFrameElement | null = null;
let chrome: HTMLDivElement | null = null;
let radioToken = 0;
let floatPos: { x: number; y: number } | null = null;
let dragging = false;
let dragOffset = { x: 0, y: 0 };
let minimized = false;

const FLOAT_W = 400;
const CHROME_H = 36;
const FLOAT_H = Math.round((FLOAT_W * 9) / 16) + CHROME_H;

function isDesktop() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
}

function embedUrl(id: string, play: boolean, playlist: string[] = []) {
  const q = new URLSearchParams({
    autoplay: play ? "1" : "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
    origin: typeof window !== "undefined" ? window.location.origin : "https://verzzify.com",
  });
  const rest = playlist.filter((x) => x && x !== id).slice(0, 20);
  if (rest.length) q.set("playlist", rest.join(","));
  return `https://www.youtube.com/embed/${encodeURIComponent(id)}?${q.toString()}`;
}

function clampPos(x: number, y: number) {
  const maxX = Math.max(8, window.innerWidth - FLOAT_W - 8);
  const maxY = Math.max(8, window.innerHeight - FLOAT_H - 8);
  return { x: Math.min(maxX, Math.max(8, x)), y: Math.min(maxY, Math.max(8, y)) };
}

function ensureFrame() {
  const existing = document.getElementById("verzzify-yt-wrap");
  if (existing && !existing.querySelector("#verzzify-yt-min")) {
    existing.remove();
    wrap = null;
    frame = null;
    chrome = null;
  }
  wrap = (document.getElementById("verzzify-yt-wrap") as HTMLDivElement | null) || wrap;
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "verzzify-yt-wrap";
    document.body.appendChild(wrap);
  }
  wrap.style.position = "fixed";
  wrap.style.zIndex = "80";
  wrap.style.overflow = "hidden";
  wrap.style.background = "#0b0610";
  wrap.style.borderRadius = "16px";
  wrap.style.boxShadow = "0 18px 50px rgba(0,0,0,0.55)";
  wrap.style.border = "1px solid rgba(255,255,255,0.16)";
  wrap.style.display = "none";
  wrap.style.transition = "height .32s cubic-bezier(.22,1,.36,1), width .32s cubic-bezier(.22,1,.36,1), box-shadow .32s ease, border-radius .32s ease";

  chrome = wrap.querySelector("#verzzify-yt-chrome") as HTMLDivElement | null;
  if (!chrome) {
    chrome = document.createElement("div");
    chrome.id = "verzzify-yt-chrome";
    chrome.style.cssText =
      "display:flex;align-items:center;justify-content:space-between;gap:8px;height:36px;padding:0 8px 0 12px;cursor:move;background:linear-gradient(90deg,rgba(192,38,211,0.35),rgba(11,6,16,0.95));user-select:none;";
    const label = document.createElement("span");
    label.id = "verzzify-yt-label";
    label.textContent = "VerzZify player · drag";
    label.style.cssText =
      "flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:700 11px/1 Montserrat,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#fff;opacity:.9";
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;align-items:center;gap:6px;flex-shrink:0";
    const btnStyle =
      "width:28px;height:28px;border:0;border-radius:999px;background:rgba(255,255,255,0.12);color:#fff;font:700 16px/1 sans-serif;cursor:pointer";
    const min = document.createElement("button");
    min.type = "button";
    min.id = "verzzify-yt-min";
    min.setAttribute("aria-label", "Minimize player");
    min.textContent = "–";
    min.style.cssText = btnStyle;
    min.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      minimized = !minimized;
      min.textContent = minimized ? "▢" : "–";
      min.setAttribute("aria-label", minimized ? "Restore player" : "Minimize player");
      const lab = document.getElementById("verzzify-yt-label");
      if (lab) lab.textContent = minimized ? "VerzZify · tap to restore" : "VerzZify player · drag";
      layoutYtFrame();
    });
    const close = document.createElement("button");
    close.type = "button";
    close.id = "verzzify-yt-close";
    close.setAttribute("aria-label", "Close player");
    close.textContent = "×";
    close.style.cssText = btnStyle;
    close.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      useYtPlayer.getState().close();
    });
    actions.append(min, close);
    chrome.append(label, actions);
    wrap.prepend(chrome);

    chrome.addEventListener("pointerdown", (e) => {
      const id = (e.target as HTMLElement).id;
      if (id === "verzzify-yt-close" || id === "verzzify-yt-min") return;
      if (minimized) {
        minimized = false;
        const minBtn = document.getElementById("verzzify-yt-min");
        if (minBtn) {
          minBtn.textContent = "–";
          minBtn.setAttribute("aria-label", "Minimize player");
        }
        const lab = document.getElementById("verzzify-yt-label");
        if (lab) lab.textContent = "VerzZify player · drag";
        layoutYtFrame();
        return;
      }
      if (!isDesktop()) return;
      dragging = true;
      const r = wrap!.getBoundingClientRect();
      dragOffset = { x: e.clientX - r.left, y: e.clientY - r.top };
      chrome!.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    chrome.addEventListener("pointermove", (e) => {
      if (!dragging || !wrap) return;
      wrap.style.transition = "none";
      floatPos = clampPos(e.clientX - dragOffset.x, e.clientY - dragOffset.y);
      wrap.style.left = `${floatPos.x}px`;
      wrap.style.top = `${floatPos.y}px`;
      useYtPlayer.setState({ expanded: false });
    });
    const endDrag = () => {
      dragging = false;
      if (wrap) {
        wrap.style.transition =
          "height .32s cubic-bezier(.22,1,.36,1), width .32s cubic-bezier(.22,1,.36,1), box-shadow .32s ease, border-radius .32s ease";
      }
    };
    chrome.addEventListener("pointerup", endDrag);
    chrome.addEventListener("pointercancel", endDrag);
  }

  frame = wrap.querySelector("iframe");
  if (!frame) {
    frame = document.createElement("iframe");
    frame.id = "verzzify-yt-frame";
    frame.title = "VerzZify player";
    frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.setAttribute("allowfullscreen", "true");
    wrap.appendChild(frame);
  }
  frame.style.width = "100%";
  frame.style.height = `calc(100% - ${CHROME_H}px)`;
  frame.style.border = "0";
  frame.style.display = "block";
  frame.style.background = "#000";
}

/** Must run inside a click. Assigning src here is what allows unmuted autoplay. */
function startVideo(id: string, playlist: string[] = []) {
  ensureFrame();
  if (!frame || !wrap) return;
  const label = document.getElementById("verzzify-yt-label");
  if (label) label.textContent = "VerzZify player · drag";
  frame.src = embedUrl(id, true, playlist);
  wrap.style.display = "block";
  requestAnimationFrame(layoutYtFrame);
}

function stopVideo() {
  if (frame) frame.src = "about:blank";
}

export function layoutYtFrame() {
  if (!wrap) return;
  const playing = Boolean(useYtPlayer.getState().videoId);
  if (!playing) {
    wrap.style.display = "none";
    return;
  }
  wrap.style.display = "block";
  const expanded = useYtPlayer.getState().expanded;
  const slot = document.getElementById("verzzify-cover-slot");
  const desktop = isDesktop();

  if (chrome) chrome.style.display = desktop || !expanded ? "flex" : "none";

  if (expanded && slot && !floatPos && !desktop) {
    const r = slot.getBoundingClientRect();
    wrap.style.left = `${Math.round(r.left)}px`;
    wrap.style.top = `${Math.round(r.top)}px`;
    wrap.style.width = `${Math.round(r.width)}px`;
    wrap.style.height = `${Math.round(r.height)}px`;
    wrap.style.borderRadius = "999px";
    if (frame) frame.style.height = "100%";
    return;
  }

  const w = desktop ? FLOAT_W : 280;
  const h = desktop ? FLOAT_H : Math.round((280 * 9) / 16) + CHROME_H;
  const fallback = clampPos(window.innerWidth - w - 24, window.innerHeight - h - 96);
  const pos = floatPos ?? fallback;
  wrap.style.width = `${w}px`;
  wrap.style.height = `${h}px`;
  wrap.style.left = `${pos.x}px`;
  wrap.style.top = `${pos.y}px`;
  wrap.style.borderRadius = minimized ? "999px" : "16px";
  wrap.style.boxShadow = minimized ? "0 10px 28px rgba(0,0,0,0.4)" : "0 18px 50px rgba(0,0,0,0.55)";
  if (minimized) {
    wrap.style.height = `${CHROME_H}px`;
    wrap.style.width = `${Math.min(w, 280)}px`;
    if (frame) {
      frame.style.transition = "opacity .18s ease";
      frame.style.opacity = "0";
      window.setTimeout(() => {
        if (minimized && frame) frame.style.display = "none";
      }, 180);
    }
    return;
  }
  if (frame) {
    frame.style.display = "block";
    frame.style.transition = "opacity .22s ease .08s";
    frame.style.height = `calc(100% - ${CHROME_H}px)`;
    requestAnimationFrame(() => {
      if (frame) frame.style.opacity = "1";
    });
  }
}

function asVideo(video: YouTubeVideo, queue: YouTubeVideo[], index: number): Partial<YtState> {
  usePlayer.getState().pause();
  usePlayer.setState({ expanded: false, isPlaying: false });
  startVideo(video.videoId, queue.map((v) => v.videoId));
  return {
    videoId: video.videoId,
    title: video.title,
    channel: video.channelName,
    channelId: video.channelId,
    watchUrl: video.url,
    thumbnailUrl: video.thumbnailUrl || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
    queue,
    index,
    expanded: true,
    isPlaying: true,
    position: 0,
    duration: video.durationSeconds ?? 0,
  };
}

async function fillArtistQueue(video: YouTubeVideo) {
  const token = ++radioToken;
  useYtPlayer.setState({ radioLoading: true });
  try {
    const { getMoreFromArtist } = await import("./promotions");
    const more = await getMoreFromArtist({
      data: {
        channelName: video.channelName,
        channelId: video.channelId,
        videoId: video.videoId,
      },
    });
    if (token !== radioToken) return;
    const s = useYtPlayer.getState();
    const seen = new Set(s.queue.map((v) => v.videoId));
    const extra = more.filter((v) => v.videoId && !seen.has(v.videoId));
    const rest = s.shuffle ? [...extra].sort(() => Math.random() - 0.5) : extra;
    useYtPlayer.setState({
      queue: extra.length ? [...s.queue, ...rest] : s.queue,
      radioLoading: false,
    });
  } catch {
    if (token === radioToken) useYtPlayer.setState({ radioLoading: false });
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("resize", () => layoutYtFrame());
  window.addEventListener("scroll", () => layoutYtFrame(), true);
  window.addEventListener("message", (event) => {
    const origin = String(event.origin || "");
    if (!origin.includes("youtube.com") && !origin.includes("youtube-nocookie.com")) return;
    let payload: { event?: string; info?: number | Record<string, unknown> } | null = null;
    try {
      payload = typeof event.data === "string" ? (JSON.parse(event.data) as typeof payload) : (event.data as typeof payload);
    } catch {
      return;
    }
    if (!payload) return;
    if (payload.event === "onStateChange" && payload.info === 0) {
      const s = useYtPlayer.getState();
      if (s.repeat === "one" && s.videoId) {
        startVideo(s.videoId, s.queue.map((v) => v.videoId));
        return;
      }
      s.next();
    }
    if (payload.event === "infoDelivery" && payload.info && typeof payload.info === "object") {
      const info = payload.info as { currentTime?: number; duration?: number };
      const patch: Partial<YtState> = {};
      if (typeof info.currentTime === "number") patch.position = info.currentTime;
      if (typeof info.duration === "number" && info.duration > 0) patch.duration = info.duration;
      if (Object.keys(patch).length) useYtPlayer.setState(patch);
    }
  });
}

export const useYtPlayer = create<YtState>((set, get) => ({
  videoId: null,
  title: null,
  channel: null,
  channelId: null,
  watchUrl: null,
  thumbnailUrl: null,
  queue: [],
  index: 0,
  isPlaying: false,
  position: 0,
  duration: 0,
  volume: 0.85,
  muted: false,
  expanded: false,
  shuffle: false,
  repeat: "all",
  radioLoading: false,
  open: (d) => {
    const video: YouTubeVideo = {
      videoId: d.videoId,
      title: d.title,
      thumbnailUrl: `https://i.ytimg.com/vi/${d.videoId}/hqdefault.jpg`,
      channelName: d.channel,
      channelId: d.channelId ?? null,
      channelUrl: null,
      publishedAt: null,
      description: null,
      durationSeconds: null,
      embeddable: true,
      url: d.watchUrl,
      viewCount: null,
      likeCount: null,
      source: "youtube",
    };
    set(asVideo(video, [video], 0));
    void fillArtistQueue(video);
  },
  openQueue: (videos, index = 0) => {
    const video = videos[index];
    if (!video?.videoId) return;
    set(asVideo(video, videos, index));
    void fillArtistQueue(video);
  },
  playAt: (index) => {
    const s = get();
    const video = s.queue[index];
    if (!video?.videoId) return;
    set(asVideo(video, s.queue, index));
  },
  toggle: () => {
    const s = get();
    if (!s.videoId) return;
    const live = Boolean(frame?.src && !frame.src.endsWith("blank") && !frame.src.endsWith("about:blank"));
    if (s.isPlaying && live) {
      stopVideo();
      set({ isPlaying: false });
    } else {
      startVideo(s.videoId, s.queue.map((v) => v.videoId));
      set({ isPlaying: true, expanded: true });
    }
  },
  pause: () => {
    stopVideo();
    set({ isPlaying: false });
  },
  next: () => {
    const s = get();
    if (s.index + 1 < s.queue.length) {
      set(asVideo(s.queue[s.index + 1], s.queue, s.index + 1));
      return;
    }
    const current = s.queue[s.index];
    if (!current) return;
    void (async () => {
      await fillArtistQueue(current);
      const now = get();
      if (now.index + 1 < now.queue.length) {
        set(asVideo(now.queue[now.index + 1], now.queue, now.index + 1));
      } else if (now.queue.length) {
        set(asVideo(now.queue[0], now.queue, 0));
      }
    })();
  },
  prev: () => {
    const { queue, index } = get();
    if (!queue.length) return;
    const prev = (index - 1 + queue.length) % queue.length;
    set(asVideo(queue[prev], queue, prev));
  },
  seek: (seconds) => set({ position: seconds }),
  setVolume: (v) => set({ volume: v, muted: v === 0 }),
  toggleMute: () => set({ muted: !get().muted }),
  toggleShuffle: () => {
    const s = get();
    const on = !s.shuffle;
    if (!on) {
      set({ shuffle: false });
      return;
    }
    const current = s.queue[s.index];
    const rest = s.queue.filter((_, i) => i !== s.index).sort(() => Math.random() - 0.5);
    set({ shuffle: true, queue: current ? [current, ...rest] : rest, index: 0 });
  },
  cycleRepeat: () => {
    const order: Repeat[] = ["off", "all", "one"];
    const i = order.indexOf(get().repeat);
    set({ repeat: order[(i + 1) % order.length] });
  },
  setExpanded: (v) => {
    set({ expanded: v });
    requestAnimationFrame(layoutYtFrame);
  },
  close: () => {
    radioToken += 1;
    floatPos = null;
    dragging = false;
    minimized = false;
    stopVideo();
    if (wrap) wrap.style.display = "none";
    set({
      videoId: null,
      title: null,
      channel: null,
      channelId: null,
      watchUrl: null,
      thumbnailUrl: null,
      queue: [],
      index: 0,
      isPlaying: false,
      position: 0,
      duration: 0,
      expanded: false,
      radioLoading: false,
    });
  },
}));
