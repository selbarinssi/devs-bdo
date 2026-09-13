import { ImagePlus, Loader2, X, Upload, Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createWorker, type Worker } from "tesseract.js";
import { Input } from "@/components/ui/input";
import type { LootRow } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export type QtyMode = "override" | "add";

export type DetectionRow = {
  lootId: string;
  name: string;
  iconUrl: string | null;
  detectedQty: number | null;
  mode: QtyMode;
  ignore: boolean;
  confidence: number | null;
  editQty: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  loots: LootRow[];
  currentQty: Record<string, string>;
  onApply: (nextQty: Record<string, string>) => void;
};

type Step = "upload" | "processing" | "review";

type DigitHit = { value: number; cx: number; cy: number };
type IconHit = { lootId: string; score: number; cx: number; cy: number; size: number };

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 80)}`));
    img.src = src;
  });
}

function toGray(img: CanvasImageSource, w: number, h: number): ImageData {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = d[i + 1] = d[i + 2] = g;
  }
  return data;
}

/** Build a high-contrast image optimized for white BDO stack numbers. */
function makeOcrCanvas(img: HTMLImageElement, maxSide = 1200): HTMLCanvasElement {
  const scale =
    Math.max(img.naturalWidth, img.naturalHeight) > maxSide
      ? maxSide / Math.max(img.naturalWidth, img.naturalHeight)
      : 1;
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);

  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);

  const data = ctx.getImageData(0, 0, w, h);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    // Aggressive: keep only bright pixels (stack numbers are white/near-white)
    const v = g > 160 ? 255 : 0;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  return c;
}

/**
 * Full-image OCR: find every digit group and its center position.
 * This is much more reliable than tiny per-slot crops for BDO numbers.
 */
async function findAllDigits(worker: Worker, img: HTMLImageElement): Promise<DigitHit[]> {
  const canvas = makeOcrCanvas(img);
  const scaleX = img.naturalWidth / canvas.width;
  const scaleY = img.naturalHeight / canvas.height;

  // Try two page-seg modes and merge results
  const modes = ["6", "11"]; // uniform block, sparse text
  const hits: DigitHit[] = [];
  const seen = new Set<string>();

  for (const psm of modes) {
    try {
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789",
        tessedit_pageseg_mode: psm as unknown as string,
      });
      const {
        data: { words },
      } = await worker.recognize(canvas);

      for (const w of words || []) {
        const raw = (w.text || "").replace(/\s/g, "");
        if (!/^\d+$/.test(raw)) continue;
        const value = parseInt(raw, 10);
        if (!Number.isFinite(value) || value <= 0) continue;

        const bbox = w.bbox;
        if (!bbox) continue;
        const cx = ((bbox.x0 + bbox.x1) / 2) * scaleX;
        const cy = ((bbox.y0 + bbox.y1) / 2) * scaleY;

        // Dedup near-identical detections
        const key = `${value}:${Math.round(cx / 8)}:${Math.round(cy / 8)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push({ value, cx, cy });
      }
    } catch {
      /* mode failed */
    }
  }

  return hits;
}

