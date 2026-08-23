import { createWriteStream } from "node:fs";
import { mkdir, copyFile, stat, readFile, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  S3_BUCKETS,
  awsConfigured,
  awsRegion,
  localS3Root,
  s3Endpoint,
  type S3BucketKind,
} from "@/lib/infra/env";

export type PutResult = { bucket: string; key: string };

const globalRef = globalThis as typeof globalThis & {
  __verzzifyS3__?: import("@aws-sdk/client-s3").S3Client;
};

export function storageMode(): "aws" | "local" {
  return awsConfigured() ? "aws" : "local";
}

async function s3(): Promise<import("@aws-sdk/client-s3").S3Client> {
  if (!globalRef.__verzzifyS3__) {
    const { S3Client } = await import("@aws-sdk/client-s3");
    const endpoint = s3Endpoint();
    globalRef.__verzzifyS3__ = new S3Client({
      region: awsRegion(),
      endpoint,
      forcePathStyle: Boolean(endpoint),
    });
  }
  return globalRef.__verzzifyS3__;
}

function bucketName(kind: S3BucketKind): string {
  return S3_BUCKETS[kind];
}

function localPath(kind: S3BucketKind, key: string): string {
  const root = resolve(localS3Root());
  const full = resolve(join(root, bucketName(kind), key));
  if (!full.startsWith(root + "/") && full !== root) {
    throw new Error("Invalid object key");
  }
  return full;
}

export async function putObject(opts: {
  kind: S3BucketKind;
  key: string;
  body: Buffer | Uint8Array;
  mime: string;
}): Promise<PutResult> {
  const bucket = bucketName(opts.kind);
  if (storageMode() === "aws") {
    const client = await s3();
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: opts.key,
        Body: opts.body,
        ContentType: opts.mime,
        CacheControl: opts.kind === "public" ? "public, max-age=86400" : "private, max-age=3600",
      }),
    );
    return { bucket, key: opts.key };
  }
  const path = localPath(opts.kind, opts.key);
  await mkdir(dirname(path), { recursive: true });
  await pipeline(Readable.from(opts.body), createWriteStream(path));
  return { bucket, key: opts.key };
}

export async function copyObject(opts: {
  from: S3BucketKind;
  to: S3BucketKind;
  key: string;
}): Promise<PutResult> {
  const destBucket = bucketName(opts.to);
  if (storageMode() === "aws") {
    const client = await s3();
    const { CopyObjectCommand } = await import("@aws-sdk/client-s3");
    await client.send(
      new CopyObjectCommand({
        Bucket: destBucket,
        Key: opts.key,
        CopySource: `${bucketName(opts.from)}/${opts.key}`,
        MetadataDirective: "COPY",
      }),
    );
    return { bucket: destBucket, key: opts.key };
  }
  const src = localPath(opts.from, opts.key);
  const dest = localPath(opts.to, opts.key);
  await mkdir(dirname(dest), { recursive: true });
  await copyFile(src, dest);
  return { bucket: destBucket, key: opts.key };
}

export async function objectExists(kind: S3BucketKind, key: string): Promise<boolean> {
  if (storageMode() === "aws") {
    const client = await s3();
    const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
    try {
      await client.send(new HeadObjectCommand({ Bucket: bucketName(kind), Key: key }));
      return true;
    } catch {
      return false;
    }
  }
  try {
    await access(localPath(kind, key));
    return true;
  } catch {
    return false;
  }
}

export async function objectStat(
  kind: S3BucketKind,
  key: string,
): Promise<{ size: number } | null> {
  if (storageMode() === "aws") {
    const client = await s3();
    const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
    try {
      const out = await client.send(new HeadObjectCommand({ Bucket: bucketName(kind), Key: key }));
      return { size: Number(out.ContentLength ?? 0) };
    } catch {
      return null;
    }
  }
  try {
    const s = await stat(localPath(kind, key));
    return { size: s.size };
  } catch {
    return null;
  }
}

export async function readObject(
  kind: S3BucketKind,
  key: string,
): Promise<{ body: Buffer; mimeHint?: string } | null> {
  if (storageMode() === "aws") {
    const client = await s3();
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    try {
      const out = await client.send(new GetObjectCommand({ Bucket: bucketName(kind), Key: key }));
      const bytes = await out.Body?.transformToByteArray();
      if (!bytes) return null;
      return { body: Buffer.from(bytes), mimeHint: out.ContentType };
    } catch {
      return null;
    }
  }
  try {
    const body = await readFile(localPath(kind, key));
    return { body };
  } catch {
    return null;
  }
}

export async function presignPut(opts: {
  kind: S3BucketKind;
  key: string;
  mime: string;
  expiresSec?: number;
}): Promise<string | null> {
  if (storageMode() !== "aws") return null;
  const client = await s3();
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucketName(opts.kind),
      Key: opts.key,
      ContentType: opts.mime,
    }),
    { expiresIn: opts.expiresSec ?? 900 },
  );
}

export async function presignGet(opts: {
  kind: S3BucketKind;
  key: string;
  expiresSec?: number;
}): Promise<string | null> {
  if (storageMode() !== "aws") return null;
  const client = await s3();
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucketName(opts.kind), Key: opts.key }),
    { expiresIn: opts.expiresSec ?? 900 },
  );
}

export async function pingS3(): Promise<{ ok: boolean; error?: string }> {
  if (storageMode() === "local") {
    try {
      await mkdir(localS3Root(), { recursive: true });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "local store failed" };
    }
  }
  try {
    const client = await s3();
    const { HeadBucketCommand } = await import("@aws-sdk/client-s3");
    await client.send(new HeadBucketCommand({ Bucket: S3_BUCKETS.masters }));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "s3 unreachable" };
  }
}
