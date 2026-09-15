const REGION = "eu"; // change to "eu" if needed
const LANG = "en";

export type ArshaPriceHit = {
  id: number;
  name: string;
  basePrice: number;
  sid?: number;
};

/** Search by name → pick best exact match → return base market price (pre-tax). */
export async function fetchMarketPriceByName(
  name: string,
): Promise<ArshaPriceHit | null> {
  const q = name.trim();
  if (!q) return null;

  // 1) Search
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
  // Response shape varies; normalize to array of { id, name, ... }
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

  // 2) SubList for prices
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
  // Usually [[ { name, id, sid, basePrice, ... }, ... ]]
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
