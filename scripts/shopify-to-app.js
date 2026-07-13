/* Generic Shopify export → app CSV converter
   Usage: node scripts/shopify-to-app.js --src "data/file.csv" --out "data/products-X-Y.csv" --brand brandid --cat handbags
   The --cat flag is optional, defaults to handbags. */

const fs   = require('fs');
const path = require('path');

/* ── CLI args ─────────────────────────────────────────────── */
const args = {};
process.argv.slice(2).forEach((a, i, arr) => {
  if (a.startsWith('--')) args[a.slice(2)] = arr[i + 1];
});

const ROOT = path.join(__dirname, '..');
const SRC  = path.resolve(ROOT, args.src  || '');
const OUT  = path.resolve(ROOT, args.out  || '');
const BRAND = (args.brand || '').trim();
const CAT   = (args.cat   || 'handbags').trim();

if (!SRC || !OUT || !BRAND) {
  console.error('Usage: node shopify-to-app.js --src <file> --out <file> --brand <id> [--cat <category>]');
  process.exit(1);
}
if (!fs.existsSync(SRC)) { console.error('Missing source file: ' + SRC); process.exit(1); }

/* ── RFC4180 parser ───────────────────────────────────────── */
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i+1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += ch;
    } else {
      if      (ch === '"')  inQ = true;
      else if (ch === ',')  { row.push(field); field = ''; }
      else if (ch === '\r') { /* skip */ }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += ch;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function norm(s) {
  return String(s == null ? '' : s).replace(/\r\n|\n|\r/g,' ').replace(/"/g,"'").replace(/\s+/g,' ').trim();
}
function esc(v) { const s = norm(v); return s.includes(',') ? '"' + s + '"' : s; }
function badge(tags) {
  const t = String(tags||'').toLowerCase();
  if (t.includes('hot')) return 'Hot';
  if (t.includes('new arrival') || t.includes('new-arrival')) return 'New';
  return '';
}

/* ── Main ─────────────────────────────────────────────────── */
const matrix = parseCSV(fs.readFileSync(SRC, 'utf8'));
if (!matrix.length) { console.error('File appears empty'); process.exit(1); }

const header = matrix[0];
const idx = {};
header.forEach((h, i) => { idx[h.trim()] = i; });

['Handle','Title','Image Src','Image Position'].forEach(c => {
  if (idx[c] === undefined) { console.error('Missing column: ' + c); process.exit(1); }
});

const grouped = new Map();
for (let r = 1; r < matrix.length; r++) {
  const cols = matrix[r];
  const handle = (cols[idx['Handle']] || '').trim();
  if (!handle) continue;

  if (!grouped.has(handle)) grouped.set(handle, { handle, title:'', tags:'', images:[] });
  const g = grouped.get(handle);

  const title = (cols[idx['Title']] || '').trim();
  if (title) g.title = title;

  if (idx['Tags'] !== undefined) {
    const t = (cols[idx['Tags']] || '');
    if (t) g.tags = t;
  }

  const imgUrl = (cols[idx['Image Src']] || '').trim();
  if (imgUrl && imgUrl.startsWith('http')) {
    const pos = parseInt(cols[idx['Image Position']], 10);
    g.images.push({ pos: isFinite(pos) ? pos : 999, url: imgUrl });
  }
}

const outRows = [];
for (const [, g] of grouped) {
  g.images.sort((a, b) => a.pos - b.pos);
  const seen = new Set(), urls = [];
  for (const img of g.images) {
    if (!seen.has(img.url)) { seen.add(img.url); urls.push(img.url); }
  }
  if (!urls.length) continue;

  const name = norm(g.title || g.handle);
  outRows.push([
    esc(name),
    esc(urls[0]),
    esc(CAT),
    esc(BRAND),
    esc(urls.join('|')),
    esc('Hi I want ' + name),
    esc(badge(g.tags))
  ].join(','));
}

const lines = ['name,image,category,brand,images,whatsapp_text,badge', ...outRows];
fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');

console.log(`[${BRAND}] ${grouped.size} handles → ${outRows.length} products → ${path.basename(OUT)}`);
