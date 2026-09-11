import { Link, useRouterState } from "@tanstack/react-router";
import { Anchor, FlaskConical, ListChecks, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/routines", label: "Routines", icon: ListChecks, exact: false },
  { to: "/grind", label: "Grind", icon: Swords, exact: false },
  { to: "/", label: "Alchemy", icon: FlaskConical, exact: true },
  { to: "/voyage", label: "Voyage", icon: Anchor, exact: false },
] as const;

/** White central star + purple planets orbiting (Grok-style working animation) */
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
          <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.9" />
        </radialGradient>
        <radialGradient id="hubPlanetA" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </radialGradient>
        <radialGradient id="hubPlanetB" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#ddd6fe" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </radialGradient>
        <radialGradient id="hubPlanetC" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f5f3ff" />
          <stop offset="100%" stopColor="#6d28d9" />
        </radialGradient>
        <filter id="hubStarGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Soft orbit rings */}
      <circle cx="20" cy="20" r="9.5" stroke="rgba(167,139,250,0.35)" strokeWidth="0.6" fill="none" />
      <circle cx="20" cy="20" r="13.5" stroke="rgba(139,92,246,0.22)" strokeWidth="0.5" fill="none" />
      <circle cx="20" cy="20" r="17" stroke="rgba(124,58,237,0.15)" strokeWidth="0.45" fill="none" />
      {/* Orbit 1 — inner, faster */}
      <g className="hub-orbit hub-orbit-fast">
        <circle cx="20" cy="10.5" r="2.1" fill="url(#hubPlanetA)" />
      </g>
      {/* Orbit 2 — mid */}
      <g className="hub-orbit hub-orbit-mid">
        <circle cx="20" cy="6.5" r="1.55" fill="url(#hubPlanetB)" opacity="0.95" />
      </g>
      {/* Orbit 3 — outer, slower */}
      <g className="hub-orbit hub-orbit-slow">
        <circle cx="20" cy="3" r="1.15" fill="url(#hubPlanetC)" opacity="0.9" />
      </g>
      {/* Central white star */}
      <circle cx="20" cy="20" r="4.2" fill="url(#hubStar)" filter="url(#hubStarGlow)" />
      <circle cx="20" cy="20" r="2.1" fill="#ffffff" opacity="0.95" />
      {/* Star points */}
      <path
        d="M20 12.5 L20.55 18.2 L20 19.2 L19.45 18.2 Z M20 27.5 L20.55 21.8 L20 20.8 L19.45 21.8 Z M12.5 20 L18.2 19.45 L19.2 20 L18.2 20.55 Z M27.5 20 L21.8 19.45 L20.8 20 L21.8 20.55 Z"
        fill="#ffffff"
        opacity="0.85"
      />
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
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-white/5 ring-1 ring-violet-400/35 shadow-[0_0_28px_rgba(167,139,250,0.35),0_0_48px_rgba(255,255,255,0.08)]">
              <HubMark className="size-7" />
              <span className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.2),transparent_55%)]" />
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
