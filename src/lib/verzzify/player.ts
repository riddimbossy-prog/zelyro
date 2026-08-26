import { create } from "zustand";
import type { TrackCard } from "./types";
import { recordStream } from "./queries";
import { resolvePlaybackUrl, useDownloads } from "./downloads";
import { toast } from "sonner";
import { resumeKeepAliveIfNeeded, startKeepAlive, stopKeepAlive } from "./keepalive";

type Repeat = "off" | "all" | "one";

type PlayerState = {
  queue: TrackCard[];
  index: number;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: Repeat;
  volume: number;
  muted: boolean;
  position: number;
  duration: number;
  expanded: boolean;
  play: (tracks: TrackCard[], index?: number) => void;
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
  patchTrack: (id: string, patch: Partial<TrackCard>) => void;
};

let el: HTMLAudioElement | null = null;
let analyser: AnalyserNode | null = null;
let freqData: Uint8Array | null = null;
let ctx: AudioContext | null = null;
let listenedMs = 0;
let lastTick = 0;
let reported = false;
let wakeLock: WakeLockSentinel | null = null;

async function requestWake() {
  try {
    if (typeof navigator !== "undefined" && "wakeLock" in navigator && usePlayer.getState().isPlaying) {
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

function bindMediaSession(t: TrackCard | undefined) {
  if (!navigator.mediaSession || !t) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: t.title,
    artist: t.artistName,
    album: t.albumTitle ?? "VerzZify",
    artwork: t.coverUrl
      ? [
          { src: t.coverUrl, sizes: "96x96", type: "image/jpeg" },
          { src: t.coverUrl, sizes: "256x256", type: "image/jpeg" },
          { src: t.coverUrl, sizes: "512x512", type: "image/jpeg" },
        ]
      : [],
  });
  navigator.mediaSession.setActionHandler("play", () => {
    const a = audio();
    if (!a) return;
    void a.play().catch(() => undefined);
  });
  navigator.mediaSession.setActionHandler("pause", () => {
    audio()?.pause();
  });
  navigator.mediaSession.setActionHandler("previoustrack", () => usePlayer.getState().prev());
  navigator.mediaSession.setActionHandler("nexttrack", () => usePlayer.getState().next());
  navigator.mediaSession.setActionHandler("seekto", (d) => {
    if (typeof d.seekTime === "number") usePlayer.getState().seek(d.seekTime);
  });
  navigator.mediaSession.setActionHandler("seekbackward", (d) => {
    const a = audio();
    if (a) a.currentTime = Math.max(0, a.currentTime - (d.seekOffset ?? 10));
  });
  navigator.mediaSession.setActionHandler("seekforward", (d) => {
    const a = audio();
    if (a) a.currentTime = Math.min(a.duration || 0, a.currentTime + (d.seekOffset ?? 10));
  });
}

function audio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!el) {
    el = new Audio();
    el.preload = "auto";
    el.autoplay = true;
    el.setAttribute("playsinline", "true");
    el.setAttribute("webkit-playsinline", "true");
    el.controls = false;
    el.style.cssText = "position:fixed;width:1px;height:1px;opacity:0.01;left:0;bottom:0;pointer-events:none;z-index:0";
    document.body.appendChild(el);
    el.addEventListener("timeupdate", () => {
      const now = performance.now();
      if (lastTick) listenedMs += Math.min(now - lastTick, 500);
      lastTick = now;
      usePlayer.setState({
        position: el?.currentTime ?? 0,
        duration: Number.isFinite(el?.duration) ? el!.duration : 0,
      });
      if (navigator.mediaSession && el) {
        try {
          navigator.mediaSession.setPositionState({
            duration: Number.isFinite(el.duration) ? el.duration : 0,
            playbackRate: el.playbackRate || 1,
            position: el.currentTime || 0,
          });
        } catch {
          /* Safari can throw if duration is NaN */
        }
      }
    });
    el.addEventListener("ended", () => {
      flushStream();
      const s = usePlayer.getState();
      if (s.repeat === "one") {
        el!.currentTime = 0;
        void el!.play();
        return;
      }
      s.next();
    });
    el.addEventListener("play", () => {
      lastTick = performance.now();
      usePlayer.setState({ isPlaying: true });
      setupAnalyser();
      void ctx?.resume();
      const t = usePlayer.getState().queue[usePlayer.getState().index];
      bindMediaSession(t);
      if (navigator.mediaSession) navigator.mediaSession.playbackState = "playing";
      startKeepAlive();
      void requestWake();
    });
    el.addEventListener("pause", () => {
      usePlayer.setState({ isPlaying: false });
      if (navigator.mediaSession) navigator.mediaSession.playbackState = "paused";
      if (document.visibilityState === "visible") {
        releaseWake();
        stopKeepAlive();
      }
    });
  }
  return el;
}

function setupAnalyser() {
  if (!el || ctx) return;
  try {
    ctx = new AudioContext();
    const src = ctx.createMediaElementSource(el);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    src.connect(analyser);
    analyser.connect(ctx.destination);
    freqData = new Uint8Array(analyser.frequencyBinCount);
  } catch {
    analyser = null;
  }
}

export function getSpectrum(): number[] {
  if (!analyser || !freqData) return [];
  analyser.getByteFrequencyData(freqData as Uint8Array<ArrayBuffer>);
  return Array.from(freqData);
}

