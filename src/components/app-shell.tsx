import { Anchor, FlaskConical, ListChecks, Radio, Swords, Skull } from "lucide-react";
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
  { to: "/bosses", label: "Bosses", icon: Skull, exact: false },
  { to: "/alchemy", label: "Alchemy", icon: FlaskConical, exact: false },
  { to: "/voyage", label: "Voyage", icon: Anchor, exact: false },
] as const;

const PAGE_META: Record<string, { title: string; eyebrow: string }> = {
  "/feed": { title: "Hub Feed", eyebrow: "Community" },
  "/routines": { title: "Routines", eyebrow: "Task Tracker" },
  "/grind": { title: "Grind", eyebrow: "PvE Tracker" },
  "/bosses": { title: "World Bosses", eyebrow: "EU Schedule & Alerts" },
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
        <filter id="hubNeon" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.1" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="hubNucleus" cx="50%" cy="50%" r="50%">
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
          filter="url(#hubNeon)"
          opacity="0.95"
        />
        <ellipse
          cx="20" cy="20" rx="15" ry="6"
          transform="rotate(25 20 20)"
          stroke="#4ade80"
          strokeWidth="1.15"
          filter="url(#hubNeon)"
          opacity="0.95"
        />
        <ellipse
          cx="20" cy="20" rx="15" ry="6"
          transform="rotate(85 20 20)"
          stroke="#22d3ee"
          strokeWidth="1.15"
          filter="url(#hubNeon)"
          opacity="0.95"
        />

        {/* electrons — motion */}
        <g className="hub-electron-a">
          <circle cx="20" cy="5" r="1.35" fill="#e9d5ff" filter="url(#hubNeon)" />
          <circle cx="20" cy="5" r="0.55" fill="#ffffff" />
        </g>
        <g className="hub-electron-b">
          <circle cx="34" cy="23" r="1.25" fill="#86efac" filter="url(#hubNeon)" />
          <circle cx="34" cy="23" r="0.5" fill="#ffffff" />
        </g>
        <g className="hub-electron-c">
          <circle cx="8" cy="26" r="1.2" fill="#67e8f9" filter="url(#hubNeon)" />
          <circle cx="8" cy="26" r="0.45" fill="#ffffff" />
        </g>

        {/* nucleus */}
        <circle cx="20" cy="20" r="3.6" fill="url(#hubNucleus)" filter="url(#hubNeon)" />
        <circle cx="20" cy="20" r="1.5" fill="#ffffff" opacity="0.95" />
        {/* mini inner “atom” hint */}
        <ellipse cx="20" cy="20" rx="2.4" ry="1" stroke="#a5f3fc" strokeWidth="0.35" opacity="0.7" />
        <ellipse cx="20" cy="20" rx="2.4" ry="1" transform="rotate(60 20 20)" stroke="#e9d5ff" strokeWidth="0.3" opacity="0.6" />
      </g>
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
        <nav className="grid grid-cols-6 gap-0.5 border-t border-white/5 px-2 py-1.5 md:hidden">
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
