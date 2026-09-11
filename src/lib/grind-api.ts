import {
  getSupabase,
  type LootRow,
  type SessionLootRow,
  type SessionRow,
  type SpotRow,
} from "@/lib/supabase";

export async function listSpots(): Promise<SpotRow[]> {
  const { data, error } = await getSupabase()
    .from("spots")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createSpot(input: {
  name: string;
  monsters: string;
  territory: string;
  icon_url?: string | null;
  mode?: string | null;
}): Promise<SpotRow> {
  const { data, error } = await getSupabase()
    .from("spots")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSpot(id: string): Promise<void> {
  const { error } = await getSupabase().from("spots").delete().eq("id", id);
  if (error) throw error;
}

export async function listLoots(spotId: string): Promise<LootRow[]> {
  const { data, error } = await getSupabase()
    .from("loots")
    .select("*")
    .eq("spot_id", spotId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createLoot(input: {
  spot_id: string;
  name: string;
  kind: "market" | "npc";
  unit_price: number;
  icon_url?: string | null;
  market_item_id?: number | null;
}): Promise<LootRow> {
  const { data, error } = await getSupabase()
    .from("loots")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLootPrice(id: string, unit_price: number): Promise<void> {
  const { error } = await getSupabase().from("loots").update({ unit_price }).eq("id", id);
  if (error) throw error;
}

export async function deleteLoot(id: string): Promise<void> {
  const { error } = await getSupabase().from("loots").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadLootIcon(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await getSupabase().storage.from("loot-icons").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/png",
  });
  if (error) throw error;
  const { data } = getSupabase().storage.from("loot-icons").getPublicUrl(path);
  return data.publicUrl;
}

export async function listSessions(limit = 50): Promise<(SessionRow & { spots?: { name: string } | null })[]> {
  const { data, error } = await getSupabase()
    .from("sessions")
    .select("*, spots(name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function createSession(input: {
  spot_id: string;
  character_name: string;
  minutes: number;
  total_value: number;
  silver_per_hour: number;
  started_at?: string | null;
  lines: {
    loot_id: string | null;
    loot_name: string;
    unit_price: number;
    quantity: number;
    line_value: number;
  }[];
}): Promise<SessionRow> {
  const sb = getSupabase();
  const { data: session, error } = await sb
    .from("sessions")
    .insert({
      spot_id: input.spot_id,
      character_name: input.character_name,
      minutes: input.minutes,
      total_value: input.total_value,
      silver_per_hour: input.silver_per_hour,
      started_at: input.started_at ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  if (input.lines.length) {
    const { error: lineErr } = await sb.from("session_loots").insert(
      input.lines.map((l) => ({
        session_id: session.id,
        loot_id: l.loot_id,
        loot_name: l.loot_name,
        unit_price: l.unit_price,
        quantity: l.quantity,
        line_value: l.line_value,
      })),
    );
    if (lineErr) throw lineErr;
  }

  return session;
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await getSupabase().from("sessions").delete().eq("id", id);
  if (error) throw error;
}

export async function updateSession(
  id: string,
  patch: {
    character_name?: string;
    minutes?: number;
    total_value?: number;
    silver_per_hour?: number;
  },
): Promise<void> {
  const { error } = await getSupabase().from("sessions").update(patch).eq("id", id);
  if (error) throw error;
}

export async function updateSpot(
  id: string,
  patch: Partial<Pick<SpotRow, "name" | "monsters" | "territory" | "icon_url" | "mode">>,
): Promise<void> {
  const { error } = await getSupabase().from("spots").update(patch).eq("id", id);
  if (error) throw error;
}

export type { SessionLootRow };
