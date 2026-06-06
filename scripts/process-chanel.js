const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { parse } = require('csv-parse/sync');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const R2_ACCOUNT_ID   = '7a509d6d508392cb204c4ed39f5c1471';
const R2_ACCESS_KEY   = '87a9d0cd9e67f44202b128932a8d728a';
const R2_SECRET_KEY   = '861b6cfd9fc8174ab8f83e2b0be4fd64225963f29461605935a339d978a7375c';
const R2_BUCKET       = 'lucxuer';
const R2_PUBLIC_URL   = 'https://pub-461f36b5362b494c9d4e4eb82ef799b5.r2.dev';
const INPUT_CSV       = process.env.CHANEL_INPUT_CSV || path.join(__dirname, '..', 'data', 'chanel - 1.csv');
const OUTPUT_CSV      = process.env.CHANEL_OUTPUT_CSV || path.join(__dirname, '..', 'data', 'chanel-processed.csv');
const R2_KEY_PREFIX   = process.env.R2_KEY_PREFIX || 'chanel';
const WHATSAPP_NUMBER = '17175385671';
const CONCURRENCY     = Number(process.env.UPLOAD_CONCURRENCY || 6);
const DOWNLOAD_TIMEOUT_MS = Number(process.env.DOWNLOAD_TIMEOUT_MS || 30000);

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: DOWNLOAD_TIMEOUT_MS }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout: ' + url));
    });
  });
}

async function toWebp(buffer) {
  return sharp(buffer)
    .webp({ quality: 85 })
    .toBuffer();
}

async function uploadToR2(buffer, key) {
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/webp',
  }));
  return `${R2_PUBLIC_URL}/${key}`;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Reading CSV...');
  const raw = fs.readFileSync(INPUT_CSV, 'utf8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true });

  // Group rows by Handle — each handle = one product, multiple rows = multiple images
  const products = new Map();
  for (const row of rows) {
    const handle = row['Handle'];
    const title  = row['Title'];
    const imgSrc = row['Image Src'];
    const imgPos = parseInt(row['Image Position'], 10) || 0;
    const type   = row['Type'] || '';

    if (!handle) continue;

    if (!products.has(handle)) {
      products.set(handle, {
        handle,
        title: title || handle,
        type,
        images: [],
      });
    }

    if (imgSrc && imgSrc.startsWith('http')) {
      products.get(handle).images.push({ pos: imgPos, url: imgSrc });
    }
  }

  console.log(`Found ${products.size} unique products`);

  const productList = Array.from(products.values()).filter((product) => product.images.length > 0);
  productList.forEach((product) => {
    product.images.sort((a, b) => a.pos - b.pos);
    product.r2Urls = new Array(product.images.length);
  });

  const tasks = [];
  for (const product of productList) {
    product.images.forEach((image, index) => {
      tasks.push({ product, image, index });
    });
  }

  console.log(`Uploading ${tasks.length} images with concurrency ${CONCURRENCY}...`);

  let done = 0;
  let taskIndex = 0;

  async function worker() {
    while (taskIndex < tasks.length) {
      const task = tasks[taskIndex++];
      const key = `${R2_KEY_PREFIX}/${task.product.handle}-${task.index + 1}.webp`;

      try {
        const raw = await downloadBuffer(task.image.url);
        const webp = await toWebp(raw);
        const r2Url = await uploadToR2(webp, key);
        task.product.r2Urls[task.index] = r2Url;
      } catch (err) {
        console.warn(`\n  ✗ Failed ${task.product.title} image ${task.index + 1}: ${err.message}`);
      }

      done++;
      if (done % 25 === 0 || done === tasks.length) {
        process.stdout.write(`\rUploaded ${done}/${tasks.length} images`);
      }

      await sleep(50);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  console.log('\nBuilding product CSV...');

  const outputRows = ['name,image,category,brand,images,whatsapp_text,badge'];

  for (const product of productList) {
    const r2Urls = product.r2Urls.filter(Boolean);

    if (r2Urls.length === 0) {
      console.log(`  SKIP (all images failed): ${product.title}`);
      continue;
    }

    const mainImage = r2Urls[0];
    const allImages = r2Urls.join('|');
    const waText    = `Hi I want ${product.title}`;
    const name      = product.title.replace(/"/g, '""');

    outputRows.push(`"${name}",${mainImage},handbags,chanel,"${allImages}","${waText}",`);
  }

  fs.writeFileSync(OUTPUT_CSV, outputRows.join('\n'), 'utf8');
  console.log(`\n✅ Done! Output saved to: ${OUTPUT_CSV}`);
  console.log(`Total products processed: ${outputRows.length - 1}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
