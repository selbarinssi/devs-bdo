import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel env, then redeploy.",
    );
  }
  if (!client) {
    client = createClient(url, anonKey);
  }
  return client;
}

export type SpotRow = {
  id: string;
  name: string;
  monsters: string;
  territory: string;
  created_at: string;
};

export type LootRow = {
  id: string;
  spot_id: string;
  name: string;
  kind: "market" | "npc";
  unit_price: number;
  icon_url: string | null;
  market_item_id: number | null;
  created_at: string;
};

export type SessionRow = {
  id: string;
  spot_id: string;
  character_name: string;
  minutes: number;
  total_value: number;
  silver_per_hour: number;
  started_at: string | null;
  created_at: string;
};

export type SessionLootRow = {
  id: string;
  session_id: string;
  loot_id: string | null;
  loot_name: string;
  unit_price: number;
  quantity: number;
  line_value: number;
};
