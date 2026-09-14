import { getSupabase } from "@/lib/supabase";

export type HubEmoji = {
  id: string;
  name: string;
  image_url: string;
  created_at: string;
};

export async function listHubEmojis(): Promise<HubEmoji[]> {
  const { data, error } = await getSupabase()
    .from("hub_emojis")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message || "Failed to load emojis");
  return (data ?? []) as HubEmoji[];
}

export async function uploadHubEmoji(name: string, file: File): Promise<HubEmoji> {
  const sb = getSupabase();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error("Sign in required");
  const safe = name
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 32);
  if (!safe) throw new Error("Invalid emoji name");
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `${safe}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error: upErr } = await sb.storage.from("hub-emojis").upload(path, file, {
    cacheControl: "86400",
    upsert: false,
    contentType: file.type || "image/png",
  });
  if (upErr) throw new Error(upErr.message || "Upload failed");
  const { data: pub } = sb.storage.from("hub-emojis").getPublicUrl(path);
  const { data, error } = await sb
    .from("hub_emojis")
    .insert({
      name: safe,
      image_url: pub.publicUrl,
      created_by: auth.user.id,
    })
    .select()
    .single();
  if (error) throw new Error(error.message || "Save emoji failed");
  return data as HubEmoji;
}

export async function deleteHubEmoji(id: string): Promise<void> {
  const { error } = await getSupabase().from("hub_emojis").delete().eq("id", id);
  if (error) throw new Error(error.message || "Delete failed");
}

export function isHubReaction(token: string): boolean {
  return token.startsWith("hub:");
}

export function hubReactionId(token: string): string | null {
  return isHubReaction(token) ? token.slice(4) : null;
}

export function hubReactionToken(id: string): string {
  return `hub:${id}`;
}
