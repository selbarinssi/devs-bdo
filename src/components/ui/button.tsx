import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-serif font-semibold transition-[background-color,color,box-shadow,transform,border-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ivory disabled:pointer-events-none disabled:opacity-50 active:not-disabled:scale-[0.96]",
  {
    variants: {
      variant: {
        default: "bg-teal text-ivory shadow-[var(--shadow-border)] hover:bg-teal-deep",
        outline:
          "bg-paper text-teal border border-stone hover:border-teal hover:bg-ivory",
        ghost: "bg-transparent text-muted hover:text-ink hover:bg-stone/40",
        danger: "bg-transparent text-danger border border-danger/40 hover:bg-danger hover:text-ivory",
        tab: "bg-paper text-muted border border-stone hover:border-teal hover:text-ink hover:bg-ivory data-[active=true]:bg-teal data-[active=true]:text-ivory data-[active=true]:border-teal data-[active=true]:shadow-[0_4px_14px_rgba(32,89,92,0.30)]",
      },
      size: {
        default: "h-11 px-4 text-sm",
        sm: "h-9 px-3 text-sm",
        lg: "h-12 px-5 text-base",
        icon: "size-11",
        tab: "h-14 min-h-11 px-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
