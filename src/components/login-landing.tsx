import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

function HubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <defs>
        <radialGradient id="loginStar" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.85" />
        </radialGradient>
        <radialGradient id="loginPlanet" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#f5f3ff" />
          <stop offset="100%" stopColor="#7c3aed" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="11.5" stroke="rgba(139,92,246,0.25)" strokeWidth="0.4" fill="none" />
      <circle cx="20" cy="20" r="15" stroke="rgba(124,58,237,0.15)" strokeWidth="0.35" fill="none" />
      <g className="hub-orbit hub-orbit-fast">
        <circle cx="20" cy="9" r="1.8" fill="url(#loginPlanet)" />
      </g>
      <g className="hub-orbit hub-orbit-med">
        <circle cx="31" cy="20" r="1.3" fill="url(#loginPlanet)" />
      </g>
      <circle cx="20" cy="20" r="3.2" fill="url(#loginStar)" />
    </svg>
  );
}

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    void getSupabase()
      .auth.getUser()
      .then(({ data }) => {
        setUser(data.user ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    const { data: sub } = getSupabase().auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, loading };
}

export function LoginLanding() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/routines` : undefined;

  const oauth = async (provider: "google" | "discord") => {
    if (!isSupabaseConfigured()) {
      setMsg("Supabase is not configured.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "OAuth failed");
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!isSupabaseConfigured()) {
      setMsg("Supabase is not configured.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signin") {
        const { error } = await getSupabase().auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await getSupabase().auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        setMsg("Check your email to confirm, then sign in.");
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="glass max-w-md p-6 text-center text-sm text-muted-foreground">
          Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <HubMark className="size-16" />
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
          Black Desert Online
        </p>
        <h1 className="text-2xl font-semibold tracking-wide text-foreground">Dev&apos;s Hub</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Sign in to sync grind drafts, routines, Sailies, and alchemy across devices.
        </p>
      </div>

      <div className="glass w-full max-w-sm p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => oauth("google")}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-foreground transition hover:bg-white/10"
          >
            Continue With Google
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => oauth("discord")}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#5865F2]/40 bg-[#5865F2]/15 text-sm font-semibold text-[#c5caff] transition hover:bg-[#5865F2]/25"
          >
            Continue With Discord
          </button>
        </div>

        <div className="relative mb-4 text-center text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
          <span className="relative z-10 bg-[rgba(8,12,22,0.95)] px-2">Or Email</span>
          <span className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <Label className="text-[0.65rem]">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 text-sm"
              autoComplete="email"
            />
          </div>
          <div>
            <Label className="text-[0.65rem]">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 text-sm"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>
          {msg && <p className="text-[0.75rem] text-amber-200">{msg}</p>}
          <button
            type="button"
            disabled={busy || !email.trim() || password.length < 6}
            onClick={submit}
            className="btn-primary h-11 w-full text-sm"
          >
            <LogIn className="size-4" />
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
          <button
            type="button"
            className="text-center text-[0.75rem] text-muted-foreground hover:text-cyan-300"
            onClick={() => {
              setMode((m) => (m === "signin" ? "signup" : "signin"));
              setMsg(null);
            }}
          >
            {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
