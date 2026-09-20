// src/components/world-bosses-panel.tsx
import { Volume2, VolumeX, Wifi, WifiOff } from "lucide-react";
import { BOSS_META, type BossId } from "@/data/world-bosses";
import { useBossTimers } from "@/lib/use-boss-timers";
import { cn } from "@/lib/utils";

function formatCountdown(min: number, sec: number) {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m.toString().padStart(2, "0")}m`;
  }
  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

export function WorldBossesPanel() {
  const { bosses, connected, settings, setSettings, testAlert } = useBossTimers("eu");

  const toggleBoss = (id: BossId) => {
    const set = new Set(settings.enabledBosses);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    setSettings({ enabledBosses: Array.from(set) });
  };

  return (
    <div className="space-y-5">
      {/* Header controls */}
      <div className="glass flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
              connected
                ? "bg-emerald-500/15 text-emerald-200 ring-emerald-400/40"
                : "bg-rose-500/15 text-rose-200 ring-rose-400/40",
            )}
          >
            {connected ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
            {connected ? "Live EU" : "Reconnecting…"}
          </div>
          <p className="hub-meta">Sound alert when a selected boss is ≤ lead time</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSettings({ enabled: !settings.enabled })}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 transition",
              settings.enabled
                ? "bg-cyan-400/20 text-cyan-100 ring-cyan-400/50"
                : "bg-white/5 text-muted-foreground ring-white/10",
            )}
          >
            {settings.enabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
            Alerts {settings.enabled ? "On" : "Off"}
          </button>

          <select
            className="field-select h-9 w-[7.5rem] text-xs"
            value={settings.leadMinutes}
            onChange={(e) => setSettings({ leadMinutes: Number(e.target.value) })}
          >
            {[10, 5, 3, 1].map((m) => (
              <option key={m} value={m}>
                {m} min lead
              </option>
            ))}
          </select>

          <button type="button" onClick={testAlert} className="btn-ghost h-9 text-xs">
            Test voice
          </button>
        </div>
      </div>

      {/* Upcoming bosses */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {bosses.length === 0 && (
          <div className="hub-empty col-span-full">Waiting for boss data…</div>
        )}

        {bosses.map((b) => {
          const meta = BOSS_META[b.id];
          const urgent = b.minutesLeft < settings.leadMinutes;

          return (
            <div
              key={`${b.id}-${b.spawnAt.getTime()}`}
              className={cn(
                "glass relative overflow-hidden p-4 transition-all",
                urgent && "ring-1 ring-cyan-400/50 shadow-[0_0_28px_rgba(34,211,238,0.18)]",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className="relative size-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10"
                  style={{ boxShadow: `0 0 18px ${meta.color}33` }}
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
                    className="absolute inset-0 opacity-30"
                    style={{ background: `linear-gradient(135deg, ${meta.color}55, transparent)` }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="hub-label" style={{ color: meta.color }}>
                    {meta.short}
                  </p>
                  <p className="hub-title truncate">{meta.name}</p>
                  <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-cyan-200">
                    {formatCountdown(b.minutesLeft, b.secondsLeft)}
                  </p>
                  <p className="hub-meta mt-0.5">
                    {b.spawnAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Boss filter */}
      <div className="glass p-4">
        <p className="hub-label mb-3">Alert for these bosses</p>
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
                    ? "bg-cyan-400/15 text-cyan-100 ring-cyan-400/40"
                    : "bg-white/5 text-muted-foreground ring-white/10",
                )}
              >
                <img src={meta.icon} alt="" className="size-5 rounded-md object-cover" />
                {meta.short}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
