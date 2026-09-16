import { createFileRoute } from "@tanstack/react-router";

const REGION = "eu"; // you are on EU
const LANG = "en";

type ArshaPriceHit = {
  id: number;
  name: string;
  basePrice: number;
  sid?: number;
};

type CodexHit = {
  value: number;
  name: string;
  link_type?: string;
  object_type?: string;
};

/** Resolve item name → mainKey via BDO Codex autocomplete (clean JSON). */
async function resolveItemIdByName(
  name: string,
): Promise<{ id: number; name: string } | null> {
  const q = name.trim();
  if (!q) return null;

  const url = new URL("https://bdocodex.com/ac.php");
  url.searchParams.set("l", "us");
  url.searchParams.set("term", q);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;

  const raw = await res.text();
  // Codex sometimes prefixes a UTF-8 BOM
  const json = JSON.parse(raw.replace(/^\uFEFF/, "")) as CodexHit[];
  if (!Array.isArray(json) || !json.length) return null;

  const lower = q.toLowerCase();
  // Prefer exact name match on real items (not recipes/knowledge)
  const items = json.filter(
    (x) =>
      (x.link_type === "item" || x.object_type === "Item") &&
      Number.isFinite(Number(x.value)),
  );
  const pool = items.length ? items : json;
  const exact =
    pool.find((x) => String(x.name || "").toLowerCase() === lower) ?? pool[0];

  const id = Number(exact.value);
  if (!Number.isFinite(id) || id <= 0) return null;
  return { id, name: String(exact.name || q) };
}

async function fetchPriceById(
  id: number,
  fallbackName: string,
): Promise<ArshaPriceHit | null> {
  const subRes = await fetch(
    `https://api.arsha.io/v2/${REGION}/GetWorldMarketSubList?lang=${LANG}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([id]),
    },
  );
  if (!subRes.ok) return null;

  const subJson = await subRes.json();
  // V2 returns either [{...variants}] or a flat list of variants
  const variants: any[] = Array.isArray(subJson?.[0])
    ? subJson[0]
    : Array.isArray(subJson)
      ? subJson
      : [];

  const base =
    variants.find((v) => Number(v.sid) === 0) ?? variants[0] ?? null;
  if (!base) return null;

  const basePrice = Number(base.basePrice ?? base.lastSoldPrice ?? 0);
  if (!Number.isFinite(basePrice) || basePrice <= 0) return null;

  return {
    id,
    name: String(base.name || fallbackName),
    basePrice,
    sid: Number(base.sid) || 0,
  };
}

async function fetchFromArsha(
  name: string,
  idParam?: number | null,
): Promise<ArshaPriceHit | null> {
  let id = idParam && Number.isFinite(idParam) && idParam > 0 ? idParam : null;
  let resolvedName = name.trim();

  if (!id) {
    const resolved = await resolveItemIdByName(resolvedName);
    if (!resolved) return null;
    id = resolved.id;
    resolvedName = resolved.name;
  }

  return fetchPriceById(id, resolvedName);
}

export const Route = createFileRoute("/api/market-price")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const name = url.searchParams.get("name") ?? "";
        const idRaw = url.searchParams.get("id");
        const idParam = idRaw != null && idRaw !== "" ? Number(idRaw) : null;

        if (!name.trim() && !(idParam && idParam > 0)) {
          return Response.json(
            { error: "name or id required" },
            { status: 400 },
          );
        }

        try {
          const hit = await fetchFromArsha(name, idParam);
          if (!hit) {
            return Response.json({ error: "not found" }, { status: 404 });
          }
          return Response.json(hit);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "proxy failed";
          return Response.json({ error: msg }, { status: 502 });
        }
      },
    },
  },
});
