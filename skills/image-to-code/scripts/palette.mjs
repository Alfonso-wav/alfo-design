#!/usr/bin/env node
// Reads the real colours and size of a design image, so tokens are measured instead of guessed.
// Decodes the image in a browser canvas through playwright-cli. No dependencies, Node 18+.
//
//   node palette.mjs <image.png|jpg|webp> [--k 8] [--width 1440] [--region x,y,w,h]
//
//   --k        number of colour clusters (default 8)
//   --width    the CSS width the design was drawn at; prints the px→CSS scale (default 1440)
//   --region   only sample this rectangle, in image pixels (e.g. the hero, a button)
//
// Prints each cluster as hex with its share of the area, plus the WCAG contrast of the likely
// ink/ground pair. Shares tell roles: the biggest is the ground, small saturated ones are accents.

import { execFile, execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, extname, delimiter } from 'node:path';

const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : d);
const img = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
if (!img) { console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 12).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(0); }
if (!existsSync(img)) { console.error(`not found: ${img}`); process.exit(2); }
const K = Number(opt('k', 8));
const CSSW = Number(opt('width', 1440));
const REGION = opt('region', null)?.split(',').map(Number) || null;

function cliEntry() {
  if (process.env.PLAYWRIGHT_CLI_JS) return process.env.PLAYWRIGHT_CLI_JS;
  const rel = join('node_modules', '@playwright', 'cli', 'playwright-cli.js');
  for (const d of (process.env.PATH || '').split(delimiter)) {
    if (existsSync(join(d, 'playwright-cli.cmd')) || existsSync(join(d, 'playwright-cli'))) {
      if (existsSync(join(d, rel))) return join(d, rel);
      if (existsSync(join(d, '..', 'lib', rel))) return join(d, '..', 'lib', rel);
    }
  }
  try { const g = join(execSync('npm root -g', { encoding: 'utf8' }).trim(), '@playwright', 'cli', 'playwright-cli.js'); if (existsSync(g)) return g; } catch {}
  console.error('playwright-cli not found. Install it: npm install -g @playwright/cli@latest');
  process.exit(2);
}
const CLI = cliEntry();
const pw = (...args) => new Promise((res, rej) => execFile(process.execPath, [CLI, '-s=palette', ...args], { maxBuffer: 1 << 24 }, (e, o, s) => {
  const out = String(o) + String(s);
  if (out.includes('### Error') || (e && !out.includes('### Result'))) return rej(new Error(out));
  res(out);
}));

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif' };
const data = readFileSync(resolve(img));
const srv = createServer((req, res) => {
  if (req.url.startsWith('/img')) { res.writeHead(200, { 'content-type': MIME[extname(img).toLowerCase()] || 'image/png' }); return res.end(data); }
  res.writeHead(200, { 'content-type': 'text/html' }); res.end('<!doctype html><body></body>');
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${srv.address().port}`;

// k-means over a downsampled pixel grid, in the page.
const FN = `async () => {
  const im = new Image(); im.src = '/img'; await im.decode();
  const R = ${JSON.stringify(REGION)} || [0, 0, im.naturalWidth, im.naturalHeight];
  const step = Math.max(1, Math.round(Math.sqrt((R[2] * R[3]) / 60000)));
  const w = Math.floor(R[2] / step), h = Math.floor(R[3] / step);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, R[0], R[1], R[2], R[3], 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data; const px = [];
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) px.push([d[i], d[i + 1], d[i + 2]]);
  const K = ${K};
  // k-means++ seeding, deterministic
  let cent = [px[0]];
  while (cent.length < K) {
    let best = null, bd = -1;
    for (let i = 0; i < px.length; i += 7) { const p = px[i]; let m = Infinity; for (const q of cent) { const dd = (p[0]-q[0])**2 + (p[1]-q[1])**2 + (p[2]-q[2])**2; if (dd < m) m = dd; } if (m > bd) { bd = m; best = p; } }
    if (bd <= 0) break; cent.push(best.slice());
  }
  let lab = new Int32Array(px.length);
  for (let it = 0; it < 12; it++) {
    const sum = cent.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < px.length; i++) { const p = px[i]; let m = Infinity, k = 0; cent.forEach((q, j) => { const dd = (p[0]-q[0])**2 + (p[1]-q[1])**2 + (p[2]-q[2])**2; if (dd < m) { m = dd; k = j; } }); lab[i] = k; const s = sum[k]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++; }
    cent = sum.map((s, j) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : cent[j]));
  }
  const n = new Array(cent.length).fill(0); for (const k of lab) n[k]++;
  return { size: [im.naturalWidth, im.naturalHeight], region: R, clusters: cent.map((q, j) => ({ rgb: q.map(Math.round), share: n[j] / px.length })).filter((c) => c.share > 0.002).sort((a, b) => b.share - a.share) };
}`;

let r;
try {
  await pw('open', base + '/');
  const out = await pw('eval', `async () => JSON.stringify(await (${FN})())`);
  r = JSON.parse(JSON.parse(out.split('### Result')[1].trim().split(/\r?\n/)[0]));
} finally {
  await pw('close').catch(() => {});
  srv.close();
}

const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
const lum = ([a, b, c]) => { const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * f(a) + 0.7152 * f(b) + 0.0722 * f(c); };
const ratio = (p, q) => { const [x, y] = [lum(p), lum(q)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const sat = ([a, b, c]) => { const mx = Math.max(a, b, c), mn = Math.min(a, b, c); return mx ? (mx - mn) / mx : 0; };

const [W, H] = r.size;
console.log(`image ${W}×${H}px · drawn at ${CSSW} CSS px → scale ${(W / CSSW).toFixed(2)} (divide every measured px by this)`);
if (REGION) console.log(`region ${r.region.join(',')}`);
console.log('');
for (const c of r.clusters) {
  const tag = sat(c.rgb) > 0.35 && c.share < 0.15 ? 'accent?' : '';
  console.log(`${hex(c.rgb)}  ${(c.share * 100).toFixed(1).padStart(5)}%  sat ${sat(c.rgb).toFixed(2)}  ${tag}`);
}
const ground = r.clusters[0];
const ink = r.clusters.slice(1).filter((c) => sat(c.rgb) < 0.35).sort((a, b) => ratio(b.rgb, ground.rgb) - ratio(a.rgb, ground.rgb))[0];
if (ink) console.log(`\nlikely ground ${hex(ground.rgb)} · likely ink ${hex(ink.rgb)} · contrast ${ratio(ink.rgb, ground.rgb).toFixed(2)}:1`);
console.log('Cluster centres are averages: antialiased edges pull them toward the ground. Snap to the cleanest pixel of each role with --region on a flat area.');
