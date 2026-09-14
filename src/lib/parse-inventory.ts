import { createServerFn } from "@tanstack/react-start";

export type ParseLootInput = {
  id: string;
  name: string;
  /** Optional tiny reference icon (data URL). Spot loot only — keeps matching accurate without full BDO catalog. */
  icon?: string | null;
};

export type ParseInventoryResult = {
  items: { id: string; name: string; qty: number | null }[];
};

type Body = {
  images: string[];
  loots: ParseLootInput[];
};

type InlinePart = { inline_data: { mime_type: string; data: string } };
type TextPart = { text: string };
type Part = TextPart | InlinePart;

const MAX_INV_IMAGES = 2;
const MAX_REF_ICONS = 20;

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
    const icon =
      typeof r.icon === "string" && r.icon.startsWith("data:image/") ? r.icon : null;
    loots.push({ id: r.id, name: r.name, icon });
  }
  return { images: d.images as string[], loots };
}

/**
 * Server-only work lives inside the handler. The exported fn is a client-safe
 * RPC stub (safe to import from React components).
 *
 * Strategy: inventory screenshot(s) + tiny reference icons for this spot's loot only.
 * Names alone are unreliable (BDO slots show icons, not text). Full catalog icons are not sent.
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

    const invParts: InlinePart[] = [];
    for (const url of images.slice(0, MAX_INV_IMAGES)) {
      const parsed = dataUrlToInline(url);
      if (!parsed) throw new Error("Invalid image data URL (expected png/jpeg/webp base64)");
      invParts.push({
        inline_data: { mime_type: parsed.mime, data: parsed.data },
      });
    }

    // Reference icons: small chips only, capped to control tokens
    const refLoots = loots.slice(0, 60);
    const refParts: Part[] = [];
    let iconCount = 0;
    for (let i = 0; i < refLoots.length; i++) {
      const l = refLoots[i];
      const label = `REF ${i + 1}: id=${l.id} | name=${l.name}`;
      if (l.icon && iconCount < MAX_REF_ICONS) {
        const parsed = dataUrlToInline(l.icon);
        if (parsed) {
          refParts.push({ text: `${label} (icon follows)` });
          refParts.push({
            inline_data: { mime_type: parsed.mime, data: parsed.data },
          });
          iconCount++;
          continue;
        }
      }
      refParts.push({ text: `${label} (no icon — match by name only if obvious, else null)` });
    }

    const promptHead = `Black Desert Online (BDO) inventory analysis.

CONTEXT:
- Inventory slots show ITEM ICONS + a stack number. Item names are usually NOT written on the slot.
- You are given REFERENCE icons/names for THIS grind spot's loot list only.
- Match inventory slots to those references by VISUAL similarity to the reference icons when provided.
- Ignore every other item in the bag (not in the reference list).

STACK NUMBERS:
- Small digits on the item slot (often bottom-right / corner of the icon).
- qty = that integer when readable.
- qty = 1 if the item is clearly present but no number is visible.
- qty = null if the item is not clearly present OR you are unsure (never guess).

IMAGES AFTER THIS TEXT:
1) REFERENCE section: labeled REF lines, each optionally followed by a tiny reference icon.
2) INVENTORY screenshot(s): normal bag and/or enhancement bag (up to 2).

RULES:
- Only return quantities for the given reference ids.
- If the same reference item appears in multiple inventory images, use the MAXIMUM stack count (do not sum unless stacks are clearly separate unrelated piles of the same id — prefer max).
- Never invent ids. Never include items not in the reference list.
- When icons look similar and you cannot tell them apart → null.
- Output JSON array only, no markdown, no commentary:
[{"id":"<exact id>","qty":123},{"id":"<exact id>","qty":null}]
- Exactly one object per reference id listed below.

REFERENCE LIST (id|name):
${refLoots.map((l) => `${l.id}|${l.name}`).join("\n")}
`;

    const promptTail = `
INVENTORY SCREENSHOT(S) follow. Analyze them against the references above.
Return the JSON array now.`;

    const parts: Part[] = [
      { text: promptHead },
      ...refParts,
      { text: promptTail },
      ...invParts,
    ];

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
              parts,
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