function findSlotSize(w: number, h: number): number {
  // Prefer sizes that tile cleanly into ~8 columns
  let best = 48;
  let bestScore = -Infinity;
  for (let s = 30; s <= 70; s++) {
    const cols = Math.round(w / s);
    if (cols < 4 || cols > 12) continue;
    const xErr = Math.abs(w - cols * s) / w;
    const colBonus = 1 - Math.abs(cols - 8) / 8;
    const score = (1 - xErr) * 0.6 + colBonus * 0.4;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}

function scoreIconMatch(
  gray: ImageData,
  sx: number,
  sy: number,
  size: number,
  iconImg: HTMLImageElement,
): number {
  const inset = Math.max(2, Math.floor(size * 0.18));
  const inner = size - inset * 2;
  if (inner < 8) return 0;

  const iconGray = toGray(iconImg, inner, inner);
  const tData = iconGray.data;
  const sData = gray.data;
  const sw = gray.width;

  let sumDiff = 0;
  const pixels = inner * inner;
  for (let ty = 0; ty < inner; ty++) {
    const sRow = ((sy + inset + ty) * sw + (sx + inset)) * 4;
    const tRow = ty * inner * 4;
    for (let tx = 0; tx < inner; tx++) {
      sumDiff += Math.abs(sData[sRow + tx * 4] - tData[tRow + tx * 4]);
    }
  }
  return 1 - sumDiff / (pixels * 255);
}

function regionBrightness(gray: ImageData, x: number, y: number, size: number): number {
  const { width: sw, data, height: sh } = gray;
  let sum = 0;
  let n = 0;
  const x2 = Math.min(sw, x + size);
  const y2 = Math.min(sh, y + size);
  for (let py = Math.max(0, y); py < y2; py++) {
    for (let px = Math.max(0, x); px < x2; px++) {
      sum += data[(py * sw + px) * 4];
      n++;
    }
  }
  return n ? sum / n : 0;
}

/** Scan grid and score every slot against every loot icon. */
function findIconHits(
  gray: ImageData,
  scale: number,
  lootIcons: { loot: LootRow; img: HTMLImageElement }[],
): IconHit[] {
  const w = gray.width;
  const h = gray.height;
  const size = findSlotSize(w, h);
  const cols = Math.round(w / size);
  const rows = Math.round(h / size);
  const originX = Math.floor((w - cols * size) / 2);
  const originY = Math.floor((h - rows * size) / 2);

  const hits: IconHit[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = originX + c * size;
      const y = originY + r * size;
      if (regionBrightness(gray, x, y, size) < 15) continue;

      let bestLoot: string | null = null;
      let bestScore = 0;
      for (const { loot, img } of lootIcons) {
        const s = scoreIconMatch(gray, x, y, size, img);
        if (s > bestScore) {
          bestScore = s;
          bestLoot = loot.id;
        }
      }

      if (bestLoot && bestScore >= 0.42) {
        hits.push({
          lootId: bestLoot,
          score: bestScore,
          cx: ((x + size / 2) / scale),
          cy: ((y + size / 2) / scale),
          size: size / scale,
        });
      }
    }
  }

  return hits;
}

/**
 * Assign digit hits to icon hits by proximity.
 * Stack numbers sit in the bottom-right of a slot, so prefer digits
 * that are slightly down-right of the icon center.
 */
function assignDigitsToIcons(
  icons: IconHit[],
  digits: DigitHit[],
): Map<string, { qty: number; conf: number }> {
  // Best icon per loot first
  const byLoot = new Map<string, IconHit>();
  const sorted = [...icons].sort((a, b) => b.score - a.score);
  for (const hit of sorted) {
    if (!byLoot.has(hit.lootId)) byLoot.set(hit.lootId, hit);
  }

  const result = new Map<string, { qty: number; conf: number }>();
  const usedDigits = new Set<number>();

  for (const [lootId, icon] of byLoot) {
    let bestDigit: DigitHit | null = null;
    let bestDist = Infinity;

    for (let i = 0; i < digits.length; i++) {
      if (usedDigits.has(i)) continue;
      const d = digits[i];

      // Expected digit position: bottom-right of the slot
      const expectedX = icon.cx + icon.size * 0.15;
      const expectedY = icon.cy + icon.size * 0.25;
      const dist = Math.hypot(d.cx - expectedX, d.cy - expectedY);

      // Must be reasonably close (within ~1.2 slot widths)
      if (dist > icon.size * 1.2) continue;
      if (dist < bestDist) {
        bestDist = dist;
        bestDigit = d;
        (bestDigit as DigitHit & { _i?: number })._i = i;
      }
    }

    if (bestDigit) {
      const idx = (bestDigit as DigitHit & { _i?: number })._i!;
      usedDigits.add(idx);
      result.set(lootId, { qty: bestDigit.value, conf: icon.score });
    } else {
      // Icon found but no nearby digit — still record the match
      result.set(lootId, { qty: -1, conf: icon.score }); // -1 means OCR miss
    }
  }

  return result;
}

