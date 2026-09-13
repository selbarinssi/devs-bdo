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

function toGrayData(img: CanvasImageSource, w: number, h: number): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = d[i + 1] = d[i + 2] = g;
  }
  return data;
}

/** Estimate typical slot size from screenshot (BDO inventory is a regular grid). */
function estimateSlotSize(sw: number, sh: number): number {
  // Common BDO layouts: ~8–10 columns visible in a crop
  // Prefer a size that divides the width reasonably
  const candidates = [32, 36, 40, 44, 48, 52, 56, 60, 64];
  let best = 44;
  let bestScore = Infinity;
  for (const c of candidates) {
    const cols = sw / c;
    const rows = sh / c;
    // Prefer sizes that nearly tile the image
    const score = Math.abs(cols - Math.round(cols)) + Math.abs(rows - Math.round(rows));
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  // Also clamp to a reasonable fraction of the image
  return Math.max(28, Math.min(best, Math.floor(sw / 6)));
}

/**
 * Template match that works on both full 1920 screenshots and small crops.
 * Uses adaptive template sizes based on estimated slot size, and matches
 * only the center of the icon (ignores rarity border differences).
 */
function matchIcon(
  screenGray: ImageData,
  iconImg: HTMLImageElement,
  slotHint: number,
): { x: number; y: number; score: number; tw: number; th: number } | null {
  const sw = screenGray.width;
  const sh = screenGray.height;
  const sData = screenGray.data;

  // Build a few template sizes around the estimated slot size
  const sizes = [
    Math.round(slotHint * 0.75),
    Math.round(slotHint * 0.9),
    slotHint,
    Math.round(slotHint * 1.1),
    Math.round(slotHint * 1.25),
  ].filter((s) => s >= 16 && s < Math.min(sw, sh));

  let best: { x: number; y: number; score: number; tw: number; th: number } | null = null;

  for (const size of sizes) {
    // Use only the center 70% of the icon to avoid rarity frame mismatch
    const tw = size;
    const th = size;
    const iconGray = toGrayData(iconImg, tw, th);
    const tData = iconGray.data;
    const tPixels = tw * th;

    // Inset: compare only inner region (skip outer 12% border)
    const inset = Math.max(2, Math.floor(size * 0.12));
    const innerW = tw - inset * 2;
    const innerH = th - inset * 2;
    if (innerW < 8 || innerH < 8) continue;
    const innerPixels = innerW * innerH;

    const stride = Math.max(1, Math.floor(size / 10));

    for (let y = 0; y <= sh - th; y += stride) {
      for (let x = 0; x <= sw - tw; x += stride) {
        let sumDiff = 0;
        for (let ty = inset; ty < th - inset; ty++) {
          const sRow = ((y + ty) * sw + x) * 4;
          const tRow = ty * tw * 4;
          for (let tx = inset; tx < tw - inset; tx++) {
            sumDiff += Math.abs(sData[sRow + tx * 4] - tData[tRow + tx * 4]);
          }
        }
        const score = 1 - sumDiff / (innerPixels * 255);
        if (!best || score > best.score) {
          best = { x, y, score, tw, th };
        }
      }
    }
  }

  // More permissive threshold — user can still ignore false positives in review
  if (!best || best.score < 0.55) return null;
  return best;
}

/**
 * Crop the stack-number area.
 * In BDO the count sits in the bottom-right of the slot, often overlapping the icon.
 */
function cropStackRegion(
  screenImg: HTMLImageElement,
  match: { x: number; y: number; tw: number; th: number },
  scaleX: number,
  scaleY: number,
): HTMLCanvasElement {
  // Map match coords back to original image if we scaled the gray buffer
  const x = Math.round(match.x / scaleX);
  const y = Math.round(match.y / scaleY);
  const tw = Math.round(match.tw / scaleX);
  const th = Math.round(match.th / scaleY);

  // Bottom-right quadrant of the slot — where stack numbers live
  const cx = Math.max(0, x + Math.floor(tw * 0.4));
  const cy = Math.max(0, y + Math.floor(th * 0.55));
  const cw = Math.min(screenImg.naturalWidth - cx, Math.ceil(tw * 0.7));
  const ch = Math.min(screenImg.naturalHeight - cy, Math.ceil(th * 0.55));

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, cw);
  canvas.height = Math.max(1, ch);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(screenImg, cx, cy, cw, ch, 0, 0, cw, ch);
  return canvas;
}

