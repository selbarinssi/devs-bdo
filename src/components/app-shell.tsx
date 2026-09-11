import { Link, useRouterState } from "@tanstack/react-router";
import { Anchor, FlaskConical, ListChecks, Ship, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/routines", label: "Routines", icon: ListChecks, exact: false },
  { to: "/grind", label: "Grind", icon: Swords, exact: false },
  { to: "/", label: "Alchemy", icon: FlaskConical, exact: true },
  { to: "/voyage", label: "Voyage", icon: Anchor, exact: false },
  { to: "/ships", label: "Carrack", icon: Ship, exact: false },
] as const;

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
            <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-400/15 ring-1 ring-cyan-400/40 shadow-[0_0_24px_rgba(34,211,238,0.35)]">
              <span className="text-sm font-bold text-cyan-300">D</span>
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
        <nav className="grid grid-cols-5 gap-0.5 border-t border-white/5 px-2 py-1.5 md:hidden">
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
