// Renders a dish log as a shareable banner image (1080x1350, Instagram 4:5 —
// also reads well in WhatsApp). Drawn on a canvas so nothing leaves the device
// until the user explicitly shares: logs stay private otherwise.
import { ratingColor, ratingLabel } from '../theme/theme';
import { STAMPS } from '../utils/constants';

const W = 1080;
const H = 1350;

const GREEN = '#004225';
const GREEN_DEEP = '#00301B';
const GOLD = '#C2A14D';
const GOLD_BRIGHT = '#D9BC6B';
const PARCHMENT = '#F4EDE0';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Word-wrap helper; returns the y after the last drawn line.
function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = text.split(/\s+/);
  let line = '';
  let lines = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      if (lines === maxLines - 1) {
        ctx.fillText(line.replace(/\s+\S*$/, '') + '...', x, y);
        return y + lineHeight;
      }
      ctx.fillText(line, x, y);
      y += lineHeight;
      lines++;
      line = words[i];
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

export async function renderShareCard(log) {
  // Make sure Playfair is ready before drawing serif text to canvas.
  try {
    await Promise.all([
      document.fonts.load('700 90px "Playfair Display"'),
      document.fonts.load('italic 400 44px "Playfair Display"'),
    ]);
  } catch { /* fall back to system serif */ }

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Deep green stage with a soft top glow.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, GREEN);
  bg.addColorStop(1, GREEN_DEEP);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 0, 100, W / 2, 0, 900);
  glow.addColorStop(0, 'rgba(217,188,107,0.16)');
  glow.addColorStop(1, 'rgba(217,188,107,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Double gold frame.
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 6;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = 'rgba(217,188,107,0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(58, 58, W - 116, H - 116);

  ctx.textAlign = 'center';

  // Brand
  ctx.fillStyle = GOLD_BRIGHT;
  ctx.font = '700 58px "Playfair Display", serif';
  ctx.fillText('aftertaste', W / 2, 165);
  ctx.font = 'italic 400 30px "Playfair Display", serif';
  ctx.fillStyle = 'rgba(244,237,224,0.65)';
  ctx.fillText('every bite, remembered', W / 2, 212);

  // Gold divider with center diamond.
  const dy = 260;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(220, dy); ctx.lineTo(W / 2 - 30, dy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2 + 30, dy); ctx.lineTo(W - 220, dy); ctx.stroke();
  ctx.save();
  ctx.translate(W / 2, dy);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = GOLD;
  ctx.fillRect(-9, -9, 18, 18);
  ctx.restore();

  // Dish name + restaurant
  ctx.fillStyle = PARCHMENT;
  ctx.font = '700 88px "Playfair Display", serif';
  let y = wrapText(ctx, log.dishName || 'A mystery dish', W / 2, 385, W - 240, 100, 2);
  ctx.font = 'italic 400 44px "Playfair Display", serif';
  ctx.fillStyle = GOLD_BRIGHT;
  y = wrapText(ctx, `at ${log.restaurantName || 'somewhere wonderful'}`, W / 2, y + 28, W - 280, 56, 2);

  // Score medallion
  const overall = log.overall ?? null;
  const cy = y + 160;
  const scoreColor = overall != null ? ratingColor(overall) : GOLD;
  ctx.beginPath();
  ctx.arc(W / 2, cy, 150, 0, Math.PI * 2);
  ctx.fillStyle = PARCHMENT;
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = GOLD;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W / 2, cy, 132, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = scoreColor;
  ctx.stroke();
  ctx.fillStyle = scoreColor;
  ctx.font = '800 130px "Playfair Display", serif';
  ctx.fillText(overall != null ? String(overall) : '–', W / 2, cy + 28);
  ctx.font = '600 34px -apple-system, sans-serif';
  ctx.fillStyle = '#6E6356';
  ctx.fillText('/10', W / 2, cy + 86);

  // Verdict label
  ctx.font = 'italic 700 64px "Playfair Display", serif';
  ctx.fillStyle = GOLD_BRIGHT;
  ctx.fillText(overall != null ? `"${ratingLabel(overall)}"` : 'Logged', W / 2, cy + 240);

  let fy = cy + 310;

  // Comment (short excerpt)
  if (log.comment) {
    ctx.font = 'italic 400 40px "Playfair Display", serif';
    ctx.fillStyle = 'rgba(244,237,224,0.85)';
    fy = wrapText(ctx, `"${log.comment}"`, W / 2, fy, W - 260, 54, 3) + 20;
  }

  // Stamps as gold-outline pills
  const stampLabels = (log.stamps || [])
    .map((id) => STAMPS.find((s) => s.id === id)?.label)
    .filter(Boolean)
    .slice(0, 3);
  if (stampLabels.length) {
    ctx.font = '700 30px -apple-system, sans-serif';
    const pad = 28;
    const gap = 20;
    const widths = stampLabels.map((l) => ctx.measureText(l).width + pad * 2);
    let x = W / 2 - (widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1)) / 2;
    for (let i = 0; i < stampLabels.length; i++) {
      roundRect(ctx, x, fy, widths[i], 60, 30);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.fillText(stampLabels[i], x + widths[i] / 2, fy + 41);
      x += widths[i] + gap;
    }
    fy += 100;
  }

  // Date footer
  const dateStr = new Date(log.date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  ctx.font = '500 32px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(244,237,224,0.55)';
  // Sit at the bottom of the frame, but never collide with the stamps row.
  ctx.fillText(dateStr, W / 2, Math.min(H - 90, Math.max(H - 120, fy + 30)));

  return canvas;
}

// Share the banner via the native share sheet (Insta/WhatsApp on mobile);
// falls back to downloading the PNG on desktop browsers.
export async function shareLog(log) {
  const canvas = await renderShareCard(log);
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  if (!blob) throw new Error('Could not create the share image.');

  const file = new File([blob], `aftertaste-${(log.dishName || 'bite').toLowerCase().replace(/\s+/g, '-')}.png`, {
    type: 'image/png',
  });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'aftertaste',
        text: `${log.dishName} at ${log.restaurantName} — ${log.overall != null ? `${log.overall}/10, ${ratingLabel(log.overall)}` : 'logged on aftertaste'}`,
      });
      return 'shared';
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled';
      // fall through to download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'downloaded';
}
