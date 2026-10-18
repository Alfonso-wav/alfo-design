#!/usr/bin/env node
// Visual QA in a real browser through playwright-cli. No dependencies, Node 18+.
//
//   node qa.mjs <url | path/to/index.html | dir> [options]
//
//   --out <dir>          where screenshots and report.json go (default: .visual-qa)
//   --widths 1440,768,390
//   --height 900         viewport height
//   --schemes light,dark colour schemes to capture (default: light,dark)
//   --reference <png>    a design/screenshot to compare against: writes compare-<w>.png side by side
//   --wait <ms>          extra settle time after load (default 600)
//   --session <name>     playwright-cli session name (default: vqa)
//   --headed             show the browser
//
// Measures per width and scheme: horizontal overflow, headings over two lines, text under 12px,
// low text contrast, images without size or alt, unnamed controls, small tap targets, console errors.
// Then keyboard focus visibility (Tab x6) and content hidden under prefers-reduced-motion.
// Exit 1 when any FAIL.

import { execFile, execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, resolve, extname, dirname, basename, delimiter } from 'node:path';

const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : d);
const flag = (k) => argv.includes(`--${k}`);
const target = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && !['--headed'].includes(argv[i - 1])));
if (!target) { console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 19).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(0); }

const OUT = resolve(opt('out', '.visual-qa'));
const WIDTHS = opt('widths', '1440,768,390').split(',').map(Number);
const HEIGHT = Number(opt('height', 900));
const SCHEMES = opt('schemes', 'light,dark').split(',');
const WAIT = Number(opt('wait', 600));
const S = `-s=${opt('session', 'vqa')}`;
const REF = opt('reference', null);
mkdirSync(OUT, { recursive: true });

// ---------- playwright-cli ----------

// On Windows the npm shim is a .cmd that cmd.exe would re-parse (breaking quoted JS), so call the
// package's JS entry with node directly. Override with PLAYWRIGHT_CLI_JS.
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

function pw(...args) {
  return new Promise((res, rej) => {
    execFile(process.execPath, [CLI, S, ...args], { maxBuffer: 1 << 24 }, (err, stdout, stderr) => {
      const out = String(stdout) + String(stderr);
      if (err && !out.includes('### Result')) return rej(new Error(`playwright-cli ${args[0]} failed:
${out || err.message}`));
      if (out.includes('### Error')) return rej(new Error(out.split('### Error')[1].split('###')[0].trim()));
      res(out);
    });
  });
}

async function evalJson(fn) {
  const out = await pw('eval', `async () => JSON.stringify(await (${fn})())`);
  const line = out.split('### Result')[1].trim().split(/\r?\n/)[0];
  return JSON.parse(JSON.parse(line));
}

// ---------- local server ----------

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon' };

async function serve(root, extra) {
  const srv = createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (extra[p]) { res.writeHead(200, { 'content-type': extra[p].type }); return res.end(extra[p].body); }
    let f = join(root, p);
    if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
    if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': MIME[extname(f).toLowerCase()] || 'application/octet-stream' });
    res.end(readFileSync(f));
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  return { srv, base: `http://127.0.0.1:${srv.address().port}` };
}

// ---------- in-page checks (run in the browser) ----------

