const fs   = require('fs');
const path = require('path');
const https = require('https');

const TOKEN      = process.env.CLOUDFLARE_API_TOKEN || '';
const ACCOUNT_ID = '7a509d6d508392cb204c4ed39f5c1471';
const BUCKET     = 'lucxuer';

const VIDEOS = [
  { src: path.join(__dirname, '..', 'videos', 'handbag.mp4'), key: 'videos/handbags.mp4'  },
  { src: path.join(__dirname, '..', 'videos', 'Shoes.mp4'),   key: 'videos/footwear.mp4'  },
  { src: path.join(__dirname, '..', 'videos', 'jewelry.mp4'), key: 'videos/jewelry.mp4'   }
];

function uploadVideo({ src, key }) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(src)) {
      return reject(new Error(`File not found: ${src}`));
    }
    const fileData = fs.readFileSync(src);
    const options = {
      method:   'PUT',
      hostname: 'api.cloudflare.com',
      path:     `/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${key}`,
      headers: {
        'Authorization':  `Bearer ${TOKEN}`,
        'Content-Type':   'video/mp4',
        'Content-Length': fileData.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.success) resolve(`OK: ${key}`);
          else reject(new Error(`FAIL: ${key} :: ${JSON.stringify(parsed.errors)}`));
        } catch (e) {
          reject(new Error(`PARSE_ERR: ${key} :: ${e.message}`));
        }
      });
    });

    req.on('error', e => reject(new Error(`NET_ERR: ${key} :: ${e.message}`)));
    req.write(fileData);
    req.end();
  });
}

async function run() {
  if (!TOKEN) {
    console.error('ERROR: Set CLOUDFLARE_API_TOKEN environment variable first.');
    console.error('Usage: CLOUDFLARE_API_TOKEN=your_token node scripts/upload-videos-r2.js');
    process.exit(1);
  }
  console.log(`Uploading ${VIDEOS.length} videos to R2 bucket "${BUCKET}"...\n`);
  for (const v of VIDEOS) {
    const sizeMB = (fs.statSync(v.src).size / 1024 / 1024).toFixed(1);
    console.log(`Uploading ${path.basename(v.src)} (${sizeMB} MB) → ${v.key}`);
    try {
      const result = await uploadVideo(v);
      console.log(`  ${result}`);
      console.log(`  Public URL: https://pub-461f36b5362b494c9d4e4eb82ef799b5.r2.dev/${v.key}`);
    } catch (e) {
      console.error(`  ${e.message}`);
    }
    console.log();
  }
  console.log('Done.');
}

run().catch(console.error);
