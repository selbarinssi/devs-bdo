// src/components/boss-alert-provider.tsx
import { useBossTimers } from "@/lib/use-boss-timers";

/**
 * Keeps the EU boss WebSocket + voice alerts alive on every hub page.
 * Renders nothing — settings are still edited on /bosses (localStorage).
 */
export function BossAlertProvider() {
  useBossTimers("eu");
  return null;
}