const CHECKS = `async () => {
  await document.fonts.ready;
  const W = innerWidth, out = { overflow: [], longHeads: [], tinyText: 0, lowContrast: [], imgNoSize: [], imgNoAlt: [], unnamed: [], smallTargets: [], hiddenText: 0 };
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const label = (el) => (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '')).slice(0, 60);
  if (document.documentElement.scrollWidth > W + 1) {
    for (const el of document.body.querySelectorAll('*')) { const r = el.getBoundingClientRect(); if (r.right > W + 1 && r.width <= document.documentElement.scrollWidth && vis(el)) { out.overflow.push(label(el) + ' right=' + Math.round(r.right)); if (out.overflow.length > 5) break; } }
    if (!out.overflow.length) out.overflow.push('document scrollWidth ' + document.documentElement.scrollWidth);
  }
  for (const h of document.querySelectorAll('h1,h2,h3')) {
    if (!vis(h) || !h.textContent.trim()) continue;
    const cs = getComputedStyle(h); let lh = parseFloat(cs.lineHeight); if (isNaN(lh)) lh = parseFloat(cs.fontSize) * 1.2;
    const rng = document.createRange(); rng.selectNodeContents(h); const lines = Math.round(rng.getBoundingClientRect().height / lh);
    if (lines > 2) out.longHeads.push(h.tagName + ' "' + h.textContent.trim().slice(0, 40) + '" ' + lines + ' lines');
  }
  const parse = (c) => { const m = c.match(/[\\d.]+/g); return m ? m.map(Number) : null; };
  const lum = ([r, g, b]) => { const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none') return null; const c = parse(cs.backgroundColor); if (c && (c[3] === undefined || c[3] > 0.9)) return c; } const r = parse(getComputedStyle(document.documentElement).backgroundColor); return r && (r[3] === undefined || r[3] > 0) ? r : [255, 255, 255]; };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n; (n = walker.nextNode());) {
    const el = n.parentElement; if (!el || seen.has(el) || !n.textContent.trim() || !vis(el)) continue; seen.add(el);
    if (el.closest('svg,script,style,noscript,[aria-hidden="true"]')) continue;
    const cs = getComputedStyle(el); const fs = parseFloat(cs.fontSize);
    if (fs < 12) out.tinyText++;
    if (parseFloat(cs.opacity) < 0.05) out.hiddenText++;
    const fg = parse(cs.color), bg = bgOf(el); if (!fg || !bg) continue;
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x); const ratio = (a + 0.05) / (b + 0.05);
    const large = fs >= 24 || (fs >= 18.66 && Number(cs.fontWeight) >= 700);
    if (ratio < (large ? 3 : 4.5) && out.lowContrast.length < 8) out.lowContrast.push(label(el) + ' "' + n.textContent.trim().slice(0, 24) + '" ' + ratio.toFixed(2) + ':1');
  }
  for (const img of document.images) {
    if (!img.hasAttribute('width') || !img.hasAttribute('height')) { if (!getComputedStyle(img).aspectRatio || getComputedStyle(img).aspectRatio === 'auto') out.imgNoSize.push(img.currentSrc.split('/').pop().slice(0, 40)); }
    if (!img.hasAttribute('alt')) out.imgNoAlt.push(img.currentSrc.split('/').pop().slice(0, 40));
  }
  for (const el of document.querySelectorAll('a[href],button,[role=button],input:not([type=hidden]),select,textarea')) {
    if (!vis(el)) continue;
    const name = (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title') || el.textContent || el.getAttribute('alt') || el.querySelector('img[alt]')?.alt || (el.id && document.querySelector('label[for="' + el.id + '"]')?.textContent) || el.closest('label')?.textContent || el.getAttribute('placeholder') || el.value || '').trim();
    if (!name && out.unnamed.length < 8) out.unnamed.push(label(el));
    const r = el.getBoundingClientRect(); const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.closest('p,li');
    if (!inline && (r.width < 24 || r.height < 24) && out.smallTargets.length < 8) out.smallTargets.push(label(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
  }
  for (const el of document.querySelectorAll('*')) { const fn = el.onclick || el.getAttribute('onclick'); if (fn && !el.matches('a,button,input,select,textarea,label,summary,[role=button],[role=link],[tabindex]') && out.unnamed.length < 12) out.unnamed.push(label(el) + ' (click handler on non-interactive element)'); }
  out.title = document.title; out.lang = document.documentElement.lang; out.viewportMeta = !!document.querySelector('meta[name=viewport]');
  out.zoomBlocked = /user-scalable\\s*=\\s*no|maximum-scale\\s*=\\s*1(\\.0)?\\b/.test(document.querySelector('meta[name=viewport]')?.content || '');
  return out;
}`;

const FOCUS = `async () => {
  const el = document.activeElement; if (!el || el === document.body) return { none: true };
  const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
  const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none');
  const hidden = r.bottom < 0 || r.top > innerHeight;
  const covered = (() => { const x = r.left + r.width / 2, y = r.top + r.height / 2; const hit = document.elementFromPoint(x, y); return hit && !el.contains(hit) && !hit.contains(el); })();
  return { tag: el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''), text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30), ring, hidden, covered };
}`;

// ---------- run ----------

const results = [];
const add = (lvl, where, msg) => results.push({ lvl, where, msg });

let url = target, server = null;
const extra = {};
if (!/^https?:\/\//.test(target)) {
  const p = resolve(target);
  if (!existsSync(p)) { console.error(`not found: ${p}`); process.exit(2); }
  const root = statSync(p).isDirectory() ? p : dirname(p);
  const page = statSync(p).isDirectory() ? '/' : '/' + basename(p);
  server = await serve(root, extra);
  url = server.base + page;
} else if (REF) {
  server = await serve(OUT, extra);
}

