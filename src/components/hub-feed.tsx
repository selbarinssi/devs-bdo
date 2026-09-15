import { ImagePlus, Loader2, SmilePlus, Sparkles, Trash2, Users } from "lucide-react";
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
import { listHubEmojis, deleteHubEmoji, hubReactionToken, type HubEmoji, uploadHubEmoji } from "@/lib/hub-emojis";
import { fetchPreviewsForText, type LinkPreview } from "@/lib/link-preview";
import { cn } from "@/lib/utils";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"] as const;

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
  if (role === "admin")
    return "bg-rose-500/25 text-rose-100 ring-1 ring-rose-400/50 shadow-[0_0_12px_rgba(244,63,94,0.25)]";
  if (role === "moderator")
    return "bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.2)]";
  return "bg-white/5 text-muted-foreground ring-1 ring-white/10";
}

const URL_IN_TEXT = /https?:\/\/[^\s<>\[\]()"']+/gi;

function stripPreviewedUrls(body: string, previews: LinkPreview[]): string {
  if (!previews.length) return body;
  const urls = new Set(previews.map((p) => p.url.replace(/[.,);:]+$/, "")));
  let out = body;
  for (const u of urls) out = out.split(u).join("");
  out = out.replace(URL_IN_TEXT, (match) => {
    const cleaned = match.replace(/[.,);:]+$/, "");
    for (const u of urls) if (cleaned === u || cleaned.startsWith(u)) return "";
    return match;
  });
  return out.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function renderPostBody(body: string, pack: HubEmoji[], previews: LinkPreview[] = []) {
  const text = stripPreviewedUrls(body, previews);
  if (!text) return null;
  const byName = new Map(pack.map((e) => [e.name, e]));
  const parts = text.split(/(:[a-z0-9_]+:)/gi);
  return parts.map((part, i) => {
    const m = part.match(/^:([a-z0-9_]+):$/i);
    if (m) {
      const em = byName.get(m[1]!.toLowerCase());
      if (em) {
        return (
          <img
            key={i}
            src={em.image_url}
            alt={em.name}
            title={`:${em.name}:`}
            className="inline-block size-6 align-text-bottom drop-shadow-[0_0_6px_rgba(34,211,238,0.35)]"
          />
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
      className="mt-3 flex max-w-full overflow-hidden rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-black/40 to-violet-500/10 shadow-[0_0_24px_rgba(34,211,238,0.08)] transition hover:border-cyan-400/45 hover:shadow-[0_0_28px_rgba(34,211,238,0.18)]"
    >
      {p.image ? (
        <img src={p.image} alt="" className="h-24 w-28 shrink-0 object-cover sm:h-28 sm:w-36" />
      ) : (
        <div className="flex h-24 w-28 shrink-0 items-center justify-center bg-cyan-500/10 hub-label text-cyan-300/80 sm:h-28 sm:w-36">
          Link
        </div>
      )}
      <div className="min-w-0 flex-1 p-3">
        {p.site && <p className="hub-label">{p.site}</p>}
        <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-foreground">{p.title || p.url}</p>
        {p.description && <p className="mt-1 line-clamp-2 hub-meta">{p.description}</p>}
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
  const [pickerPostId, setPickerPostId] = useState<string | null>(null);
  const [composePreviews, setComposePreviews] = useState<LinkPreview[]>([]);
  const [postPreviews, setPostPreviews] = useState<Record<string, LinkPreview[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      setPosts(await listFeedPosts());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load feed");
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
      await createFeedPost(body.trim(), files);
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
      <div className="flex items-center justify-center gap-2 py-24 hub-body text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-cyan-300" />
        <span className="neon-text">Loading Hub Feed…</span>
      </div>
    );
  }

  return (
    <div className="hub-narrow flex flex-col gap-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:gap-5">
      {error && (
        <p className="glass rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100">
          {error}
          <button type="button" className="ml-2 font-semibold underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </p>
      )}

      <div className="glass-strong relative overflow-hidden p-4 sm:p-5">
        <div className="relative mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-cyan-300" />
          <p className="hub-label neon-text">New Post</p>
        </div>

        <div className="relative flex gap-3">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="size-12 shrink-0 rounded-full object-cover ring-2 ring-cyan-400/40 shadow-[0_0_16px_rgba(34,211,238,0.25)]"
            />
          ) : (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/40 to-cyan-500/30 text-sm font-bold text-cyan-100 ring-2 ring-violet-400/30">
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
              className="w-full resize-none rounded-xl border border-cyan-400/20 bg-[rgba(4,10,20,0.55)] px-3.5 py-3 text-base leading-relaxed text-foreground placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50 sm:text-sm"
            />

            {showEmojiPicker && (
              <div className="glass mt-3 max-h-44 overflow-y-auto border border-white/10 p-3">
                <div className="flex flex-wrap gap-2">
                  {hubPack.length === 0 && (
                    <span className="text-xs text-muted-foreground">No pack yet — staff can upload below.</span>
                  )}
                  {hubPack.map((em) => (
                    <div key={em.id} className="relative">
                      <button
                        type="button"
                        title={`:${em.name}:`}
                        className="rounded-xl bg-white/5 p-1.5 ring-1 ring-white/15 transition hover:bg-cyan-400/15 hover:ring-cyan-400/40"
                        onClick={() => {
                          setBody((b) => `${b}${b && !b.endsWith(" ") ? " " : ""}:${em.name}: `);
                          setShowEmojiPicker(false);
                        }}
                      >
                        <img src={em.image_url} alt={em.name} className="size-8" />
                      </button>
                      {isStaff ? (
                        <button
                          type="button"
                          title={`Remove :${em.name}:`}
                          className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-rose-500/90 text-white shadow ring-1 ring-rose-300/50 hover:bg-rose-400"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm(`Remove emoji :${em.name}: from the pack?`)) return;
                            try {
                              await deleteHubEmoji(em.id);
                              setHubPack((p) => p.filter((x) => x.id !== em.id));
                            } catch (err) {
                              setError(err instanceof Error ? err.message : "Delete emoji failed");
                            }
                          }}
                        >
                          <Trash2 className="size-3" strokeWidth={2.5} />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
                {isStaff && (
                  <label className="btn-ghost mt-3 h-8 cursor-pointer text-xs text-cyan-200">
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
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {previews.map((src, i) => (
                  <div key={src} className="relative aspect-square overflow-hidden rounded-xl ring-1 ring-cyan-400/25">
                    <img src={src} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      className="absolute right-1.5 top-1.5 rounded-full bg-black/75 px-2 py-0.5 text-xs text-white"
                      onClick={() => {
                        const nf = files.filter((_, j) => j !== i);
                        setFiles(nf);
                        URL.revokeObjectURL(previews[i]!);
                        setPreviews(nf.map((f) => URL.createObjectURL(f)));
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" className="btn-ghost h-9 text-xs" onClick={() => setShowEmojiPicker((v) => !v)}>
                <SmilePlus className="size-4" /> Emoji
              </button>
              <button type="button" className="btn-ghost h-9 text-xs" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="size-4" /> Images
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onPickFiles(e.target.files)}
              />
              <button type="button" disabled={busy} onClick={() => void onPost()} className="btn-primary ml-auto h-9 px-4 text-xs">
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="glass p-3">
          <button type="button" className="btn-ghost h-8 text-xs" onClick={() => setShowRoles((v) => !v)}>
            <Users className="size-3.5" /> {showRoles ? "Hide" : "Manage"} roles
          </button>
          {showRoles && (
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {profiles.map((pr) => (
                <li key={pr.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate">{pr.display_name || pr.id}</span>
                  <select
                    className="field-select h-8 text-xs"
                    value={pr.role}
                    onChange={async (e) => {
                      try {
                        await setProfileRole(pr.id, e.target.value as HubRole);
                        setProfiles((p) =>
                          p.map((x) => (x.id === pr.id ? { ...x, role: e.target.value as HubRole } : x)),
                        );
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Role update failed");
                      }
                    }}
                  >
                    <option value="member">member</option>
                    <option value="moderator">moderator</option>
                    <option value="admin">admin</option>
                  </select>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {posts.map((post) => {
          const mine = user?.id === post.user_id;
          const rx = post.reactions ?? [];
          const counts = new Map<string, number>();
          for (const r of rx) counts.set(r.emoji, (counts.get(r.emoji) || 0) + 1);
          const mySet = new Set(rx.filter((r) => r.user_id === user?.id).map((r) => r.emoji));

          return (
            <li key={post.id} className="glass-strong group p-3 sm:p-4">
              <div className="relative flex items-start gap-3">
                {post.author?.avatar_url ? (
                  <img
                    src={post.author.avatar_url}
                    alt=""
                    className="size-11 shrink-0 rounded-full object-cover ring-2 ring-white/15"
                  />
                ) : (
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/25 to-violet-500/30 text-sm font-bold text-cyan-100 ring-1 ring-cyan-400/30">
                    {(post.author?.display_name || "?")[0]?.toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{post.author?.display_name || "Player"}</span>
                    {post.author?.role && post.author.role !== "member" && (
                      <span className={cn("metric-pill font-bold uppercase", roleBadge(post.author.role))}>
                        {post.author.role}
                      </span>
                    )}
                    <span className="hub-meta">{timeAgo(post.created_at)}</span>
                    {(mine || isStaff) && (
                      <button
                        type="button"
                        onClick={() => void onDelete(post.id)}
                        className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-300"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                  {post.body ? (
                    <p className="mt-2 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-foreground/95">
                      {renderPostBody(post.body, hubPack, postPreviews[post.id] ?? [])}
                    </p>
                  ) : null}
                  {(postPreviews[post.id] ?? []).map((pv) => (
                    <LinkPreviewCard key={pv.url} p={pv} />
                  ))}
                  {(post.images?.length ?? 0) > 0 && (
                    <div className={cn("mt-3 grid gap-2", post.images!.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
                      {post.images!.map((url) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl ring-1 ring-white/10">
                          <img src={url} alt="" className="max-h-80 w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {[...counts.entries()].map(([emoji, n]) => {
                      const active = mySet.has(emoji);
                      const isHub = emoji.startsWith("hub:");
                      const hubId = isHub ? emoji.slice(4) : null;
                      const hubEm = hubId ? hubPack.find((e) => e.id === hubId) : null;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => void onReact(post.id, emoji)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 transition",
                            active
                              ? "bg-cyan-400/20 text-cyan-100 ring-cyan-400/40"
                              : "bg-white/5 text-muted-foreground ring-white/10 hover:bg-white/10",
                          )}
                        >
                          {hubEm ? <img src={hubEm.image_url} alt="" className="size-4" /> : <span>{emoji}</span>}
                          <span>{n}</span>
                        </button>
                      );
                    })}
                    <div className="relative">
                      <button
                        type="button"
                        className="inline-flex size-7 items-center justify-center rounded-full bg-white/5 text-muted-foreground ring-1 ring-white/10 hover:bg-cyan-400/15"
                        onClick={() => setPickerPostId((id) => (id === post.id ? null : post.id))}
                      >
                        <SmilePlus className="size-4" />
                      </button>
                      {pickerPostId === post.id && (
                        <div className="absolute bottom-full left-0 z-50 mb-1 flex flex-wrap gap-1 rounded-xl border border-white/10 bg-[#0a0e1a]/95 p-1.5 backdrop-blur-xl">
                          {REACTION_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className="flex size-8 items-center justify-center rounded-lg text-sm hover:bg-cyan-400/15"
                              onClick={() => {
                                void onReact(post.id, emoji);
                                setPickerPostId(null);
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                          {hubPack.map((em) => (
                            <button
                              key={em.id}
                              type="button"
                              title={em.name}
                              className="flex size-8 items-center justify-center rounded-lg hover:bg-violet-400/15"
                              onClick={() => {
                                void onReact(post.id, hubReactionToken(em.id));
                                setPickerPostId(null);
                              }}
                            >
                              <img src={em.image_url} alt={em.name} className="size-5" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
        {posts.length === 0 && !error && (
          <li className="glass-strong px-6 py-16 text-center">
            <Sparkles className="mx-auto mb-3 size-8 text-cyan-300/80" />
            <p className="hub-body text-muted-foreground">Nothing here yet. Drop the first meme.</p>
          </li>
        )}
      </ul>
    </div>
  );
}
