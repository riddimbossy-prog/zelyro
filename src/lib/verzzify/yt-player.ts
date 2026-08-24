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
let activePointer: number | null = null;

const CHROME_H = 40;

/** Responsive float size for phone, tablet, Z Fold, and desktop. */
function floatSize() {
  if (typeof window === "undefined") return { w: 320, h: Math.round((320 * 9) / 16) + CHROME_H };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Keep a sensible max so it never covers the whole fold screen
  const maxW = Math.min(420, Math.max(240, Math.floor(vw * 0.72)));
  const maxH = Math.min(Math.round((maxW * 9) / 16) + CHROME_H, Math.floor(vh * 0.55));
  const w = maxW;
  const h = Math.min(Math.round((w * 9) / 16) + CHROME_H, maxH);
  return { w, h };
}

function clampPos(x: number, y: number, w?: number, h?: number) {
  const size = floatSize();
  const ww = w ?? (minimized ? Math.min(size.w, 280) : size.w);
  const hh = h ?? (minimized ? CHROME_H : size.h);
  const pad = 6;
  const maxX = Math.max(pad, window.innerWidth - ww - pad);
  const maxY = Math.max(pad, window.innerHeight - hh - pad);
  return { x: Math.min(maxX, Math.max(pad, x)), y: Math.min(maxY, Math.max(pad, y)) };
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
  wrap.style.touchAction = "none";
  wrap.style.transition =
    "height .32s cubic-bezier(.22,1,.36,1), width .32s cubic-bezier(.22,1,.36,1), box-shadow .32s ease, border-radius .32s ease";

  chrome = wrap.querySelector("#verzzify-yt-chrome") as HTMLDivElement | null;
  if (!chrome) {
    chrome = document.createElement("div");
    chrome.id = "verzzify-yt-chrome";
    chrome.style.cssText =
      "display:flex;align-items:center;justify-content:space-between;gap:8px;height:40px;padding:0 8px 0 12px;cursor:grab;background:linear-gradient(90deg,rgba(192,38,211,0.35),rgba(11,6,16,0.95));user-select:none;touch-action:none;-webkit-user-select:none;";
    const label = document.createElement("span");
    label.id = "verzzify-yt-label";
    label.textContent = "VerzZify · drag anywhere";
    label.style.cssText =
      "flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:700 11px/1 Montserrat,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#fff;opacity:.9;pointer-events:none";
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;align-items:center;gap:6px;flex-shrink:0";
    const btnStyle =
      "width:32px;height:32px;border:0;border-radius:999px;background:rgba(255,255,255,0.12);color:#fff;font:700 16px/1 sans-serif;cursor:pointer;touch-action:manipulation";
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
      if (lab) lab.textContent = minimized ? "VerzZify · drag to move · tap to restore" : "VerzZify · drag anywhere";
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

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (t.id === "verzzify-yt-close" || t.id === "verzzify-yt-min" || t.closest("#verzzify-yt-close,#verzzify-yt-min")) {
        return;
      }
      if (minimized) {
        // Still allow drag while minimized; double-tap chrome restores via min button
      }
      dragging = true;
      activePointer = e.pointerId;
      const r = wrap!.getBoundingClientRect();
      dragOffset = { x: e.clientX - r.left, y: e.clientY - r.top };
      try {
        chrome!.setPointerCapture(e.pointerId);
      } catch {
        /* older browsers */
      }
      chrome!.style.cursor = "grabbing";
      e.preventDefault();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging || !wrap) return;
      if (activePointer != null && e.pointerId !== activePointer) return;
      wrap.style.transition = "none";
      floatPos = clampPos(e.clientX - dragOffset.x, e.clientY - dragOffset.y);
      wrap.style.left = `${floatPos.x}px`;
      wrap.style.top = `${floatPos.y}px`;
      useYtPlayer.setState({ expanded: false });
    };

    const endDrag = (e?: PointerEvent) => {
      if (e && activePointer != null && e.pointerId !== activePointer) return;
      dragging = false;
      activePointer = null;
      if (chrome) chrome.style.cursor = "grab";
      if (wrap) {
        wrap.style.transition =
          "height .32s cubic-bezier(.22,1,.36,1), width .32s cubic-bezier(.22,1,.36,1), box-shadow .32s ease, border-radius .32s ease";
        // Snap back inside safe bounds after fold / rotation
        if (floatPos) {
          floatPos = clampPos(floatPos.x, floatPos.y);
          wrap.style.left = `${floatPos.x}px`;
          wrap.style.top = `${floatPos.y}px`;
        }
      }
    };

    chrome.addEventListener("pointerdown", onPointerDown);
    chrome.addEventListener("pointermove", onPointerMove);
    chrome.addEventListener("pointerup", endDrag);
    chrome.addEventListener("pointercancel", endDrag);
    chrome.addEventListener("lostpointercapture", endDrag);
  }

  frame = wrap.querySelector("iframe");
  if (!frame) {
    frame = document.createElement("iframe");
    frame.id = "verzzify-yt-frame";
    frame.title = "VerzZify player";
    frame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.setAttribute("allowfullscreen", "true");
    wrap.appendChild(frame);
  }
  frame.style.width = "100%";
  frame.style.height = `calc(100% - ${CHROME_H}px)`;
  frame.style.border = "0";
  frame.style.display = "block";
  frame.style.background = "#000";
  // Prevent iframe from eating the first touch when starting a drag on chrome only
  frame.style.pointerEvents = dragging ? "none" : "auto";
}

