#!/usr/bin/env node
// DESIGN.md toolbox. No dependencies, Node 18+.
//
//   node design.mjs list [--q <text>]            brands in the library, optionally filtered
//   node design.mjs show <brand>                 print a brand's DESIGN.md path
//   node design.mjs tokens <DESIGN.md> [--out f] frontmatter tokens -> CSS custom properties
//   node design.mjs check <DESIGN.md>            validate against the spec and the manifesto
//   node design.mjs drift <DESIGN.md> <src...>   colours used in source that are not tokens
//
// Exit code 1 when `check` has FAILs or `drift` finds stray colours.

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, basename, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BRANDS = join(HERE, '..', 'brands');

// ---------- parsing ----------

function splitFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  return m ? { yaml: m[1], body: m[2] } : { yaml: null, body: text };
}

function scalar(v) {
  v = v.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

// Minimal YAML: nested maps by indentation, scalar values. Enough for DESIGN.md frontmatter.
function parseYaml(src) {
  const root = {};
  const stack = [{ indent: -1, obj: root }];
  for (const raw of src.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const indent = raw.match(/^ */)[0].length;
    const line = raw.trim();
    const i = line.indexOf(':');
    if (i < 0) continue;
    const key = line.slice(0, i).trim().replace(/^["']|["']$/g, '');
    const rest = line.slice(i + 1);
    while (stack.length > 1 && stack.at(-1).indent >= indent) stack.pop();
    const parent = stack.at(-1).obj;
    if (rest.trim() === '') {
      parent[key] = {};
      stack.push({ indent, obj: parent[key] });
    } else {
      parent[key] = scalar(rest);
    }
  }
  return root;
}

function load(file) {
  const text = readFileSync(file, 'utf8');
  const { yaml, body } = splitFrontmatter(text);
  return { text, body, fm: yaml ? parseYaml(yaml) : null };
}

function resolveRef(fm, v, depth = 0) {
  if (typeof v !== 'string' || depth > 8) return v;
  const m = v.match(/^\{([a-z-]+)\.([\w-]+)\}$/i);
  if (!m) return v;
  const hit = fm?.[m[1]]?.[m[2]];
  return hit === undefined ? v : resolveRef(fm, hit, depth + 1);
}

// ---------- colour maths ----------

function hexToRgb(h) {
  h = String(h).replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h.slice(0, 6))) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function luminance([r, g, b]) {
  const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const A = hexToRgb(a), B = hexToRgb(b);
  if (!A || !B) return null;
  const [x, y] = [luminance(A), luminance(B)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
const normHex = (h) => {
  const rgb = hexToRgb(h);
  return rgb ? '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('') : null;
};

// ---------- commands ----------

function brandSummary(file) {
  const { fm, body } = load(file);
  let d = fm?.description;
  if (!d) d = (body.split(/\r?\n\r?\n/).find((p) => p.trim() && !p.trim().startsWith('#')) || '').replace(/\s+/g, ' ');
  return String(d).trim();
}

function cmdList(args) {
  const q = args.includes('--q') ? args[args.indexOf('--q') + 1].toLowerCase() : null;
  const rows = readdirSync(BRANDS).filter((f) => f.endsWith('.md')).sort().map((f) => {
    const s = brandSummary(join(BRANDS, f));
    return { brand: basename(f, '.md'), s };
  }).filter((r) => !q || (r.brand + ' ' + r.s).toLowerCase().includes(q));
  for (const r of rows) console.log(`${r.brand.padEnd(14)} ${r.s.slice(0, 150)}${r.s.length > 150 ? '…' : ''}`);
  console.log(`\n${rows.length} brand(s). Full file: node design.mjs show <brand>`);
}

function cmdShow([brand]) {
  const f = join(BRANDS, `${brand}.md`);
  if (!existsSync(f)) { console.error(`no brand "${brand}". Try: node design.mjs list --q ${brand}`); process.exit(2); }
  console.log(resolve(f));
}

function kebab(s) { return String(s).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(); }

function cmdTokens([file, ...rest]) {
  const { fm } = load(file);
  if (!fm) { console.error('no YAML frontmatter: write tokens first (see templates/DESIGN.template.md)'); process.exit(2); }
  const out = [':root {'];
  for (const [k, v] of Object.entries(fm.colors || {})) out.push(`  --color-${k}: ${resolveRef(fm, v)};`);
  for (const [k, v] of Object.entries(fm.spacing || {})) out.push(`  --space-${k}: ${resolveRef(fm, v)};`);
  for (const [k, v] of Object.entries(fm.rounded || {})) out.push(`  --radius-${k}: ${resolveRef(fm, v)};`);
  for (const [k, t] of Object.entries(fm.typography || {})) {
    if (typeof t !== 'object') continue;
    if (t.fontFamily) out.push(`  --text-${k}-family: ${/[\s]/.test(t.fontFamily) && !t.fontFamily.includes(',') ? `"${t.fontFamily}"` : t.fontFamily};`);
    if (t.fontSize) out.push(`  --text-${k}-size: ${t.fontSize};`);
    if (t.fontWeight) out.push(`  --text-${k}-weight: ${t.fontWeight};`);
    if (t.lineHeight) out.push(`  --text-${k}-leading: ${t.lineHeight};`);
    if (t.letterSpacing !== undefined) out.push(`  --text-${k}-tracking: ${t.letterSpacing === 0 ? '0' : t.letterSpacing};`);
  }
  out.push('}', '');
  // One utility class per typography role, so components never restate the five properties.
  for (const k of Object.keys(fm.typography || {})) {
    out.push(`.text-${k} { font-family: var(--text-${k}-family); font-size: var(--text-${k}-size); font-weight: var(--text-${k}-weight); line-height: var(--text-${k}-leading); letter-spacing: var(--text-${k}-tracking); }`);
  }
  const css = out.join('\n') + '\n';
  const o = rest.includes('--out') ? rest[rest.indexOf('--out') + 1] : null;
  if (o) { writeFileSync(o, css); console.log(`wrote ${o}`); } else process.stdout.write(css);
}

const REQUIRED_SECTIONS = ['Overview', 'Colors', 'Typography', 'Layout', 'Components', "Do's and Don'ts", 'Responsive'];

function cmdCheck([file]) {
  const { fm, body } = load(file);
  const res = [];
  const add = (lvl, msg) => res.push([lvl, msg]);
  if (!fm) add('FAIL', 'no YAML frontmatter with tokens');
  else {
    for (const k of ['name', 'description', 'colors', 'typography', 'spacing', 'rounded']) if (!fm[k]) add('FAIL', `frontmatter missing "${k}"`);
    // every {ref} resolves
    const walk = (o, path) => {
      for (const [k, v] of Object.entries(o || {})) {
        if (v && typeof v === 'object') walk(v, `${path}.${k}`);
        else if (typeof v === 'string' && /^\{.*\}$/.test(v) && resolveRef(fm, v) === v) add('FAIL', `${path}.${k}: unresolved ref ${v}`);
      }
    };
    walk(fm, 'fm');
    const c = fm.colors || {};
    const pick = (...names) => names.map((n) => c[n]).find(Boolean);
    const ink = pick('ink', 'text', 'foreground', 'on-canvas', 'on-surface');
    const ground = pick('canvas', 'background', 'surface', 'bg');
    const primary = pick('primary', 'accent');
    const onPrimary = pick('on-primary', 'on-accent');
    const pair = (a, b, label, min) => {
      const r = contrast(resolveRef(fm, a), resolveRef(fm, b));
      if (r === null) return add('WARN', `${label}: cannot measure (not hex)`);
      add(r >= min ? 'PASS' : 'FAIL', `${label} contrast ${r.toFixed(2)}:1 (min ${min})`);
    };
    if (ink && ground) pair(ink, ground, 'ink/canvas', 4.5); else add('WARN', 'no ink/canvas colour roles to check contrast (name them ink + canvas)');
    if (primary && onPrimary) pair(onPrimary, primary, 'on-primary/primary', 4.5);
    for (const [k, v] of Object.entries(c)) {
      const rgb = hexToRgb(resolveRef(fm, v));
      if (!rgb) continue;
      const [r, g, b] = rgb;
      // violet/indigo default: blue-dominant with red above green
      if (/primary|accent/.test(k) && b > 150 && r > g && b > r && b - g > 60) add('WARN', `colors.${k} ${v} is in the violet/indigo "assistant" range — keep only if it is the brand's`);
    }
    const fams = new Set(Object.values(fm.typography || {}).map((t) => t?.fontFamily).filter(Boolean).filter((f) => !/mono/i.test(f)));
    add(fams.size <= 2 ? 'PASS' : 'WARN', `${fams.size} non-mono font famil${fams.size === 1 ? 'y' : 'ies'} (manifesto: 2 max)`);
    const radii = Object.entries(fm.rounded || {}).filter(([k]) => !/pill|full|none/.test(k)).map(([, v]) => parseFloat(v)).filter((n) => !isNaN(n));
    const soft = radii.filter((n) => n >= 9 && n <= 16);
    if (soft.length) add('WARN', `radii ${soft.join(', ')}px sit in the 9–16px "soft" band — manifesto prefers square or full pill, decided once`);
    if (!fm.components) add('WARN', 'no components block: buttons, inputs and cards will be improvised');
  }
  for (const s of REQUIRED_SECTIONS) {
    const re = new RegExp(`^##\\s+${s.replace(/[.*+?^${}()|[\]\\']/g, '.')}`, 'mi');
    if (!re.test(body)) add('FAIL', `missing section "## ${s}"`);
  }
  for (const [lvl, msg] of res) console.log(`${lvl.padEnd(4)} ${msg}`);
  const fails = res.filter(([l]) => l === 'FAIL').length;
  console.log(`\n${fails} FAIL, ${res.filter(([l]) => l === 'WARN').length} WARN`);
  process.exit(fails ? 1 : 0);
}

const SRC_EXT = new Set(['.css', '.scss', '.sass', '.less', '.html', '.vue', '.svelte', '.astro', '.jsx', '.tsx', '.js', '.ts']);
function* files(p) {
  const st = statSync(p);
  if (st.isFile()) { if (SRC_EXT.has(extname(p))) yield p; return; }
  for (const f of readdirSync(p)) {
    if (/^(node_modules|dist|build|\.git|\.next|\.taste-skill|coverage)$/.test(f)) continue;
    yield* files(join(p, f));
  }
}

function cmdDrift([file, ...srcs]) {
  const { fm } = load(file);
  const palette = new Set(Object.values(fm?.colors || {}).map((v) => normHex(resolveRef(fm, v))).filter(Boolean));
  const ok = new Set(['#000000', '#ffffff', ...palette]);
  let stray = 0;
  for (const src of srcs.length ? srcs : ['.']) {
    for (const f of files(src)) {
      readFileSync(f, 'utf8').split(/\r?\n/).forEach((line, i) => {
        for (const m of line.matchAll(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi)) {
          const h = normHex(m[0]);
          if (h && !ok.has(h)) { stray++; console.log(`${f}:${i + 1} - ${m[0]} not in DESIGN.md palette`); }
        }
        if (/rgba?\(\s*\d/.test(line) && !/var\(--/.test(line)) { stray++; console.log(`${f}:${i + 1} - literal rgb() colour; use a token`); }
      });
    }
  }
  console.log(stray ? `\n${stray} stray colour(s)` : '✓ every colour is a token');
  process.exit(stray ? 1 : 0);
}

const [cmd, ...args] = process.argv.slice(2);
const cmds = { list: cmdList, show: cmdShow, tokens: cmdTokens, check: cmdCheck, drift: cmdDrift };
if (!cmds[cmd]) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 10).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(cmd ? 2 : 0);
}
cmds[cmd](args);