function flushStream() {
  const s = usePlayer.getState();
  const t = s.queue[s.index];
  if (!t || reported) return;
  reported = true;
  void recordStream({ data: { trackId: t.id, listenedMs: Math.round(listenedMs) } }).catch(
    () => undefined,
  );
}

let loadGen = 0;

function loadCurrent() {
  const s = usePlayer.getState();
  const t = s.queue[s.index];
  const a = audio();
  if (!a || !t) return;
  flushStream();
  listenedMs = 0;
  lastTick = 0;
  reported = false;
  const gen = ++loadGen;
  bindMediaSession(t);
  void (async () => {
    const src = await resolvePlaybackUrl(t);
    if (gen !== loadGen) return;
    if (!src) {
      const now = usePlayer.getState();
      const items = now.queue;
      for (let n = 1; n < items.length; n++) {
        const i = (now.index + n) % items.length;
        if (useDownloads.getState().has(items[i].id)) {
          usePlayer.setState({ index: i });
          loadCurrent();
          return;
        }
      }
      toast("Nothing in this queue is in Downloads. Save tracks while you’re online.");
      usePlayer.setState({ isPlaying: false });
      return;
    }
    a.src = src;
    a.volume = s.muted ? 0 : s.volume;
    void a.play().catch((err) => {
      console.warn("playback failed", err);
      toast(err instanceof Error ? err.message : "Could not play this track");
      usePlayer.setState({ isPlaying: false });
    });
  })();
}

function resumeAudioIfNeeded() {
  const a = el;
  if (!a) return;
  void ctx?.resume();
  resumeKeepAliveIfNeeded();
  if (usePlayer.getState().isPlaying && a.paused) {
    void a.play().catch(() => undefined);
  }
  if (usePlayer.getState().isPlaying) void requestWake();
}

if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      if (usePlayer.getState().isPlaying) {
        resumeKeepAliveIfNeeded();
        const a = el;
        if (a && a.paused) void a.play().catch(() => undefined);
      }
      return;
    }
    resumeAudioIfNeeded();
  });
  window.addEventListener("pageshow", () => resumeAudioIfNeeded());
  window.addEventListener("focus", () => resumeAudioIfNeeded());
}

export const usePlayer = create<PlayerState>((set, get) => ({
  queue: [],
  index: 0,
  isPlaying: false,
  shuffle: false,
  repeat: "all",
  volume: 0.85,
  muted: false,
  position: 0,
  duration: 0,
  expanded: false,
  play: (tracks, index = 0) => {
    void import("./yt-player").then((m) => m.useYtPlayer.getState().close());
    const list = Array.isArray(tracks) ? tracks : [tracks];
    const start = typeof index === "number" && Number.isFinite(index) ? index : 0;
    set({ queue: list, index: Math.max(0, Math.min(start, list.length - 1)), isPlaying: true });
    loadCurrent();
  },
  pause: () => {
    audio()?.pause();
    stopKeepAlive();
  },
  toggle: () => {
    const a = audio();
    if (!a) return;
    const s = get();
    if (!s.queue[s.index]) return;
    void ctx?.resume();
    if (a.paused) {
      if (!a.src) loadCurrent();
      else void a.play().catch(() => usePlayer.setState({ isPlaying: false }));
    } else a.pause();
  },
  next: () => {
    const s = get();
    if (!s.queue.length) return;
    if (s.repeat === "one") {
      const a = audio();
      if (a) {
        a.currentTime = 0;
        void a.play();
      }
      return;
    }
    let next = s.index + 1;
    if (s.shuffle && s.queue.length > 1) {
      let pick = s.index;
      for (let i = 0; i < 8 && pick === s.index; i++) pick = Math.floor(Math.random() * s.queue.length);
      next = pick;
    }
    if (next >= s.queue.length) {
      if (s.repeat === "off") {
        audio()?.pause();
        set({ isPlaying: false, position: 0 });
        return;
      }
      next = 0;
    }
    set({ index: next });
    loadCurrent();
  },
  prev: () => {
    const a = audio();
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }
    const s = get();
    const prev = s.index <= 0 ? s.queue.length - 1 : s.index - 1;
    set({ index: prev });
    loadCurrent();
  },
  seek: (seconds) => {
    const a = audio();
    if (a) a.currentTime = seconds;
  },
  setVolume: (v) => {
    const a = audio();
    if (a) a.volume = v;
    set({ volume: v, muted: v === 0 });
  },
  toggleMute: () => {
    const s = get();
    const a = audio();
    const muted = !s.muted;
    if (a) a.volume = muted ? 0 : s.volume;
    set({ muted });
  },
  toggleShuffle: () => set({ shuffle: !get().shuffle }),
  cycleRepeat: () => {
    const order: Repeat[] = ["off", "all", "one"];
    const i = order.indexOf(get().repeat);
    set({ repeat: order[(i + 1) % order.length] });
  },
  setExpanded: (v) => set({ expanded: v }),
  patchTrack: (id, patch) =>
    set({
      queue: get().queue.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }),
}));

export function currentTrack(): TrackCard | undefined {
  const s = usePlayer.getState();
  return s.queue[s.index];
}
