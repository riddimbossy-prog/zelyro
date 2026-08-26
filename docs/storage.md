# Storage

Three buckets. The app creates them automatically the first time AWS keys are on Render.

| Bucket env | Default name | Access | Contents |
| --- | --- | --- | --- |
| `S3_MASTERS_BUCKET` | `verzzify-masters` | private | Original audio uploads |
| `S3_STREAM_BUCKET` | `verzzify-stream` | private, signed GET | Player copies |
| `S3_PUBLIC_BUCKET` | `verzzify-public` | public GET | Covers, posters, banners |

Names must be **globally unique** on AWS. If create fails with “already owned”, set e.g. `verzzify-masters-shela`.

## What you do (once)

### 1. IAM user

AWS Console → **IAM → Users → Create user** named `verzzify-s3`.

Attach this inline policy (replace `ACCOUNT_ID` is not needed — resource is bucket ARNs):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VerzZifyBuckets",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:GetBucketCors",
        "s3:PutBucketCors",
        "s3:PutBucketPolicy",
        "s3:PutBucketPublicAccessBlock",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::verzzify-masters",
        "arn:aws:s3:::verzzify-masters/*",
        "arn:aws:s3:::verzzify-stream",
        "arn:aws:s3:::verzzify-stream/*",
        "arn:aws:s3:::verzzify-public",
        "arn:aws:s3:::verzzify-public/*"
      ]
    }
  ]
}
```

If you rename buckets, change the ARNs to match.

Then **Security credentials → Create access key → Application running outside AWS**. Copy:

- Access key ID
- Secret access key (shown once)

### 2. Render environment

| Key | Value |
| --- | --- |
| `AWS_ACCESS_KEY_ID` | the access key |
| `AWS_SECRET_ACCESS_KEY` | the secret |
| `AWS_REGION` | `eu-west-1` |
| `S3_REGION` | `eu-west-1` |
| `S3_MASTERS_BUCKET` | `verzzify-masters` |
| `S3_STREAM_BUCKET` | `verzzify-stream` |
| `S3_PUBLIC_BUCKET` | `verzzify-public` |
| `S3_ENDPOINT` | **leave empty** |

Save → Render redeploys.

### 3. Check

Open [https://www.verzzify.com/api/health](https://www.verzzify.com/api/health)

Want:

```json
"s3": { "mode": "aws", "keysSet": true, "reachable": true }
```

First hit after keys land **creates** the three buckets (CORS + public-read on covers). After that, Studio uploads go to S3, not local disk.

`mode: "local"` means the two AWS keys are missing or blank.

## Contract

1. Signed-in artist calls `requestUpload` (MIME + size checked).
2. Client `PUT`s to the presigned URL (AWS) or `/api/storage/upload?token=` (preview).
3. `completeUpload` copies masters → stream.
4. Masters are never served.

The web/app never hold `AWS_SECRET_ACCESS_KEY`.
