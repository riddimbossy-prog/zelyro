#!/usr/bin/env node
/**
 * Create the three VerzZify S3 buckets (masters, stream, public) when AWS
 * credentials are present. Idempotent. Safe no-op in the live preview.
 *
 *   node scripts/provision-infra.mjs
 */
import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutPublicAccessBlockCommand,
} from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION || process.env.S3_REGION || "eu-west-1";
const endpoint = process.env.S3_ENDPOINT || undefined;
const buckets = {
  masters: process.env.S3_MASTERS_BUCKET || "verzzify-masters",
  stream: process.env.S3_STREAM_BUCKET || "verzzify-stream",
  public: process.env.S3_PUBLIC_BUCKET || "verzzify-public",
};

const configured = Boolean(
  process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim(),
);

if (!configured) {
  console.log(
    "[infra] AWS keys not set — skipping bucket create. Preview uses the local object store at .data/s3.",
  );
  console.log(`[infra] Planned buckets in ${region}:`, buckets);
  process.exit(0);
}

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle: Boolean(endpoint),
});

const cors = {
  CORSRules: [
    {
      AllowedHeaders: ["*"],
      AllowedMethods: ["GET", "PUT", "HEAD"],
      AllowedOrigins: ["*"],
      ExposeHeaders: ["ETag", "Content-Length"],
      MaxAgeSeconds: 3600,
    },
  ],
};

async function ensureBucket(name, { publicRead }) {
  try {
    await client.send(new HeadBucketCommand({ Bucket: name }));
    console.log(`[infra] exists  ${name}`);
  } catch {
    const input = { Bucket: name };
    if (region !== "us-east-1") {
      input.CreateBucketConfiguration = { LocationConstraint: region };
    }
    await client.send(new CreateBucketCommand(input));
    console.log(`[infra] created ${name}`);
  }

  await client.send(
    new PutPublicAccessBlockCommand({
      Bucket: name,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: !publicRead,
        RestrictPublicBuckets: !publicRead,
      },
    }),
  );
  await client.send(new PutBucketCorsCommand({ Bucket: name, CORSConfiguration: cors }));

  if (publicRead) {
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "VerzZifyPublicRead",
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${name}/*`],
        },
      ],
    };
    await client.send(
      new PutBucketPolicyCommand({ Bucket: name, Policy: JSON.stringify(policy) }),
    );
  }
}

async function main() {
  await ensureBucket(buckets.masters, { publicRead: false });
  await ensureBucket(buckets.stream, { publicRead: false });
  await ensureBucket(buckets.public, { publicRead: true });
  console.log("[infra] S3 ready.");
}

main().catch((err) => {
  console.error("[infra] failed:", err?.message || err);
  process.exit(1);
});
