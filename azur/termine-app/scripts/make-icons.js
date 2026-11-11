#!/usr/bin/env node
// Zeichnet das App-Symbol (Kalenderblatt mit AZUR-Logo) und legt desktop/build/icon.png, icon.ico und icon.icns an.
// Braucht Playwright (Chromium) und Python mit Pillow.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'desktop', 'build');
const svg = fs.readFileSync(path.join(ROOT, '..', 'assets', 'logo', 'azur-logo.svg'), 'utf8');
const d = /<path[^>]*\sd="([^"]+)"/.exec(svg)[1];
const box = /viewBox="([^"]+)"/.exec(svg)[1].split(/\s+/).map(Number);

// inset: Rand um die Fläche (Mac-Symbole haben Luft, Windows-Symbole füllen fast alles)
const icon = (inset, radius) => {
  const s = 1024 - 2 * inset;
  const card = { x: inset + s * 0.17, y: inset + s * 0.2, w: s * 0.66, h: s * 0.6 };
  const band = card.h * 0.2;
  const lw = card.w * 0.78, lh = lw * box[3] / box[2];
  return `<!DOCTYPE html><html><body style="margin:0;background:transparent">
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect x="${inset}" y="${inset}" width="${s}" height="${s}" rx="${radius}" fill="#111214"/>
  <rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" fill="#ffffff"/>
  <rect x="${card.x}" y="${card.y}" width="${card.w}" height="${band}" fill="#16b8ff"/>
  <rect x="${card.x + card.w * 0.22}" y="${card.y - band * 0.45}" width="${card.w * 0.07}" height="${band * 0.9}" fill="#ffffff"/>
  <rect x="${card.x + card.w * 0.71}" y="${card.y - band * 0.45}" width="${card.w * 0.07}" height="${band * 0.9}" fill="#ffffff"/>
  <svg x="${card.x + (card.w - lw) / 2}" y="${card.y + band + (card.h - band - lh) / 2}" width="${lw}" height="${lh}" viewBox="${box.join(' ')}">
    <path fill="#111214" fill-rule="evenodd" d="${d}"/>
  </svg>
</svg></body></html>`;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  const shots = { mac: icon(100, 185), win: icon(24, 120) };
  const files = {};
  for (const [k, html] of Object.entries(shots)) {
    await page.setContent(html);
    files[k] = path.join(OUT, `src-${k}.png`);
    await page.screenshot({ path: files[k], omitBackground: true, clip: { x: 0, y: 0, width: 1024, height: 1024 } });
  }
  await browser.close();
  execFileSync('python3', ['-I', '-c', `
import sys
from PIL import Image
mac, win, out = sys.argv[1], sys.argv[2], sys.argv[3]
m = Image.open(mac).convert('RGBA'); w = Image.open(win).convert('RGBA')
m.resize((512, 512), Image.LANCZOS).save(out + '/icon.png')
w.save(out + '/icon.ico', sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
m.save(out + '/icon.icns')
`, files.mac, files.win, OUT], { stdio: 'inherit' });
  for (const f of Object.values(files)) fs.unlinkSync(f);
  console.log('Symbole in', OUT, fs.readdirSync(OUT).join(', '));
})().catch((e) => { console.error(e); process.exit(1); });
