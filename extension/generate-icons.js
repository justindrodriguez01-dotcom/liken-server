const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size / 100;

  // Rounded square background #F5F4F1
  const r = 20 * s;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = '#F5F4F1';
  ctx.fill();

  const cx = size / 2;
  const cy = size / 2;
  const arcR = 32 * s;

  // C arc: clockwise from 45° to -45° (270° sweep, opening right)
  ctx.beginPath();
  ctx.arc(cx, cy, arcR, Math.PI / 4, -Math.PI / 4, false);
  ctx.strokeStyle = '#0D7377';
  ctx.lineWidth = 8 * s;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Crosshair tick marks
  ctx.strokeStyle = '#0D7377';
  ctx.lineWidth = 3 * s;
  ctx.lineCap = 'round';
  const t1 = 14 * s, t2 = 22 * s;
  // Top
  ctx.beginPath(); ctx.moveTo(cx, t1); ctx.lineTo(cx, t2); ctx.stroke();
  // Bottom
  ctx.beginPath(); ctx.moveTo(cx, size - t1); ctx.lineTo(cx, size - t2); ctx.stroke();
  // Left
  ctx.beginPath(); ctx.moveTo(t1, cy); ctx.lineTo(t2, cy); ctx.stroke();
  // Right (inside C opening)
  ctx.beginPath(); ctx.moveTo(size - t1, cy); ctx.lineTo(size - t2, cy); ctx.stroke();

  // Center dot
  ctx.fillStyle = '#0D7377';
  ctx.beginPath();
  ctx.arc(cx, cy, 3 * s, 0, Math.PI * 2);
  ctx.fill();

  // Faded endpoint dots at C openings
  const ex = cx + arcR * Math.cos(Math.PI / 4);
  const ey1 = cy + arcR * Math.sin(Math.PI / 4);
  const ey2 = cy - arcR * Math.sin(Math.PI / 4);
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#0D7377';
  ctx.beginPath(); ctx.arc(ex, ey1, 4 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(ex, ey2, 4 * s, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1.0;

  return canvas;
}

async function generateIcons() {
  const iconsDir = path.join(__dirname, 'icons');
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

  for (const size of [16, 32, 48, 128]) {
    const canvas = drawIcon(size);
    const buffer = canvas.toBuffer('image/png');
    const outPath = path.join(iconsDir, `icon${size}.png`);
    fs.writeFileSync(outPath, buffer);
    console.log(`Created ${outPath}`);
  }
}

generateIcons().catch(console.error);
