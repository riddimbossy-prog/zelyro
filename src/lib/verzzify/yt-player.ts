import { create } from "zustand";
import { usePlayer } from "./player";
import type { YouTubeVideo } from "./types";
import { resumeKeepAliveIfNeeded, startKeepAlive, stopKeepAlive } from "./keepalive";

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
let playGen = 0;
let endedArmed = false;
let advancing = false;
let floatPos: { x: number; y: number } | null = null;
let dragging = false;
let dragOffset = { x: 0, y: 0 };
let minimized = false;
let wakeLock: WakeLockSentinel | null = null;
let overlayHidden = false;
let listenTimer: number | null = null;
let watchdogTimer: number | null = null;
let pipWin: Window | null = null;
let startedAt = 0;

const FLOAT_W = 400;
const CHROME_H = 36;
const FLOAT_H = Math.round((FLOAT_W * 9) / 16) + CHROME_H;
const ENGINE_MIN_W = 240;
const ENGINE_MIN_H = 135;

function isDesktop() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
}

function ytCmd(func: string, args: unknown[] = []) {
  if (!frame?.contentWindow) return;
  try {
    frame.contentWindow.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  } catch {
    /* ignore */
  }
}

function startListening() {
  if (!frame?.contentWindow) return;
  try {
    frame.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1 }), "*");
  } catch {
    /* ignore */
  }
  ytCmd("addEventListener", ["onStateChange"]);
  ytCmd("addEventListener", ["onError"]);
  ytCmd("playVideo");
  const s = useYtPlayer.getState();
  ytCmd("setVolume", [s.muted ? 0 : Math.round(s.volume * 100)]);
}

function armIframeApi() {
  if (listenTimer != null) window.clearInterval(listenTimer);
  startListening();
  let n = 0;
  listenTimer = window.setInterval(() => {
    n += 1;
    startListening();
    if (n > 12 && listenTimer != null) {
      window.clearInterval(listenTimer);
      listenTimer = null;
    }
  }, 400);
}

async function requestWake() {
  try {
    if (typeof navigator !== "undefined" && "wakeLock" in navigator && useYtPlayer.getState().isPlaying) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    }
  } catch {
    wakeLock = null;
  }
}

function releaseWake() {
  void wakeLock?.release().catch(() => undefined);
  wakeLock = null;
}

function bindYtMediaSession() {
  if (typeof navigator === "undefined" || !navigator.mediaSession) return;
  const s = useYtPlayer.getState();
  if (!s.videoId || !s.title) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: s.title,
    artist: s.channel ?? "VerzZify",
    album: "VerzZify",
    artwork: s.thumbnailUrl
      ? [
          { src: s.thumbnailUrl, sizes: "96x96", type: "image/jpeg" },
          { src: s.thumbnailUrl, sizes: "256x256", type: "image/jpeg" },
          { src: s.thumbnailUrl, sizes: "512x512", type: "image/jpeg" },
        ]
      : [],
  });
  navigator.mediaSession.setActionHandler("play", () => {
    const st = useYtPlayer.getState();
    if (st.videoId) {
      resumePlayback();
      useYtPlayer.setState({ isPlaying: true });
    }
  });
  navigator.mediaSession.setActionHandler("pause", () => {
    useYtPlayer.getState().pause();
  });
  navigator.mediaSession.setActionHandler("previoustrack", () => useYtPlayer.getState().prev());
  navigator.mediaSession.setActionHandler("nexttrack", () => useYtPlayer.getState().next());
  navigator.mediaSession.setActionHandler("seekto", (d) => {
    if (typeof d.seekTime === "number") useYtPlayer.getState().seek(d.seekTime);
  });
  navigator.mediaSession.playbackState = s.isPlaying ? "playing" : "paused";
  try {
    if (s.duration > 0) {
      navigator.mediaSession.setPositionState({
        duration: s.duration,
        playbackRate: 1,
        position: Math.min(s.position, s.duration),
      });
    }
  } catch {
    /* ignore */
  }
}

function embedUrl(id: string, play: boolean) {
  const q = new URLSearchParams({
    autoplay: play ? "1" : "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
    fs: "1",
    origin: typeof window !== "undefined" ? window.location.origin : "https://verzzify.com",
  });
  return `https://www.youtube.com/embed/${encodeURIComponent(id)}?${q.toString()}`;
}

function clampPos(x: number, y: number) {
  const maxX = Math.max(8, window.innerWidth - FLOAT_W - 8);
  const maxY = Math.max(8, window.innerHeight - FLOAT_H - 8);
  return { x: Math.min(maxX, Math.max(8, x)), y: Math.min(maxY, Math.max(8, y)) };
}

