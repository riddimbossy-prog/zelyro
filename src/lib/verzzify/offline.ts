import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { YouTubeVideo } from "./types";

type SavedState = {
  items: YouTubeVideo[];
  save: (v: YouTubeVideo) => void;
  remove: (videoId: string) => void;
  toggle: (v: YouTubeVideo) => boolean;
  has: (videoId: string) => boolean;
};

export const useSavedYt = create<SavedState>()(
  persist(
    (set, get) => ({
      items: [],
      save: (v) =>
        set((s) =>
          s.items.some((x) => x.videoId === v.videoId) ? s : { items: [v, ...s.items] },
        ),
      remove: (videoId) => set((s) => ({ items: s.items.filter((x) => x.videoId !== videoId) })),
      toggle: (v) => {
        const exists = get().items.some((x) => x.videoId === v.videoId);
        if (exists) get().remove(v.videoId);
        else get().save(v);
        return !exists;
      },
      has: (videoId) => get().items.some((x) => x.videoId === videoId),
    }),
    { name: "verzzify-yt-saved" },
  ),
);
