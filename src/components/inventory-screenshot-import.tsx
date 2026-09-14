import { ImagePlus, Loader2, X, Upload, Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { parseInventoryWithGemini } from "@/lib/parse-inventory";
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

/** Shrink + JPEG so the server-fn POST stays under Vercel body limits. */
function compressDataUrl(dataUrl: string, maxSide = 1024, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { naturalWidth: w, naturalHeight: h } = img;
        if (w < 1 || h < 1) {
          resolve(dataUrl);
          return;
        }
        const scale = Math.min(1, maxSide / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", quality));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("Could not decode image for compression"));
    img.src = dataUrl;
  });
}

/** Load a public icon URL into a tiny JPEG data URL for Gemini reference matching. */
function loadRefIcon(url: string, maxSide = 48, quality = 0.7): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        let { naturalWidth: w, naturalHeight: h } = img;
        if (w < 1 || h < 1) {
          resolve(null);
          return;
        }
        const scale = Math.min(1, maxSide / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", quality));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function friendlyError(e: unknown): string {
  if (!(e instanceof Error)) return "Processing failed";
  const msg = e.message || "Processing failed";
  if (/NetworkError|Failed to fetch|Load failed|network/i.test(msg)) {
    return (
      "Could not reach the server function (network). " +
      "Confirm the latest deploy is Ready on Vercel, hard-refresh the page, then try again. " +
      "If it keeps failing, crop the screenshot to the inventory grid only."
    );
  }
  return msg;
}

async function runDetection(
  loots: LootRow[],
  normalDataUrl: string | null,
  enhanceDataUrl: string | null,
): Promise<DetectionRow[]> {
  const raw = [normalDataUrl, enhanceDataUrl].filter(Boolean) as string[];
  const images: string[] = [];
  for (const url of raw) {
    images.push(await compressDataUrl(url));
  }

  // Tiny reference icons for this spot only (accuracy without full BDO catalog)
  const lootPayload = await Promise.all(
    loots.map(async (l) => {
      let icon: string | null = null;
      if (l.icon_url) {
        icon = await loadRefIcon(l.icon_url);
      }
      return { id: l.id, name: l.name, icon };
    }),
  );

  let result;
  try {
    result = await parseInventoryWithGemini({
      data: {
        images,
        loots: lootPayload,
      },
    });
  } catch (e) {
    // Re-throw with friendlier message for network failures
    throw new Error(friendlyError(e));
  }

  const byId = new Map(result.items.map((i) => [i.id, i.qty]));

  return loots.map((l) => {
    const qty = byId.has(l.id) ? (byId.get(l.id) ?? null) : null;
    return {
      lootId: l.id,
      name: l.name,
      iconUrl: l.icon_url,
      detectedQty: qty,
      mode: "override" as QtyMode,
      ignore: false,
      confidence: qty != null ? 0.9 : null,
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
      setError(friendlyError(e));
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center">
      <div className="glass flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Update Quantities</p>
            <p className="text-[0.7rem] text-muted-foreground">
              {step === "upload" && "Upload inventory screenshots"}
              {step === "processing" && "Gemini is reading your inventory…"}
              {step === "review" && "Review detected stacks before applying"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost h-8 px-2">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {error && (
            <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </p>
          )}

          {step === "upload" && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground">
                Gemini matches bag icons to this spot’s loot icons and reads stack counts. Review the
                results before applying. Items not in this spot’s loot list are ignored.
              </p>
              <UploadSlot
                label="Normal Inventory"
                hint="Drop or choose normal bag"
                preview={normalPreview}
                onFile={(f) => handleFile("normal", f)}
                onClear={() => setNormalPreview(null)}
              />
              <UploadSlot
                label="Enhancement Inventory"
                hint="Drop or choose enhancement bag"
                preview={enhancePreview}
                onFile={(f) => handleFile("enhance", f)}
                onClear={() => setEnhancePreview(null)}
              />
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-cyan-300" />
              Gemini is reading stack counts…
            </div>
          )}

          {step === "review" && (
            <div className="flex flex-col gap-2">
              <p className="mb-1 text-[0.7rem] text-muted-foreground">
                Override replaces the current qty. Add stacks on top (e.g. after moving items to storage).
                Ignore skips that row. Not detected leaves the current qty unless you type a value.
              </p>
              <ul className="flex flex-col gap-2">
                {rows.map((r) => {
                  const before = parseFloat(currentQty[r.lootId] || "0") || 0;
                  const edited = parseFloat(r.editQty);
                  const value = Number.isFinite(edited)
                    ? edited
                    : r.detectedQty != null
                      ? r.detectedQty
                      : NaN;
                  const shown =
                    r.ignore
                      ? before
                      : r.mode === "add" && Number.isFinite(value)
                        ? before + value
                        : value;
                  return (
                    <li
                      key={r.lootId}
                      className={cn(
                        "rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/5",
                        r.ignore && "opacity-50",
                      )}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        {r.iconUrl ? (
                          <img src={r.iconUrl} alt="" className="size-9 rounded object-contain" />
                        ) : (
                          <span className="flex size-9 items-center justify-center rounded bg-white/5 text-xs font-bold text-cyan-300">
                            {r.name[0]?.toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{r.name}</p>
                          <p className="text-[0.7rem] text-muted-foreground">
                            Was {before}
                            {r.detectedQty != null ? ` · Detected ${r.detectedQty}` : " · Not detected"}
                          </p>
                        </div>
                        <Input
                          type="number"
                          min={0}
                          value={r.editQty}
                          onChange={(e) => updateRow(r.lootId, { editQty: e.target.value })}
                          className="h-8 w-20 text-center text-sm"
                          disabled={r.ignore}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
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
