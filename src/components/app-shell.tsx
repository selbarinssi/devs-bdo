import { Link, useRouterState } from "@tanstack/react-router";
import { Anchor, FlaskConical, ListChecks, Ship, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/routines", label: "Routines", hint: "Daily & weekly", icon: ListChecks, exact: false },
  { to: "/grind", label: "Grind", hint: "PVE sessions", icon: Swords, exact: false },
  { to: "/", label: "Alchemy", hint: "Harmony", icon: FlaskConical, exact: true },
  { to: "/voyage", label: "Voyage", hint: "Sailies", icon: Anchor, exact: false },
  { to: "/ships", label: "Carrack", hint: "Upgrade", icon: Ship, exact: false },
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
    <div className="min-h-screen bg-background pb-12 text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Black Desert Online
            </p>
            <h1 className="text-lg font-semibold tracking-wide text-foreground sm:text-xl">
              Dev&apos;s Hub
            </h1>
          </div>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Routines · Grind · Alchemy · Voyage · Carrack
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
        <nav aria-label="Tools" className="mb-4 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-center text-sm transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                <Icon className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mb-4">
          {eyebrow ? (
            <p className="mb-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
        </div>

        {children}
      </div>
    </div>
  );
}
