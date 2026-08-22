export type InfraStatus = {
  postgres: { mode: "pglite" | "postgres"; connected: boolean };
  supabase: {
    configured: boolean;
    host: string | null;
    anon: boolean;
    serviceRole: boolean;
    reachable: boolean | null;
  };
  s3: {
    mode: "aws" | "local";
    region: string;
    endpoint: string | null;
    buckets: { masters: string; stream: string; public: string };
    reachable: boolean;
    error?: string;
  };
};