function resumePlayback() {
  const s = useYtPlayer.getState();
  if (!s.videoId) return;
  const live = Boolean(frame?.src?.includes("youtube.com/embed"));
  if (live) {
    startListening();
    ytCmd("playVideo");
  } else {
    startVideo(s.videoId);
  }
  startKeepAlive();
  void requestWake();
  bindYtMediaSession();
}

function isFrameLive() {
  return Boolean(frame?.src?.includes("youtube.com/embed"));
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
  wrap.style.transition =
    "height .32s cubic-bezier(.22,1,.36,1), width .32s cubic-bezier(.22,1,.36,1), box-shadow .32s ease, border-radius .32s ease";

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
    frame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";
    frame.setAttribute("allowfullscreen", "true");
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.addEventListener("load", () => {
      if (!frame?.src?.includes("youtube.com/embed")) return;
      armIframeApi();
    });
    wrap.appendChild(frame);
  }
  frame.style.width = "100%";
  frame.style.height = `calc(100% - ${CHROME_H}px)`;
  frame.style.border = "0";
  frame.style.display = "block";
  frame.style.background = "#000";
  frame.style.minWidth = `${ENGINE_MIN_W}px`;
  frame.style.minHeight = `${ENGINE_MIN_H}px`;
}

/** Must run inside a click. Assigning src here is what allows unmuted autoplay. */
function startVideo(id: string) {
  ensureFrame();
  if (!frame || !wrap) return;
  playGen += 1;
  endedArmed = false;
  advancing = false;
  startedAt = Date.now();
  const label = document.getElementById("verzzify-yt-label");
  if (label && !minimized) label.textContent = "VerzZify player · drag";
  frame.src = embedUrl(id, true);
  wrap.style.display = "block";
  requestAnimationFrame(layoutYtFrame);
  bindYtMediaSession();
  startKeepAlive();
  void requestWake();
  startWatchdog();
}

function destroyFrameSrc() {
  if (frame) frame.src = "about:blank";
  releaseWake();
  stopKeepAlive();
  if (navigator.mediaSession) navigator.mediaSession.playbackState = "paused";
}

export function setYtOverlayHidden(hidden: boolean) {
  overlayHidden = hidden;
  if (!wrap) return;
  wrap.style.visibility = hidden ? "hidden" : "visible";
  wrap.style.pointerEvents = hidden ? "none" : "auto";
}

