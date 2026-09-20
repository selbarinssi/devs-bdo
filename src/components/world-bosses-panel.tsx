// src/components/world-bosses-panel.tsx
import { useState } from "react";
import { ChevronDown, ChevronUp, Volume2, VolumeX, Wifi, WifiOff } from "lucide-react";
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

export function WorldBossesPanel() {
  const { bosses, connected, status, settings, setSettings, testAlert } =
    useBossTimers("eu");
  const [activeIndex, setActiveIndex] = useState(0);

  // clamp when list shrinks
  const safeIndex = Math.min(activeIndex, Math.max(0, bosses.length - 1));
  const active = bosses[safeIndex] ?? null;

  const goPrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const goNext = () => setActiveIndex((i) => Math.min(bosses.length - 1, i + 1));

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
            {connected ? "Live EU" : status === "connecting" ? "Connecting…" : "Offline"}
          </div>
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

      {/* Vertical card stack */}
      <div className="mx-auto w-full max-w-md">
        {bosses.length === 0 ? (
          <div className="hub-empty">
            {status === "connecting"
              ? "Connecting to EU timers…"
              : status === "error"
                ? "Could not reach the timer feed. Retrying…"
                : "No upcoming bosses in the current window."}
          </div>
        ) : (
          <div className="relative flex flex-col items-center">
            {/* Up / Down nav */}
            <div className="mb-3 flex items-center gap-3">
              <button
                type="button"
                onClick={goPrev}
                disabled={safeIndex === 0}
                className="btn-ghost h-9 w-9 disabled:opacity-30"
                aria-label="Previous boss"
              >
                <ChevronUp className="size-4" />
              </button>
              <span className="hub-meta tabular-nums">
                {safeIndex + 1} / {bosses.length}
              </span>
              <button
                type="button"
                onClick={goNext}
                disabled={safeIndex >= bosses.length - 1}
                className="btn-ghost h-9 w-9 disabled:opacity-30"
                aria-label="Next boss"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>

            {/* Stack */}
            <div className="relative h-[340px] w-full">
              {bosses.map((b, i) => {
                const offset = i - safeIndex;
                const isActive = i === safeIndex;
                const meta = BOSS_META[b.id];
                const urgent = b.minutesLeft < settings.leadMinutes;

                // only render nearby cards for performance
                if (Math.abs(offset) > 3) return null;

                return (
                  <button
                    key={`${b.id}-${b.spawnAt.getTime()}`}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className={cn(
                      "absolute left-0 right-0 mx-auto w-[92%] origin-top transition-all duration-300 ease-out",
                      isActive ? "z-20 cursor-default" : "z-10 cursor-pointer",
                    )}
                    style={{
                      top: `${Math.max(0, offset) * 18}px`,
                      transform: `
                        translateY(${offset < 0 ? offset * 12 : 0}px)
                        scale(${isActive ? 1 : 1 - Math.abs(offset) * 0.04})
                      `,
                      opacity: Math.abs(offset) > 2 ? 0.25 : 1 - Math.abs(offset) * 0.18,
                      pointerEvents: Math.abs(offset) > 2 ? "none" : "auto",
                    }}
                  >
                    <div
                      className={cn(
                        "glass overflow-hidden rounded-2xl p-5 text-left transition-shadow",
                        isActive && urgent && "ring-1 ring-cyan-400/50 shadow-[0_0_32px_rgba(34,211,238,0.22)]",
                        isActive && !urgent && "ring-1 ring-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.45)]",
                      )}
                    >
                      {/* Portrait */}
                      <div
                        className="relative mx-auto mb-4 aspect-[3/4] w-full max-w-[200px] overflow-hidden rounded-xl ring-1 ring-white/10"
                        style={{ boxShadow: `0 0 28px ${meta.color}40` }}
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
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(to top, ${meta.color}55 0%, transparent 55%)`,
                          }}
                        />
                        <div className="absolute bottom-2 left-0 right-0 text-center">
                          <p
                            className="text-sm font-bold tracking-wide drop-shadow"
                            style={{ color: meta.color }}
                          >
                            {meta.short}
                          </p>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="hub-title">{meta.name}</p>
                        <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-cyan-200">
                          {formatCountdown(b.minutesLeft, b.secondsLeft)}
                        </p>
                        <p className="hub-meta mt-1">
                          {b.spawnAt.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Boss filter */}
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
                    ? "bg-cyan-400/15 text-cyan-100 ring-cyan-400/40"
                    : "bg-white/5 text-muted-foreground ring-white/10",
                )}
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
