import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { readStorage, writeStorage } from "@/lib/storage";
import type { User } from "@supabase/supabase-js";

export async function getSessionUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await getSupabase().auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function loadUserState<T>(key: string, fallback: T): Promise<T> {
  const user = await getSessionUser();
  if (!user) return readStorage(key, fallback);
  try {
    const { data, error } = await getSupabase()
      .from("user_state")
      .select("value")
      .eq("user_id", user.id)
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    if (data?.value != null) {
      writeStorage(key, data.value as T);
      return data.value as T;
    }
    const local = readStorage<T | null>(key, null as T | null);
    if (local != null) {
      await saveUserState(key, local as T);
      return local as T;
    }
    return fallback;
  } catch {
    return readStorage(key, fallback);
  }
}

export async function saveUserState<T>(key: string, value: T): Promise<void> {
  writeStorage(key, value);
  const user = await getSessionUser();
  if (!user) return;
  try {
    await getSupabase().from("user_state").upsert(
      {
        user_id: user.id,
        key,
        value: value as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,key" },
    );
  } catch {
    /* keep local */
  }
}

/** Cloud-only load: no localStorage. Requires signed-in user. */
export async function loadCloudStateOnly<T>(key: string, fallback: T): Promise<T> {
  const user = await getSessionUser();
  if (!user) return fallback;
  try {
    const { data, error } = await getSupabase()
      .from("user_state")
      .select("value")
      .eq("user_id", user.id)
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    if (data?.value != null) return data.value as T;
    return fallback;
  } catch {
    return fallback;
  }
}

/** Cloud-only save: no localStorage. */
export async function saveCloudStateOnly<T>(key: string, value: T): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Sign in required");
  const { error } = await getSupabase().from("user_state").upsert(
    {
      user_id: user.id,
      key,
      value: value as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,key" },
  );
  if (error) throw new Error(error.message || "Cloud save failed");
}

function hasLocal(key: string) {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(key) != null;
  } catch {
    return false;
  }
}

/** localStorage + Supabase cloud when signed in. Debounces cloud writes. */
export function useCloudStorage<T>(key: string, initial: T) {
  const [value, setValueState] = useState<T>(() => readStorage(key, initial));
  const [hydrated, setHydrated] = useState(() => hasLocal(key));
  const [userId, setUserId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getSessionUser();
      if (cancelled) return;
      setUserId(user?.id ?? null);
      const v = await loadUserState(key, initial);
      if (cancelled) return;
      setValueState(v);
      setHydrated(true);
    })();

    if (!isSupabaseConfigured()) return;
    const { data: sub } = getSupabase().auth.onAuthStateChange(async () => {
      const user = await getSessionUser();
      setUserId(user?.id ?? null);
      const v = await loadUserState(key, initial);
      setValueState(v);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValueState((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        latest.current = resolved;
        writeStorage(key, resolved);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          void saveUserState(key, latest.current);
        }, 400);
        return resolved;
      });
    },
    [key],
  );

  return { value, setValue, hydrated, userId, cloud: Boolean(userId) };
}

/**
 * Account-scoped state only (Supabase user_state). No localStorage.
 * Use for data that must be identical across browsers for the same Discord account.
 */
export function useCloudOnlyStorage<T>(key: string, initial: T) {
  const [value, setValueState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await getSessionUser();
        if (cancelled) return;
        setUserId(user?.id ?? null);
        if (!user) {
          setValueState(initial);
          setHydrated(true);
          return;
        }
        const v = await loadCloudStateOnly(key, initial);
        if (cancelled) return;
        setValueState(v);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    if (!isSupabaseConfigured()) return;
    const { data: sub } = getSupabase().auth.onAuthStateChange(async () => {
      const user = await getSessionUser();
      setUserId(user?.id ?? null);
      if (!user) {
        setValueState(initial);
        setHydrated(true);
        return;
      }
      const v = await loadCloudStateOnly(key, initial);
      setValueState(v);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValueState((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        latest.current = resolved;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          void saveCloudStateOnly(key, latest.current).catch((e) => {
            setError(e instanceof Error ? e.message : "Cloud save failed");
          });
        }, 400);
        return resolved;
      });
    },
    [key],
  );

  return { value, setValue, hydrated, error, userId, cloud: Boolean(userId) };
}
