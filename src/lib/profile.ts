import { useEffect, useState } from "react";
import { discordProfile, useSupabaseUser } from "@/components/login-landing";
import { getSupabase } from "@/lib/supabase";

export type HubRole = "member" | "moderator" | "admin";

export type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: HubRole;
  created_at: string;
  updated_at: string;
};

export function isStaffRole(role: HubRole | null | undefined): boolean {
  return role === "moderator" || role === "admin";
}

export function isAdminRole(role: HubRole | null | undefined): boolean {
  return role === "admin";
}

export async function ensureProfile(): Promise<ProfileRow | null> {
  const sb = getSupabase();
  const { data: auth } = await sb.auth.getUser();
  const user = auth.user;
  if (!user) return null;

  const { data: existing } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (existing) {
    const disc = discordProfile(user);
    const needs =
      (!existing.display_name && disc.name) ||
      (!existing.avatar_url && disc.avatar);
    if (needs) {
      const { data: updated } = await sb
        .from("profiles")
        .update({
          display_name: existing.display_name || disc.name,
          avatar_url: existing.avatar_url || disc.avatar,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();
      return (updated as ProfileRow) ?? (existing as ProfileRow);
    }
    return existing as ProfileRow;
  }

  const disc = discordProfile(user);
  const { data: created, error } = await sb
    .from("profiles")
    .insert({
      id: user.id,
      display_name: disc.name,
      avatar_url: disc.avatar,
      role: "member",
    })
    .select()
    .single();
  if (error) throw error;
  return created as ProfileRow;
}

export async function listProfiles(): Promise<ProfileRow[]> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("*")
    .order("display_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProfileRow[];
}

export async function setProfileRole(userId: string, role: HubRole): Promise<ProfileRow> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as ProfileRow;
}

export function useHubProfile() {
  const { user, loading: authLoading } = useSupabaseUser();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    ensureProfile()
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return {
    user,
    profile,
    loading: authLoading || loading,
    role: (profile?.role ?? "member") as HubRole,
    canEditCatalog: isStaffRole(profile?.role),
    isAdmin: isAdminRole(profile?.role),
    isStaff: isStaffRole(profile?.role),
    refresh: async () => {
      const p = await ensureProfile();
      setProfile(p);
      return p;
    },
  };
}
