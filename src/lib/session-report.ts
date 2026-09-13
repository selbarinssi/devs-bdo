import type { SessionLootRow, SessionRow, SpotRow } from "@/lib/supabase";
import { formatSilverCompact } from "@/lib/utils";

export type SessionReportInput = {
  session: SessionRow;
  spot: SpotRow | null | undefined;
  lines: SessionLootRow[];
  /** loot_id → icon URL for report icons */
  iconByLootId?: Record<string, string | null | undefined>;
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
    /* fallback to system serif */
  }
}

/** White star + purple planets — matches HubMark */
function drawHubLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale = 1) {
  const s = scale;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);

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
  const { session, spot, lines, iconByLootId = {} } = input;
  const sorted = [...lines].sort((a, b) => Number(b.line_value) - Number(a.line_value));
  const totalSilver = Number(session.total_value) || 0;

  await ensureLora();

  const spotImg = await loadImage(spot?.icon_url);
  const lineImgs = await Promise.all(
    sorted.map((l) => loadImage(l.loot_id ? iconByLootId[l.loot_id] : null)),
  );

  const font = "Lora, Georgia, 'Times New Roman', serif";
  const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

  const W = 920;
  const pad = 36;
  const headerH = 128;
  const metricsH = 110;
  const rowH = 48;
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

  drawHubLogo(ctx, pad + 44, y + headerH / 2, 1.85);

  ctx.fillStyle = "rgba(34,211,238,0.95)";
  ctx.font = `600 12px ${font}`;
  ctx.fillText("DEV'S HUB", pad + 78, y + 34);

  const nameX = pad + 78;
  if (spotImg) {
    ctx.drawImage(spotImg, nameX, y + 48, 36, 36);
  } else {
    roundRect(ctx, nameX, y + 48, 36, 36, 8);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.fillStyle = "#67e8f9";
    ctx.font = `700 16px ${font}`;
    ctx.fillText((spot?.name || "?")[0]?.toUpperCase() || "?", nameX + 12, y + 72);
  }

  ctx.fillStyle = "#f0f7ff";
  ctx.font = `700 26px ${font}`;
  ctx.fillText(spot?.name || "Unknown Spot", nameX + 48, y + 68);

  // created_at = when the session row was saved
  const savedAt = fmtDate(session.created_at);
  ctx.fillStyle = "rgba(148,163,184,0.95)";
  ctx.font = `500 14px ${font}`;
  const sub = [session.character_name || "Unknown", `${session.minutes} min`, `Saved ${savedAt}`].join(
    "  ·  ",
  );
  ctx.fillText(sub, nameX + 48, y + 94);

  if (spot?.territory) {
    ctx.fillStyle = "rgba(167,139,250,0.95)";
    ctx.font = `600 12px ${font}`;
    const region = String(spot.territory);
    const tw = ctx.measureText(region).width;
    ctx.fillText(region, W - pad - 24 - tw, y + 34);
  }

  y += headerH + 16;

  const cardW = (W - pad * 2 - 16) / 2;
  roundRect(ctx, pad, y, cardW, metricsH, 14);
  ctx.fillStyle = "rgba(34,211,238,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(34,211,238,0.35)";
  ctx.stroke();
  ctx.fillStyle = "rgba(148,163,184,0.9)";
  ctx.font = `700 11px ${font}`;
  ctx.fillText("TOTAL SILVER", pad + 20, y + 28);
  ctx.fillStyle = "#67e8f9";
  ctx.font = `700 32px ${mono}`;
  ctx.fillText(fmtSilver(totalSilver), pad + 20, y + 72);

  const x2 = pad + cardW + 16;
  roundRect(ctx, x2, y, cardW, metricsH, 14);
  ctx.fillStyle = "rgba(16,185,129,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(52,211,153,0.35)";
  ctx.stroke();
  ctx.fillStyle = "rgba(148,163,184,0.9)";
  ctx.font = `700 11px ${font}`;
  ctx.fillText("SILVER / HOUR", x2 + 20, y + 28);
  ctx.fillStyle = "#6ee7b7";
  ctx.font = `700 32px ${mono}`;
  ctx.fillText(fmtSilver(Number(session.silver_per_hour)), x2 + 20, y + 72);

  y += metricsH + 24;

  const listH = listHeaderH + maxRows * rowH + 12;
  roundRect(ctx, pad, y, W - pad * 2, listH, 14);
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.stroke();

  const col = {
    name: pad + 24,
    qty: W - pad - 340,
    total: W - pad - 230,
    pct: W - pad - 130,
    sph: W - pad - 36,
  };
  ctx.fillStyle = "rgba(148,163,184,0.85)";
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

      ctx.fillStyle = "#e2e8f0";
      ctx.font = `600 15px ${font}`;
      let display = line.loot_name || "Item";
      while (ctx.measureText(display).width > col.qty - textX - 20 && display.length > 4) {
        display = display.slice(0, -2) + "…";
      }
      ctx.fillText(display, textX, rowY + 30);

      ctx.font = `600 14px ${mono}`;
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(226,232,240,0.9)";
      ctx.fillText(String(qty), col.qty, rowY + 30);
      ctx.fillStyle = "#67e8f9";
      ctx.fillText(fmtSilver(lineVal), col.total, rowY + 30);
      ctx.fillStyle = "rgba(250,204,21,0.95)";
      ctx.fillText(`${pct.toFixed(1)}%`, col.pct, rowY + 30);
      ctx.fillStyle = "#6ee7b7";
      ctx.fillText(fmtSilver(lineSph), col.sph, rowY + 30);
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
  const safeChar = (session.character_name || "char").replace(/[^\w\-]+/g, "_").slice(0, 24);
  const filename = `devs-hub_${safeSpot}_${safeChar}_${session.minutes}m.png`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
