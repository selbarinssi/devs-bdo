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
        <linearGradient id="hubMwLogin" x1="2" y1="30" x2="38" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
          <stop offset="18%" stopColor="#a855f7" stopOpacity="0.9" />
          <stop offset="42%" stopColor="#22d3ee" stopOpacity="1" />
          <stop offset="62%" stopColor="#4ade80" stopOpacity="0.95" />
          <stop offset="82%" stopColor="#c026d3" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hubRingLogin" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
        <radialGradient id="hubCoreLogin" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#e0f2fe" />
          <stop offset="55%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#6d28d9" />
        </radialGradient>
        <filter id="hubGlowLogin" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="hubBoltLogin" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.45" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* deep space disc */}
      <circle cx="20" cy="20" r="19" fill="#05010f" opacity="0.55" />

      {/* cyber rings */}
      <circle cx="20" cy="20" r="18" stroke="url(#hubRingLogin)" strokeWidth="0.35" opacity="0.55" className="hub-pulse" />
      <circle cx="20" cy="20" r="14.5" stroke="#22d3ee" strokeWidth="0.3" opacity="0.4" strokeDasharray="2 3" />
      <circle cx="20" cy="20" r="11" stroke="#a855f7" strokeWidth="0.35" opacity="0.5" strokeDasharray="1.5 2.5" />
      <circle cx="20" cy="20" r="7.5" stroke="#4ade80" strokeWidth="0.3" opacity="0.45" />

      {/* inclined neon galaxy band */}
      <ellipse
        cx="20"
        cy="20"
        rx="18"
        ry="4.2"
        transform="rotate(-32 20 20)"
        fill="url(#hubMwLogin)"
        filter="url(#hubGlowLogin)"
        opacity="0.95"
      />
      <ellipse
        cx="20"
        cy="20"
        rx="18"
        ry="2.2"
        transform="rotate(-32 20 20)"
        fill="none"
        stroke="#67e8f9"
        strokeWidth="0.45"
        opacity="0.85"
        filter="url(#hubBoltLogin)"
      />
      <ellipse
        cx="20"
        cy="20"
        rx="16"
        ry="6.5"
        transform="rotate(-32 20 20)"
        fill="none"
        stroke="#c026d3"
        strokeWidth="0.25"
        opacity="0.35"
        strokeDasharray="0.8 2.2"
      />

      {/* static star field */}
      <circle cx="6" cy="8" r="0.35" fill="#e0f2fe" opacity="0.9" />
      <circle cx="33" cy="7" r="0.3" fill="#c084fc" opacity="0.85" />
      <circle cx="35" cy="24" r="0.28" fill="#4ade80" opacity="0.8" />
      <circle cx="5" cy="26" r="0.32" fill="#22d3ee" opacity="0.85" />
      <circle cx="28" cy="34" r="0.25" fill="#f0abfc" opacity="0.75" />
      <circle cx="10" cy="34" r="0.22" fill="#67e8f9" opacity="0.7" />
      <circle cx="18" cy="4" r="0.2" fill="#ffffff" opacity="0.8" />
      <circle cx="22" cy="36" r="0.22" fill="#a3e635" opacity="0.75" />

      {/* lightning orbit trails + bodies */}
      <g className="hub-orbit hub-orbit-xfast" filter="url(#hubGlowLogin)">
        <path d="M20 3.5 C22 5 23 7 22.5 9" stroke="#c084fc" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.9" />
        <circle cx="20" cy="3.5" r="1.5" fill="#e9d5ff" />
        <circle cx="20" cy="3.5" r="0.55" fill="#ffffff" />
      </g>
      <g className="hub-orbit hub-orbit-fast" filter="url(#hubGlowLogin)">
        <path d="M36 20 C34 22 32 23 30 22.5" stroke="#22d3ee" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.9" />
        <circle cx="36.2" cy="20" r="1.25" fill="#67e8f9" />
        <circle cx="36.2" cy="20" r="0.45" fill="#ffffff" />
      </g>
      <g className="hub-orbit hub-orbit-fast-rev" filter="url(#hubGlowLogin)">
        <path d="M4 21 C6 19 8 18 10 18.5" stroke="#4ade80" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.9" />
        <circle cx="4" cy="21" r="1.15" fill="#86efac" />
        <circle cx="4" cy="21" r="0.4" fill="#ffffff" />
      </g>
      <g className="hub-orbit hub-orbit-med" filter="url(#hubGlowLogin)">
        <path d="M28 34 C26 32 24 31 22 31.5" stroke="#a855f7" strokeWidth="0.55" strokeLinecap="round" fill="none" opacity="0.85" />
        <circle cx="28.5" cy="34" r="0.95" fill="#d946ef" />
        <circle cx="28.5" cy="34" r="0.35" fill="#ffffff" />
      </g>
      <g className="hub-orbit hub-orbit-med2" filter="url(#hubGlowLogin)">
        <circle cx="11" cy="9" r="0.75" fill="#22d3ee" />
        <circle cx="11" cy="9" r="0.28" fill="#ffffff" />
      </g>
      <g className="hub-orbit hub-orbit-xfast" filter="url(#hubGlowLogin)">
        <circle cx="31" cy="29" r="0.55" fill="#4ade80" />
      </g>
      <g className="hub-orbit hub-orbit-mid-rev" filter="url(#hubGlowLogin)">
        <circle cx="15" cy="33" r="0.5" fill="#f0abfc" />
      </g>

      {/* core star */}
      <circle cx="20" cy="20" r="4.2" fill="url(#hubCoreLogin)" filter="url(#hubGlowLogin)" />
      <circle cx="20" cy="20" r="2.1" fill="#f5f3ff" opacity="0.95" />
      <circle cx="20" cy="20" r="0.9" fill="#ffffff" />
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
