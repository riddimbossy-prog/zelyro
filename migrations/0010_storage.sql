-- Object store index: AWS S3 in production, local disk in preview.
-- Masters stay private. Stream + public are served via /api/storage/media/:id.

create table if not exists media_objects (
  id text primary key,
  owner_id text not null references profiles(id) on delete cascade,
  bucket text not null,
  bucket_kind text not null,
  object_key text not null,
  mime text not null,
  size_bytes integer not null default 0,
  kind text not null,
  status text not null default 'pending',
  public_url text,
  upload_token text unique,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (bucket, object_key)
);

create index if not exists media_objects_owner_idx on media_objects (owner_id, created_at desc);
create index if not exists media_objects_token_idx on media_objects (upload_token)
  where upload_token is not null;
