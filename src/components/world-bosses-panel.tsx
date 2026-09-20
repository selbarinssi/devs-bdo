// src/components/world-bosses-panel.tsx
import { Volume2, VolumeX, Wifi, WifiOff } from "lucide-react";
import { BOSS_META, type BossId } from "@/data/world-bosses";
import { useBossTimers, type VoiceChoice } from "@/lib/use-boss-timers";
import { cn } from "@/lib/utils";

/** 04:19 when ≥ 1h, else MM:SS */
function formatCountdown(min: number, sec: number) {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }
  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

const LEAD_OPTIONS = [15, 10, 5, 1] as const;

function BossCard({
  boss,
  large,
  urgent,
}: {
  boss: {
    id: BossId;
    name: string;
    spawnAt: Date;
    minutesLeft: number;
    secondsLeft: number;
  };
  large?: boolean;
  urgent?: boolean;
}) {
  const meta = BOSS_META[boss.id];

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border transition-all",
        large ? "min-h-[380px]" : "min-h-[280px]",
        urgent
          ? "border-emerald-400/45 shadow-[0_0_32px_rgba(52,211,153,0.2)]"
          : "border-white/10",
      )}
      style={{
        background: `
          linear-gradient(165deg,
            rgba(12, 18, 32, 0.94) 0%,
            rgba(10, 16, 28, 0.9) 55%,
            ${meta.color}18 100%
          )`,
      }}
    >
      <div
        className="h-1 w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, ${meta.color}, transparent 85%)`,
        }}
      />

      <div className={cn("flex flex-1 flex-col", large ? "p-5" : "p-4")}>
        {/* Rectangular portrait — 4:5 */}
        <div
          className={cn(
            "relative mx-auto overflow-hidden rounded-xl ring-1 ring-white/10",
            large ? "mb-5 w-full max-w-[220px] aspect-[4/5]" : "mb-3 w-full max-w-[140px] aspect-[4/5]",
          )}
          style={{ boxShadow: `0 0 24px ${meta.color}35` }}
        >
          <img
            src={meta.icon}
            alt={meta.name}
            className="size-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${meta.color}45 0%, transparent 55%)`,
            }}
          />
        </div>

        <div className="mt-auto text-center">
          <p
            className={cn(
              "font-bold uppercase tracking-[0.14em]",
              large ? "text-[0.72rem]" : "text-[0.62rem]",
            )}
            style={{ color: meta.color }}
          >
            {meta.short}
          </p>
          <p
            className={cn(
              "mt-0.5 font-semibold text-slate-100",
              large ? "text-xl" : "text-sm",
            )}
          >
            {meta.name}
          </p>

          <p
            className={cn(
              "mt-3 font-mono font-bold tabular-nums neon-emerald",
              large ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl",
            )}
          >
            {formatCountdown(boss.minutesLeft, boss.secondsLeft)}
          </p>

          <p className="hub-meta mt-1.5">
            {boss.spawnAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

export function WorldBossesPanel() {
  const { bosses, connected, status, settings, setSettings, testAlert } =
    useBossTimers("eu");

  // Only show bosses the user has alerts enabled for
  const visible = bosses.filter((b) => settings.enabledBosses.includes(b.id));
  const next = visible[0] ?? null;
  const upcoming = visible.slice(1, 5);

  const minLead = settings.leadMinutes.length
    ? Math.min(...settings.leadMinutes)
    : 15;

  const toggleBoss = (id: BossId) => {
    const set = new Set(settings.enabledBosses);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    setSettings({ enabledBosses: Array.from(set) });
  };

  const toggleLead = (m: number) => {
    const set = new Set(settings.leadMinutes);
    if (set.has(m)) {
      if (set.size === 1) return; // keep at least one
      set.delete(m);
    } else {
      set.add(m);
    }
    setSettings({ leadMinutes: Array.from(set).sort((a, b) => b - a) });
  };

  return (
    <div className="space-y-6">
      {/* Cards first */}
      {visible.length === 0 ? (
        <div className="hub-empty">
          {status === "connecting"
            ? "Connecting to EU timers…"
            : status === "error"
              ? "Could not reach the timer feed. Retrying…"
              : settings.enabledBosses.length === 0
                ? "No bosses selected in Alerts."
                : "No upcoming bosses for your selected alerts."}
        </div>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          {next && (
            <div className="lg:w-[36%] lg:min-w-[260px] lg:max-w-[340px]">
              <p className="hub-label mb-2 text-emerald-300/90">Next</p>
              <BossCard
                boss={next}
                large
                urgent={next.minutesLeft < minLead}
              />
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="min-w-0 flex-1">
              <p className="hub-label-muted mb-2">Upcoming</p>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {upcoming.map((b) => (
                  <BossCard
                    key={`${b.id}-${b.spawnAt.getTime()}`}
                    boss={b}
                    urgent={b.minutesLeft < minLead}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerts config — below cards */}
      <div className="glass space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="hub-label">Alerts</p>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
              connected
                ? "bg-emerald-500/15 text-emerald-200 ring-emerald-400/40"
                : "bg-rose-500/15 text-rose-200 ring-rose-400/40",
            )}
          >
            {connected ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
            {connected ? "Live EU" : status === "connecting" ? "Connecting…" : "Offline"}
          </div>
        </div>

        {/* On/off + voice + test */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSettings({ enabled: !settings.enabled })}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 transition",
              settings.enabled
                ? "bg-emerald-500/20 text-emerald-100 ring-emerald-400/45"
                : "bg-white/5 text-muted-foreground ring-white/10",
            )}
          >
            {settings.enabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
            {settings.enabled ? "On" : "Off"}
          </button>

          <div className="hub-tab-rail">
            {(["female1", "female2"] as VoiceChoice[]).map((v) => (
              <button
                key={v}
                type="button"
                data-active={settings.voice === v}
                className="hub-tab text-xs"
                onClick={() => setSettings({ voice: v })}
              >
                {v === "female1" ? "Voice A" : "Voice B"}
              </button>
            ))}
          </div>

          <button type="button" onClick={testAlert} className="btn-ghost h-9 text-xs">
            Test voice
          </button>
        </div>

        {/* Multi lead times: 15 / 10 / 5 / 1 */}
        <div>
          <p className="hub-meta mb-2">Notify at</p>
          <div className="flex flex-wrap gap-2">
            {LEAD_OPTIONS.map((m) => {
              const on = settings.leadMinutes.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleLead(m)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition",
                    on
                      ? "bg-emerald-500/20 text-emerald-100 ring-emerald-400/45"
                      : "bg-white/5 text-muted-foreground ring-white/10",
                  )}
                >
                  {m} min
                </button>
              );
            })}
          </div>
        </div>

        {/* Boss filter — also drives visible cards */}
        <div>
          <p className="hub-meta mb-2">Bosses</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(BOSS_META) as BossId[]).map((id) => {
              const on = settings.enabledBosses.includes(id);
              const meta = BOSS_META[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleBoss(id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 transition",
                    on ? "text-slate-100" : "bg-white/5 text-muted-foreground ring-white/10",
                  )}
                  style={
                    on
                      ? {
                          background: `${meta.color}22`,
                          boxShadow: `0 0 14px ${meta.color}22`,
                          borderColor: `${meta.color}55`,
                        }
                      : undefined
                  }
                >
                  <img
                    src={meta.icon}
                    alt=""
                    className="size-5 rounded-md object-cover"
                  />
                  {meta.short}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
