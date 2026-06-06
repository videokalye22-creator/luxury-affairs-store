/**
 * Upload all images/proof/* folders to Cloudflare R2.
 * Run: CLOUDFLARE_API_TOKEN=xxx node scripts/upload-proof-r2.js
 * Optional: node scripts/upload-proof-r2.js feb-26   (single folder only)
 */
const fs   = require('fs');
const path = require('path');
const https = require('https');

const TOKEN      = process.env.CLOUDFLARE_API_TOKEN || '';
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '7a509d6d508392cb204c4ed39f5c1471';
const BUCKET     = 'lucxuer';
const PROOF_DIR  = path.join(__dirname, '..', 'images', 'proof');
const CONCURRENCY = 8;

function r2KeyFromFolder(folderName) {
  return folderName.toLowerCase().replace(/\s+/g, '-');
}

function contentType(fileName) {
  if (/\.webp$/i.test(fileName)) return 'image/webp';
  if (/\.png$/i.test(fileName))  return 'image/png';
  if (/\.jpe?g$/i.test(fileName)) return 'image/jpeg';
  return 'application/octet-stream';
}

function uploadFile(localPath, r2Key) {
  return new Promise(function(resolve, reject) {
    const fileData = fs.readFileSync(localPath);
    const options = {
      method: 'PUT',
      hostname: 'api.cloudflare.com',
      path: '/client/v4/accounts/' + ACCOUNT_ID + '/r2/buckets/' + BUCKET + '/objects/' + encodeURIComponent(r2Key).replace(/%2F/g, '/'),
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': contentType(path.basename(localPath)),
        'Content-Length': fileData.length
      }
    };

    const req = https.request(options, function(res) {
      var body = '';
      res.on('data', function(d) { body += d; });
      res.on('end', function() {
        try {
          var parsed = JSON.parse(body);
          if (parsed.success) resolve(r2Key);
          else reject(new Error('FAIL ' + r2Key + ': ' + JSON.stringify(parsed.errors)));
        } catch (e) {
          reject(new Error('PARSE ' + r2Key + ': ' + e.message));
        }
      });
    });
    req.on('error', function(e) { reject(e); });
    req.write(fileData);
    req.end();
  });
}

async function uploadFolder(folderName) {
  const dir = path.join(PROOF_DIR, folderName);
  const r2Prefix = r2KeyFromFolder(folderName);
  const files = fs.readdirSync(dir).filter(function(f) {
    return /\.(webp|jpg|jpeg|png)$/i.test(f);
  });

  console.log('\nUploading ' + folderName + ' → ' + r2Prefix + '/ (' + files.length + ' files)');

  var done = 0;
  var queue = files.slice();

  async function worker() {
    while (queue.length) {
      var file = queue.shift();
      var key = r2Prefix + '/' + file;
      var apiKey = r2Prefix + '/' + encodeURIComponent(file).replace(/%2F/g, '/');
      try {
        await uploadFile(path.join(dir, file), apiKey);
        done++;
        process.stdout.write('\r  [' + done + '/' + files.length + '] ' + file + '                    ');
      } catch (e) {
        done++;
        console.error('\n  ' + e.message);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log('\n  Done: ' + r2Prefix + '/');
}

async function run() {
  if (!TOKEN) {
    console.error('Set CLOUDFLARE_API_TOKEN first.');
    console.error('Usage: CLOUDFLARE_API_TOKEN=xxx node scripts/upload-proof-r2.js [folder-name]');
    process.exit(1);
  }

  var only = process.argv[2];
  var folders = fs.readdirSync(PROOF_DIR, { withFileTypes: true })
    .filter(function(d) { return d.isDirectory(); })
    .map(function(d) { return d.name; })
    .filter(function(name) { return !only || name === only || r2KeyFromFolder(name) === only; })
    .sort();

  if (!folders.length) {
    console.error('No proof folders found' + (only ? ' matching: ' + only : ''));
    process.exit(1);
  }

  for (var i = 0; i < folders.length; i++) {
    await uploadFolder(folders[i]);
  }

  console.log('\nAll proof uploads complete.');
}

run().catch(function(e) { console.error(e); process.exit(1); });
