import { Link, useRouterState } from "@tanstack/react-router";
import { Anchor, FlaskConical, ListChecks, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/routines", label: "Routines", icon: ListChecks, exact: false },
  { to: "/grind", label: "Grind", icon: Swords, exact: false },
  { to: "/", label: "Alchemy", icon: FlaskConical, exact: true },
  { to: "/voyage", label: "Voyage", icon: Anchor, exact: false },
] as const;

/** Neon blue/purple geometric mark — crystal / portal vibe */
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
        <linearGradient id="hubGrad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67e8f9" />
          <stop offset="0.45" stopColor="#22d3ee" />
          <stop offset="0.72" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#c4b5fd" />
        </linearGradient>
        <linearGradient id="hubCore" x1="14" y1="12" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e0f2fe" />
          <stop offset="1" stopColor="#c4b5fd" />
        </linearGradient>
        <filter id="hubGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Outer hex ring */}
      <path
        d="M20 3.5 L33.5 11.5 V28.5 L20 36.5 L6.5 28.5 V11.5 Z"
        stroke="url(#hubGrad)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        filter="url(#hubGlow)"
        opacity="0.95"
      />
      {/* Inner diamond */}
      <path
        d="M20 11 L28 20 L20 29 L12 20 Z"
        stroke="url(#hubGrad)"
        strokeWidth="1.35"
        strokeLinejoin="round"
        fill="rgba(34,211,238,0.08)"
      />
      {/* Core spark */}
      <circle cx="20" cy="20" r="3.2" fill="url(#hubCore)" filter="url(#hubGlow)" />
      <circle cx="20" cy="20" r="1.35" fill="#f0f9ff" opacity="0.95" />
      {/* Accent rays */}
      <path d="M20 6.5 V10" stroke="#67e8f9" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
      <path d="M20 30 V33.5" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
      <path d="M9.5 14.5 L12.2 16.2" stroke="#22d3ee" strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
      <path d="M27.8 23.8 L30.5 25.5" stroke="#c4b5fd" strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function AppShell({
  children,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen pb-14 text-foreground">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#04060c]/65 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 via-violet-500/15 to-fuchsia-500/10 ring-1 ring-cyan-400/35 shadow-[0_0_28px_rgba(34,211,238,0.35),0_0_48px_rgba(167,139,250,0.18)]">
              <HubMark className="size-7" />
              <span className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_30%_25%,rgba(103,232,249,0.25),transparent_55%)]" />
            </div>
            <div>
              <p className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                Black Desert Online
              </p>
              <h1 className="text-base font-semibold tracking-wide text-foreground sm:text-lg">
                Dev&apos;s Hub
              </h1>
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
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all",
                    active
                      ? "bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/40 shadow-[0_0_16px_rgba(34,211,238,0.2)]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
                  <span className="font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <nav className="grid grid-cols-4 gap-0.5 border-t border-white/5 px-2 py-1.5 md:hidden">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[0.65rem] font-semibold",
                  active ? "bg-cyan-400/10 text-cyan-300" : "text-muted-foreground",
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
        <div className="mb-4">
          {eyebrow ? (
            <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.24em] text-cyan-300/90">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
