import { completeUpload, requestUpload, type UploadKind } from "./actions";

export async function compressImage(file: File, maxEdge = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(maxEdge / bmp.width, maxEdge / bmp.height, 1);
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bmp, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.84),
  );
  return blob ?? file;
}

function putWithProgress(
  url: string,
  body: Blob,
  headers: Record<string, string>,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) onProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(body);
  });
}

export async function uploadStudioAsset(
  file: File,
  kind: UploadKind,
  onProgress?: (pct: number) => void,
): Promise<{ mediaId: string; url: string; bytes: number }> {
  let body: Blob = file;
  let mime = file.type || "application/octet-stream";
  let filename = file.name || "upload";
  if (kind === "cover" || kind === "poster") {
    body = await compressImage(file);
    mime = body.type || "image/jpeg";
    filename = filename.replace(/\.[^.]+$/, "") + ".jpg";
  }
  onProgress?.(2);
  const signed = await requestUpload({
    data: { kind, mime, size: body.size, filename },
  });
  onProgress?.(8);
  await putWithProgress(signed.putUrl, body, signed.putHeaders, (p) =>
    onProgress?.(8 + Math.round(p * 0.8)),
  );
  const done = await completeUpload({ data: { mediaId: signed.mediaId } });
  onProgress?.(100);
  return { mediaId: done.mediaId, url: done.url, bytes: done.bytes };
}
