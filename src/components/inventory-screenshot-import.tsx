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

async function runDetection(
  loots: LootRow[],
  normalDataUrl: string | null,
  enhanceDataUrl: string | null,
): Promise<DetectionRow[]> {
  const images = [normalDataUrl, enhanceDataUrl].filter(Boolean) as string[];

  const result = await parseInventoryWithGemini({
    data: {
      images,
      loots: loots.map((l) => ({ id: l.id, name: l.name })),
    },
  });

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
              {step === "processing" && "Gemini is reading your inventory…"}
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
                Gemini reads the screenshot and matches items to this spot’s loot list. Review the
                numbers before applying.
              </p>
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
                              ? "Not found in screenshot"
                              : `Detected ${detected}`}
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
