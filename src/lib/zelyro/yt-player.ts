import { create } from "zustand";
import { usePlayer } from "./player";

type YtState = {
  videoId: string | null;
  title: string | null;
  channel: string | null;
  watchUrl: string | null;
  open: (d: { videoId: string; title: string; channel: string; watchUrl: string }) => void;
  close: () => void;
};

export const useYtPlayer = create<YtState>((set) => ({
  videoId: null,
  title: null,
  channel: null,
  watchUrl: null,
  open: (d) => {
    const audio = usePlayer.getState();
    audio.pause();
    audio.setExpanded(false);
    set({
      videoId: d.videoId,
      title: d.title,
      channel: d.channel,
      watchUrl: d.watchUrl,
    });
  },
  close: () => set({ videoId: null, title: null, channel: null, watchUrl: null }),
}));
