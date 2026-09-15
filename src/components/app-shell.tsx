import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Anchor, FlaskConical, ListChecks, Radio, Swords } from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";
import { LoginLanding, useSupabaseUser } from "@/components/login-landing";
import { TabLoader } from "@/components/tab-loader";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/feed", label: "Feed", icon: Radio, exact: false },
  { to: "/routines", label: "Routines", icon: ListChecks, exact: false },
  { to: "/grind", label: "Grind", icon: Swords, exact: false },
  { to: "/alchemy", label: "Alchemy", icon: FlaskConical, exact: false },
  { to: "/voyage", label: "Voyage", icon: Anchor, exact: false },
] as const;

const PAGE_META: Record<string, { title: string; eyebrow: string }> = {
  "/feed": { title: "Hub Feed", eyebrow: "Community" },
  "/routines": { title: "Routines", eyebrow: "Task Tracker" },
  "/grind": { title: "Grind", eyebrow: "PvE Tracker" },
  "/alchemy": { title: "Alchemy Planner", eyebrow: "Harmony Draught Pipeline" },
  "/voyage": { title: "Voyage", eyebrow: "Daily Sailies & Bartering" },
};

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
      <g className="hub-orbit hub-orbit-xslow">
        <circle cx="26" cy="11" r="0.85" fill="url(#hubPlanetB)" />
      </g>
      <g className="hub-orbit hub-orbit-med2">
        <circle cx="12" cy="27" r="0.7" fill="url(#hubPlanetC)" />
      </g>
      <circle cx="20" cy="20" r="3.2" fill="url(#hubStar)" filter="url(#hubStarGlow)" />
      <circle cx="20" cy="20" r="1.1" fill="#ffffff" opacity="0.95" />
    </svg>
  );
}

export function AppShell({
  children,
  title,
  eyebrow,
}: {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
    const meta =
    PAGE_META[pathname] ??
    Object.entries(PAGE_META).find(([path]) => pathname.startsWith(path))?.[1];
  const pageTitle = title ?? meta?.title;
  const pageEyebrow = eyebrow ?? meta?.eyebrow;
  const isPending = useRouterState({ select: (s) => s.status === "pending" });
  const { user, loading } = useSupabaseUser();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center hub-body text-muted-foreground">
        <TabLoader label="Signing you in…" />
      </div>
    );
  }

  if (!user) {
    return <LoginLanding />;
  }

  return (
    <div className="min-h-screen pb-14 text-foreground">
      {/* Single thin progress indicator while router is pending */}
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-300 transition-transform duration-300 ease-out",
          isPending ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0",
        )}
        style={{ transformOrigin: "left" }}
        aria-hidden
      />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#04060c]/65 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 shrink-0 items-center justify-center">
              <HubMark className="size-10" />
            </div>
            <div>
              <p className="hub-label-muted tracking-[0.22em]">Black Desert Online</p>
              <h1 className="hub-title tracking-wide">Dev&apos;s Hub</h1>
            </div>
          </div>
          <nav aria-label="Tools" className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.9rem] font-semibold transition-all",
                    active
                      ? "bg-cyan-400/20 text-cyan-200 ring-1 ring-cyan-400/50 shadow-[0_0_18px_rgba(34,211,238,0.28)]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <AuthPanel className="shrink-0" />
        </div>
        <nav className="grid grid-cols-5 gap-0.5 border-t border-white/5 px-2 py-1.5 md:hidden">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg py-1.5 hub-tiny font-semibold",
                  active ? "bg-cyan-400/15 text-cyan-200" : "text-muted-foreground",
                )}
              >
                <Icon className="size-3.5" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-5">
          {pageEyebrow ? <p className="hub-label mb-1.5">{pageEyebrow}</p> : null}
          {pageTitle ? <h2 className="hub-page-title">{pageTitle}</h2> : null}
        </div>
                <div className="min-h-[42vh]">{children}</div>
      </div>
    </div>
  );
}
