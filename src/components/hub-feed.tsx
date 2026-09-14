import { ImagePlus, Loader2, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createFeedPost,
  deleteFeedPost,
  listFeedPosts,
  toggleReaction,
  validateFeedFile,
  type FeedPost,
} from "@/lib/feed-api";
import {
  listProfiles,
  setProfileRole,
  useHubProfile,
  type HubRole,
  type ProfileRow,
} from "@/lib/profile";
import { listHubEmojis, hubReactionToken, type HubEmoji, uploadHubEmoji } from "@/lib/hub-emojis";
import { fetchPreviewsForText, type LinkPreview } from "@/lib/link-preview";
import { cn } from "@/lib/utils";

const REACTION_EMOJIS = ["\ud83d\udd25", "\ud83d\ude02", "\ud83d\udc80", "\u2728", "\ud83e\udee1", "\ud83d\ude2d", "\ud83c\udfaf", "\ud83d\udc8e"] as const;

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function roleBadge(role: HubRole) {
  if (role === "admin") return "bg-rose-500/20 text-rose-200 ring-rose-400/40";
  if (role === "moderator") return "bg-amber-500/20 text-amber-100 ring-amber-400/35";
  return "bg-white/10 text-muted-foreground ring-white/10";
}

function renderPostBody(body: string, pack: HubEmoji[]) {
  const byName = new Map(pack.map((e) => [e.name, e]));
  const parts = body.split(/(:[a-z0-9_]+:)/gi);
  return parts.map((part, i) => {
    const m = part.match(/^:([a-z0-9_]+):$/i);
    if (m) {
      const em = byName.get(m[1]!.toLowerCase());
      if (em) {
        return (
          <img key={i} src={em.image_url} alt={em.name} title={`:${em.name}:`} className="inline-block size-6 align-text-bottom" />
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
}

function LinkPreviewCard({ p }: { p: LinkPreview }) {
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 flex overflow-hidden rounded-xl border border-white/10 bg-black/30 transition hover:border-cyan-400/30"
    >
      {p.image ? (
        <img src={p.image} alt="" className="h-24 w-28 shrink-0 object-cover sm:h-28 sm:w-36" />
      ) : (
        <div className="flex h-24 w-28 shrink-0 items-center justify-center bg-white/5 text-[0.65rem] text-muted-foreground sm:h-28 sm:w-36">
          Link
        </div>
      )}
      <div className="min-w-0 flex-1 p-2.5">
        {p.site && (
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-cyan-300/80">{p.site}</p>
        )}
        <p className="line-clamp-2 text-sm font-semibold text-foreground">{p.title || p.url}</p>
        {p.description && (
          <p className="mt-0.5 line-clamp-2 text-[0.7rem] text-muted-foreground">{p.description}</p>
        )}
      </div>
    </a>
  );
}

export function HubFeed() {
  const { user, profile, loading: profileLoading, isAdmin, isStaff } = useHubProfile();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [showRoles, setShowRoles] = useState(false);
  const [hubPack, setHubPack] = useState<HubEmoji[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [composePreviews, setComposePreviews] = useState<LinkPreview[]>([]);
  const [postPreviews, setPostPreviews] = useState<Record<string, LinkPreview[]>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      setPosts(await listFeedPosts());
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load feed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    listHubEmojis()
      .then(setHubPack)
      .catch(() => setHubPack([]));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchPreviewsForText(body).then(setComposePreviews);
    }, 500);
    return () => clearTimeout(t);
  }, [body]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map: Record<string, LinkPreview[]> = {};
      for (const post of posts) {
        if (!post.body) continue;
        map[post.id] = await fetchPreviewsForText(post.body);
      }
      if (!cancelled) setPostPreviews(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [posts]);

  useEffect(() => {
    if (!isAdmin || !showRoles) return;
    listProfiles()
      .then(setProfiles)
      .catch(() => setProfiles([]));
  }, [isAdmin, showRoles]);

  const onPickFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const next: File[] = [...files];
    for (const f of Array.from(list)) {
      if (next.length >= 4) {
        setError("Max 4 images per post");
        break;
      }
      const err = validateFeedFile(f);
      if (err) {
        setError(err);
        continue;
      }
      next.push(f);
    }
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const clearCompose = () => {
    setBody("");
    setFiles([]);
    previews.forEach((u) => URL.revokeObjectURL(u));
    setPreviews([]);
    setComposePreviews([]);
  };

  const onPost = async () => {
    if (!body.trim() && files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await createFeedPost(body, files);
      clearCompose();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Post failed");
    } finally {
      setBusy(false);
    }
  };

  const onReact = async (postId: string, emoji: string) => {
    try {
      await toggleReaction(postId, emoji);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reaction failed");
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      await deleteFeedPost(id);
      setPosts((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading Hub Feed…
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
          <button type="button" className="ml-2 underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </p>
      )}

      <div className="glass relative overflow-hidden p-4">
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex gap-3">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="size-11 shrink-0 rounded-full object-cover ring-2 ring-violet-400/30" />
          ) : (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-200">
              {(profile?.display_name || "?")[0]?.toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share a flex, meme, or chaos…"
              rows={3}
              maxLength={2000}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/30"
            />
            {composePreviews.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5">
                {composePreviews.map((pv) => (
                  <LinkPreviewCard key={pv.url} p={pv} />
                ))}
              </div>
            )}
            {showEmojiPicker && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-black/50 p-2">
                <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">Hub Emojis</p>
                <div className="flex flex-wrap gap-1.5">
                  {hubPack.length === 0 && (
                    <span className="text-xs text-muted-foreground">No pack yet — staff can upload below.</span>
                  )}
                  {hubPack.map((em) => (
                    <button
                      key={em.id}
                      type="button"
                      title={`:${em.name}:`}
                      className="rounded-lg bg-white/5 p-1.5 ring-1 ring-white/10 hover:bg-white/10"
                      onClick={() => {
                        setBody((b) => `${b}${b && !b.endsWith(" ") ? " " : ""}:${em.name}: `);
                        setShowEmojiPicker(false);
                      }}
                    >
                      <img src={em.image_url} alt={em.name} className="size-7" />
                    </button>
                  ))}
                </div>
                {isStaff && (
                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-[0.7rem] text-cyan-300/90">
                    <input
                      type="file"
                      accept="image/png,image/webp,image/gif,image/jpeg"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (!f) return;
                        const name = prompt("Emoji name (letters/numbers):");
                        if (!name) return;
                        try {
                          const em = await uploadHubEmoji(name, f);
                          setHubPack((p) => [...p, em].sort((a, b) => a.name.localeCompare(b.name)));
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Emoji upload failed");
                        }
                      }}
                    />
                    + Upload emoji (staff)
                  </label>
                )}
              </div>
            )}
            {previews.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {previews.map((src, i) => (
                  <div key={src} className="relative aspect-square overflow-hidden rounded-lg ring-1 ring-white/10">
                    <img src={src} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      className="absolute right-1 top-1 rounded bg-black/70 px-1.5 text-[0.65rem] text-white"
                      onClick={() => {
                        const nf = files.filter((_, j) => j !== i);
                        setFiles(nf);
                        URL.revokeObjectURL(previews[i]!);
                        setPreviews(nf.map((f) => URL.createObjectURL(f)));
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost flex h-9 items-center gap-1.5 px-2.5 text-xs">
                <ImagePlus className="size-3.5" /> Photo / GIF
              </button>
              <button type="button" onClick={() => setShowEmojiPicker((v) => !v)} className="btn-ghost flex h-9 items-center gap-1.5 px-2.5 text-xs">
                Emojis
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => {
                  onPickFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <span className="text-[0.65rem] text-muted-foreground">Max 4 · 2 MB · GIF ok</span>
              <button type="button" disabled={busy || (!body.trim() && files.length === 0)} onClick={onPost} className="btn-primary ml-auto h-9 px-4 text-sm">
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="glass p-3">
          <button type="button" onClick={() => setShowRoles((v) => !v)} className="btn-ghost flex h-9 w-full items-center justify-center gap-2 text-xs">
            <Users className="size-3.5" />
            {showRoles ? "Hide Roles" : "Manage Roles"}
          </button>
          {showRoles && (
            <ul className="mt-3 flex flex-col gap-2">
              {profiles.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.04] px-2.5 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="size-8 rounded-full object-cover" />
                    ) : (
                      <span className="flex size-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                        {(p.display_name || "?")[0]?.toUpperCase()}
                      </span>
                    )}
                    <span className="truncate text-sm font-medium">{p.display_name || p.id.slice(0, 8)}</span>
                    <span className={cn("rounded-md px-1.5 py-0.5 text-[0.6rem] font-semibold ring-1", roleBadge(p.role))}>{p.role}</span>
                  </div>
                  <select
                    className="field-select h-8 max-w-[8rem] text-xs"
                    value={p.role}
                    disabled={p.id === user?.id}
                    onChange={async (e) => {
                      const role = e.target.value as HubRole;
                      try {
                        const updated = await setProfileRole(p.id, role);
                        setProfiles((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Role update failed");
                      }
                    }}
                  >
                    <option value="member">Member</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {posts.map((post) => {
          const reactionCounts = new Map<string, number>();
          for (const r of post.reactions) {
            reactionCounts.set(r.emoji, (reactionCounts.get(r.emoji) || 0) + 1);
          }
          const mine = post.user_id === user?.id;
          return (
            <li key={post.id} className="glass group relative overflow-hidden p-4 transition hover:ring-1 hover:ring-violet-400/20">
              <div className="flex items-start gap-3">
                {post.author?.avatar_url ? (
                  <img src={post.author.avatar_url} alt="" className="size-11 shrink-0 rounded-full object-cover ring-2 ring-white/10" />
                ) : (
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-bold text-cyan-200">
                    {(post.author?.display_name || "?")[0]?.toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{post.author?.display_name || "Player"}</span>
                    {post.author?.role && post.author.role !== "member" && (
                      <span className={cn("rounded-md px-1.5 py-0.5 text-[0.6rem] font-bold uppercase ring-1", roleBadge(post.author.role))}>
                        {post.author.role}
                      </span>
                    )}
                    <span className="text-[0.7rem] text-muted-foreground">{timeAgo(post.created_at)}</span>
                    {(mine || isStaff) && (
                      <button type="button" onClick={() => onDelete(post.id)} className="ml-auto rounded p-1.5 text-muted-foreground opacity-0 transition hover:text-rose-300 group-hover:opacity-100" title="Delete">
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                  {post.body && (
                    <p className="mt-1.5 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-foreground/95">
                      {renderPostBody(post.body, hubPack)}
                    </p>
                  )}
                  {(postPreviews[post.id] ?? []).map((pv) => (
                    <LinkPreviewCard key={pv.url} p={pv} />
                  ))}
                  {post.images.length > 0 && (
                    <div className={cn("mt-3 grid gap-1.5 overflow-hidden rounded-xl ring-1 ring-white/10", post.images.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
                      {post.images.map((img) => (
                        <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="block">
                          <img src={img.url} alt="" className={cn("w-full object-cover", post.images.length === 1 ? "max-h-96" : "aspect-square")} />
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {REACTION_EMOJIS.map((emoji) => {
                      const count = reactionCounts.get(emoji) || 0;
                      const active = post.reactions.some((r) => r.user_id === user?.id && r.emoji === emoji);
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => onReact(post.id, emoji)}
                          className={cn(
                            "inline-flex h-8 items-center gap-1 rounded-full px-2 text-sm transition ring-1",
                            active ? "bg-violet-500/25 ring-violet-400/40" : "bg-white/[0.04] ring-white/10 hover:bg-white/[0.08]",
                          )}
                        >
                          <span>{emoji}</span>
                          {count > 0 && <span className="text-[0.65rem] font-semibold tabular-nums text-muted-foreground">{count}</span>}
                        </button>
                      );
                    })}
                    {hubPack.map((em) => {
                      const token = hubReactionToken(em.id);
                      const count = reactionCounts.get(token) || 0;
                      const active = post.reactions.some((r) => r.user_id === user?.id && r.emoji === token);
                      return (
                        <button
                          key={em.id}
                          type="button"
                          title={em.name}
                          onClick={() => onReact(post.id, token)}
                          className={cn(
                            "inline-flex h-8 items-center gap-1 rounded-full px-1.5 transition ring-1",
                            active ? "bg-violet-500/25 ring-violet-400/40" : "bg-white/[0.04] ring-white/10 hover:bg-white/[0.08]",
                          )}
                        >
                          <img src={em.image_url} alt={em.name} className="size-5" />
                          {count > 0 && <span className="pr-1 text-[0.65rem] font-semibold tabular-nums text-muted-foreground">{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
        {posts.length === 0 && !error && (
          <li className="glass py-16 text-center text-sm text-muted-foreground">Nothing here yet. Drop the first meme.</li>
        )}
      </ul>
    </div>
  );
}
