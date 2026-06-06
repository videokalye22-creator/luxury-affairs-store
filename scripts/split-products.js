/* Split data/products.csv into per-category files.
   Preserves each original line verbatim; only parses (quote-aware)
   to read the category column so quoted commas don't break it. */
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const src = path.join(dataDir, 'products.csv');
const text = fs.readFileSync(src, 'utf8');

// Normalise to \n lines (matches the browser parseCSV which split('\n'))
const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
const header = lines[0];

function categoryOf(line) {
  // Walk fields, quote-aware, return the 3rd field (index 2 = category)
  let field = 0, cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === ',' && !inQ) {
      if (field === 2) return cur.trim();
      field++; cur = '';
    } else {
      cur += ch;
    }
  }
  return field === 2 ? cur.trim() : '';
}

// Keep each chunk comfortably under Cloudflare's 25 MiB per-asset limit.
const MAX_ROWS = 9000;

const buckets = {};
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  const cat = categoryOf(line) || 'uncategorized';
  (buckets[cat] = buckets[cat] || []).push(line);
}

const summary = [];
const manifest = {};
Object.keys(buckets).forEach((cat) => {
  const rows = buckets[cat];
  const chunkCount = Math.ceil(rows.length / MAX_ROWS);
  manifest[cat] = [];
  for (let c = 0; c < chunkCount; c++) {
    const slice = rows.slice(c * MAX_ROWS, (c + 1) * MAX_ROWS);
    const name = chunkCount === 1
      ? 'products-' + cat + '.csv'
      : 'products-' + cat + '-' + (c + 1) + '.csv';
    const out = path.join(dataDir, name);
    fs.writeFileSync(out, header + '\n' + slice.join('\n') + '\n', 'utf8');
    const mb = (fs.statSync(out).size / (1024 * 1024)).toFixed(2);
    summary.push({ category: cat, rows: slice.length, sizeMB: mb, file: 'data/' + name });
    manifest[cat].push('data/' + name);
  }
});

summary.sort((a, b) => Number(b.sizeMB) - Number(a.sizeMB));
console.table(summary);
console.log('\nCATALOG_FILES manifest (paste into main.js):\n');
console.log(JSON.stringify(manifest, null, 2));
