import type { SessionLootRow, SessionRow, SpotRow } from "@/lib/supabase";
import { formatSilverCompact } from "@/lib/utils";

export type SessionReportInput = {
  session: SessionRow;
  spot: SpotRow | null | undefined;
  lines: SessionLootRow[];
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

/** Draw a neon glass-style session report PNG and trigger download. */
export async function downloadSessionReportPng(input: SessionReportInput): Promise<void> {
  const { session, spot, lines } = input;
  const sorted = [...lines].sort((a, b) => Number(b.line_value) - Number(a.line_value));

  const W = 900;
  const pad = 36;
  const headerH = 120;
  const metricsH = 110;
  const rowH = 44;
  const listHeaderH = 36;
  const footerH = 48;
  const maxRows = Math.max(sorted.length, 1);
  const H = pad + headerH + 16 + metricsH + 24 + listHeaderH + maxRows * rowH + 24 + footerH + pad;

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

  ctx.fillStyle = "rgba(34,211,238,0.9)";
  ctx.font = "600 13px system-ui, -apple-system, sans-serif";
  ctx.fillText("DEV'S HUB  ·  GRIND REPORT", pad + 24, y + 32);

  ctx.fillStyle = "#f1f5f9";
  ctx.font = "700 28px system-ui, -apple-system, sans-serif";
  const spotName = spot?.name || "Unknown Spot";
  ctx.fillText(spotName, pad + 24, y + 68);

  ctx.fillStyle = "rgba(148,163,184,0.95)";
  ctx.font = "500 14px system-ui, -apple-system, sans-serif";
  const sub = [
    session.character_name || "Unknown",
    `${session.minutes} min`,
    fmtDate(session.started_at || session.created_at),
  ]
    .filter(Boolean)
    .join("  ·  ");
  ctx.fillText(sub, pad + 24, y + 94);

  if (spot?.territory) {
    ctx.fillStyle = "rgba(167,139,250,0.9)";
    ctx.font = "600 12px system-ui, -apple-system, sans-serif";
    const region = String(spot.territory);
    const tw = ctx.measureText(region).width;
    ctx.fillText(region, W - pad - 24 - tw, y + 32);
  }

  y += headerH + 16;

  const cardW = (W - pad * 2 - 16) / 2;
  roundRect(ctx, pad, y, cardW, metricsH, 14);
  ctx.fillStyle = "rgba(34,211,238,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(34,211,238,0.35)";
  ctx.stroke();
  ctx.fillStyle = "rgba(148,163,184,0.9)";
  ctx.font = "700 11px system-ui, -apple-system, sans-serif";
  ctx.fillText("TOTAL SILVER", pad + 20, y + 28);
  ctx.fillStyle = "#67e8f9";
  ctx.font = "700 32px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(fmtSilver(Number(session.total_value)), pad + 20, y + 72);

  const x2 = pad + cardW + 16;
  roundRect(ctx, x2, y, cardW, metricsH, 14);
  ctx.fillStyle = "rgba(16,185,129,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(52,211,153,0.35)";
  ctx.stroke();
  ctx.fillStyle = "rgba(148,163,184,0.9)";
  ctx.font = "700 11px system-ui, -apple-system, sans-serif";
  ctx.fillText("SILVER / HOUR", x2 + 20, y + 28);
  ctx.fillStyle = "#6ee7b7";
  ctx.font = "700 32px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(fmtSilver(Number(session.silver_per_hour)), x2 + 20, y + 72);

  y += metricsH + 24;

  const listH = listHeaderH + maxRows * rowH + 16;
  roundRect(ctx, pad, y, W - pad * 2, listH, 14);
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.stroke();

  const colX = {
    name: pad + 24,
    qty: W - pad - 280,
    total: W - pad - 160,
    sph: W - pad - 40,
  };
  ctx.fillStyle = "rgba(148,163,184,0.85)";
  ctx.font = "700 11px system-ui, -apple-system, sans-serif";
  ctx.fillText("ITEM", colX.name, y + 26);
  ctx.textAlign = "right";
  ctx.fillText("QTY", colX.qty, y + 26);
  ctx.fillText("TOTAL", colX.total, y + 26);
  ctx.fillText("/H", colX.sph, y + 26);
  ctx.textAlign = "left";

  const hours = Math.max(Number(session.minutes) / 60, 1 / 60);
  let rowY = y + listHeaderH + 8;

  if (sorted.length === 0) {
    ctx.fillStyle = "rgba(148,163,184,0.7)";
    ctx.font = "500 14px system-ui, -apple-system, sans-serif";
    ctx.fillText("No loot lines recorded for this session.", colX.name, rowY + 20);
  } else {
    for (const line of sorted) {
      const qty = Number(line.quantity) || 0;
      const lineVal = Number(line.line_value) || 0;
      const lineSph = lineVal / hours;

      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.beginPath();
      ctx.moveTo(pad + 16, rowY);
      ctx.lineTo(W - pad - 16, rowY);
      ctx.stroke();

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 15px system-ui, -apple-system, sans-serif";
      const name = line.loot_name || "Item";
      let display = name;
      while (ctx.measureText(display).width > colX.qty - colX.name - 24 && display.length > 4) {
        display = display.slice(0, -2) + "…";
      }
      ctx.fillText(display, colX.name, rowY + 28);

      ctx.fillStyle = "rgba(226,232,240,0.9)";
      ctx.font = "600 14px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "right";
      ctx.fillText(String(qty), colX.qty, rowY + 28);
      ctx.fillStyle = "#67e8f9";
      ctx.fillText(fmtSilver(lineVal), colX.total, rowY + 28);
      ctx.fillStyle = "#6ee7b7";
      ctx.fillText(fmtSilver(lineSph), colX.sph, rowY + 28);
      ctx.textAlign = "left";

      rowY += rowH;
    }
  }

  const footY = H - pad - 12;
  ctx.fillStyle = "rgba(100,116,139,0.9)";
  ctx.font = "500 12px system-ui, -apple-system, sans-serif";
  ctx.fillText("Dev's Hub  ·  Black Desert Online", pad, footY);
  ctx.textAlign = "right";
  ctx.fillText("grind session report", W - pad, footY);
  ctx.textAlign = "left";

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
