import { create } from "zustand";
import type { TrackCard } from "./types";

const DB_NAME = "verzzify-downloads";
const STORE = "files";

export type DownloadMeta = {
  id: string;
  title: string;
  artistName: string;
  artistSlug: string;
  coverUrl: string;
  durationMs: number;
  bytes: number;
  savedAt: number;
  track: TrackCard;
};

type FileRow = DownloadMeta & { audio: Blob; cover?: Blob };

type DownloadsState = {
  ready: boolean;
  items: DownloadMeta[];
  progress: Record<string, number>;
  hydrate: () => Promise<void>;
  saveTrack: (track: TrackCard) => Promise<void>;
  remove: (id: string) => Promise<void>;
  has: (id: string) => boolean;
  getAudioUrl: (id: string) => Promise<string | null>;
  getCoverUrl: (id: string) => Promise<string | null>;
};

const urls = new Map<string, string>();

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

async function putRow(row: FileRow) {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(row);
  await txDone(tx);
  db.close();
}

async function deleteRow(id: string) {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
  await txDone(tx);
  db.close();
}

async function getRow(id: string): Promise<FileRow | null> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const req = tx.objectStore(STORE).get(id);
  const row = await new Promise<FileRow | undefined>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as FileRow | undefined);
    req.onerror = () => reject(req.error);
  });
  await txDone(tx);
  db.close();
  return row ?? null;
}

async function listRows(): Promise<FileRow[]> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const req = tx.objectStore(STORE).getAll();
  const rows = await new Promise<FileRow[]>((resolve, reject) => {
    req.onsuccess = () => resolve((req.result as FileRow[]) ?? []);
    req.onerror = () => reject(req.error);
  });
  await txDone(tx);
  db.close();
  return rows;
}

function metaOf(row: FileRow): DownloadMeta {
  const { audio: _a, cover: _c, ...meta } = row;
  return meta;
}

function isYouTubeTrack(track: TrackCard): boolean {
  return (
    track.id.startsWith("yt_") ||
    track.distribution === "youtube" ||
    /youtube\.com|youtu\.be/i.test(track.audioUrl || "")
  );
}

async function fetchBlob(url: string, onProgress?: (pct: number) => void): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) {
    let detail = `download failed (${res.status})`;
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json")) {
        const body = (await res.json()) as { error?: string; message?: string };
        detail = body.error || body.message || detail;
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  const total = Number(res.headers.get("content-length") || 0);
  if (!res.body || !total) return res.blob();
  const reader = res.body.getReader();
  const chunks: BlobPart[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      onProgress?.(Math.min(99, Math.round((received / total) * 100)));
    }
  }
  onProgress?.(100);
  return new Blob(chunks, { type: res.headers.get("content-type") || "audio/mpeg" });
}

function rememberUrl(key: string, blob: Blob) {
  const prev = urls.get(key);
  if (prev) URL.revokeObjectURL(prev);
  const next = URL.createObjectURL(blob);
  urls.set(key, next);
  return next;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export const useDownloads = create<DownloadsState>((set, get) => ({
  ready: false,
  items: [],
  progress: {},
  hydrate: async () => {
    if (typeof indexedDB === "undefined") {
      set({ ready: true });
      return;
    }
    try {
      const rows = await listRows();
      rows.sort((a, b) => b.savedAt - a.savedAt);
      set({ ready: true, items: rows.map(metaOf) });
    } catch {
      set({ ready: true });
    }
  },
  has: (id) => get().items.some((x) => x.id === id),
  saveTrack: async (track) => {
    if (isYouTubeTrack(track)) {
      throw new Error("YouTube videos cannot be downloaded. Play them with the official player only.");
    }
    if (!track.audioUrl) {
      throw new Error("No downloadable audio for this track.");
    }
    if (get().items.some((x) => x.id === track.id)) return;
    set((s) => ({ progress: { ...s.progress, [track.id]: 1 } }));
    try {
      const audio = await fetchBlob(track.audioUrl, (pct) =>
        set((s) => ({ progress: { ...s.progress, [track.id]: pct } })),
      );
      if (!audio.size) throw new Error("Empty audio file");
      let cover: Blob | undefined;
      try {
        cover = await fetchBlob(track.coverUrl);
      } catch {
        cover = undefined;
      }
      const row: FileRow = {
        id: track.id,
        title: track.title,
        artistName: track.artistName,
        artistSlug: track.artistSlug,
        coverUrl: track.coverUrl,
        durationMs: track.durationMs,
        bytes: audio.size,
        savedAt: Date.now(),
        track,
        audio,
        cover,
      };
      await putRow(row);
      rememberUrl(`a:${track.id}`, audio);
      if (cover) rememberUrl(`c:${track.id}`, cover);
      set((s) => {
        const progress = { ...s.progress };
        delete progress[track.id];
        return {
          items: [metaOf(row), ...s.items.filter((x) => x.id !== track.id)],
          progress,
        };
      });
    } catch (err) {
      set((s) => {
        const progress = { ...s.progress };
        delete progress[track.id];
        return { progress };
      });
      throw err;
    }
  },
  remove: async (id) => {
    await deleteRow(id);
    for (const k of [`a:${id}`, `c:${id}`]) {
      const u = urls.get(k);
      if (u) URL.revokeObjectURL(u);
      urls.delete(k);
    }
    set((s) => ({ items: s.items.filter((x) => x.id !== id) }));
  },
  getAudioUrl: async (id) => {
    const cached = urls.get(`a:${id}`);
    if (cached) return cached;
    const row = await getRow(id);
    if (!row?.audio) return null;
    return rememberUrl(`a:${id}`, row.audio);
  },
  getCoverUrl: async (id) => {
    const cached = urls.get(`c:${id}`);
    if (cached) return cached;
    const row = await getRow(id);
    if (!row?.cover) return null;
    return rememberUrl(`c:${id}`, row.cover);
  },
}));

export async function resolvePlaybackUrl(track: TrackCard): Promise<string | null> {
  if (isYouTubeTrack(track)) return null;
  if (typeof indexedDB === "undefined") return track.audioUrl || null;
  if (!useDownloads.getState().ready) await useDownloads.getState().hydrate();
  if (!useDownloads.getState().has(track.id)) {
    if (typeof navigator !== "undefined" && !navigator.onLine) return null;
    return track.audioUrl || null;
  }
  return (await useDownloads.getState().getAudioUrl(track.id)) ?? track.audioUrl ?? null;
}
