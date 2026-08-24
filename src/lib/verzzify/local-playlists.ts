import { create } from "zustand";
import type { TrackCard } from "./types";

const DB_NAME = "verzzify-playlists";
const STORE = "playlists";

export type LocalPlaylist = {
  id: string;
  title: string;
  trackIds: string[];
  tracks: TrackCard[];
  coverUrl: string | null;
  createdAt: number;
  updatedAt: number;
};

type State = {
  ready: boolean;
  items: LocalPlaylist[];
  hydrate: () => Promise<void>;
  create: (title: string, tracks: TrackCard[]) => Promise<LocalPlaylist>;
  rename: (id: string, title: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  addTracks: (id: string, tracks: TrackCard[]) => Promise<void>;
  removeTrack: (id: string, trackId: string) => Promise<void>;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function put(row: LocalPlaylist) {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(row);
  await txDone(tx);
  db.close();
}

async function del(id: string) {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
  await txDone(tx);
  db.close();
}

async function listAll(): Promise<LocalPlaylist[]> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const req = tx.objectStore(STORE).getAll();
  const rows = await new Promise<LocalPlaylist[]>((resolve, reject) => {
    req.onsuccess = () => resolve((req.result as LocalPlaylist[]) ?? []);
    req.onerror = () => reject(req.error);
  });
  await txDone(tx);
  db.close();
  return rows.sort((a, b) => b.updatedAt - a.updatedAt);
}

export const useLocalPlaylists = create<State>((set, get) => ({
  ready: false,
  items: [],
  hydrate: async () => {
    if (typeof indexedDB === "undefined") {
      set({ ready: true });
      return;
    }
    try {
      const items = await listAll();
      set({ ready: true, items });
    } catch {
      set({ ready: true });
    }
  },
  create: async (title, tracks) => {
    const now = Date.now();
    const row: LocalPlaylist = {
      id: `opl_${now}_${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim().slice(0, 80) || "My playlist",
      trackIds: tracks.map((t) => t.id),
      tracks,
      coverUrl: tracks[0]?.coverUrl ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await put(row);
    set((s) => ({ items: [row, ...s.items] }));
    return row;
  },
  rename: async (id, title) => {
    const cur = get().items.find((p) => p.id === id);
    if (!cur) return;
    const next = { ...cur, title: title.trim().slice(0, 80) || cur.title, updatedAt: Date.now() };
    await put(next);
    set((s) => ({ items: s.items.map((p) => (p.id === id ? next : p)) }));
  },
  remove: async (id) => {
    await del(id);
    set((s) => ({ items: s.items.filter((p) => p.id !== id) }));
  },
  addTracks: async (id, tracks) => {
    const cur = get().items.find((p) => p.id === id);
    if (!cur) return;
    const seen = new Set(cur.trackIds);
    const extra = tracks.filter((t) => !seen.has(t.id));
    if (!extra.length) return;
    const next: LocalPlaylist = {
      ...cur,
      trackIds: [...cur.trackIds, ...extra.map((t) => t.id)],
      tracks: [...cur.tracks, ...extra],
      coverUrl: cur.coverUrl ?? extra[0]?.coverUrl ?? null,
      updatedAt: Date.now(),
    };
    await put(next);
    set((s) => ({ items: s.items.map((p) => (p.id === id ? next : p)) }));
  },
  removeTrack: async (id, trackId) => {
    const cur = get().items.find((p) => p.id === id);
    if (!cur) return;
    const tracks = cur.tracks.filter((t) => t.id !== trackId);
    const next: LocalPlaylist = {
      ...cur,
      trackIds: tracks.map((t) => t.id),
      tracks,
      coverUrl: tracks[0]?.coverUrl ?? null,
      updatedAt: Date.now(),
    };
    await put(next);
    set((s) => ({ items: s.items.map((p) => (p.id === id ? next : p)) }));
  },
}));
