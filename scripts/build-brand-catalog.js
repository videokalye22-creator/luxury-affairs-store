// Converts a raw Shopify product export into the app's catalog CSV format.
// Usage: node build-brand-catalog.js <sourceFile> <category> <brand> [outputFile]
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const [sourceFile, category, brand, outputFile] = process.argv.slice(2);
if (!sourceFile || !category || !brand) {
  console.error('Usage: node build-brand-catalog.js <sourceFile> <category> <brand> [outputFile]');
  process.exit(1);
}

const dataDir = path.join(__dirname, '..', 'data');
const sourcePath = path.join(dataDir, sourceFile);
const outputPath = path.join(dataDir, outputFile || `products-${category}-${brand}.csv`);

function csvField(value) {
  const text = String(value || '').replace(/\r?\n|\r/g, ' ').trim();
  return /[",]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function norm(str) {
  return String(str == null ? '' : str)
    .replace(/\r\n|\n|\r/g, ' ')
    .replace(/"/g, "'")
    .trim();
}

function toBadge(tags) {
  const t = String(tags || '').toLowerCase();
  if (t.includes('hot')) return 'Hot';
  if (t.includes('new')) return 'New';
  return '';
}

const raw = fs.readFileSync(sourcePath, 'utf8');
const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true, bom: true });

const products = new Map();
rows.forEach((row) => {
  if (!row.Handle) return;
  if (!products.has(row.Handle)) {
    products.set(row.Handle, {
      name: norm(row.Title || row.Handle),
      tags: row.Tags || '',
      images: []
    });
  }
  const image = row['Image Src'];
  if (image && image.startsWith('http')) {
    products.get(row.Handle).images.push({
      url: image,
      position: Number(row['Image Position']) || 0
    });
  }
});

const outRows = [];
products.forEach((product) => {
  if (!product.images.length) return;
  const seen = new Set();
  const images = product.images
    .sort((a, b) => a.position - b.position)
    .map((img) => img.url)
    .filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });

  outRows.push({
    name: product.name,
    image: images[0],
    category,
    brand,
    images: images.join('|'),
    whatsapp_text: `Hi I want ${product.name}`,
    badge: toBadge(product.tags)
  });
});

const header = 'name,image,category,brand,images,whatsapp_text,badge';
const lines = [header].concat(outRows.map((r) => (
  [r.name, r.image, r.category, r.brand, r.images, r.whatsapp_text, r.badge].map(csvField).join(',')
)));
fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf8');

console.log(`Built ${outRows.length} ${brand} ${category} products from ${products.size} handles.`);
console.log(`Written to ${outputPath}`);
