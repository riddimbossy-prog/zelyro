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

export const useShareSheet = create<ShareState>((set) => ({
  open: false,
  payload: null,
  show: (payload) => set({ open: true, payload }),
  close: () => set({ open: false }),
}));
