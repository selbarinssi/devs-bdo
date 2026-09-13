import { LogOut } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { discordProfile, useSupabaseUser } from "@/components/login-landing";
import { cn } from "@/lib/utils";

export function AuthPanel({ className }: { className?: string }) {
  const { user } = useSupabaseUser();

  if (!isSupabaseConfigured() || !user) return null;

  const { name, avatar } = discordProfile(user);

  const signOut = async () => {
    await getSupabase().auth.signOut();
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-2.5 ring-1 ring-white/10">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="size-7 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex size-7 items-center justify-center rounded-full bg-[#5865F2]/30 text-[0.65rem] font-bold text-[#c5caff]">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="max-w-[8rem] truncate text-xs font-semibold text-foreground sm:max-w-[12rem]">
          {name}
        </span>
      </div>
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