async function runDetection(
  loots: LootRow[],
  normalDataUrl: string | null,
  enhanceDataUrl: string | null,
): Promise<DetectionRow[]> {
  const empty = (): DetectionRow[] =>
    loots.map((l) => ({
      lootId: l.id,
      name: l.name,
      iconUrl: l.icon_url,
      detectedQty: null,
      mode: "override" as QtyMode,
      ignore: false,
      confidence: null,
      editQty: "",
    }));

  const screens: HTMLImageElement[] = [];
  for (const url of [normalDataUrl, enhanceDataUrl]) {
    if (!url) continue;
    try {
      screens.push(await loadImage(url));
    } catch {
      /* skip */
    }
  }
  if (!screens.length) return empty();

  const lootIcons: { loot: LootRow; img: HTMLImageElement }[] = [];
  for (const l of loots) {
    if (!l.icon_url) continue;
    try {
      lootIcons.push({ loot: l, img: await loadImage(l.icon_url) });
    } catch {
      /* skip */
    }
  }

  const worker = await createWorker("eng", 1, { logger: () => {} });

  // Merge assignments across screenshots (keep highest confidence)
  const merged = new Map<string, { qty: number; conf: number }>();

  try {
    for (const img of screens) {
      // 1. Full-image OCR for all stack numbers
      const digits = await findAllDigits(worker, img);

      // 2. Grid icon matching
      const maxSide = 800;
      const scale =
        Math.max(img.naturalWidth, img.naturalHeight) > maxSide
          ? maxSide / Math.max(img.naturalWidth, img.naturalHeight)
          : 1;
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const gray = toGray(img, w, h);
      const icons = findIconHits(gray, scale, lootIcons);

      // 3. Pair digits ↔ icons by proximity
      const assigned = assignDigitsToIcons(icons, digits);

      for (const [lootId, val] of assigned) {
        const prev = merged.get(lootId);
        if (!prev || val.conf > prev.conf) {
          merged.set(lootId, val);
        }
      }
    }
  } finally {
    await worker.terminate();
  }

  return loots.map((l) => {
    const a = merged.get(l.id);
    const qty = a && a.qty > 0 ? a.qty : null;
    return {
      lootId: l.id,
      name: l.name,
      iconUrl: l.icon_url,
      detectedQty: qty,
      mode: "override" as QtyMode,
      ignore: false,
      confidence: a?.conf ?? null,
      editQty: "",
    };
  });
}

function UploadSlot({
  label,
  hint,
  preview,
  onFile,
  onClear,
}: {
  label: string;
  hint: string;
  preview: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) onFile(file);
    },
    [onFile],
  );

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
          <img src={preview} alt={label} className="max-h-40 w-full object-contain" />
          <button
            type="button"
            onClick={onClear}
            className="btn-ghost absolute right-2 top-2 h-7 px-2 text-[0.65rem]"
          >
            <X className="size-3.5" /> Clear
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center transition hover:border-cyan-400/40 hover:bg-cyan-400/5"
        >
          <Upload className="size-6 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{hint}</span>
          <span className="text-[0.7rem] text-muted-foreground">PNG / JPG · drag & drop or click</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              e.target.value = "";
            }}
          />
        </button>
      )}
    </div>
  );
}

