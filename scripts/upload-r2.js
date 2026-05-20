const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '7a509d6d508392cb204c4ed39f5c1471';
const BUCKET = 'lucxuer';
const FOLDER = 'feb-26';
const IMG_DIR = path.join(__dirname, '..', 'data', 'Opale Bags - Premium Products');
const CONCURRENCY = 10;

function uploadFile(fileName) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(IMG_DIR, fileName);
    const fileData = fs.readFileSync(filePath);
    const key = `${FOLDER}/${fileName}`;
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${key}`;

    const options = {
      method: 'PUT',
      hostname: 'api.cloudflare.com',
      path: `/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${key}`,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'image/webp',
        'Content-Length': fileData.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.success) resolve(`OK: ${fileName}`);
          else reject(new Error(`FAIL: ${fileName} :: ${JSON.stringify(parsed.errors)}`));
        } catch (e) {
          reject(new Error(`PARSE_ERR: ${fileName} :: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => reject(new Error(`NET_ERR: ${fileName} :: ${e.message}`)));
    req.write(fileData);
    req.end();
  });
}

async function uploadBatch(fileList) {
  let done = 0;
  const total = fileList.length;
  const queue = [...fileList];

  async function worker() {
    while (queue.length > 0) {
      const file = queue.shift();
      try {
        const result = await uploadFile(file);
        done++;
        process.stdout.write(`\r[${done}/${total}] ${result}                    `);
      } catch (e) {
        done++;
        console.error(`\n${e.message}`);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);
  console.log(`\n\nDone! Uploaded ${total} files to ${BUCKET}/${FOLDER}/`);
}

const allFiles = fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.webp')).sort();
console.log(`Uploading ${allFiles.length} files with concurrency ${CONCURRENCY}...`);
uploadBatch(allFiles).catch(console.error);
