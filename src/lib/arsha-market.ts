export type ArshaPriceHit = {
  id: number;
  name: string;
  basePrice: number;
  sid?: number;
};

/** Browser-safe: calls your server proxy (no CORS). */
export async function fetchMarketPriceByName(
  name: string,
): Promise<ArshaPriceHit | null> {
  const q = name.trim();
  if (!q) return null;

  const res = await fetch(
    `/api/market-price?name=${encodeURIComponent(q)}`,
  );
  if (!res.ok) return null;

  const data = await res.json();
  if (!data?.basePrice) return null;

  return {
    id: Number(data.id),
    name: String(data.name || q),
    basePrice: Number(data.basePrice),
    sid: data.sid != null ? Number(data.sid) : 0,
  };
}
