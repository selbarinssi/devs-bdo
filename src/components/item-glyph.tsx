import { cn } from "@/lib/utils";

const PALETTE = ["#20595C", "#163E40", "#4A7A6E", "#5C6B6B", "#8C4A44", "#6B4A3A"] as const;

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function letterFor(name: string): string {
  const cleaned = name.replace(/[^A-Za-z]/g, "");
  return (cleaned[0] || "?").toUpperCase();
}

function colorFor(name: string): string {
  if (/^Oil of /.test(name)) return "#20595C";
  if (/Blood/.test(name)) return "#8C4A44";
  if (/Elixir|Draught/.test(name)) return "#20595C";
  return PALETTE[hashName(name) % PALETTE.length];
}

export function ItemGlyph({
  name,
  size = 44,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const letter = letterFor(name);
  const color = colorFor(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <rect width="64" height="64" rx="10" fill="#F3EEE4" />
      <circle cx="32" cy="32" r="22" fill="none" stroke={color} strokeWidth="4" />
      <text
        x="32"
        y="40"
        fontFamily="Lora, Georgia, serif"
        fontSize="22"
        fontWeight="700"
        fill={color}
        textAnchor="middle"
      >
        {letter}
      </text>
    </svg>
  );
}
