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

export type VoiceChoice = "female1" | "female2";

type Settings = {
  enabled: boolean;
  leadMinutes: number;
  enabledBosses: BossId[];
  volume: number;
  voice: VoiceChoice;
};

const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  leadMinutes: 5,
  enabledBosses: Object.keys(BOSS_META) as BossId[],
  volume: 0.95,
  voice: "female1",
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

/** Pick the best matching female English voice for the chosen slot */
function pickFemaleVoice(choice: VoiceChoice): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const en = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));

  // Prefer clearly different female-leaning voices
  const preferA = [
    /zira/i,
    /aria/i,
    /jenny/i,
    /samantha/i,
    /karen/i,
    /susan/i,
    /female/i,
    /google.*english.*female/i,
  ];
  const preferB = [
    /moira/i,
    /tessa/i,
    /fiona/i,
    /victoria/i,
    /catherine/i,
    /hazel/i,
    /uk.*english/i,
    /australian/i,
  ];

  const score = (v: SpeechSynthesisVoice, prefs: RegExp[]) =>
    prefs.reduce((s, re) => (re.test(v.name) ? s + 2 : s), 0) +
    (v.lang.toLowerCase().includes("en-gb") ? 1 : 0) +
    (v.lang.toLowerCase().includes("en-au") ? 1 : 0);

  const rankedA = [...en].sort((a, b) => score(b, preferA) - score(a, preferA));
  const rankedB = [...en].sort((a, b) => score(b, preferB) - score(a, preferB));

  if (choice === "female1") {
    return rankedA[0] ?? en[0] ?? null;
  }
  // Voice B: force a different voice from A if possible
  const a = rankedA[0];
  const b = rankedB.find((v) => v.name !== a?.name) ?? rankedB[0] ?? en[1] ?? en[0];
  return b ?? null;
}

function speakBossName(name: string, volume: number, voiceChoice: VoiceChoice) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(name);
  u.volume = volume;
  u.rate = 0.95;
  u.pitch = 1.05;

  const voice = pickFemaleVoice(voiceChoice);
  if (voice) u.voice = voice;

  window.speechSynthesis.speak(u);
}

function extractBossList(msg: any): any[] {
  // boss_timers push
  if (Array.isArray(msg?.data?.bosses)) return msg.data.bosses;
  // connection_ack shapes
  if (Array.isArray(msg?.cached_data?.boss_timers?.bosses)) return msg.cached_data.boss_timers.bosses;
  if (Array.isArray(msg?.cached_data?.bosses)) return msg.cached_data.bosses;
  if (Array.isArray(msg?.bosses)) return msg.bosses;
  return [];
}

export function useBossTimers(region: "eu" | "na" = "eu") {
  const [bosses, setBosses] = useState<BossTimer[]>([]);
  const [connected, setConnected] = useState(false);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<"connecting" | "live" | "error">("connecting");
  const alertedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setSettingsState(loadSettings());
    // Chrome loads voices async
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
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
      setStatus("connecting");
      ws = new WebSocket(`wss://api.bdoalerts.net/ws?region=${region}`);

      ws.onopen = () => {
        setConnected(true);
        setStatus("live");
        pingTimer = window.setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 25000);
      };

      ws.onclose = () => {
        setConnected(false);
        setStatus("error");
        if (!closed) {
          reconnectTimer = window.setTimeout(connect, 4000);
        }
      };

      ws.onerror = () => {
        setStatus("error");
        ws?.close();
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "heartbeat" || msg.type === "pong") return;

          const list = extractBossList(msg);
          if (list.length === 0) return;

          const now = Date.now();
          const parsed: BossTimer[] = [];

          for (const b of list) {
            const rawName = b.boss_name || b.name || b.boss || "";
            const id = normalizeBossName(String(rawName));
            if (!id) continue;

            // Prefer time_until (always present in the API)
            let totalSec = 0;
            if (b.time_until && typeof b.time_until === "object") {
              const h = Number(b.time_until.hours) || 0;
              const m = Number(b.time_until.minutes) || 0;
              const s = Number(b.time_until.seconds) || 0;
              totalSec = h * 3600 + m * 60 + s;
            } else {
              // fallback: parse spawn timestamp
              const spawnRaw =
                b.spawn_time || b.spawnAt || b.spawn || b.time || b.next_spawn;
              const spawn = new Date(spawnRaw);
              if (Number.isNaN(spawn.getTime())) continue;
              totalSec = Math.max(0, Math.floor((spawn.getTime() - now) / 1000));
            }

            if (totalSec < 0) continue;

            const spawnAt = new Date(now + totalSec * 1000);

            parsed.push({
              id,
              name: BOSS_META[id].name,
              spawnAt,
              minutesLeft: Math.floor(totalSec / 60),
              secondsLeft: totalSec % 60,
            });
          }

          // de-dupe by id, keep soonest
          const byId = new Map<BossId, BossTimer>();
          for (const p of parsed) {
            const existing = byId.get(p.id);
            if (!existing || p.spawnAt < existing.spawnAt) byId.set(p.id, p);
          }

          const sorted = Array.from(byId.values()).sort(
            (a, b) => a.spawnAt.getTime() - b.spawnAt.getTime(),
          );
          setBosses(sorted);
        } catch {
          /* ignore bad packets */
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

  // Local countdown tick so the UI updates every second without waiting for WS
  useEffect(() => {
    const id = window.setInterval(() => {
      setBosses((prev) =>
        prev
          .map((b) => {
            const totalSec = Math.max(
              0,
              Math.floor((b.spawnAt.getTime() - Date.now()) / 1000),
            );
            return {
              ...b,
              minutesLeft: Math.floor(totalSec / 60),
              secondsLeft: totalSec % 60,
            };
          })
          .filter((b) => b.minutesLeft > 0 || b.secondsLeft > 0),
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Alert engine — speaks only the boss name
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
          const mins = settings.leadMinutes;
          const phrase =
            mins === 1
              ? `${BOSS_META[b.id].short} in 1 minute`
              : `${BOSS_META[b.id].short} in ${mins} minutes`;
          speakBossName(phrase, settings.volume, settings.voice);
        }
      }
    };

    const id = window.setInterval(tick, 10_000);
    tick();
    return () => clearInterval(id);
  }, [bosses, settings]);

  const testAlert = useCallback(() => {
  const mins = settings.leadMinutes;
  const phrase =
    mins === 1
      ? `Karanda in 1 minute`
      : `Karanda in ${mins} minutes`;
  speakBossName(phrase, settings.volume, settings.voice);
}, [settings.volume, settings.voice, settings.leadMinutes]);

  return {
    bosses,
    connected,
    status,
    settings,
    setSettings,
    testAlert,
  };
}
