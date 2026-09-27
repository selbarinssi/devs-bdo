import { createContext, useContext, type ReactNode } from "react";
import { useBossTimers } from "@/lib/use-boss-timers";

type BossTimersApi = ReturnType<typeof useBossTimers>;

const BossTimersContext = createContext<BossTimersApi | null>(null);

export function BossAlertProvider({ children }: { children?: ReactNode }) {
  const api = useBossTimers("eu");
  return (
    <BossTimersContext.Provider value={api}>
      {children ?? null}
    </BossTimersContext.Provider>
  );
}

export function useBossTimersContext(): BossTimersApi {
  const ctx = useContext(BossTimersContext);
  if (!ctx) {
    throw new Error("useBossTimersContext must be used under BossAlertProvider");
  }
  return ctx;
}
