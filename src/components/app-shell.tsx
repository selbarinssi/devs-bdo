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
        <linearGradient id="hubMw" x1="2" y1="30" x2="38" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
          <stop offset="18%" stopColor="#a855f7" stopOpacity="0.9" />
          <stop offset="42%" stopColor="#22d3ee" stopOpacity="1" />
          <stop offset="62%" stopColor="#4ade80" stopOpacity="0.95" />
          <stop offset="82%" stopColor="#c026d3" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hubRing" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
        <radialGradient id="hubCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#e0f2fe" />
          <stop offset="55%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#6d28d9" />
        </radialGradient>
        <filter id="hubGlow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="hubBolt" x="-50%" y="-50%" width="200%" height="200%">
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
      <circle cx="20" cy="20" r="18" stroke="url(#hubRing)" strokeWidth="0.35" opacity="0.55" className="hub-pulse" />
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
        fill="url(#hubMw)"
        filter="url(#hubGlow)"
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
        filter="url(#hubBolt)"
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
      <g className="hub-orbit hub-orbit-xfast" filter="url(#hubGlow)">
        <path d="M20 3.5 C22 5 23 7 22.5 9" stroke="#c084fc" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.9" />
        <circle cx="20" cy="3.5" r="1.5" fill="#e9d5ff" />
        <circle cx="20" cy="3.5" r="0.55" fill="#ffffff" />
      </g>
      <g className="hub-orbit hub-orbit-fast" filter="url(#hubGlow)">
        <path d="M36 20 C34 22 32 23 30 22.5" stroke="#22d3ee" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.9" />
        <circle cx="36.2" cy="20" r="1.25" fill="#67e8f9" />
        <circle cx="36.2" cy="20" r="0.45" fill="#ffffff" />
      </g>
      <g className="hub-orbit hub-orbit-fast-rev" filter="url(#hubGlow)">
        <path d="M4 21 C6 19 8 18 10 18.5" stroke="#4ade80" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.9" />
        <circle cx="4" cy="21" r="1.15" fill="#86efac" />
        <circle cx="4" cy="21" r="0.4" fill="#ffffff" />
      </g>
      <g className="hub-orbit hub-orbit-med" filter="url(#hubGlow)">
        <path d="M28 34 C26 32 24 31 22 31.5" stroke="#a855f7" strokeWidth="0.55" strokeLinecap="round" fill="none" opacity="0.85" />
        <circle cx="28.5" cy="34" r="0.95" fill="#d946ef" />
        <circle cx="28.5" cy="34" r="0.35" fill="#ffffff" />
      </g>
      <g className="hub-orbit hub-orbit-med2" filter="url(#hubGlow)">
        <circle cx="11" cy="9" r="0.75" fill="#22d3ee" />
        <circle cx="11" cy="9" r="0.28" fill="#ffffff" />
      </g>
      <g className="hub-orbit hub-orbit-xfast" filter="url(#hubGlow)">
        <circle cx="31" cy="29" r="0.55" fill="#4ade80" />
      </g>
      <g className="hub-orbit hub-orbit-mid-rev" filter="url(#hubGlow)">
        <circle cx="15" cy="33" r="0.5" fill="#f0abfc" />
      </g>

      {/* core star */}
      <circle cx="20" cy="20" r="4.2" fill="url(#hubCore)" filter="url(#hubGlow)" />
      <circle cx="20" cy="20" r="2.1" fill="#f5f3ff" opacity="0.95" />
      <circle cx="20" cy="20" r="0.9" fill="#ffffff" />
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
