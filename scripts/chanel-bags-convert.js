/* Convert data/chanel baghands.csv (Shopify export) →
   data/products-handbags-chanel.csv (app format)
   Run: node scripts/chanel-bags-convert.js */
const fs   = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'data', 'chanel baghands.csv');
const OUT = path.join(__dirname, '..', 'data', 'products-handbags-chanel.csv');

/* RFC4180 parser — handles quoted fields, embedded newlines, "" escapes */
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
  return String(s == null ? '' : s).replace(/\r\n|\n|\r/g, ' ').replace(/"/g, "'").replace(/\s+/g, ' ').trim();
}

function esc(v) {
  const s = norm(v);
  return s.includes(',') ? '"' + s + '"' : s;
}

function toBadge(tags) {
  const t = String(tags || '').toLowerCase();
  if (t.includes('hot')) return 'Hot';
  if (t.includes('new arrival')) return 'New';
  return '';
}

function main() {
  if (!fs.existsSync(SRC)) throw new Error('Missing: ' + SRC);
  const matrix = parseCSV(fs.readFileSync(SRC, 'utf8'));
  if (!matrix.length) throw new Error('File appears empty');

  const header = matrix[0];
  const idx = {};
  header.forEach((h, i) => { idx[h.trim()] = i; });

  const need = ['Handle', 'Title', 'Image Src', 'Image Position'];
  need.forEach(c => { if (idx[c] === undefined) throw new Error('Missing column: ' + c); });

  const grouped = new Map();
  for (let r = 1; r < matrix.length; r++) {
    const cols = matrix[r];
    const handle = (cols[idx['Handle']] || '').trim();
    if (!handle) continue;

    if (!grouped.has(handle)) grouped.set(handle, { handle, title: '', tags: '', images: [] });
    const g = grouped.get(handle);

    const title = (cols[idx['Title']] || '').trim();
    if (title) g.title = title;

    const tags = idx['Tags'] !== undefined ? (cols[idx['Tags']] || '') : '';
    if (tags) g.tags = tags;

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
    outRows.push({
      name,
      image:         urls[0],
      category:      'handbags',
      brand:         'chanel',
      images:        urls.join('|'),
      whatsapp_text: 'Hi I want ' + name,
      badge:         toBadge(g.tags),
    });
  }

  const lines = ['name,image,category,brand,images,whatsapp_text,badge'];
  for (const r of outRows) {
    lines.push([esc(r.name), esc(r.image), esc(r.category), esc(r.brand),
                esc(r.images), esc(r.whatsapp_text), esc(r.badge)].join(','));
  }
  fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');

  console.log('Handles found : ' + grouped.size);
  console.log('Products written: ' + outRows.length);
  console.log('Output : ' + OUT);
}

main();
