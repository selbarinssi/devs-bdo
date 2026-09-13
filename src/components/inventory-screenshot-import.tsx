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
  /** Quantity detected from screenshot(s). null = not found. */
  detectedQty: number | null;
  mode: QtyMode;
  ignore: boolean;
  /** 0–1 confidence; null when not detected */
  confidence: number | null;
  /** Editable value shown in the review UI */
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

/** Convert image to grayscale ImageData at given size */
function toGrayData(img: HTMLImageElement, w: number, h: number): ImageData {
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

/**
 * Fast-ish multi-scale template match.
 * Returns best {x, y, score, scale} or null if below threshold.
 * Score is 0–1 (higher = better match). Tuned for 1920×1080 BDO UI.
 */
function matchIcon(
  screenGray: ImageData,
  iconImg: HTMLImageElement,
  scales = [0.7, 0.85, 1.0, 1.15, 1.3],
): { x: number; y: number; score: number; scale: number; tw: number; th: number } | null {
  const sw = screenGray.width;
  const sh = screenGray.height;
  const sData = screenGray.data;

  let best: { x: number; y: number; score: number; scale: number; tw: number; th: number } | null =
    null;

  for (const scale of scales) {
    const tw = Math.max(12, Math.round(iconImg.naturalWidth * scale));
    const th = Math.max(12, Math.round(iconImg.naturalHeight * scale));
    if (tw >= sw || th >= sh) continue;

    const iconGray = toGrayData(iconImg, tw, th);
    const tData = iconGray.data;

    // Mean of template (for normalized-ish score)
    let tSum = 0;
    const tPixels = tw * th;
    for (let i = 0; i < tData.length; i += 4) tSum += tData[i];
    const tMean = tSum / tPixels;

    // Stride to keep it interactive (~every 3–4 px)
    const stride = Math.max(2, Math.floor(Math.min(tw, th) / 12));

    for (let y = 0; y <= sh - th; y += stride) {
      for (let x = 0; x <= sw - tw; x += stride) {
        let sumDiff = 0;
        let sSum = 0;
        for (let ty = 0; ty < th; ty++) {
          const sRow = ((y + ty) * sw + x) * 4;
          const tRow = ty * tw * 4;
          for (let tx = 0; tx < tw; tx++) {
            const sVal = sData[sRow + tx * 4];
            const tVal = tData[tRow + tx * 4];
            sumDiff += Math.abs(sVal - tVal);
            sSum += sVal;
          }
        }
        const meanDiff = sumDiff / tPixels;
        // Normalize roughly against intensity so dark/light icons both work
        const score = 1 - meanDiff / 255;
        if (!best || score > best.score) {
          best = { x, y, score, scale, tw, th };
        }
      }
    }
  }

  // Threshold — tune later with real screenshots
  if (!best || best.score < 0.72) return null;
  return best;
}

/** Crop the typical BDO stack-number region relative to a found icon */
function cropStackRegion(
  screenImg: HTMLImageElement,
  match: { x: number; y: number; tw: number; th: number },
): string {
  // BDO usually draws the stack count in the bottom-right of the slot,
  // slightly overlapping / just outside the icon.
  const padX = Math.round(match.tw * 0.15);
  const padY = Math.round(match.th * 0.1);
  const cx = Math.max(0, match.x + Math.round(match.tw * 0.45));
  const cy = Math.max(0, match.y + Math.round(match.th * 0.65));
  const cw = Math.min(screenImg.naturalWidth - cx, Math.round(match.tw * 0.7) + padX);
  const ch = Math.min(screenImg.naturalHeight - cy, Math.round(match.th * 0.55) + padY);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, cw);
  canvas.height = Math.max(1, ch);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(screenImg, cx, cy, cw, ch, 0, 0, cw, ch);

  // Upscale a bit — helps Tesseract on small digits
  const up = document.createElement("canvas");
  up.width = canvas.width * 3;
  up.height = canvas.height * 3;
  const uctx = up.getContext("2d")!;
  uctx.imageSmoothingEnabled = false;
  uctx.drawImage(canvas, 0, 0, up.width, up.height);

  return up.toDataURL("image/png");
}

async function ocrDigits(worker: Worker, dataUrl: string): Promise<number | null> {
  try {
    const {
      data: { text },
    } = await worker.recognize(dataUrl);
    const cleaned = (text || "").replace(/[^0-9]/g, "");
    if (!cleaned) return null;
    const n = parseInt(cleaned, 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

/**
 * Client-side detection: icon template matching + stack-digit OCR.
 * Tuned for ~1920×1080 BDO inventory / enhancement windows.
 */
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
      /* skip bad image */
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

  // Precompute grayscale screens at native size (cap very large images)
  const screenGrays: { img: HTMLImageElement; gray: ImageData }[] = [];
  for (const img of screens) {
    const maxW = 1920;
    const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    screenGrays.push({ img, gray: toGrayData(img, w, h) });
  }

  // One Tesseract worker shared across all items
  const worker = await createWorker("eng", 1, {
    logger: () => {},
  });
  await worker.setParameters({
    tessedit_char_whitelist: "0123456789",
    tessedit_pageseg_mode: "7" as unknown as string, // treat as single text line
  });

  const results: DetectionRow[] = [];

  try {
    for (const l of loots) {
      let bestQty: number | null = null;
      let bestConf: number | null = null;

      if (l.icon_url) {
        try {
          const iconImg = await loadImage(l.icon_url);

          for (const { img, gray } of screenGrays) {
            const match = matchIcon(gray, iconImg);
            if (!match) continue;

            const cropUrl = cropStackRegion(img, match);
            const qty = await ocrDigits(worker, cropUrl);

            // Prefer higher confidence match; if multiple screens, take higher qty as absolute
            if (qty != null) {
              if (bestQty == null || qty > bestQty || (match.score > (bestConf ?? 0))) {
                bestQty = qty;
                bestConf = match.score;
              }
            } else if (bestConf == null || match.score > bestConf) {
              // Matched icon but OCR failed — still record confidence so UI can show "found"
              bestConf = match.score;
            }
          }
        } catch {
          /* icon load / match failed → leave undetected */
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

      if (detected == null) continue;

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
                Best results at 1920×1080. Icons are matched against this spot’s loot list;
                unmatched slots are ignored and existing quantities stay unchanged.
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
                Override replaces the current qty. Add sums on top. Ignored rows keep their previous
                value.
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
                                ? `Icon found · OCR missed · was ${before || 0}`
                                : "Not detected · qty unchanged"
                              : `Detected ${detected}${r.confidence != null ? ` · ${Math.round(r.confidence * 100)}%` : ""}`}
                            {before > 0 && detected != null && ` · was ${before}`}
                          </p>
                        </div>
                        <Input
                          type="number"
                          min={0}
                          disabled={r.ignore}
                          value={r.editQty}
                          onChange={(e) => updateRow(r.lootId, { editQty: e.target.value })}
                          placeholder={detected == null ? "—" : "0"}
                          className="h-9 w-[4.5rem] text-center text-sm font-semibold"
                        />
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          disabled={detected == null && r.confidence == null}
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
                          disabled={detected == null && r.confidence == null}
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
