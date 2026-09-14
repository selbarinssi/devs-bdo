import { createServerFn } from "@tanstack/react-start";
import { env } from "@/lib/env.server";

export type ParseLootInput = {
  id: string;
  name: string;
};

export type ParseInventoryResult = {
  items: { id: string; name: string; qty: number | null }[];
  raw?: string;
};

type Body = {
  /** data URLs (image/png or image/jpeg) */
  images: string[];
  loots: ParseLootInput[];
};

function dataUrlToInline(dataUrl: string): { mime: string; data: string } | null {
  const m = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i.exec(dataUrl);
  if (!m) return null;
  const mime = m[1].toLowerCase() === "image/jpg" ? "image/jpeg" : m[1].toLowerCase();
  return { mime, data: m[2] };
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  // Strip markdown fences if present
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  // Find first [ or {
  const startArr = candidate.indexOf("[");
  const startObj = candidate.indexOf("{");
  let start = -1;
  if (startArr >= 0 && (startObj < 0 || startArr < startObj)) start = startArr;
  else if (startObj >= 0) start = startObj;
  if (start < 0) throw new Error("No JSON in model response");
  const slice = candidate.slice(start);
  return JSON.parse(slice);
}

export const parseInventoryWithGemini = createServerFn({ method: "POST" })
  .validator((data: Body) => data)
  .handler(async ({ data }): Promise<ParseInventoryResult> => {
    const apiKey = env("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Add it in Vercel → Settings → Environment Variables and redeploy.",
      );
    }

    const { images, loots } = data;
    if (!images?.length) throw new Error("At least one screenshot is required");
    if (!loots?.length) throw new Error("No loot items to match");

    const inlineParts: { inline_data: { mime_type: string; data: string } }[] = [];
    for (const url of images.slice(0, 2)) {
      const parsed = dataUrlToInline(url);
      if (!parsed) throw new Error("Invalid image data URL (expected png/jpeg/webp base64)");
      inlineParts.push({
        inline_data: { mime_type: parsed.mime, data: parsed.data },
      });
    }

    const lootList = loots
      .map((l, i) => `${i + 1}. id="${l.id}" name="${l.name}"`)
      .join("\n");

    const prompt = `You are analyzing Black Desert Online (BDO) inventory / enhancement inventory screenshots.

Your job: for each item in the LOOT LIST below, find it in the screenshot(s) and read its stack quantity (the white number on the item slot).

Rules:
- Only report items from the LOOT LIST (match by name / icon appearance).
- qty must be the integer stack count visible on that slot. If the item is present but no number is shown, qty is 1.
- If the item is not visible in any screenshot, qty must be null.
- Do not invent items that are not in the LOOT LIST.
- Ignore potions/food/gear that are not in the LOOT LIST.
- Prefer the enhancement inventory screenshot for enhancement materials when both are provided.

LOOT LIST:
${lootList}

Respond with ONLY a JSON array (no markdown, no commentary), one object per loot list item:
[{"id":"<exact id from list>","name":"<exact name>","qty":<number or null>}]
Include every loot list item exactly once.`;

    // gemini-2.0-flash is on the free tier and strong at UI screenshots
    const model = env("GEMINI_MODEL") || "gemini-2.0-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }, ...inlineParts],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(
        `Gemini API error ${res.status}: ${errText.slice(0, 300) || res.statusText}`,
      );
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      error?: { message?: string };
    };

    if (json.error?.message) {
      throw new Error(json.error.message);
    }

    const text =
      json.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    if (!text.trim()) throw new Error("Empty response from Gemini");

    let parsed: unknown;
    try {
      parsed = extractJson(text);
    } catch {
      throw new Error(`Could not parse Gemini JSON: ${text.slice(0, 200)}`);
    }

    const arr = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { items?: unknown })?.items)
        ? (parsed as { items: unknown[] }).items
        : null;

    if (!arr) throw new Error("Gemini response was not a JSON array");

    const byId = new Map<string, number | null>();
    const byName = new Map<string, number | null>();

    for (const row of arr) {
      if (!row || typeof row !== "object") continue;
      const r = row as { id?: unknown; name?: unknown; qty?: unknown };
      const id = typeof r.id === "string" ? r.id : "";
      const name = typeof r.name === "string" ? r.name.trim().toLowerCase() : "";
      let qty: number | null = null;
      if (typeof r.qty === "number" && Number.isFinite(r.qty) && r.qty >= 0) {
        qty = Math.round(r.qty);
      } else if (typeof r.qty === "string" && /^\d+$/.test(r.qty.trim())) {
        qty = parseInt(r.qty.trim(), 10);
      }
      if (id) byId.set(id, qty);
      if (name) byName.set(name, qty);
    }

    const items = loots.map((l) => {
      let qty: number | null = null;
      if (byId.has(l.id)) qty = byId.get(l.id) ?? null;
      else if (byName.has(l.name.trim().toLowerCase())) {
        qty = byName.get(l.name.trim().toLowerCase()) ?? null;
      }
      return { id: l.id, name: l.name, qty };
    });

    return { items, raw: text.slice(0, 500) };
  });
