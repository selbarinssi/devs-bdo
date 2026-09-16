import { createFileRoute } from "@tanstack/react-router";

const REGION = "eu"; // you are on EU
const LANG = "en";

type ArshaPriceHit = {
  id: number;
  name: string;
  basePrice: number;
  sid?: number;
};

async function fetchFromArsha(name: string): Promise<ArshaPriceHit | null> {
  const q = name.trim();
  if (!q) return null;

  // Search (no Content-Type needed for simple POST body on server)
  const searchRes = await fetch(
    `https://api.arsha.io/v2/${REGION}/GetWorldMarketSearchList?lang=${LANG}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(q),
    },
  );
  if (!searchRes.ok) return null;

  const searchJson = await searchRes.json();
  const list: any[] = Array.isArray(searchJson)
    ? searchJson
    : Array.isArray(searchJson?.result)
      ? searchJson.result
      : [];

  if (!list.length) return null;

  const lower = q.toLowerCase();
  const exact =
    list.find((x) => String(x.name || "").toLowerCase() === lower) ?? list[0];
  const id = Number(exact.id ?? exact.mainKey);
  if (!Number.isFinite(id)) return null;

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
    name: String(base.name || exact.name || q),
    basePrice,
    sid: Number(base.sid) || 0,
  };
}

export const Route = createFileRoute("/api/market-price")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const name = url.searchParams.get("name") ?? "";
        if (!name.trim()) {
          return Response.json({ error: "name required" }, { status: 400 });
        }
        try {
          const hit = await fetchFromArsha(name);
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