const shots = [];
try {
  await pw('open', url, ...(flag('headed') ? ['--headed'] : []));
  for (const scheme of SCHEMES) {
    await pw('set-color-scheme', scheme);
    for (const w of WIDTHS) {
      await pw('resize', String(w), String(HEIGHT));
      await pw('goto', url);
      await new Promise((r) => setTimeout(r, WAIT));
      const where = `${scheme} ${w}`;
      const c = await evalJson(CHECKS);
      if (c.overflow.length) add('FAIL', where, `horizontal overflow: ${c.overflow.join('; ')}`);
      for (const h of c.longHeads) add('FAIL', where, `heading over two lines: ${h}`);
      if (c.lowContrast.length) add('FAIL', where, `low contrast: ${c.lowContrast.join('; ')}`);
      if (c.tinyText) add('WARN', where, `${c.tinyText} text element(s) under 12px`);
      if (c.smallTargets.length && w <= 768) add('WARN', where, `tap targets under 24px: ${c.smallTargets.join('; ')}`);
      if (scheme === SCHEMES[0] && w === WIDTHS[0]) {
        if (c.imgNoSize.length) add('WARN', 'all', `img without width/height (CLS): ${c.imgNoSize.join(', ')}`);
        if (c.imgNoAlt.length) add('FAIL', 'all', `img without alt: ${c.imgNoAlt.join(', ')}`);
        if (c.unnamed.length) add('FAIL', 'all', `controls without accessible name: ${c.unnamed.join('; ')}`);
        if (!c.title) add('WARN', 'all', 'no <title>');
        if (!c.lang) add('WARN', 'all', 'no <html lang>');
        if (!c.viewportMeta) add('FAIL', 'all', 'no <meta name=viewport>');
        if (c.zoomBlocked) add('FAIL', 'all', 'viewport meta blocks zoom');
      }
      const file = join(OUT, `${scheme}-${w}.png`);
      await pw('screenshot', '--full-page', `--filename=${file}`);
      shots.push(file);
    }
  }
  // keyboard focus, first scheme, widest width
  await pw('set-color-scheme', SCHEMES[0]);
  await pw('resize', String(WIDTHS[0]), String(HEIGHT));
  await pw('goto', url);
  const stops = [];
  for (let i = 0; i < 6; i++) {
    await pw('press', 'Tab');
    const f = await evalJson(FOCUS);
    if (f.none) break;
    stops.push(f);
    if (!f.ring) add('FAIL', 'keyboard', `no visible focus ring on ${f.tag} "${f.text}"`);
    if (f.covered) add('WARN', 'keyboard', `focused ${f.tag} "${f.text}" is covered by another element`);
  }
  if (!stops.length) add('WARN', 'keyboard', 'Tab reaches no element');
  else await pw('screenshot', `--filename=${join(OUT, 'focus.png')}`), shots.push(join(OUT, 'focus.png'));
  // reduced motion: content must still be there
  await pw('set-reduced-motion', 'reduce');
  await pw('goto', url);
  await new Promise((r) => setTimeout(r, WAIT));
  const rm = await evalJson(CHECKS);
  if (rm.hiddenText) add('FAIL', 'reduced-motion', `${rm.hiddenText} text element(s) stay invisible (opacity≈0) with prefers-reduced-motion`);
  await pw('screenshot', '--full-page', `--filename=${join(OUT, 'reduced-motion.png')}`);
  shots.push(join(OUT, 'reduced-motion.png'));
  await pw('clear-reduced-motion');
  // console
  const con = await pw('console', 'warning');
  const m = con.match(/Errors:\s*(\d+),\s*Warnings:\s*(\d+)/);
  if (m && +m[1]) add('FAIL', 'console', `${m[1]} console error(s) — run: playwright-cli ${S} console error`);
  if (m && +m[2]) add('WARN', 'console', `${m[2]} console warning(s)`);
  // side-by-side with a reference design
  if (REF) {
    copyFileSync(resolve(REF), join(OUT, '_reference' + extname(REF)));
    for (const w of WIDTHS.slice(0, 1)) {
      const html = `<!doctype html><meta charset=utf-8><style>body{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:24px;background:#777;font:600 20px system-ui;color:#fff}figure{margin:0}figcaption{padding:12px}img{width:100%;display:block}</style>
<figure><figcaption>reference</figcaption><img src="/_ref${extname(REF)}"></figure><figure><figcaption>build ${SCHEMES[0]} ${w}</figcaption><img src="/_shot.png"></figure>`;
      extra['/_compare.html'] = { type: 'text/html', body: html };
      extra[`/_ref${extname(REF)}`] = { type: MIME[extname(REF).toLowerCase()] || 'image/png', body: readFileSync(resolve(REF)) };
      extra['/_shot.png'] = { type: 'image/png', body: readFileSync(join(OUT, `${SCHEMES[0]}-${w}.png`)) };
      await pw('resize', '2000', '1200');
      await pw('goto', server.base + '/_compare.html');
      await new Promise((r) => setTimeout(r, 300));
      const file = join(OUT, `compare-${w}.png`);
      await pw('screenshot', '--full-page', `--filename=${file}`);
      shots.push(file);
    }
  }
} catch (e) {
  add('FAIL', 'run', e.message.split('\n')[0]);
} finally {
  await pw('close').catch(() => {});
  server?.srv.close();
}

const order = { FAIL: 0, WARN: 1 };
results.sort((a, b) => order[a.lvl] - order[b.lvl]);
// Same finding at several viewports prints once, with every place it was seen.
const grouped = new Map();
for (const r of results) {
  const k = r.lvl + ' ' + r.msg;
  if (!grouped.has(k)) grouped.set(k, { ...r, where: [] });
  grouped.get(k).where.push(r.where);
}
for (const r of grouped.values()) console.log(`${r.lvl.padEnd(4)} [${r.where.join(', ')}] ${r.msg}`);
if (!results.length) console.log('PASS no measured problems');
console.log(`\nScreenshots (look at every one):\n${shots.map((s) => '  ' + s).join('\n')}`);
const fails = results.filter((r) => r.lvl === 'FAIL').length;
console.log(`\n${fails} FAIL, ${results.filter((r) => r.lvl === 'WARN').length} WARN`);
writeFileSync(join(OUT, 'report.json'), JSON.stringify({ url: target, results, shots }, null, 2));
process.exit(fails ? 1 : 0);
