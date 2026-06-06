const fs   = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const R2_PUBLIC_URL = 'https://pub-461f36b5362b494c9d4e4eb82ef799b5.r2.dev';
const INPUT_CSV     = path.join(__dirname, '..', 'data', 'chanel - 1.csv');
const OUTPUT_CSV    = path.join(__dirname, '..', 'data', 'chanel-processed.csv');

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const raw  = fs.readFileSync(INPUT_CSV, 'utf8');
const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true });

// Group rows by Handle
const products = new Map();
for (const row of rows) {
  const handle = row['Handle'];
  const title  = row['Title'];
  const imgSrc = row['Image Src'];
  const imgPos = parseInt(row['Image Position'], 10) || 0;
  if (!handle) continue;
  if (!products.has(handle)) {
    products.set(handle, { handle, title: title || handle, images: [] });
  }
  if (imgSrc && imgSrc.startsWith('http')) {
    products.get(handle).images.push({ pos: imgPos, url: imgSrc });
  }
}

const lines = ['name,image,category,brand,images,whatsapp_text,badge'];

for (const [handle, product] of products) {
  if (product.images.length === 0) continue;

  product.images.sort((a, b) => a.pos - b.pos);
  const count = product.images.length;

  const r2Urls = [];
  for (let i = 1; i <= count; i++) {
    r2Urls.push(`${R2_PUBLIC_URL}/chanel/${handle}-${i}.webp`);
  }

  const name    = product.title.replace(/"/g, '""');
  const mainImg = r2Urls[0];
  const allImgs = r2Urls.join('|');
  const waText  = `Hi I want ${product.title}`;

  lines.push(`"${name}",${mainImg},handbags,chanel,"${allImgs}","${waText}",`);
}

fs.writeFileSync(OUTPUT_CSV, lines.join('\r\n'), 'utf8');
console.log('Written', lines.length - 1, 'products to', OUTPUT_CSV);

// Also print first 3 rows for verification
lines.slice(0, 4).forEach(l => console.log(l.substring(0, 120)));
