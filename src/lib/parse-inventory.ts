import { createServerFn } from "@tanstack/react-start";

export type ParseLootInput = {
  id: string;
  name: string;
};

export type ParseInventoryResult = {
  items: { id: string; name: string; qty: number | null }[];
};

type Body = {
  images: string[];
  loots: ParseLootInput[];
};

function dataUrlToInline(dataUrl: string): { mime: string; data: string } | null {
  const m = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i.exec(dataUrl);
  if (!m) return null;
  const mime = m[1].toLowerCase() === "image/jpg" ? "image/jpeg" : m[1].toLowerCase();
  return { mime, data: m[2] };
}

/** Parse full JSON, or salvage complete objects from a truncated array. */
function extractJsonArray(text: string): unknown[] {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidate = (fenced ? fenced[1] : trimmed).trim();

  const start = candidate.indexOf("[");
  if (start < 0) throw new Error("No JSON array in model response");
  candidate = candidate.slice(start);

  try {
    const full = JSON.parse(candidate);
    if (Array.isArray(full)) return full;
  } catch {
    /* try salvage */
  }

  // Truncated response: pull every complete {...} object we can
  const objects: unknown[] = [];
  const re = /\{[^{}]*\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(candidate)) !== null) {
    try {
      objects.push(JSON.parse(match[0]));
    } catch {
      /* skip broken fragment */
    }
  }
  if (objects.length) return objects;

  throw new Error(`Could not parse Gemini JSON: ${text.slice(0, 180)}`);
}

function validateBody(data: unknown): Body {
  if (!data || typeof data !== "object") throw new Error("Invalid request body");
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.images) || !d.images.every((x) => typeof x === "string")) {
    throw new Error("images must be string[]");
  }
  if (!Array.isArray(d.loots)) throw new Error("loots must be an array");
  const loots: ParseLootInput[] = [];
  for (const row of d.loots) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    if (typeof r.id !== "string" || typeof r.name !== "string") continue;
    loots.push({ id: r.id, name: r.name });
  }
  return { images: d.images as string[], loots };
}

/**
 * Server-only work lives inside the handler. The exported fn is a client-safe
 * RPC stub (safe to import from React components).
 */
export const parseInventoryWithGemini = createServerFn({ method: "POST" })
  .inputValidator(validateBody)
  .handler(async ({ data }): Promise<ParseInventoryResult> => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Add it in Vercel → Settings → Environment Variables and redeploy.",
      );
    }

    const { images, loots } = data;
    if (!images.length) throw new Error("At least one screenshot is required");
    if (!loots.length) throw new Error("No loot items to match");

    const inlineParts: { inline_data: { mime_type: string; data: string } }[] = [];
    for (const url of images.slice(0, 2)) {
      const parsed = dataUrlToInline(url);
      if (!parsed) throw new Error("Invalid image data URL (expected png/jpeg/webp base64)");
      inlineParts.push({
        inline_data: { mime_type: parsed.mime, data: parsed.data },
      });
    }

    // Compact list — model only needs id + name to match
    const lootList = loots.map((l) => `${l.id}|${l.name}`).join("\n");

    const prompt = `BDO inventory screenshot analysis.
For each LOOT line (format id|name), find that item in the image(s) and read its stack number (white digits on the slot).
Rules: qty = integer on slot, or 1 if present with no number, or null if not in image. Only these items. Ignore everything else.

LOOT:
${lootList}

Reply with a JSON array only, compact, no markdown:
[{"id":"...","qty":123},{"id":"...","qty":null}]
One entry per LOOT id.`;

    const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    let res: Response;
    try {
      res = await fetch(endpoint, {
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
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        }),
      });
    } catch (e) {
      throw new Error(
        `Could not reach Gemini: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      // If responseMimeType unsupported, retry without it once would be ideal;
      // surface the error clearly for now.
      throw new Error(
        `Gemini API error ${res.status}: ${errText.slice(0, 400) || res.statusText}`,
      );
    }

    const json = (await res.json()) as {
      candidates?: {
        content?: { parts?: { text?: string }[] };
        finishReason?: string;
      }[];
      error?: { message?: string };
    };

    if (json.error?.message) throw new Error(json.error.message);

    const text =
      json.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    if (!text.trim()) throw new Error("Empty response from Gemini");

    const arr = extractJsonArray(text);

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
      } else if (r.qty === null) {
        qty = null;
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

    return { items };
  });