export function layoutYtFrame() {
  if (!wrap) return;
  const playing = Boolean(useYtPlayer.getState().videoId);
  if (!playing) {
    wrap.style.display = "none";
    return;
  }
  wrap.style.display = "block";
  wrap.style.visibility = overlayHidden ? "hidden" : "visible";
  wrap.style.pointerEvents = overlayHidden ? "none" : "auto";
  const expanded = useYtPlayer.getState().expanded;
  const slot = document.getElementById("verzzify-cover-slot");
  const desktop = isDesktop();

  if (expanded && slot && !pipWin) {
    const r = slot.getBoundingClientRect();
    if (chrome) chrome.style.display = "none";
    wrap.style.left = `${Math.round(r.left)}px`;
    wrap.style.top = `${Math.round(r.top)}px`;
    wrap.style.width = `${Math.round(Math.max(r.width, ENGINE_MIN_W))}px`;
    wrap.style.height = `${Math.round(Math.max(r.height, ENGINE_MIN_H))}px`;
    wrap.style.borderRadius = getComputedStyle(slot).borderRadius || "24px";
    wrap.style.border = "none";
    wrap.style.boxShadow = "none";
    wrap.style.background = "#000";
    wrap.style.zIndex = "70";
    wrap.style.overflow = "hidden";
    if (frame) {
      frame.style.display = "block";
      frame.style.opacity = "1";
      frame.style.height = "100%";
      frame.style.minHeight = `${ENGINE_MIN_H}px`;
    }
    return;
  }

  if (chrome) chrome.style.display = "flex";
  wrap.style.zIndex = "80";
  wrap.style.border = "1px solid rgba(255,255,255,0.16)";
  wrap.style.background = "#0b0610";

  const w = desktop ? FLOAT_W : 280;
  const h = desktop ? FLOAT_H : Math.round((280 * 9) / 16) + CHROME_H;
  const fallback = clampPos(window.innerWidth - w - 24, window.innerHeight - h - 96);
  const pos = floatPos ?? fallback;
  wrap.style.width = `${w}px`;
  wrap.style.left = `${pos.x}px`;
  wrap.style.top = `${pos.y}px`;
  wrap.style.borderRadius = minimized ? "16px" : "16px";
  wrap.style.boxShadow = "0 18px 50px rgba(0,0,0,0.55)";
  // Never display:none the iframe — YouTube pauses hidden players.
  if (minimized) {
    wrap.style.height = `${Math.max(h, ENGINE_MIN_H + CHROME_H)}px`;
    wrap.style.opacity = "0.04";
    wrap.style.pointerEvents = "none";
    if (frame) {
      frame.style.display = "block";
      frame.style.opacity = "1";
      frame.style.height = `calc(100% - ${CHROME_H}px)`;
    }
    const chip = document.getElementById("verzzify-yt-restore");
    if (!chip) {
      const btn = document.createElement("button");
      btn.id = "verzzify-yt-restore";
      btn.type = "button";
      btn.textContent = "VerzZify playing";
      btn.style.cssText =
        "position:fixed;z-index:90;right:16px;bottom:96px;height:36px;padding:0 14px;border:0;border-radius:999px;background:#c026d3;color:#fff;font:700 12px/1 Montserrat,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;box-shadow:0 10px 28px rgba(0,0,0,.4)";
      btn.addEventListener("click", () => {
        minimized = false;
        wrap && (wrap.style.opacity = "1");
        wrap && (wrap.style.pointerEvents = "auto");
        btn.remove();
        const minBtn = document.getElementById("verzzify-yt-min");
        if (minBtn) {
          minBtn.textContent = "–";
          minBtn.setAttribute("aria-label", "Minimize player");
        }
        layoutYtFrame();
      });
      document.body.appendChild(btn);
    }
    return;
  }
  document.getElementById("verzzify-yt-restore")?.remove();
  wrap.style.opacity = "1";
  wrap.style.height = `${h}px`;
  wrap.style.pointerEvents = overlayHidden ? "none" : "auto";
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
  startVideo(video.videoId);
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

function handleEnded() {
  if (advancing) return;
  if (!endedArmed) return;
  if (Date.now() - startedAt < 1600) return;
  endedArmed = false;
  advancing = true;
  const s = useYtPlayer.getState();
  if (s.repeat === "one" && s.videoId) {
    startVideo(s.videoId);
    window.setTimeout(() => {
      advancing = false;
    }, 800);
    return;
  }
  s.next();
  window.setTimeout(() => {
    advancing = false;
  }, 1200);
}

function startWatchdog() {
  if (watchdogTimer != null) return;
  watchdogTimer = window.setInterval(() => {
    if (!useYtPlayer.getState().videoId || !isFrameLive()) return;
    ytCmd("getCurrentTime");
    ytCmd("getDuration");
    ytCmd("getPlayerState");
    const s = useYtPlayer.getState();
    if (s.isPlaying && s.duration > 5 && s.position >= s.duration - 0.55) {
      endedArmed = true;
      handleEnded();
    }
  }, 500);
}

async function enterDocPip() {
  if (typeof window === "undefined" || pipWin || !wrap) return;
  const api = (window as unknown as { documentPictureInPicture?: { requestWindow: (o: { width: number; height: number }) => Promise<Window> } })
    .documentPictureInPicture;
  if (!api) return;
  try {
    const w = await api.requestWindow({ width: FLOAT_W, height: FLOAT_H });
    pipWin = w;
    w.document.body.style.margin = "0";
    w.document.body.style.background = "#0b0610";
    w.document.body.appendChild(wrap);
    wrap.style.left = "0";
    wrap.style.top = "0";
    wrap.style.width = "100%";
    wrap.style.height = "100%";
    wrap.style.opacity = "1";
    wrap.style.pointerEvents = "auto";
    w.addEventListener("pagehide", () => {
      pipWin = null;
      document.body.appendChild(wrap!);
      layoutYtFrame();
    });
  } catch {
    pipWin = null;
  }
}

function handlePlayerState(state: number) {
  // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
  if (state === 1) {
    endedArmed = true;
    advancing = false;
    useYtPlayer.setState({ isPlaying: true });
    startKeepAlive();
    bindYtMediaSession();
  } else if (state === 2) {
    if (document.visibilityState === "hidden") {
      ytCmd("playVideo");
      return;
    }
    useYtPlayer.setState({ isPlaying: false });
  } else if (state === 0) {
    handleEnded();
  } else if (state === 5) {
    ytCmd("playVideo");
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("resize", () => layoutYtFrame());
  window.addEventListener("scroll", () => layoutYtFrame(), true);
  document.addEventListener("visibilitychange", () => {
    const playing = useYtPlayer.getState().isPlaying && Boolean(useYtPlayer.getState().videoId);
    if (document.visibilityState === "hidden") {
      if (playing) {
        ytCmd("playVideo");
        resumeKeepAliveIfNeeded();
        void enterDocPip();
      }
      return;
    }
    resumeKeepAliveIfNeeded();
    if (playing) {
      resumePlayback();
      void requestWake();
    }
  });
  window.addEventListener("pageshow", () => {
    if (useYtPlayer.getState().isPlaying) resumePlayback();
  });
  window.addEventListener("focus", () => {
    if (useYtPlayer.getState().isPlaying) resumePlayback();
  });
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
    if (payload.event === "initialDelivery" || payload.event === "onReady") {
      startListening();
      ytCmd("playVideo");
    }
    if (payload.event === "onStateChange") {
      if (typeof payload.info === "number") handlePlayerState(payload.info);
    }
    if (payload.event === "onError") {
      endedArmed = true;
      handleEnded();
    }
    if (payload.event === "infoDelivery" && payload.info && typeof payload.info === "object") {
      const info = payload.info as { currentTime?: number; duration?: number; playerState?: number };
      const patch: Partial<YtState> = {};
      if (typeof info.currentTime === "number") patch.position = info.currentTime;
      if (typeof info.duration === "number" && info.duration > 0) patch.duration = info.duration;
      if (Object.keys(patch).length) {
        useYtPlayer.setState(patch);
        bindYtMediaSession();
      }
      if (typeof info.playerState === "number") handlePlayerState(info.playerState);
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
    bindYtMediaSession();
    void fillArtistQueue(video);
  },
  openQueue: (videos, index = 0) => {
    const safe = videos.filter((v) => v?.videoId);
    if (!safe.length) return;
    const idx = Math.min(Math.max(0, index), safe.length - 1);
    const video = safe[idx];
    if (!video?.videoId) return;
    set(asVideo(video, safe, idx));
    bindYtMediaSession();
    void fillArtistQueue(video);
  },
  playAt: (index) => {
    const s = get();
    const video = s.queue[index];
    if (!video?.videoId) return;
    set(asVideo(video, s.queue, index));
    bindYtMediaSession();
  },
  toggle: () => {
    const s = get();
    if (!s.videoId) return;
    if (s.isPlaying && isFrameLive()) {
      ytCmd("pauseVideo");
      stopKeepAlive();
      set({ isPlaying: false });
      bindYtMediaSession();
    } else {
      resumePlayback();
      set({ isPlaying: true, expanded: true });
      bindYtMediaSession();
    }
  },
  pause: () => {
    ytCmd("pauseVideo");
    stopKeepAlive();
    set({ isPlaying: false });
    bindYtMediaSession();
  },
  next: () => {
    const s = get();
    const go = (video: YouTubeVideo, queue: YouTubeVideo[], index: number) => {
      set(asVideo(video, queue, index));
      bindYtMediaSession();
    };
    if (s.index + 1 < s.queue.length) {
      go(s.queue[s.index + 1], s.queue, s.index + 1);
      return;
    }
    if (s.repeat !== "off" && s.queue.length) {
      go(s.queue[0], s.queue, 0);
    }
    const current = s.queue[s.index];
    if (current) void fillArtistQueue(current);
  },
  prev: () => {
    const { queue, index, position } = get();
    if (!queue.length) return;
    if (position > 3 && queue[index]) {
      ytCmd("seekTo", [0, true]);
      set({ position: 0 });
      return;
    }
    const prev = (index - 1 + queue.length) % queue.length;
    set(asVideo(queue[prev], queue, prev));
    bindYtMediaSession();
  },
  seek: (seconds) => {
    ytCmd("seekTo", [seconds, true]);
    set({ position: seconds });
  },
  setVolume: (v) => {
    ytCmd("setVolume", [Math.round(v * 100)]);
    if (v > 0) ytCmd("unMute");
    set({ volume: v, muted: v === 0 });
  },
  toggleMute: () => {
    const s = get();
    const muted = !s.muted;
    if (muted) ytCmd("mute");
    else {
      ytCmd("unMute");
      ytCmd("setVolume", [Math.round(s.volume * 100)]);
    }
    set({ muted });
  },
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
    playGen += 1;
    endedArmed = false;
    advancing = false;
    floatPos = null;
    dragging = false;
    minimized = false;
    document.getElementById("verzzify-yt-restore")?.remove();
    destroyFrameSrc();
    if (wrap) wrap.style.display = "none";
    if (navigator.mediaSession) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
    }
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
