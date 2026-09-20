// src/lib/use-boss-timers.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { BOSS_META, normalizeBossName, type BossId } from "@/data/world-bosses";

export type BossTimer = {
  id: BossId;
  name: string;
  spawnAt: Date;
  minutesLeft: number;
  secondsLeft: number;
};

type Settings = {
  enabled: boolean;
  leadMinutes: number; // e.g. 5
  enabledBosses: BossId[];
  volume: number; // 0-1
};

const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  leadMinutes: 5,
  enabledBosses: Object.keys(BOSS_META) as BossId[],
  volume: 0.9,
};

const STORAGE_KEY = "devs-hub-boss-alerts";

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function speak(text: string, volume: number) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.volume = volume;
  u.rate = 1.05;
  u.pitch = 1;
  // Prefer a clear English voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google")) ||
    voices.find((v) => v.lang.startsWith("en"));
  if (preferred) u.voice = preferred;
  window.speechSynthesis.speak(u);
}

export function useBossTimers(region: "eu" | "na" = "eu") {
  const [bosses, setBosses] = useState<BossTimer[]>([]);
  const [connected, setConnected] = useState(false);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const alertedRef = useRef<Set<string>>(new Set()); // key = bossId + spawn timestamp

  // load settings once
  useEffect(() => {
    setSettingsState(loadSettings());
  }, []);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  // WebSocket
  useEffect(() => {
    let ws: WebSocket | null = null;
    let pingTimer: number | undefined;
    let reconnectTimer: number | undefined;
    let closed = false;

    const connect = () => {
      ws = new WebSocket(`wss://api.bdoalerts.net/ws?region=${region}`);

      ws.onopen = () => {
        setConnected(true);
        pingTimer = window.setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 25000);
      };

      ws.onclose = () => {
        setConnected(false);
        if (!closed) {
          reconnectTimer = window.setTimeout(connect, 4000);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type !== "boss_timers" && msg.type !== "connection_ack") return;

          const list =
            msg.type === "connection_ack"
              ? msg.cached_data?.boss_timers?.bosses ?? msg.cached_data?.bosses
              : msg.data?.bosses;

          if (!Array.isArray(list)) return;

          const now = Date.now();
          const parsed: BossTimer[] = [];

          for (const b of list) {
            const id = normalizeBossName(b.boss_name || b.name || "");
            if (!id) continue;

            const spawn = new Date(b.spawn_time || b.spawnAt || b.time);
            if (Number.isNaN(spawn.getTime())) continue;

            const msLeft = spawn.getTime() - now;
            if (msLeft < -60_000) continue; // already passed

            const totalSec = Math.max(0, Math.floor(msLeft / 1000));
            parsed.push({
              id,
              name: BOSS_META[id].name,
              spawnAt: spawn,
              minutesLeft: Math.floor(totalSec / 60),
              secondsLeft: totalSec % 60,
            });
          }

          parsed.sort((a, b) => a.spawnAt.getTime() - b.spawnAt.getTime());
          setBosses(parsed);
        } catch {
          /* ignore */
        }
      };
    };

    connect();

    return () => {
      closed = true;
      if (pingTimer) clearInterval(pingTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [region]);

  // Alert engine
  useEffect(() => {
    if (!settings.enabled) return;

    const tick = () => {
      const now = Date.now();
      for (const b of bosses) {
        if (!settings.enabledBosses.includes(b.id)) continue;

        const msLeft = b.spawnAt.getTime() - now;
        const minLeft = msLeft / 60_000;
        const key = `${b.id}-${b.spawnAt.getTime()}`;

        if (minLeft <= settings.leadMinutes && minLeft > 0 && !alertedRef.current.has(key)) {
          alertedRef.current.add(key);
          const text =
            settings.leadMinutes === 1
              ? `${BOSS_META[b.id].short} in 1 minute`
              : `${BOSS_META[b.id].short} in ${settings.leadMinutes} minutes`;
          speak(text, settings.volume);
        }
      }
    };

    const id = window.setInterval(tick, 15_000);
    tick(); // immediate
    return () => clearInterval(id);
  }, [bosses, settings]);

  const testAlert = useCallback(() => {
    speak("Boss in 5 minutes", settings.volume);
  }, [settings.volume]);

  return {
    bosses,
    connected,
    settings,
    setSettings,
    testAlert,
  };
}
