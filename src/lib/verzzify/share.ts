import { create } from "zustand";

export type SharePayload = {
  kind: "Song" | "Live" | "Event" | "Album";
  title: string;
  subtitle?: string;
  coverUrl: string;
  url: string;
};

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

export const useShareSheet = create<ShareState>((set) => ({
  open: false,
  payload: null,
  show: (payload) => set({ open: true, payload }),
  close: () => set({ open: false, payload: null }),
}));
