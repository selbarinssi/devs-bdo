import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-stone bg-ivory px-3.5 py-2 font-serif text-sm text-ink outline-none transition-[border-color,box-shadow] duration-150",
        "placeholder:text-muted",
        "focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/20",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
