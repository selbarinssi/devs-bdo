import { useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

function HubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <radialGradient id="hubStarLogin" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.85" />
        </radialGradient>
        <radialGradient id="hubPlanetALogin" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#f5f3ff" />
          <stop offset="55%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </radialGradient>
        <radialGradient id="hubPlanetBLogin" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </radialGradient>
        <radialGradient id="hubPlanetCLogin" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ddd6fe" />
          <stop offset="100%" stopColor="#6d28d9" />
        </radialGradient>
        <filter id="hubStarGlowLogin" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="20" cy="20" r="8" stroke="rgba(167,139,250,0.28)" strokeWidth="0.45" fill="none" />
      <circle cx="20" cy="20" r="11.5" stroke="rgba(139,92,246,0.2)" strokeWidth="0.4" fill="none" />
      <circle cx="20" cy="20" r="15" stroke="rgba(124,58,237,0.14)" strokeWidth="0.35" fill="none" />
      <circle cx="20" cy="20" r="18" stroke="rgba(167,139,250,0.1)" strokeWidth="0.3" fill="none" />
      <g className="hub-orbit hub-orbit-xfast">
        <circle cx="20" cy="12" r="1.9" fill="url(#hubPlanetALogin)" />
      </g>
      <g className="hub-orbit hub-orbit-fast">
        <circle cx="31" cy="20" r="1.45" fill="url(#hubPlanetBLogin)" />
      </g>
      <g className="hub-orbit hub-orbit-med">
        <circle cx="20" cy="32" r="1.2" fill="url(#hubPlanetCLogin)" />
      </g>
      <g className="hub-orbit hub-orbit-slow">
        <circle cx="9" cy="20" r="1.05" fill="url(#hubPlanetALogin)" />
      </g>
      <g className="hub-orbit hub-orbit-xslow">
        <circle cx="26" cy="11" r="0.85" fill="url(#hubPlanetBLogin)" />
      </g>
      <g className="hub-orbit hub-orbit-med2">
        <circle cx="12" cy="27" r="0.7" fill="url(#hubPlanetCLogin)" />
      </g>
      <circle cx="20" cy="20" r="3.2" fill="url(#hubStarLogin)" filter="url(#hubStarGlowLogin)" />
      <circle cx="20" cy="20" r="1.1" fill="#ffffff" opacity="0.95" />
    </svg>
  );
}

/** Discord display name + avatar from Supabase user metadata */
export function discordProfile(user: User) {
  const m = user.user_metadata ?? {};
  const name =
    (m.full_name as string) ||
    (m.name as string) ||
    (m.custom_claims as { global_name?: string } | undefined)?.global_name ||
    (m.preferred_username as string) ||
    (m.user_name as string) ||
    "Player";
  const avatar = (m.avatar_url as string) || (m.picture as string) || null;
  return { name, avatar };
}

/** Survives AppShell remounts on every tab so we don't flash "Signing you in…". */
let cachedAuthUser: User | null = null;
let authResolved = false;

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(() => cachedAuthUser);
  const [loading, setLoading] = useState(() => !authResolved);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      authResolved = true;
      setLoading(false);
      return;
    }
    void getSupabase()
      .auth.getUser()
      .then(({ data }) => {
        cachedAuthUser = data.user ?? null;
        authResolved = true;
        setUser(cachedAuthUser);
        setLoading(false);
      })
      .catch(() => {
        authResolved = true;
        setLoading(false);
      });
    const { data: sub } = getSupabase().auth.onAuthStateChange((_e, session) => {
      cachedAuthUser = session?.user ?? null;
      authResolved = true;
      setUser(cachedAuthUser);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, loading };
}

export function LoginLanding() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/routines` : undefined;

  const signInDiscord = async () => {
    if (!isSupabaseConfigured()) {
      setMsg("Supabase is not configured.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const silent = await getSupabase().auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo,
          scopes: "identify",
          queryParams: { prompt: "none" },
        },
      });
      if (silent.error) {
        const full = await getSupabase().auth.signInWithOAuth({
          provider: "discord",
          options: {
            redirectTo,
            scopes: "identify",
          },
        });
        if (full.error) throw full.error;
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Discord sign-in failed");
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
      </div>

      <div className="glass w-full max-w-sm p-5 sm:p-6">
        <button
          type="button"
          disabled={busy}
          onClick={signInDiscord}
          className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[#5865F2]/45 bg-[#5865F2]/20 text-sm font-semibold text-[#e0e3ff] transition hover:bg-[#5865F2]/30 disabled:opacity-60"
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M20.3 4.4A16.8 16.8 0 0 0 15.9 3l-.2.4a15.2 15.2 0 0 1 3.6 1.8 13.5 13.5 0 0 0-12.6 0A15 15 0 0 1 10.3 3l-.2-.4A16.8 16.8 0 0 0 5.7 4.4C2.6 9 1.8 13.4 2.1 17.8a17 17 0 0 0 5.1 2.6l.7-1.1a11 11 0 0 1-1.6-.8l.4-.3c3.2 1.5 6.7 1.5 9.8 0l.4.3c-.5.3-1 .6-1.6.8l.7 1.1a17 17 0 0 0 5.1-2.6c.5-5 .1-9.3-2.2-13.4ZM9.2 14.9c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm5.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
          </svg>
          {busy ? "Connecting…" : "Continue With Discord"}
        </button>
        {msg && <p className="mt-3 text-center text-[0.75rem] text-amber-200">{msg}</p>}
      </div>
    </div>
  );
}
