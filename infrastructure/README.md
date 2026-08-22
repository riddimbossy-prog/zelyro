# Infrastructure

## Supabase (Postgres)

1. Create a project.
2. Set `DATABASE_URL` / `SUPABASE_DB_URL` to the **transaction pooler** URI.
3. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Run migrations (`npm run db:migrate` or `migrations/*.sql` in the SQL editor).
5. Run `infrastructure/supabase/rls.sql`.

Auth stays Better Auth in this app. Do not enable Supabase Auth as a second session.

## AWS S3

```bash
# with AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY in the environment
npm run infra:provision
```

Creates `verzzify-masters` (private), `verzzify-stream` (private), `verzzify-public` (GetObject public) and CORS for browser PUTs.

Without keys, Studio still uploads through the same APIs into `.data/s3`.
