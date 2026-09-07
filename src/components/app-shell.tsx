import { Link, useRouterState } from "@tanstack/react-router";
import { Anchor, FlaskConical, Ship } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Alchemy", hint: "Harmony pipeline", icon: FlaskConical, exact: true },
  { to: "/voyage", label: "Voyage", hint: "Sailies & barter", icon: Anchor, exact: false },
  { to: "/ships", label: "Carrack", hint: "Upgrade tracker", icon: Ship, exact: false },
] as const;

export function AppShell({
  children,
  eyebrow,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
  subtitle: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-ivory pb-16 text-ink">
      <header className="bg-teal text-ivory">
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
          <p className="text-center text-[0.7rem] font-medium uppercase tracking-[0.35em] text-stone sm:tracking-[0.45em]">
            Black Desert Online
          </p>
          <h1 className="mt-2 text-center font-medium uppercase tracking-[0.28em] text-balance text-[1.65rem] text-ivory sm:text-[2.1rem] sm:tracking-[0.42em]">
            The Alchemist
          </h1>
          <p className="mt-2 text-center text-xs tracking-[0.18em] text-stone uppercase">
            Alchemy · Sailies · Carrack
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
        <nav aria-label="Tools" className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[10px] border px-2 py-3 text-center transition-[background-color,color,border-color,box-shadow] duration-150 sm:flex-row sm:gap-2.5 sm:px-4",
                  active
                    ? "border-teal bg-teal text-ivory shadow-[0_4px_14px_rgba(32,89,92,0.30)]"
                    : "border-stone bg-paper text-muted hover:border-teal hover:text-ink",
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                <span className="text-sm font-bold sm:text-base">{item.label}</span>
                <span
                  className={cn(
                    "hidden text-xs font-medium italic sm:inline",
                    active ? "text-ivory/75" : "text-muted",
                  )}
                >
                  {item.hint}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mb-6">
          {eyebrow ? (
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-teal">{eyebrow}</p>
          ) : null}
          <h2 className="text-xl font-semibold text-ink sm:text-2xl">{title}</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  );
}