/** High-contrast upscaled version for Tesseract */
function prepareForOcr(src: HTMLCanvasElement): string {
  const scale = 4;
  const up = document.createElement("canvas");
  up.width = src.width * scale;
  up.height = src.height * scale;
  const ctx = up.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, up.width, up.height);

  // Boost contrast / threshold-ish so white digits stand out on dark bg
  const img = ctx.getImageData(0, 0, up.width, up.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    // BDO stack numbers are bright; force high contrast
    const v = g > 140 ? 255 : g < 80 ? 0 : Math.round(g);
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return up.toDataURL("image/png");
}

async function ocrDigits(worker: Worker, dataUrl: string): Promise<number | null> {
  try {
    const {
      data: { text },
    } = await worker.recognize(dataUrl);
    // Prefer the longest digit sequence (avoids single-digit noise from borders)
    const matches = (text || "").match(/\d+/g);
    if (!matches || matches.length === 0) return null;
    // Take the largest number found in the crop (stack counts, not fragment digits)
    let best = 0;
    for (const m of matches) {
      const n = parseInt(m, 10);
      if (Number.isFinite(n) && n > best) best = n;
    }
    return best > 0 ? best : null;
  } catch {
    return null;
  }
}

async function runDetection(
  loots: LootRow[],
  normalDataUrl: string | null,
  enhanceDataUrl: string | null,
): Promise<DetectionRow[]> {
  const screens: HTMLImageElement[] = [];
  for (const url of [normalDataUrl, enhanceDataUrl]) {
    if (!url) continue;
    try {
      screens.push(await loadImage(url));
    } catch {
      /* skip */
    }
  }

  if (screens.length === 0) {
    return loots.map((l) => ({
      lootId: l.id,
      name: l.name,
      iconUrl: l.icon_url,
      detectedQty: null,
      mode: "override" as QtyMode,
      ignore: false,
      confidence: null,
      editQty: "",
    }));
  }

  // Work at a reasonable resolution for matching speed + accuracy
  const screenGrays: {
    img: HTMLImageElement;
    gray: ImageData;
    scaleX: number;
    scaleY: number;
    slot: number;
  }[] = [];

  for (const img of screens) {
    const maxSide = 900; // enough detail, still fast
    const scale =
      Math.max(img.naturalWidth, img.naturalHeight) > maxSide
        ? maxSide / Math.max(img.naturalWidth, img.naturalHeight)
        : 1;
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const gray = toGrayData(img, w, h);
    const slot = estimateSlotSize(w, h);
    screenGrays.push({
      img,
      gray,
      scaleX: scale,
      scaleY: scale,
      slot,
    });
  }

  const worker = await createWorker("eng", 1, { logger: () => {} });
  await worker.setParameters({
    tessedit_char_whitelist: "0123456789",
    // single word / sparse text works better for isolated stack counts
    tessedit_pageseg_mode: "8" as unknown as string,
  });

  const results: DetectionRow[] = [];

  try {
    for (const l of loots) {
      let bestQty: number | null = null;
      let bestConf: number | null = null;

      if (l.icon_url) {
        try {
          const iconImg = await loadImage(l.icon_url);

          for (const { img, gray, scaleX, scaleY, slot } of screenGrays) {
            const match = matchIcon(gray, iconImg, slot);
            if (!match) continue;

            const cropCanvas = cropStackRegion(img, match, scaleX, scaleY);
            const ocrUrl = prepareForOcr(cropCanvas);
            const qty = await ocrDigits(worker, ocrUrl);

            if (qty != null) {
              if (bestQty == null || match.score > (bestConf ?? 0)) {
                bestQty = qty;
                bestConf = match.score;
              }
            } else if (bestConf == null || match.score > bestConf) {
              bestConf = match.score;
            }
          }
        } catch {
          /* icon failed */
        }
      }

      results.push({
        lootId: l.id,
        name: l.name,
        iconUrl: l.icon_url,
        detectedQty: bestQty,
        mode: "override",
        ignore: false,
        confidence: bestConf,
        editQty: "",
      });
    }
  } finally {
    await worker.terminate();
  }

  return results;
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
        // Allow manual edit even when OCR missed
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
              {step === "processing" && "Matching icons…"}
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
                Works with full or cropped inventory screenshots. Icons are matched against this
                spot’s loot list. You can always correct numbers on the review screen.
              </p>
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-cyan-300" />
              Matching icons & reading stack counts…
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
                                ? `Icon found · OCR missed`
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