/** Must run inside a click. Assigning src here is what allows unmuted autoplay. */
function startVideo(id: string, playlist: string[] = []) {
  ensureFrame();
  if (!frame || !wrap) return;
  const label = document.getElementById("verzzify-yt-label");
  if (label) label.textContent = "VerzZify · drag anywhere";
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
  const { w, h } = floatSize();

  // Always show the drag chrome so phone / fold / tablet users can move it
  if (chrome) chrome.style.display = "flex";

  // Cover-slot dock only when user has never dragged and is on a small phone layout
  const narrow = typeof window !== "undefined" && window.innerWidth < 640;
  if (expanded && slot && !floatPos && narrow) {
    const r = slot.getBoundingClientRect();
    wrap.style.left = `${Math.round(r.left)}px`;
    wrap.style.top = `${Math.round(r.top)}px`;
    wrap.style.width = `${Math.round(r.width)}px`;
    wrap.style.height = `${Math.round(r.height)}px`;
    wrap.style.borderRadius = "16px";
    if (frame) frame.style.height = "100%";
    return;
  }

  const fallback = clampPos(window.innerWidth - w - 16, window.innerHeight - h - 88, w, h);
  const pos = floatPos ? clampPos(floatPos.x, floatPos.y, w, h) : fallback;
  floatPos = pos;

  wrap.style.width = `${w}px`;
  wrap.style.height = `${h}px`;
  wrap.style.left = `${pos.x}px`;
  wrap.style.top = `${pos.y}px`;
  wrap.style.borderRadius = minimized ? "999px" : "16px";
  wrap.style.boxShadow = minimized ? "0 10px 28px rgba(0,0,0,0.4)" : "0 18px 50px rgba(0,0,0,0.55)";

  if (minimized) {
    wrap.style.height = `${CHROME_H}px`;
    wrap.style.width = `${Math.min(w, 300)}px`;
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
    frame.style.pointerEvents = "auto";
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
  const onViewportChange = () => {
    // Fold open/close, rotate, split-screen: keep player on-screen
    if (floatPos) floatPos = clampPos(floatPos.x, floatPos.y);
    layoutYtFrame();
  };
  window.addEventListener("resize", onViewportChange);
  window.addEventListener("orientationchange", onViewportChange);
  window.addEventListener("scroll", () => layoutYtFrame(), true);
  window.addEventListener("message", (event) => {
    const origin = String(event.origin || "");
    if (!origin.includes("youtube.com") && !origin.includes("youtube-nocookie.com")) return;
    let payload: { event?: string; info?: number | Record<string, unknown> } | null = null;
    try {
      payload =
        typeof event.data === "string"
          ? (JSON.parse(event.data) as typeof payload)
          : (event.data as typeof payload);
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
    activePointer = null;
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
