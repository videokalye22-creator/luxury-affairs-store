const fs = require('fs');
const path = require('path');
const https = require('https');
const { parse } = require('csv-parse/sync');

const catalogPath = path.join(__dirname, '..', 'data', process.argv[2] || 'products-handbags-hermes.csv');
const CONCURRENCY = 20;

function csvField(value) {
  const text = String(value || '').replace(/\r?\n|\r/g, ' ').trim();
  return /[",]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const req = https.request(url, { method: 'HEAD', timeout: 10000 }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
        res.resume();
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

async function main() {
  const raw = fs.readFileSync(catalogPath, 'utf8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true, bom: true });

  const results = new Array(rows.length);
  let cursor = 0;
  async function worker() {
    while (cursor < rows.length) {
      const i = cursor++;
      results[i] = await checkUrl(rows[i].image);
      if (i % 100 === 0) console.log(`Checked ${i + 1}/${rows.length}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const kept = [];
  const removed = [];
  rows.forEach((row, i) => {
    if (results[i]) kept.push(row);
    else removed.push(row);
  });

  const header = 'name,image,category,brand,images,whatsapp_text,badge';
  const lines = [header].concat(kept.map((r) => (
    [r.name, r.image, r.category, r.brand, r.images, r.whatsapp_text, r.badge].map(csvField).join(',')
  )));
  fs.writeFileSync(catalogPath, lines.join('\n') + '\n', 'utf8');

  const reportPath = catalogPath.replace(/\.csv$/, '-removed-dead-images.json');
  fs.writeFileSync(reportPath, JSON.stringify(removed.map((r) => ({ name: r.name, image: r.image })), null, 2), 'utf8');

  console.log(`Kept ${kept.length}, removed ${removed.length} products with dead main images.`);
  console.log(`Removed product list written to ${reportPath}`);
}

main();
