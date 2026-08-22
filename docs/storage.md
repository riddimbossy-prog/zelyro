# Storage

Three buckets:

| Bucket | Access | Contents |
| --- | --- | --- |
| `verzzify-masters` | private | Original audio uploads |
| `verzzify-stream` | private, signed GET | Player copies (passthrough until FFmpeg) |
| `verzzify-public` | CDN / public GET | Covers, posters, banners |

## Contract

1. Signed-in artist calls `requestUpload` (MIME + size checked).
2. Client `PUT`s bytes to the returned URL (AWS presigned, or `/api/storage/upload?token=` in preview).
3. `completeUpload` verifies the object, copies masters → stream, returns `/api/storage/media/:id`.
4. Masters are never served. Stream + public objects are.

Flutter / the web app never hold `AWS_SECRET_ACCESS_KEY`. Provision buckets with `npm run infra:provision` when keys are present.

Preview without AWS keys uses `.data/s3/{bucket}/` with the same APIs.
