# Deployment

**GitHub** holds the code. **Do not** host the live player on GitHub Pages.

## Render (production web)

[`render.yaml`](../render.yaml) is the blueprint. Push it, then New → Blueprint.

### Environment variable names

Paste these **exact** keys in Render → Environment (already declared in `render.yaml`):

| Name | Required | What it is |
|---|---|---|
| `NODE_VERSION` | yes | `22` |
| `NODE_ENV` | yes | `production` |
| `NITRO_PRESET` | yes | `node-server` |
| `PORT` | yes | Render sets this; blueprint uses `10000` |
| `VITE_AUTH_ENABLED` | yes | `false` until login is ready |
| `VITE_PUBLIC_HOSTNAME` | yes | `verzzify.com` |
| `BETTER_AUTH_URL` | yes | `https://verzzify.com` |
| `BETTER_AUTH_SECRET` | yes | auto-generated in blueprint |
| `DATABASE_URL` | yes | from Render Postgres (or your Supabase pooler URI) |
| `YOUTUBE_API_KEY` | for live charts/search | Google Cloud YouTube Data API v3 |
| `AWS_ACCESS_KEY_ID` | for real uploads | IAM user |
| `AWS_SECRET_ACCESS_KEY` | for real uploads | IAM user |
| `AWS_REGION` | if using S3 | `eu-west-1` |
| `S3_REGION` | optional alias | `eu-west-1` |
| `S3_MASTERS_BUCKET` | if using S3 | `verzzify-masters` |
| `S3_STREAM_BUCKET` | if using S3 | `verzzify-stream` |
| `S3_PUBLIC_BUCKET` | if using S3 | `verzzify-public` |
| `S3_ENDPOINT` | only MinIO/LocalStack | leave empty on AWS |
| `SUPABASE_URL` | if using Supabase API | `https://….supabase.co` |
| `SUPABASE_ANON_KEY` | if using Supabase API | anon |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | service role |
| `SUPABASE_DB_URL` | alt to `DATABASE_URL` | pooler URI |
| `SUPABASE_DATABASE_URL` | alt to `DATABASE_URL` | same |
| `POSTGRES_URL` | alt to `DATABASE_URL` | same |
| `VITE_SUPABASE_URL` | client anon | same as `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | client anon | same as `SUPABASE_ANON_KEY` |
| `GOOGLE_CLIENT_ID` | later | OAuth |
| `GOOGLE_CLIENT_SECRET` | later | OAuth |
| `TWITTER_CLIENT_ID` | later | OAuth |
| `TWITTER_CLIENT_SECRET` | later | OAuth |
| `JAMENDO_CLIENT_ID` | independents rail | [devportal.jamendo.com](https://devportal.jamendo.com/) |
| `FCM_PROJECT_ID` | later | push |
| `PAYMENT_WEBHOOK_SECRET` | later | billing |
| `VITE_API_BASE` | later | `https://verzzify.com/api/v1` |

Fill every `sync: false` key in the Render dashboard (YouTube, AWS, optional Supabase/OAuth). Do not put secrets in git.

### DNS

Hostinger: remove GitHub A records. CNAME `www` → `verzzify.onrender.com` (the host Render shows). Custom domain in Render: `verzzify.com` and `www.verzzify.com`.

Use **starter** (or higher) so the player does not sleep.
