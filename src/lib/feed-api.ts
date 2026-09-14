import { getSupabase } from "@/lib/supabase";
import type { ProfileRow } from "@/lib/profile";

export type FeedImage = {
  id: string;
  post_id: string;
  url: string;
  sort: number;
};

export type FeedReaction = {
  post_id: string;
  user_id: string;
  emoji: string;
};

export type FeedPost = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  images: FeedImage[];
  reactions: FeedReaction[];
  author: ProfileRow | null;
};

export async function listFeedPosts(limit = 40): Promise<FeedPost[]> {
  const sb = getSupabase();
  const { data: posts, error } = await sb
    .from("feed_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (!posts?.length) return [];

  const ids = posts.map((p) => p.id);
  const userIds = [...new Set(posts.map((p) => p.user_id))];

  const [{ data: images }, { data: reactions }, { data: profiles }] = await Promise.all([
    sb.from("feed_images").select("*").in("post_id", ids).order("sort"),
    sb.from("feed_reactions").select("*").in("post_id", ids),
    sb.from("profiles").select("*").in("id", userIds),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p as ProfileRow]));
  const imgsBy = new Map<string, FeedImage[]>();
  for (const img of images ?? []) {
    const list = imgsBy.get(img.post_id) ?? [];
    list.push(img as FeedImage);
    imgsBy.set(img.post_id, list);
  }
  const rxBy = new Map<string, FeedReaction[]>();
  for (const r of reactions ?? []) {
    const list = rxBy.get(r.post_id) ?? [];
    list.push(r as FeedReaction);
    rxBy.set(r.post_id, list);
  }

  return posts.map((p) => ({
    id: p.id,
    user_id: p.user_id,
    body: p.body ?? "",
    created_at: p.created_at,
    images: imgsBy.get(p.id) ?? [],
    reactions: rxBy.get(p.id) ?? [],
    author: profileMap.get(p.user_id) ?? null,
  }));
}

export async function createFeedPost(body: string, files: File[]): Promise<void> {
  const sb = getSupabase();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error("Sign in required");
  const uid = auth.user.id;

  const { data: post, error } = await sb
    .from("feed_posts")
    .insert({ user_id: uid, body: body.trim() })
    .select()
    .single();
  if (error) throw error;

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${uid}/${post.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await sb.storage.from("feed-media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });
    if (upErr) throw upErr;
    const { data: pub } = sb.storage.from("feed-media").getPublicUrl(path);
    const { error: imgErr } = await sb.from("feed_images").insert({
      post_id: post.id,
      url: pub.publicUrl,
      sort: i,
    });
    if (imgErr) throw imgErr;
  }
}

export async function deleteFeedPost(id: string): Promise<void> {
  const { error } = await getSupabase().from("feed_posts").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleReaction(postId: string, emoji: string): Promise<void> {
  const sb = getSupabase();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error("Sign in required");
  const uid = auth.user.id;

  const { data: existing } = await sb
    .from("feed_reactions")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", uid)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    const { error } = await sb
      .from("feed_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", uid)
      .eq("emoji", emoji);
    if (error) throw error;
  } else {
    const { error } = await sb.from("feed_reactions").insert({
      post_id: postId,
      user_id: uid,
      emoji,
    });
    if (error) throw error;
  }
}

const MAX_BYTES = 2 * 1024 * 1024;

export function validateFeedFile(file: File): string | null {
  const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type);
  if (!ok) return "Only JPG, PNG, WebP, or GIF";
  if (file.size > MAX_BYTES) return "Max 2 MB per file";
  return null;
}
