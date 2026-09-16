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
        <filter id="hubNeonLogin" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.1" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="hubNucleusLogin" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#e9d5ff" />
          <stop offset="100%" stopColor="#a855f7" />
        </radialGradient>
      </defs>

      {/* tiny sparkles */}
      <circle cx="6" cy="8" r="0.45" fill="#67e8f9" opacity="0.85" />
      <circle cx="34" cy="7" r="0.4" fill="#c084fc" opacity="0.8" />
      <circle cx="33" cy="30" r="0.35" fill="#4ade80" opacity="0.75" />
      <circle cx="7" cy="31" r="0.35" fill="#22d3ee" opacity="0.7" />
      <circle cx="20" cy="3.5" r="0.3" fill="#f0abfc" opacity="0.65" />

      <g className="hub-atom-drift">
        {/* orbit rings — static relative to atom, neon like the ref */}
        <ellipse
          cx="20" cy="20" rx="15" ry="6"
          transform="rotate(-35 20 20)"
          stroke="#c084fc"
          strokeWidth="1.15"
          filter="url(#hubNeonLogin)"
          opacity="0.95"
        />
        <ellipse
          cx="20" cy="20" rx="15" ry="6"
          transform="rotate(25 20 20)"
          stroke="#4ade80"
          strokeWidth="1.15"
          filter="url(#hubNeonLogin)"
          opacity="0.95"
        />
        <ellipse
          cx="20" cy="20" rx="15" ry="6"
          transform="rotate(85 20 20)"
          stroke="#22d3ee"
          strokeWidth="1.15"
          filter="url(#hubNeonLogin)"
          opacity="0.95"
        />

        {/* electrons — motion */}
        <g className="hub-electron-a">
          <circle cx="20" cy="5" r="1.35" fill="#e9d5ff" filter="url(#hubNeonLogin)" />
          <circle cx="20" cy="5" r="0.55" fill="#ffffff" />
        </g>
        <g className="hub-electron-b">
          <circle cx="34" cy="23" r="1.25" fill="#86efac" filter="url(#hubNeonLogin)" />
          <circle cx="34" cy="23" r="0.5" fill="#ffffff" />
        </g>
        <g className="hub-electron-c">
          <circle cx="8" cy="26" r="1.2" fill="#67e8f9" filter="url(#hubNeonLogin)" />
          <circle cx="8" cy="26" r="0.45" fill="#ffffff" />
        </g>

        {/* nucleus */}
        <circle cx="20" cy="20" r="3.6" fill="url(#hubNucleusLogin)" filter="url(#hubNeonLogin)" />
        <circle cx="20" cy="20" r="1.5" fill="#ffffff" opacity="0.95" />
        {/* mini inner “atom” hint */}
        <ellipse cx="20" cy="20" rx="2.4" ry="1" stroke="#a5f3fc" strokeWidth="0.35" opacity="0.7" />
        <ellipse cx="20" cy="20" rx="2.4" ry="1" transform="rotate(60 20 20)" stroke="#e9d5ff" strokeWidth="0.3" opacity="0.6" />
      </g>
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
