/* Regenerate data/products-watches-rolex.csv from data/Rolex.csv (Shopify export).
   Keeps the Shopify CDN image links as-is (no R2 upload/download).
   Self-contained: includes an RFC4180 parser so no external deps are needed.
   Run: node scripts/rolex-to-watches.js */
const fs = require('fs');
const path = require('path');

const ROLEX_CSV = path.join(__dirname, '..', 'data', 'rolix.csv');
const OUT_CSV = path.join(__dirname, '..', 'data', 'products-watches-rolex.csv');

/* RFC4180 parser: handles quoted fields, "" escaped quotes, embedded newlines. */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\r') { /* ignore */ }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += ch;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function norm(str) {
  return String(str == null ? '' : str)
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/"/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/* Front-end parser toggles on every quote, so never emit a literal " inside a field. */
function escapeCsvField(value) {
  const s = norm(value);
  if (s.includes(',')) return `"${s.replace(/"/g, "'")}"`;
  return s;
}

function toBadge(tags) {
  const t = String(tags || '').toLowerCase();
  if (t.includes('hot')) return 'Hot';
  if (t.includes('new')) return 'New';
  return '';
}

function main() {
  if (!fs.existsSync(ROLEX_CSV)) throw new Error(`Missing file: ${ROLEX_CSV}`);

  const raw = fs.readFileSync(ROLEX_CSV, 'utf8');
  const matrix = parseCSV(raw);
  if (!matrix.length) throw new Error('Rolex.csv appears empty');

  const header = matrix[0];
  const idx = {};
  header.forEach((h, i) => { idx[h.trim()] = i; });

  const need = ['Handle', 'Title', 'Image Src', 'Image Position'];
  need.forEach((c) => { if (idx[c] === undefined) throw new Error(`Rolex.csv missing column: ${c}`); });

  const grouped = new Map();
  for (let r = 1; r < matrix.length; r++) {
    const cols = matrix[r];
    const handle = (cols[idx['Handle']] || '').trim();
    if (!handle) continue;

    if (!grouped.has(handle)) {
      grouped.set(handle, { handle, title: '', tags: '', images: [] });
    }
    const g = grouped.get(handle);

    const title = (cols[idx['Title']] || '').trim();
    if (title) g.title = title;
    const tags = idx['Tags'] !== undefined ? (cols[idx['Tags']] || '') : '';
    if (tags) g.tags = tags;

    const imgUrl = (cols[idx['Image Src']] || '').trim();
    if (imgUrl && imgUrl.startsWith('http')) {
      const pos = parseInt(cols[idx['Image Position']], 10);
      g.images.push({ pos: Number.isFinite(pos) ? pos : 0, url: imgUrl });
    }
  }

  const outRows = [];
  for (const [, g] of grouped) {
    g.images.sort((a, b) => a.pos - b.pos);
    const seen = new Set();
    const urls = [];
    for (const img of g.images) {
      if (seen.has(img.url)) continue;
      seen.add(img.url);
      urls.push(img.url);
    }
    if (!urls.length) continue;

    const name = norm(g.title || g.handle);
    outRows.push({
      name,
      image: urls[0],
      category: 'watches',
      brand: 'rolex',
      images: urls.join('|'),
      whatsapp_text: `Hi I want ${name}`,
      badge: toBadge(g.tags),
    });
  }

  const headerLine = 'name,image,category,brand,images,whatsapp_text,badge';
  const toLine = (r) => ([
    escapeCsvField(r.name),
    escapeCsvField(r.image),
    escapeCsvField(r.category),
    escapeCsvField(r.brand),
    escapeCsvField(r.images),
    escapeCsvField(r.whatsapp_text),
    escapeCsvField(r.badge),
  ]).join(',');

  const out = [headerLine].concat(outRows.map(toLine)).join('\n') + '\n';
  fs.writeFileSync(OUT_CSV, out, 'utf8');

  console.log(`Rolex handles found: ${grouped.size}`);
  console.log(`Watches written: ${outRows.length}`);
  console.log(`Output: ${OUT_CSV}`);
}

main();
