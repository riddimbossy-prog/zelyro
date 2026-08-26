import {
  S3_BUCKETS,
  awsConfigured,
  awsRegion,
  s3Endpoint,
} from "@/lib/infra/env";

export type EnsureResult = {
  ok: boolean;
  created: string[];
  existing: string[];
  error?: string;
};

let ran = false;
let last: EnsureResult | null = null;

function cors() {
  return {
    CORSRules: [
      {
        AllowedHeaders: ["*"],
        AllowedMethods: ["GET", "PUT", "HEAD"],
        AllowedOrigins: [
          "https://verzzify.com",
          "https://www.verzzify.com",
          "http://localhost:8080",
          "*",
        ],
        ExposeHeaders: ["ETag", "Content-Length", "Content-Type"],
        MaxAgeSeconds: 3600,
      },
    ],
  };
}

async function client() {
  const { S3Client } = await import("@aws-sdk/client-s3");
  const endpoint = s3Endpoint();
  return new S3Client({
    region: awsRegion(),
    endpoint,
    forcePathStyle: Boolean(endpoint),
  });
}

async function ensureOne(
  s3: import("@aws-sdk/client-s3").S3Client,
  name: string,
  publicRead: boolean,
): Promise<"created" | "exists"> {
  const {
    CreateBucketCommand,
    HeadBucketCommand,
    PutBucketCorsCommand,
    PutBucketPolicyCommand,
    PutPublicAccessBlockCommand,
  } = await import("@aws-sdk/client-s3");
  const region = awsRegion();
  let created = false;
  try {
    await s3.send(new HeadBucketCommand({ Bucket: name }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const missing = /NotFound|NoSuchBucket|404/i.test(msg) || (err as { name?: string }).name === "NotFound";
    const forbidden = /Forbidden|403|AccessDenied/i.test(msg);
    if (forbidden) {
      throw new Error(
        `Bucket ${name} exists but this key cannot access it — pick a unique name (e.g. ${name}-prod) on Render`,
      );
    }
    if (!missing) throw err;
    const input: { Bucket: string; CreateBucketConfiguration?: { LocationConstraint: string } } = { Bucket: name };
    if (region !== "us-east-1") {
      input.CreateBucketConfiguration = { LocationConstraint: region };
    }
    await s3.send(new CreateBucketCommand(input));
    created = true;
  }

  await s3.send(
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
  await s3.send(new PutBucketCorsCommand({ Bucket: name, CORSConfiguration: cors() }));

  if (publicRead) {
    await s3.send(
      new PutBucketPolicyCommand({
        Bucket: name,
        Policy: JSON.stringify({
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
        }),
      }),
    );
  }
  return created ? "created" : "exists";
}

/** Idempotent. Creates the three VerzZify buckets the first time AWS keys are live. */
export async function ensureBuckets(): Promise<EnsureResult> {
  if (!awsConfigured()) {
    return { ok: false, created: [], existing: [], error: "AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY not set" };
  }
  if (ran && last) return last;
  const created: string[] = [];
  const existing: string[] = [];
  try {
    const s3 = await client();
    const plan: [string, boolean][] = [
      [S3_BUCKETS.masters, false],
      [S3_BUCKETS.stream, false],
      [S3_BUCKETS.public, true],
    ];
    for (const [name, pub] of plan) {
      const state = await ensureOne(s3, name, pub);
      (state === "created" ? created : existing).push(name);
    }
    last = { ok: true, created, existing };
    ran = true;
    return last;
  } catch (err) {
    last = {
      ok: false,
      created,
      existing,
      error: err instanceof Error ? err.message : "bucket ensure failed",
    };
    return last;
  }
}
