const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const ROLEX_CSV = path.join(__dirname, '..', 'data', 'Rolex.csv');
const PRODUCTS_CSV = path.join(__dirname, '..', 'data', 'products.csv');

function norm(str) {
  return String(str == null ? '' : str)
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/"/g, "'");
}

function escapeCsvField(value) {
  const s = norm(value).trim();
  // Our front-end CSV parser toggles on every quote, so we avoid double-quotes inside fields.
  // We only add quotes when needed (commas).
  if (s.includes(',') || s.startsWith(' ') || s.endsWith(' ')) {
    return `"${s.replace(/"/g, "'")}"`;
  }
  return s;
}

function toBadge(tags) {
  const t = String(tags || '').toLowerCase();
  if (t.includes('hot')) return 'Hot';
  if (t.includes('new')) return 'New';
  return '';
}

function rowKey(r) {
  return `${String(r.category || '').toLowerCase()}|${String(r.brand || '').toLowerCase()}|${String(r.name || '').toLowerCase()}`;
}

function main() {
  if (!fs.existsSync(ROLEX_CSV)) {
    throw new Error(`Missing file: ${ROLEX_CSV}`);
  }
  if (!fs.existsSync(PRODUCTS_CSV)) {
    throw new Error(`Missing file: ${PRODUCTS_CSV}`);
  }

  const rolexRaw = fs.readFileSync(ROLEX_CSV, 'utf8');
  const productsRaw = fs.readFileSync(PRODUCTS_CSV, 'utf8');

  const existingRows = parse(productsRaw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  });

  const existing = new Set(existingRows.map(rowKey));

  const rolexRows = parse(rolexRaw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  });

  // Group by Handle: one product can have multiple images (different Image Position).
  const grouped = new Map();
  for (const row of rolexRows) {
    const handle = row['Handle'];
    if (!handle) continue;

    if (!grouped.has(handle)) {
      grouped.set(handle, {
        handle,
        title: row['Title'] || handle,
        tags: row['Tags'] || '',
        images: [], // {pos,url}
      });
    }

    const g = grouped.get(handle);
    g.title = row['Title'] || g.title;
    g.tags = row['Tags'] || g.tags;

    const imgUrl = row['Image Src'];
    if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
      const pos = parseInt(row['Image Position'], 10);
      g.images.push({ pos: Number.isFinite(pos) ? pos : 0, url: imgUrl });
    }
  }

  const newRows = [];
  for (const [, g] of grouped) {
    // Sort and de-dup by URL
    g.images.sort((a, b) => a.pos - b.pos);
    const seen = new Set();
    const urls = [];
    for (const img of g.images) {
      if (seen.has(img.url)) continue;
      seen.add(img.url);
      urls.push(img.url);
    }
    if (urls.length === 0) continue;

    const name = norm(g.title).trim();
    const allImages = urls.join('|');
    const mainImage = urls[0];
    const waText = `Hi I want ${name}`;
    const badge = toBadge(g.tags);

    const outRow = {
      name,
      image: mainImage,
      category: 'watches',
      brand: 'rolex',
      images: allImages,
      whatsapp_text: waText,
      badge,
    };

    if (existing.has(rowKey(outRow))) continue;
    existing.add(rowKey(outRow));
    newRows.push(outRow);
  }

  const header = 'name,image,category,brand,images,whatsapp_text,badge';

  const toLine = (r) => ([
    escapeCsvField(r.name),
    escapeCsvField(r.image),
    escapeCsvField(r.category),
    escapeCsvField(r.brand),
    escapeCsvField(r.images),
    escapeCsvField(r.whatsapp_text),
    escapeCsvField(r.badge),
  ]).join(',');

  const outLines = [header]
    .concat(existingRows.map(toLine))
    .concat(newRows.map(toLine));

  fs.writeFileSync(PRODUCTS_CSV, outLines.join('\n'), 'utf8');

  console.log(`Existing products: ${existingRows.length}`);
  console.log(`Rolex handles found: ${grouped.size}`);
  console.log(`New Rolex watches added: ${newRows.length}`);
}

main();

