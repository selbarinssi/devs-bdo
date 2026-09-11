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
      <header className="sticky top-0 z-30 border-b border-border/80 bg-[#0a1018]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
              <span className="text-sm font-bold text-primary">D</span>
            </div>
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                Black Desert Online
              </p>
              <h1 className="text-base font-semibold tracking-wide text-foreground sm:text-lg">
                Dev's Hub
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
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/15 text-primary ring-1 ring-primary/35"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
                  <span className="font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <nav
          aria-label="Tools mobile"
          className="grid grid-cols-5 gap-0.5 border-t border-border/60 px-2 py-1.5 md:hidden"
        >
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-md py-1.5 text-[0.65rem] font-semibold",
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground",
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
          {eyebrow ? (
            <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </div>
  );
}
