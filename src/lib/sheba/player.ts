import { create } from "zustand";
import type { TrackCard } from "./types";
import { recordStream } from "./queries";

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

function audio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!el) {
    el = new Audio();
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    el.addEventListener("timeupdate", () => {
      const now = performance.now();
      if (lastTick) listenedMs += Math.min(now - lastTick, 500);
      lastTick = now;
      usePlayer.setState({
        position: el?.currentTime ?? 0,
        duration: Number.isFinite(el?.duration) ? el!.duration : 0,
      });
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
      const t = usePlayer.getState().queue[usePlayer.getState().index];
      if (t && navigator.mediaSession) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: t.title,
          artist: t.artistName,
          album: t.albumTitle ?? "Sheba",
          artwork: t.coverUrl ? [{ src: t.coverUrl, sizes: "800x800" }] : [],
        });
        navigator.mediaSession.playbackState = "playing";
      }
    });
    el.addEventListener("pause", () => {
      usePlayer.setState({ isPlaying: false });
      if (navigator.mediaSession) navigator.mediaSession.playbackState = "paused";
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

function loadCurrent() {
  const s = usePlayer.getState();
  const t = s.queue[s.index];
  const a = audio();
  if (!a || !t) return;
  flushStream();
  listenedMs = 0;
  lastTick = 0;
  reported = false;
  a.src = t.audioUrl;
  a.volume = s.muted ? 0 : s.volume;
  void a.play().catch(() => usePlayer.setState({ isPlaying: false }));
  if (navigator.mediaSession) {
    navigator.mediaSession.setActionHandler("play", () => usePlayer.getState().toggle());
    navigator.mediaSession.setActionHandler("pause", () => usePlayer.getState().toggle());
    navigator.mediaSession.setActionHandler("previoustrack", () => usePlayer.getState().prev());
    navigator.mediaSession.setActionHandler("nexttrack", () => usePlayer.getState().next());
    navigator.mediaSession.setActionHandler("seekto", (d) => {
      if (typeof d.seekTime === "number") usePlayer.getState().seek(d.seekTime);
    });
  }
}

export const usePlayer = create<PlayerState>((set, get) => ({
  queue: [],
  index: 0,
  isPlaying: false,
  shuffle: false,
  repeat: "off",
  volume: 0.85,
  muted: false,
  position: 0,
  duration: 0,
  expanded: false,
  play: (tracks, index = 0) => {
    set({ queue: tracks, index });
    loadCurrent();
  },
  pause: () => {
    audio()?.pause();
  },
  toggle: () => {
    const a = audio();
    if (!a) return;
    const s = get();
    if (!s.queue[s.index]) return;
    if (a.paused) {
      if (!a.src) loadCurrent();
      else void a.play();
    } else a.pause();
  },
  next: () => {
    const s = get();
    if (!s.queue.length) return;
    let next = s.index + 1;
    if (s.shuffle) next = Math.floor(Math.random() * s.queue.length);
    if (next >= s.queue.length) {
      if (s.repeat === "all") next = 0;
      else {
        audio()?.pause();
        set({ isPlaying: false, position: 0 });
        return;
      }
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
