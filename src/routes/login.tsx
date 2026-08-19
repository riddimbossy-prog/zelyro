import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { GROK_PROVIDERS, authEnabled, signIn, authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/sheba/copy";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await authClient.signUp.email({ email, password, name });
        if (error) throw new Error(error.message);
      }
      const { error } = await authClient.signIn.email({ email, password });
      if (error) throw new Error(error.message);
      window.location.href = "/";
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      <img src="/banners/hero.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      <div className="relative mx-auto grid min-h-dvh max-w-md place-items-center px-6 py-12">
        <div className="w-full rounded-[28px] bg-card p-8 shadow-[var(--shadow-border)]">
          <Link to="/" className="font-display text-3xl">
            {copy.app}
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">{copy.tagline}</p>
          <div className="mt-8 space-y-3">
            {authEnabled ? (
              GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                >
                  {p.providerId === "google-grok" ? copy.auth.continueGoogle : copy.auth.continueX}
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sign-in is disabled.</p>
            )}
          </div>
          <p className="my-6 text-center text-xs tracking-widest text-muted-foreground uppercase">or email</p>
          <form onSubmit={onEmail} className="space-y-3">
            {mode === "up" && (
              <div>
                <Label htmlFor="name">{copy.auth.name}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
              </div>
            )}
            <div>
              <Label htmlFor="email">{copy.auth.email}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">{copy.auth.password}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="mt-1" />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {mode === "up" ? copy.auth.create : copy.auth.signIn}
            </Button>
          </form>
          <button
            type="button"
            className="mt-4 w-full text-sm text-muted-foreground"
            onClick={() => setMode(mode === "up" ? "in" : "up")}
          >
            {mode === "up" ? copy.auth.haveAccount : copy.auth.needAccount}
          </button>
        </div>
      </div>
    </main>
  );
}
