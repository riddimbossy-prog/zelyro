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
let radioToken = 0;

function embedUrl(id: string, play: boolean) {
  const q = new URLSearchParams({
    autoplay: play ? "1" : "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  return `https://www.youtube.com/embed/${encodeURIComponent(id)}?${q.toString()}`;
}

function ensureFrame() {
  if (wrap && frame) return;
  wrap = document.getElementById("verzzify-yt-wrap") as HTMLDivElement | null;
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "verzzify-yt-wrap";
    document.body.appendChild(wrap);
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
  wrap.style.position = "fixed";
  wrap.style.zIndex = "70";
  wrap.style.overflow = "hidden";
  wrap.style.background = "#000";
  wrap.style.borderRadius = "999px";
  wrap.style.boxShadow = "0 20px 40px rgba(0,0,0,0.45)";
  frame.style.width = "100%";
  frame.style.height = "100%";
  frame.style.border = "0";
  frame.style.display = "block";
}

/** Must run inside a click. Assigning src here is what allows unmuted autoplay. */
function startVideo(id: string) {
  ensureFrame();
  if (!frame || !wrap) return;
  frame.src = embedUrl(id, true);
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
  const slot = document.getElementById("verzzify-cover-slot");
  const expanded = useYtPlayer.getState().expanded;
  if (expanded && slot) {
    const r = slot.getBoundingClientRect();
    wrap.style.left = `${Math.round(r.left)}px`;
    wrap.style.top = `${Math.round(r.top)}px`;
    wrap.style.width = `${Math.round(r.width)}px`;
    wrap.style.height = `${Math.round(r.height)}px`;
    wrap.style.borderRadius = "999px";
  } else {
    wrap.style.width = "224px";
    wrap.style.height = "224px";
    wrap.style.left = "16px";
    wrap.style.top = `${Math.max(16, window.innerHeight - 330)}px`;
    wrap.style.borderRadius = "24px";
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

if (typeof window !== "undefined") {
  window.addEventListener("resize", () => layoutYtFrame());
  window.addEventListener("scroll", () => layoutYtFrame(), true);
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
  toggle: () => {
    const s = get();
    if (!s.videoId) return;
    if (s.isPlaying) {
      stopVideo();
      set({ isPlaying: false });
    } else {
      startVideo(s.videoId);
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
