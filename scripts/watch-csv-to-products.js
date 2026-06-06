const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PRODUCTS_CSV = path.join(DATA_DIR, 'products.csv');

const IMPORT_SOURCES = [
  { file: 'Rolex.csv', brand: 'rolex', category: 'watches' },
  { file: 'cartie-watch_products.csv', brand: 'cartier', category: 'watches' },
  { file: 'chane-watch_products.csv', brand: 'chanel', category: 'watches' },
  { file: 'omega-watch_products.csv', brand: 'omega', category: 'watches' },
  { file: 'audemars-piguet-1_products.csv', brand: 'audemars', category: 'watches' },
  { file: 'patek-philippe-1_products.csv', brand: 'patek', category: 'watches' },
  { file: 'richard-mille_products (1).csv', brand: 'richard-mille', category: 'watches' },
  { file: 'hublot_products.csv', brand: 'hublot', category: 'watches' },
  { file: 'cc-handbags_products.csv', brand: 'chanel', category: 'handbags' },
  { file: 'hm-handbags_products.csv', brand: 'hermes', category: 'handbags' },
  { file: 'cd-bag_products.csv', brand: 'dior', category: 'handbags' },
  { file: 'celin-handbags_products.csv', brand: 'celine', category: 'handbags' },
  { file: 'bv-handbags_products.csv', brand: 'bottega', category: 'handbags' },
  { file: 'goya-handbags_products.csv', brand: 'goyard', category: 'handbags' },
  { file: 'ysl-handbags_products.csv', brand: 'ysl', category: 'handbags' },
  { file: 'gg-bag_products.csv', brand: 'gucci', category: 'handbags' },
  {
    file: 'mini-bag_products.csv',
    brand: 'miumiu',
    category: 'handbags',
    vendorMap: {
      'chanel bag': 'chanel',
      'Goya Bag': 'goyard',
      'Celine Bag': 'celine',
      'Bottega Veneta bag': 'bottega',
      'Dior bag': 'dior',
      'gucci bag': 'gucci',
      'Hermes bag': 'hermes',
      'Loewe Bag': 'loewe',
      'Miu Miu bag': 'miumiu',
    },
  },
  { file: 'fendi-bag_products.csv', brand: 'fendi', category: 'handbags' },
  { file: 'loewe-bag_products.csv', brand: 'loewe', category: 'handbags' },
  { file: 'loro-piana-bag_products.csv', brand: 'loro-piana', category: 'handbags' },
  { file: 'the-row-bag_products.csv', brand: 'the-row', category: 'handbags' },
  { file: 'miumiu-bags_products.csv', brand: 'miumiu', category: 'handbags' },
  { file: 'cc-shoe_products.csv', brand: 'chanel', category: 'footwear' },
  { file: 'hm-shoe_products.csv', brand: 'hermes', category: 'footwear' },
  { file: 'cd-shoe_products.csv', brand: 'dior', category: 'footwear' },
  { file: 'celin-shoe_products.csv', brand: 'celine', category: 'footwear' },
  { file: 'valenti-shoe_products.csv', brand: 'valentino', category: 'footwear' },
  { file: 'loro-piana-shoes_products.csv', brand: 'loro-piana', category: 'footwear' },
  { file: 'christian-louboutin-shoe_products.csv', brand: 'louboutin', category: 'footwear' },
  { file: 'gg-shoe_products.csv', brand: 'gucci', category: 'footwear' },
  { file: 'loew-shoe_products.csv', brand: 'loewe', category: 'footwear' },
  { file: 'prada-shoe_products.csv', brand: 'prada', category: 'footwear' },
  { file: 'jimmy-choo-shoe_products.csv', brand: 'jimmy-choo', category: 'footwear' },
  { file: 'fendi-shoe_products.csv', brand: 'fendi', category: 'footwear' },
  { file: 'alaia-shoe_products.csv', brand: 'alaia', category: 'footwear' },
  { file: 'ysl-shoe_products.csv', brand: 'ysl', category: 'footwear' },
  { file: 'miumiu-shoe-2025_products.csv', brand: 'miumiu', category: 'footwear' },
  { file: 'rene-caovilla_products.csv', brand: 'rene-caovilla', category: 'footwear' },
];

function norm(str) {
  return String(str == null ? '' : str)
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/"/g, "'");
}

function escapeCsvField(value) {
  const s = norm(value).trim();
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

function groupShopifyRows(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const handle = row['Handle'];
    if (!handle) continue;

    if (!grouped.has(handle)) {
      grouped.set(handle, {
        handle,
        title: row['Title'] || handle,
        tags: row['Tags'] || '',
        vendor: row['Vendor'] || '',
        images: [],
      });
    }

    const g = grouped.get(handle);
    g.title = row['Title'] || g.title;
    g.tags = row['Tags'] || g.tags;
    g.vendor = row['Vendor'] || g.vendor || '';

    const imgUrl = row['Image Src'];
    if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
      const pos = parseInt(row['Image Position'], 10);
      g.images.push({ pos: Number.isFinite(pos) ? pos : 0, url: imgUrl });
    }
  }
  return grouped;
}

function importSource(sourcePath, brand, category, existing, vendorMap) {
  if (!fs.existsSync(sourcePath)) {
    console.log(`Skip (missing): ${path.basename(sourcePath)}`);
    return { handles: 0, added: 0, rows: [] };
  }

  const raw = fs.readFileSync(sourcePath, 'utf8');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  });

  const grouped = groupShopifyRows(rows);
  const newRows = [];

  for (const [, g] of grouped) {
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
    var productBrand = brand;
    if (vendorMap) {
      productBrand = vendorMap[g.vendor];
      if (!productBrand) continue;
    }
    const outRow = {
      name,
      image: urls[0],
      category,
      brand: productBrand,
      images: urls.join('|'),
      whatsapp_text: `Hi I want ${name}`,
      badge: toBadge(g.tags),
    };

    if (existing.has(rowKey(outRow))) continue;
    existing.add(rowKey(outRow));
    newRows.push(outRow);
  }

  return { handles: grouped.size, added: newRows.length, rows: newRows };
}

function main() {
  if (!fs.existsSync(PRODUCTS_CSV)) {
    throw new Error(`Missing file: ${PRODUCTS_CSV}`);
  }

  const productsRaw = fs.readFileSync(PRODUCTS_CSV, 'utf8');
  const existingRows = parse(productsRaw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  });

  const existing = new Set(existingRows.map(rowKey));
  const allNewRows = [];

  for (const src of IMPORT_SOURCES) {
    const result = importSource(path.join(DATA_DIR, src.file), src.brand, src.category, existing, src.vendorMap);
    allNewRows.push(...result.rows);
    console.log(
      `${src.file} (${src.category}/${src.brand}): ${result.handles} handles, ${result.added} new products`
    );
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
    .concat(allNewRows.map(toLine));

  fs.writeFileSync(PRODUCTS_CSV, outLines.join('\n'), 'utf8');

  console.log(`Existing products: ${existingRows.length}`);
  console.log(`Total new products added: ${allNewRows.length}`);
  console.log(`Final product count: ${existingRows.length + allNewRows.length}`);
}

main();
