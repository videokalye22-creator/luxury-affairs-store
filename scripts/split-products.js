/* Split the clean data/products.csv into one file per category+brand,
   e.g. data/products-footwear-chanel.csv. Keeps each file small and
   well under Cloudflare's 25 MiB per-asset limit.

   Preserves each original line verbatim; only parses (quote-aware) to
   read the category/brand columns so quoted commas don't break it.
   Prints a CATALOG_FILES manifest (grouped by category) to paste into
   js/main.js. */
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const src = path.join(dataDir, 'products.csv');
const text = fs.readFileSync(src, 'utf8');

// Normalise to \n lines (matches the browser parseCSV which split('\n'))
const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
const header = lines[0];

// Return field at the given index (quote-aware). category=2, brand=3.
function fieldAt(line, index) {
  let field = 0, cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === ',' && !inQ) {
      if (field === index) return cur.trim();
      field++; cur = '';
    } else {
      cur += ch;
    }
  }
  return field === index ? cur.trim() : '';
}

function slug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown';
}

// Remove any previously generated split files so stale ones don't linger.
fs.readdirSync(dataDir)
  .filter((f) => /^products-.+\.csv$/.test(f))
  .forEach((f) => fs.unlinkSync(path.join(dataDir, f)));

const buckets = {}; // key: "category|brand" -> { category, brand, rows: [] }
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  const category = slug(fieldAt(line, 2));
  const brand = slug(fieldAt(line, 3));
  const key = category + '|' + brand;
  if (!buckets[key]) buckets[key] = { category, brand, rows: [] };
  buckets[key].rows.push(line);
}

const summary = [];
const manifest = {};
Object.keys(buckets).forEach((key) => {
  const { category, brand, rows } = buckets[key];
  const name = 'products-' + category + '-' + brand + '.csv';
  const out = path.join(dataDir, name);
  fs.writeFileSync(out, header + '\n' + rows.join('\n') + '\n', 'utf8');
  const mb = (fs.statSync(out).size / (1024 * 1024)).toFixed(2);
  summary.push({ file: 'data/' + name, rows: rows.length, sizeMB: mb });
  (manifest[category] = manifest[category] || []).push('data/' + name);
});

// Keep manifest file lists sorted for stable diffs.
Object.keys(manifest).forEach((c) => manifest[c].sort());

summary.sort((a, b) => Number(b.sizeMB) - Number(a.sizeMB));
console.table(summary);
console.log('\nLargest file: ' + summary[0].sizeMB + ' MB (limit 25 MiB)\n');
console.log('CATALOG_FILES manifest (paste into js/main.js):\n');
console.log(JSON.stringify(manifest, null, 2));
