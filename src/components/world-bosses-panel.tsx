// src/components/world-bosses-panel.tsx
import { Volume2, VolumeX, Wifi, WifiOff } from "lucide-react";
import { BOSS_META, type BossId } from "@/data/world-bosses";
import { useBossTimers, type VoiceChoice } from "@/lib/use-boss-timers";
import { cn } from "@/lib/utils";

function formatCountdown(min: number, sec: number) {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m.toString().padStart(2, "0")}m`;
  }
  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function BossCard({
  boss,
  large,
  leadMinutes,
}: {
  boss: {
    id: BossId;
    name: string;
    spawnAt: Date;
    minutesLeft: number;
    secondsLeft: number;
  };
  large?: boolean;
  leadMinutes: number;
}) {
  const meta = BOSS_META[boss.id];
  const urgent = boss.minutesLeft < leadMinutes;

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border transition-all",
        large ? "min-h-[320px] flex-[1.35]" : "min-h-[240px] flex-1",
        urgent
          ? "border-emerald-400/40 shadow-[0_0_28px_rgba(52,211,153,0.18)]"
          : "border-white/10",
      )}
      style={{
        background: `
          linear-gradient(165deg,
            rgba(12, 18, 32, 0.92) 0%,
            rgba(10, 16, 28, 0.88) 50%,
            ${meta.color}14 100%
          )`,
      }}
    >
      {/* top accent line */}
      <div
        className="h-1 w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, ${meta.color}, transparent 80%)`,
        }}
      />

      <div className={cn("flex flex-1 flex-col p-4", large && "p-5")}>
        {/* portrait */}
        <div
          className={cn(
            "relative mx-auto overflow-hidden rounded-xl ring-1 ring-white/10",
            large ? "mb-4 size-28 sm:size-32" : "mb-3 size-16 sm:size-20",
          )}
          style={{ boxShadow: `0 0 22px ${meta.color}33` }}
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
              background: `linear-gradient(to top, ${meta.color}40 0%, transparent 50%)`,
            }}
          />
        </div>

        <div className="mt-auto text-center">
          <p
            className={cn(
              "font-bold uppercase tracking-[0.14em]",
              large ? "text-[0.7rem]" : "text-[0.6rem]",
            )}
            style={{ color: meta.color }}
          >
            {meta.short}
          </p>
          <p
            className={cn(
              "mt-0.5 font-semibold text-slate-100",
              large ? "text-lg" : "text-sm",
            )}
          >
            {meta.name}
          </p>

          {/* EMERALD timer */}
          <p
            className={cn(
              "mt-2 font-mono font-bold tabular-nums neon-emerald",
              large ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl",
            )}
          >
            {formatCountdown(boss.minutesLeft, boss.secondsLeft)}
          </p>

          <p className="hub-meta mt-1">
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

  const next = bosses[0] ?? null;
  const upcoming = bosses.slice(1, 5); // up to 4 more → 5 total visible

  const toggleBoss = (id: BossId) => {
    const set = new Set(settings.enabledBosses);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    setSettings({ enabledBosses: Array.from(set) });
  };

  return (
    <div className="space-y-5">
      {/* Controls bar */}
      <div className="glass flex flex-wrap items-center justify-between gap-3 p-4">
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
            Alerts {settings.enabled ? "On" : "Off"}
          </button>

          <select
            className="field-select h-9 w-[6.5rem] text-xs"
            value={settings.leadMinutes}
            onChange={(e) => setSettings({ leadMinutes: Number(e.target.value) })}
          >
            {[10, 5, 3, 1].map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>

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
      </div>

      {/* Horizontal boss strip */}
      {bosses.length === 0 ? (
        <div className="hub-empty">
          {status === "connecting"
            ? "Connecting to EU timers…"
            : status === "error"
              ? "Could not reach the timer feed. Retrying…"
              : "No upcoming bosses in the current window."}
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          {/* NEXT — large left */}
          {next && (
            <div className="sm:w-[38%] sm:min-w-[240px] sm:max-w-[320px]">
              <p className="hub-label mb-2 text-emerald-300/90">Next</p>
              <BossCard boss={next} large leadMinutes={settings.leadMinutes} />
            </div>
          )}

          {/* UPCOMING — smaller, horizontal row */}
          {upcoming.length > 0 && (
            <div className="min-w-0 flex-1">
              <p className="hub-label-muted mb-2">Upcoming</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {upcoming.map((b) => (
                  <BossCard
                    key={`${b.id}-${b.spawnAt.getTime()}`}
                    boss={b}
                    leadMinutes={settings.leadMinutes}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerts filter */}
      <div className="glass p-4">
        <p className="hub-label mb-3">Alerts</p>
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
                  on
                    ? "ring-1 text-slate-100"
                    : "bg-white/5 text-muted-foreground ring-white/10",
                )}
                style={
                  on
                    ? {
                        background: `${meta.color}22`,
                        borderColor: `${meta.color}66`,
                        boxShadow: `0 0 14px ${meta.color}22`,
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
  );
}
