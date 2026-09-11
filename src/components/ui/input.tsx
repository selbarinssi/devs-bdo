import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 font-serif text-sm text-foreground outline-none backdrop-blur-md transition-[border-color,box-shadow]",
        "placeholder:text-muted-foreground/70",
        "focus-visible:border-cyan-400/50 focus-visible:ring-2 focus-visible:ring-cyan-400/20",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
