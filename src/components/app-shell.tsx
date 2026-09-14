import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Anchor, FlaskConical, ListChecks, Radio, Swords } from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";
import { LoginLanding, useSupabaseUser } from "@/components/login-landing";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/feed", label: "Feed", icon: Radio, exact: false },
  { to: "/routines", label: "Routines", icon: ListChecks, exact: false },
  { to: "/grind", label: "Grind", icon: Swords, exact: false },
  { to: "/alchemy", label: "Alchemy", icon: FlaskConical, exact: false },
  { to: "/voyage", label: "Voyage", icon: Anchor, exact: false },
] as const;

function HubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <defs>
        <radialGradient id="hubStar" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.85" />
        </radialGradient>
        <radialGradient id="hubPlanetA" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#f5f3ff" />
          <stop offset="55%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </radialGradient>
        <radialGradient id="hubPlanetB" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </radialGradient>
        <radialGradient id="hubPlanetC" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ddd6fe" />
          <stop offset="100%" stopColor="#6d28d9" />
        </radialGradient>
        <filter id="hubStarGlow" x="-100%" y="-100%" width="300%" height="300%">
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
        <circle cx="20" cy="12" r="1.9" fill="url(#hubPlanetA)" />
      </g>
      <g className="hub-orbit hub-orbit-fast">
        <circle cx="31" cy="20" r="1.45" fill="url(#hubPlanetB)" />
      </g>
      <g className="hub-orbit hub-orbit-med">
        <circle cx="20" cy="32" r="1.2" fill="url(#hubPlanetC)" />
      </g>
      <g className="hub-orbit hub-orbit-slow">
        <circle cx="9" cy="20" r="1.05" fill="url(#hubPlanetA)" />
      </g>
      <g className="hub-orbit hub-orbit-xfast">
        <circle cx="26" cy="11" r="0.85" fill="url(#hubPlanetB)" />
      </g>
      <g className="hub-orbit hub-orbit-med">
        <circle cx="12" cy="27" r="0.7" fill="url(#hubPlanetC)" />
      </g>
      <circle cx="20" cy="20" r="3.2" fill="url(#hubStar)" filter="url(#hubStarGlow)" />
      <circle cx="20" cy="20" r="1.1" fill="#ffffff" />
    </svg>
  );
}

export function AppShell({
  children,
  title,
  eyebrow,
}: {
  children: ReactNode;
  title: string;
  eyebrow?: string;
}) {
  const { user, loading } = useSupabaseUser();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <LoginLanding />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#04060c]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <HubMark className="size-9 shrink-0 sm:size-10" />
            <div className="min-w-0">
              <p className="truncate text-[0.65rem] font-bold uppercase tracking-[0.14em] text-cyan-300/90">
                Dev&apos;s Hub
              </p>
              <p className="truncate text-sm font-semibold text-foreground sm:text-base">{title}</p>
              {eyebrow && <p className="truncate text-[0.65rem] text-muted-foreground">{eyebrow}</p>}
            </div>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                    active
                      ? "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/30"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <AuthPanel />
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-2 py-1.5 md:hidden">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[0.7rem] font-semibold",
                  active
                    ? "bg-cyan-400/15 text-cyan-200"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">{children}</main>
    </div>
  );
}
