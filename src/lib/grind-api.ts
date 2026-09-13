import {
  getSupabase,
  type LootRow,
  type SessionLootRow,
  type SessionRow,
  type SpotRow,
} from "@/lib/supabase";

async function requireUserId(): Promise<string> {
  const { data, error } = await getSupabase().auth.getUser();
  if (error) throw new Error(error.message || "Auth check failed");
  if (!data.user) throw new Error("Sign in required — open the app and log in with Discord again");
  return data.user.id;
}

/** DB columns are bigint — never send floats */
function asInt(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

export async function listSpots(): Promise<SpotRow[]> {
  const { data, error } = await getSupabase()
    .from("spots")
    .select("*")
    .order("territory")
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
  const sb = getSupabase();
  let uid: string | null = null;
  try {
    uid = await requireUserId();
  } catch {
    /* shared spots may allow insert without user_id */
  }
  const payload = {
    name: input.name,
    monsters: input.monsters,
    territory: input.territory,
    icon_url: input.icon_url ?? null,
    mode: input.mode ?? "pve",
    ...(uid ? { user_id: uid } : {}),
  };
  const { data, error } = await sb.from("spots").insert(payload).select().single();
  if (error) throw new Error(error.message || "Create spot failed");
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
    .insert({
      ...input,
      unit_price: asInt(input.unit_price),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLootPrice(id: string, unit_price: number): Promise<void> {
  const { error } = await getSupabase()
    .from("loots")
    .update({ unit_price: asInt(unit_price) })
    .eq("id", id);
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

export async function listSessionLoots(sessionId: string): Promise<SessionLootRow[]> {
  const { data, error } = await getSupabase()
    .from("session_loots")
    .select("*")
    .eq("session_id", sessionId);
  if (error) throw error;
  return data ?? [];
}

export async function listSessions(
  limit = 50,
): Promise<(SessionRow & { spots?: { name: string } | null })[]> {
  const uid = await requireUserId();
  const { data, error } = await getSupabase()
    .from("sessions")
    .select("*, spots(name)")
    .eq("user_id", uid)
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
  drop_rate?: number | null;
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
  const uid = await requireUserId();
  const { data: session, error } = await sb
    .from("sessions")
    .insert({
      spot_id: input.spot_id,
      character_name: input.character_name,
      minutes: asInt(input.minutes),
      total_value: asInt(input.total_value),
      silver_per_hour: asInt(input.silver_per_hour),
      drop_rate: input.drop_rate != null && Number.isFinite(input.drop_rate) ? input.drop_rate : null,
      started_at: input.started_at ?? null,
      user_id: uid,
    })
    .select()
    .single();
  if (error) {
    throw new Error(error.message || "Session insert failed");
  }

  if (input.lines.length) {
    const { error: lineErr } = await sb.from("session_loots").insert(
      input.lines.map((l) => ({
        session_id: session.id,
        loot_id: l.loot_id,
        loot_name: l.loot_name,
        unit_price: asInt(l.unit_price),
        quantity: asInt(l.quantity),
        line_value: asInt(l.line_value),
      })),
    );
    if (lineErr) {
      throw new Error(lineErr.message || "Session loot lines failed");
    }
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
  const body: Record<string, unknown> = { ...patch };
  if (patch.minutes != null) body.minutes = asInt(patch.minutes);
  if (patch.total_value != null) body.total_value = asInt(patch.total_value);
  if (patch.silver_per_hour != null) body.silver_per_hour = asInt(patch.silver_per_hour);
  const { error } = await getSupabase().from("sessions").update(body).eq("id", id);
  if (error) throw error;
}

export async function updateSpot(
  id: string,
  patch: Partial<Pick<SpotRow, "name" | "monsters" | "territory" | "icon_url" | "mode">>,
): Promise<SpotRow> {
  const { data, error } = await getSupabase()
    .from("spots")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLoot(
  id: string,
  patch: {
    name?: string;
    kind?: "market" | "npc";
    unit_price?: number;
    icon_url?: string | null;
  },
): Promise<LootRow> {
  const body = {
    ...patch,
    ...(patch.unit_price != null ? { unit_price: asInt(patch.unit_price) } : {}),
  };
  const { data, error } = await getSupabase()
    .from("loots")
    .update(body)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function findIconByLootName(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const { data, error } = await getSupabase()
    .from("loots")
    .select("icon_url")
    .ilike("name", trimmed)
    .not("icon_url", "is", null)
    .limit(1);
  if (error) return null;
  return data?.[0]?.icon_url ?? null;
}

export type { SessionLootRow };
