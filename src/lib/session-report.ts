import type { SessionLootRow, SessionRow, SpotRow } from "@/lib/supabase";
import { formatSilverCompact } from "@/lib/utils";

export type SessionReportLootMeta = {
  kind?: "market" | "npc" | null;
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary" | null;
};

export type SessionReportInput = {
  session: SessionRow;
  spot: SpotRow | null | undefined;
  lines: SessionLootRow[];
  iconByLootId?: Record<string, string | null | undefined>;
  /** Current catalog meta (kind/rarity) keyed by loot id — preferred approach, no session schema change */
  metaByLootId?: Record<string, SessionReportLootMeta | undefined>;
  /** Fallback when loot_id is missing: lowercased loot name → meta */
  metaByName?: Record<string, SessionReportLootMeta | undefined>;
  showCharacter?: boolean;
  showDropRate?: boolean;
  showAgris?: boolean;
  showMinutes?: boolean;
  agris?: number | null;
};

function fmtSilver(n: number) {
  return formatSilverCompact(Number(n) || 0);
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const RARITY_COLORS: Record<string, { bg: string; fg: string; ring: string }> = {
  common: { bg: "rgba(113,113,122,0.35)", fg: "#d4d4d8", ring: "rgba(161,161,170,0.45)" },
  uncommon: { bg: "rgba(16,185,129,0.28)", fg: "#6ee7b7", ring: "rgba(52,211,153,0.45)" },
  rare: { bg: "rgba(14,165,233,0.28)", fg: "#7dd3fc", ring: "rgba(56,189,248,0.45)" },
  epic: { bg: "rgba(245,158,11,0.28)", fg: "#fcd34d", ring: "rgba(251,191,36,0.5)" },
  legendary: { bg: "rgba(244,63,94,0.28)", fg: "#fda4af", ring: "rgba(251,113,133,0.5)" },
};

function rarityLabel(r: string | null | undefined): string {
  if (r === "uncommon") return "Uncommon";
  if (r === "rare") return "Rare";
  if (r === "epic") return "Epic";
  if (r === "legendary") return "Legendary";
  return "Common";
}

function drawTag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  bg: string,
  fg: string,
  ring: string,
  font: string,
): number {
  ctx.font = `600 11px ${font}`;
  const tw = ctx.measureText(label).width;
  const padX = 7;
  const h = 18;
  const w = tw + padX * 2;
  roundRect(ctx, x, y, w, h, 5);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = ring;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.fillText(label, x + padX, y + 13);
  return w;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function loadImage(url: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function ensureLora() {
  try {
    if (document.fonts?.load) {
      await Promise.all([
        document.fonts.load("400 16px Lora"),
        document.fonts.load("600 16px Lora"),
        document.fonts.load("700 16px Lora"),
      ]);
    }
  } catch {
    /* fallback */
  }
}

function drawHubLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  for (const [r, a] of [
    [8, 0.28],
    [11.5, 0.2],
    [15, 0.14],
    [18, 0.1],
  ] as const) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(167,139,250,${a})`;
    ctx.lineWidth = 0.4;
    ctx.stroke();
  }
  const planets: [number, number, number, string][] = [
    [0, -8, 1.9, "#a78bfa"],
    [11, 0, 1.45, "#8b5cf6"],
    [0, 12, 1.2, "#6d28d9"],
    [-11, 0, 1.05, "#a78bfa"],
    [6, -9, 0.85, "#8b5cf6"],
    [-8, 7, 0.7, "#6d28d9"],
  ];
  for (const [px, py, pr, color] of planets) {
    const g = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, 0, px, py, pr);
    g.addColorStop(0, "#f5f3ff");
    g.addColorStop(1, color);
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }
  const star = ctx.createRadialGradient(0, 0, 0, 0, 0, 3.2);
  star.addColorStop(0, "#ffffff");
  star.addColorStop(0.55, "#f8fafc");
  star.addColorStop(1, "rgba(226,232,240,0.85)");
  ctx.beginPath();
  ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
  ctx.fillStyle = star;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 1.1, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
}

export async function downloadSessionReportPng(input: SessionReportInput): Promise<void> {
  const {
    session,
    spot,
    lines,
    iconByLootId = {},
    metaByLootId = {},
    metaByName = {},
    showCharacter = true,
    showDropRate = true,
    showAgris = true,
    showMinutes = true,
    agris = null,
  } = input;
  const sorted = [...lines].sort((a, b) => Number(b.line_value) - Number(a.line_value));
  const totalSilver = Number(session.total_value) || 0;

  await ensureLora();

  const lineImgs = await Promise.all(
    sorted.map((l) => loadImage(l.loot_id ? iconByLootId[l.loot_id] : null)),
  );

  const font = "Lora, Georgia, 'Times New Roman', serif";
  const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

  const W = 920;
  const pad = 36;
  const headerH = 128;
  const metricsH = 110;
  const rowH = 58;
  const listHeaderH = 36;
  const footerH = 36;
  const maxRows = Math.max(sorted.length, 1);
  const H = pad + headerH + 16 + metricsH + 24 + listHeaderH + maxRows * rowH + 16 + footerH + pad;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#04060c");
  bg.addColorStop(0.5, "#070b14");
  bg.addColorStop(1, "#0a0f1a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(120, 80, 20, 120, 80, 280);
  glow.addColorStop(0, "rgba(34,211,238,0.12)");
  glow.addColorStop(1, "rgba(34,211,238,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(W - 100, H - 80, 20, W - 100, H - 80, 260);
  glow2.addColorStop(0, "rgba(124,58,237,0.1)");
  glow2.addColorStop(1, "rgba(124,58,237,0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  let y = pad;

  roundRect(ctx, pad, y, W - pad * 2, headerH, 16);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.stroke();

  drawHubLogo(ctx, pad + 36, y + headerH / 2, 1.35);

  const nameX = pad + 72;
  ctx.fillStyle = "#f1f5f9";
  ctx.font = `700 26px ${font}`;
  ctx.fillText(spot?.name || "Unknown Spot", nameX, y + 52);

  const subParts: string[] = [];
    if (showCharacter) subParts.push(session.character_name || "Unknown");
    if (showMinutes) subParts.push(`${session.minutes} min`);
    if (showAgris) {
      subParts.push(`Agris ${agris != null && Number(agris) > 0 ? "ON" : "OFF"}`);
    }
    subParts.push(fmtDate(session.created_at));
    const sub = subParts.filter(Boolean).join("  ·  ");
  ctx.fillStyle = "rgba(148,163,184,0.95)";
  ctx.font = `500 14px ${font}`;
  ctx.fillText(sub, nameX, y + 80);

  const region = (spot?.territory || "").trim();
  if (region) {
    ctx.fillStyle = "rgba(34,211,238,0.9)";
    ctx.font = `600 13px ${font}`;
    const tw = ctx.measureText(region).width;
    const rightX = W - pad - 20;
    ctx.fillText(region, rightX - tw, y + 40);
  }

  const dr = session.drop_rate;
  if (showDropRate && dr != null && Number.isFinite(Number(dr))) {
    const label = `Drop Rate  ${Number(dr)}%`;
    ctx.font = `700 13px ${font}`;
    const tw = ctx.measureText(label).width;
    const px = W - pad - 20 - tw - 16;
    const py = y + 58;
    roundRect(ctx, px, py, tw + 16, 28, 8);
    ctx.fillStyle = "rgba(251,191,36,0.15)";
    ctx.fill();
    ctx.strokeStyle = "rgba(251,191,36,0.4)";
    ctx.stroke();
    ctx.fillStyle = "#fde68a";
    ctx.fillText(label, px + 8, py + 19);
  }

  y += headerH + 16;

  const metricsW = (W - pad * 2 - 12) / 2;
  roundRect(ctx, pad, y, metricsW, metricsH, 14);
  ctx.fillStyle = "rgba(34,211,238,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(34,211,238,0.25)";
  ctx.stroke();
  ctx.fillStyle = "rgba(148,163,184,0.9)";
  ctx.font = `600 12px ${font}`;
  ctx.fillText("TOTAL SILVER", pad + 20, y + 28);
  ctx.fillStyle = "#67e8f9";
  ctx.font = `700 36px ${mono}`;
  ctx.fillText(fmtSilver(totalSilver), pad + 20, y + 72);

  const x2 = pad + metricsW + 12;
  roundRect(ctx, x2, y, metricsW, metricsH, 14);
  ctx.fillStyle = "rgba(16,185,129,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(16,185,129,0.25)";
  ctx.stroke();
  ctx.fillStyle = "rgba(148,163,184,0.9)";
  ctx.font = `600 12px ${font}`;
  ctx.fillText("SILVER / HOUR", x2 + 20, y + 28);
  ctx.fillStyle = "#6ee7b7";
  ctx.font = `700 36px ${mono}`;
  ctx.fillText(fmtSilver(Number(session.silver_per_hour)), x2 + 20, y + 72);

  y += metricsH + 24;

  const col = {
    name: pad + 16,
    qty: W - pad - 280,
    total: W - pad - 180,
    pct: W - pad - 100,
    sph: W - pad - 16,
  };

  ctx.fillStyle = "rgba(148,163,184,0.75)";
  ctx.font = `700 11px ${font}`;
  ctx.fillText("ITEM", col.name, y + 26);
  ctx.textAlign = "right";
  ctx.fillText("QTY", col.qty, y + 26);
  ctx.fillText("TOTAL", col.total, y + 26);
  ctx.fillText("%", col.pct, y + 26);
  ctx.fillText("/H", col.sph, y + 26);
  ctx.textAlign = "left";

  const hours = Math.max(Number(session.minutes) / 60, 1 / 60);
  let rowY = y + listHeaderH + 4;

  if (sorted.length === 0) {
    ctx.fillStyle = "rgba(148,163,184,0.7)";
    ctx.font = `500 14px ${font}`;
    ctx.fillText("No loot lines recorded for this session.", col.name, rowY + 24);
  } else {
    sorted.forEach((line, i) => {
      const qty = Number(line.quantity) || 0;
      const lineVal = Number(line.line_value) || 0;
      const lineSph = lineVal / hours;
      const pct = totalSilver > 0 ? (lineVal / totalSilver) * 100 : 0;
      const icon = lineImgs[i];

      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.beginPath();
      ctx.moveTo(pad + 16, rowY);
      ctx.lineTo(W - pad - 16, rowY);
      ctx.stroke();

      const iconSize = 28;
      const textX = col.name + iconSize + 12;
      if (icon) {
        ctx.drawImage(icon, col.name, rowY + 10, iconSize, iconSize);
      } else {
        roundRect(ctx, col.name, rowY + 10, iconSize, iconSize, 6);
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fill();
        ctx.fillStyle = "#67e8f9";
        ctx.font = `700 12px ${font}`;
        ctx.fillText((line.loot_name || "?")[0]?.toUpperCase() || "?", col.name + 9, rowY + 30);
      }

      const meta =
        (line.loot_id && metaByLootId[line.loot_id]) ||
        metaByName[(line.loot_name || "").trim().toLowerCase()] ||
        {};
      const kind = meta.kind === "npc" ? "npc" : meta.kind === "market" ? "market" : null;
      const rarity = meta.rarity || null;

      ctx.fillStyle = "#e2e8f0";
      ctx.font = `600 15px ${font}`;
      let display = line.loot_name || "Item";
      while (ctx.measureText(display).width > col.qty - textX - 20 && display.length > 4) {
        display = display.slice(0, -2) + "…";
      }
      ctx.fillText(display, textX, rowY + 24);

      let tagX = textX;
      const tagY = rowY + 32;
      if (kind) {
        tagX +=
          drawTag(
            ctx,
            tagX,
            tagY,
            kind === "market" ? "Market" : "NPC",
            "rgba(255,255,255,0.08)",
            "rgba(148,163,184,0.95)",
            "rgba(255,255,255,0.14)",
            font,
          ) + 6;
      }
      {
        const key = rarity || "common";
        const c = RARITY_COLORS[key] || RARITY_COLORS.common;
        drawTag(ctx, tagX, tagY, rarityLabel(key), c.bg, c.fg, c.ring, font);
      }

      ctx.font = `600 14px ${mono}`;
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(226,232,240,0.9)";
      ctx.fillText(String(qty), col.qty, rowY + 34);
      ctx.fillStyle = "#67e8f9";
      ctx.fillText(fmtSilver(lineVal), col.total, rowY + 34);
      ctx.fillStyle = "rgba(250,204,21,0.95)";
      ctx.fillText(`${pct.toFixed(1)}%`, col.pct, rowY + 34);
      ctx.fillStyle = "#6ee7b7";
      ctx.fillText(fmtSilver(lineSph), col.sph, rowY + 34);
      ctx.textAlign = "left";

      rowY += rowH;
    });
  }

  const footY = H - pad - 8;
  ctx.fillStyle = "rgba(100,116,139,0.9)";
  ctx.font = `500 12px ${font}`;
  ctx.fillText("Dev's Hub  ·  Black Desert Online", pad, footY);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png"),
  );
  if (!blob) throw new Error("Failed to export PNG");

  const safeSpot = (spot?.name || "session").replace(/[^\w\-]+/g, "_").slice(0, 40);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `devs-hub-grind-${safeSpot}-${session.id.slice(0, 8)}.png`;
  a.click();
  URL.revokeObjectURL(a.href);
}
