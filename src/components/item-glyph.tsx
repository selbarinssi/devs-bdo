import { useState } from "react";
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

/** Convert item display name → filename slug used in public/icons/ */
function toIconSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "") // Clown's → clowns, Grim Reaper's → grim_reapers
    .replace(/[\[\]]/g, "") // [Party] → party
    .replace(/[^a-z0-9]+/g, "_") // spaces, slashes, dashes → _
    .replace(/^_+|_+$/g, "") // trim
    .replace(/_+/g, "_"); // collapse
}

/**
 * Explicit aliases for ship materials whose icon filenames are abbreviated
 * and don't match the full item display name.
 */
const ICON_ALIASES: Record<string, string> = {
  // Blue / green gear sets
  "+10 epheria caravel blue gear set": "blue_gear",
  "+10 epheria galleass blue gear set": "blue_gear",
  "+10 caravel green gear set": "green_gear",
  "+10 galleass green gear set": "green_gear",

  // Materials (short filenames)
  "ruddy manganese nodule": "manganese",
  "enhanced island tree coated plywood": "plywood",
  "seaweed stalk": "seaweed",
  "great ocean dark iron": "dark_iron",
  "pure pearl crystal": "pearl_crystal",
  "moon scale plywood": "moon_scale",
  "tide-dyed standardized timber square": "tide_timber",
  "bright reef piece": "bright_reef",
  "cox pirates' artifact (combat)": "artifact_combat",
  "cox pirates artifact (combat)": "artifact_combat",
  "cox pirates' artifact (parley beginner)": "artifact_parley_beginner",
  "cox pirates artifact (parley beginner)": "artifact_parley_beginner",
  "cox pirates' artifact (parley expert)": "artifact_parley_expert",
  "cox pirates artifact (parley expert)": "artifact_parley_expert",
  "luminous cobalt ingot": "cobalt",
  "tidal black stones": "tidal_stone",
  "moon vein flax fabric": "flax_fabric",
  "deep tide-dyed standardized timber square": "deep_tide",
  "brilliant rock salt ingot": "rock_salt",
  "brilliant pearl shard": "brilliant_pearl",
  "tear of the ocean": "tear_ocean",

  // Final ships (no dedicated icon — fall through to letter)
};

function resolveIconSlug(name: string): string {
  const key = name.toLowerCase().replace(/['’]/g, "'");
  const alias = ICON_ALIASES[key] ?? ICON_ALIASES[key.replace(/'/g, "")];
  if (alias) return alias;
  return toIconSlug(name);
}

function LetterFallback({
  name,
  size,
  className,
}: {
  name: string;
  size: number;
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

export function ItemGlyph({
  name,
  size = 44,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const slug = resolveIconSlug(name);
  // Prefer .webp (most icons), fall back to .png
  const candidates = [`/icons/${slug}.webp`, `/icons/${slug}.png`];
  const [srcIndex, setSrcIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed || srcIndex >= candidates.length) {
    return <LetterFallback name={name} size={size} className={className} />;
  }

  return (
    <img
      src={candidates[srcIndex]}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      onError={() => {
        if (srcIndex + 1 < candidates.length) {
          setSrcIndex((i) => i + 1);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
