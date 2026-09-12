import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

export function AuthPanel({ className }: { className?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    void getSupabase()
      .auth.getUser()
      .then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = getSupabase().auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured()) return null;

  const signOut = async () => {
    await getSupabase().auth.signOut();
    setOpen(false);
  };

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signin") {
        const { error } = await getSupabase().auth.signInWithPassword({ email, password });
        if (error) throw error;
        setOpen(false);
      } else {
        const { error } = await getSupabase().auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Check your email to confirm, then sign in.");
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  if (user) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="hidden max-w-[10rem] truncate text-[0.65rem] text-muted-foreground sm:inline">
          {user.email}
        </span>
        <button
          type="button"
          onClick={signOut}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/5 px-2.5 text-xs font-semibold text-muted-foreground ring-1 ring-white/10 hover:bg-white/10 hover:text-foreground"
          title="Sign Out"
        >
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-cyan-500/15 px-2.5 text-xs font-semibold text-cyan-200 ring-1 ring-cyan-400/30 hover:bg-cyan-500/25"
      >
        <LogIn className="size-3.5" />
        Sign In
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-white/10 bg-[#0b1220]/95 p-3 shadow-xl backdrop-blur-md">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300/90">
            <UserIcon className="size-3.5" />
            Cloud Sync
          </div>
          <p className="mb-3 text-[0.7rem] text-muted-foreground">
            Sign in to sync grind drafts, routines, voyage & alchemy across devices.
          </p>
          <div className="flex flex-col gap-2">
            <div>
              <Label className="text-[0.65rem]">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-sm"
                autoComplete="email"
              />
            </div>
            <div>
              <Label className="text-[0.65rem]">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 text-sm"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>
            {msg && <p className="text-[0.7rem] text-amber-200">{msg}</p>}
            <button
              type="button"
              disabled={busy || !email.trim() || password.length < 6}
              onClick={submit}
              className="btn-primary h-9 w-full text-xs"
            >
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
            <button
              type="button"
              className="text-[0.7rem] text-muted-foreground hover:text-cyan-300"
              onClick={() => {
                setMode((m) => (m === "signin" ? "signup" : "signin"));
                setMsg(null);
              }}
            >
              {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