export function InventoryScreenshotImport({ open, onClose, loots, currentQty, onApply }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [normalPreview, setNormalPreview] = useState<string | null>(null);
  const [enhancePreview, setEnhancePreview] = useState<string | null>(null);
  const [rows, setRows] = useState<DetectionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("upload");
    setNormalPreview(null);
    setEnhancePreview(null);
    setRows([]);
    setError(null);
    setBusy(false);
  }, [open]);

  const handleFile = async (kind: "normal" | "enhance", file: File) => {
    try {
      const url = await fileToDataUrl(file);
      if (kind === "normal") setNormalPreview(url);
      else setEnhancePreview(url);
    } catch {
      setError("Could not read that image.");
    }
  };

  const onProcess = async () => {
    if (!normalPreview && !enhancePreview) {
      setError("Add at least one screenshot.");
      return;
    }
    setError(null);
    setBusy(true);
    setStep("processing");
    try {
      const detected = await runDetection(loots, normalPreview, enhancePreview);
      const seeded = detected.map((d) => ({
        ...d,
        editQty: d.detectedQty != null ? String(d.detectedQty) : currentQty[d.lootId] || "",
      }));
      setRows(seeded);
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed");
      setStep("upload");
    } finally {
      setBusy(false);
    }
  };

  const updateRow = (lootId: string, patch: Partial<DetectionRow>) => {
    setRows((prev) => prev.map((r) => (r.lootId === lootId ? { ...r, ...patch } : r)));
  };

  const onConfirmApply = () => {
    const next: Record<string, string> = { ...currentQty };

    for (const r of rows) {
      if (r.ignore) continue;

      const before = parseFloat(currentQty[r.lootId] || "0") || 0;
      const detected = r.detectedQty;

      if (detected == null) {
        const edited = parseFloat(r.editQty);
        if (Number.isFinite(edited) && r.editQty.trim() !== "") {
          next[r.lootId] = String(edited);
        }
        continue;
      }

      const edited = parseFloat(r.editQty);
      const value = Number.isFinite(edited) ? edited : detected;

      if (r.mode === "add") {
        next[r.lootId] = String(before + value);
      } else {
        next[r.lootId] = String(value);
      }
    }

    onApply(next);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="glass-strong relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden sm:max-w-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-cyan-300/90">
              Update Quantities
            </p>
            <p className="text-sm text-muted-foreground">
              {step === "upload" && "Drop inventory screenshots"}
              {step === "processing" && "Reading numbers & matching icons…"}
              {step === "review" && "Review & apply"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost h-8 px-2">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
              <button type="button" className="ml-2 underline" onClick={() => setError(null)}>
                Dismiss
              </button>
            </p>
          )}

          {step === "upload" && (
            <div className="flex flex-col gap-4">
              <UploadSlot
                label="Normal Inventory"
                hint="Inventory screenshot"
                preview={normalPreview}
                onFile={(f) => handleFile("normal", f)}
                onClear={() => setNormalPreview(null)}
              />
              <UploadSlot
                label="Enhancement Inventory"
                hint="Black Spirit / enhancement window"
                preview={enhancePreview}
                onFile={(f) => handleFile("enhance", f)}
                onClear={() => setEnhancePreview(null)}
              />
              <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
                Reads all stack numbers from the screenshot, then matches icons to this spot’s loot
                list. Correct any value on the review screen before applying.
              </p>
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-cyan-300" />
              Reading stack numbers & matching icons…
            </div>
          )}

          {step === "review" && (
            <div className="flex flex-col gap-2">
              <p className="mb-1 text-[0.7rem] text-muted-foreground">
                Override replaces the current qty. Add sums on top. You can type over any value.
              </p>
              <ul className="flex flex-col gap-1.5">
                {rows.map((r) => {
                  const before = parseFloat(currentQty[r.lootId] || "0") || 0;
                  const detected = r.detectedQty;
                  const shown = r.ignore
                    ? before
                    : r.mode === "add" && detected != null
                      ? before + (parseFloat(r.editQty) || detected)
                      : parseFloat(r.editQty) || detected || before;

                  return (
                    <li
                      key={r.lootId}
                      className={cn(
                        "rounded-xl bg-white/[0.03] px-2.5 py-2.5",
                        r.ignore && "opacity-50",
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        {r.iconUrl ? (
                          <img
                            src={r.iconUrl}
                            alt=""
                            className="size-9 shrink-0 rounded-md object-contain bg-black/30"
                          />
                        ) : (
                          <div className="size-9 shrink-0 rounded-md bg-white/5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{r.name}</p>
                          <p className="text-[0.65rem] text-muted-foreground">
                            {detected == null
                              ? r.confidence != null
                                ? `Icon matched · number not read`
                                : "Not detected"
                              : `Detected ${detected}${r.confidence != null ? ` · ${Math.round(r.confidence * 100)}%` : ""}`}
                            {before > 0 && ` · was ${before}`}
                          </p>
                        </div>
                        <Input
                          type="number"
                          min={0}
                          disabled={r.ignore}
                          value={r.editQty}
                          onChange={(e) => updateRow(r.lootId, { editQty: e.target.value })}
                          placeholder="0"
                          className="h-9 w-[4.5rem] text-center text-sm font-semibold"
                        />
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateRow(r.lootId, { mode: "override" })}
                          className={cn(
                            "btn-ghost h-7 px-2.5 text-[0.65rem]",
                            r.mode === "override" && !r.ignore && "border-cyan-400/50 text-cyan-200",
                          )}
                        >
                          Override
                        </button>
                        <button
                          type="button"
                          onClick={() => updateRow(r.lootId, { mode: "add" })}
                          className={cn(
                            "btn-ghost h-7 px-2.5 text-[0.65rem]",
                            r.mode === "add" && !r.ignore && "border-emerald-400/50 text-emerald-200",
                          )}
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => updateRow(r.lootId, { ignore: !r.ignore })}
                          className={cn(
                            "btn-ghost h-7 px-2.5 text-[0.65rem]",
                            r.ignore && "border-rose-400/40 text-rose-200",
                          )}
                        >
                          {r.ignore ? "Ignored" : "Ignore"}
                        </button>
                        <span className="ml-auto font-mono text-xs tabular-nums text-cyan-300/90">
                          → {Number.isFinite(shown) ? Math.round(shown) : "—"}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
          {step === "upload" && (
            <>
              <button type="button" onClick={onClose} className="btn-ghost h-9 px-3 text-xs">
                Cancel
              </button>
              <button
                type="button"
                onClick={onProcess}
                disabled={busy || (!normalPreview && !enhancePreview)}
                className="btn-primary h-9 px-4 text-xs"
              >
                <ImagePlus className="size-3.5" /> Process
              </button>
            </>
          )}
          {step === "review" && (
            <>
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="btn-ghost h-9 px-3 text-xs"
              >
                Back
              </button>
              <button type="button" onClick={onConfirmApply} className="btn-primary h-9 px-4 text-xs">
                <Check className="size-3.5" /> Apply Quantities
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
