/**
 * Scan images/proof/* and write data/proof-manifest.json
 * Run: node scripts/generate-proof-manifest.js
 */
const fs = require('fs');
const path = require('path');

const PROOF_DIR = path.join(__dirname, '..', 'images', 'proof');
const OUT_FILE  = path.join(__dirname, '..', 'data', 'proof-manifest.json');
const R2_BASE   = 'https://pub-461f36b5362b494c9d4e4eb82ef799b5.r2.dev';

/** Map disk folder name → timeline label */
const LABEL_MAP = {
  'Dec-25': 'DEC-25',
  'dec-25': 'DEC-25',
  'feb-26': 'FEB-26',
  'Jan 26': 'JAN-26',
  'jan-26': 'JAN-26',
  'nov-25': 'NOV-25'
};

const EMOJI = {
  'DEC-25': '💳',
  'NOV-25': '📱',
  'JAN-26': '📸',
  'FEB-26': '📸'
};

function r2KeyFromFolder(folderName) {
  return folderName.toLowerCase().replace(/\s+/g, '-');
}

function scanFolder(folderName) {
  const dir = path.join(PROOF_DIR, folderName);
  const files = fs.readdirSync(dir)
    .filter(function(f) { return /\.(webp|jpg|jpeg|png)$/i.test(f); })
    .sort();
  const label = LABEL_MAP[folderName] || folderName.toUpperCase().replace(/\s+/g, '-');
  const r2Key = r2KeyFromFolder(folderName);
  return {
    label: label,
    emoji: EMOJI[label] || '📸',
    folder: folderName,
    r2Key: r2Key,
    baseUrl: R2_BASE + '/' + r2Key,
    localBase: 'images/proof/' + folderName,
    images: files,
    count: files.length
  };
}

function run() {
  if (!fs.existsSync(PROOF_DIR)) {
    console.error('Proof directory not found:', PROOF_DIR);
    process.exit(1);
  }

  const folders = fs.readdirSync(PROOF_DIR, { withFileTypes: true })
    .filter(function(d) { return d.isDirectory(); })
    .map(function(d) { return d.name; })
    .sort();

  const months = folders.map(scanFolder);

  const manifest = {
    generatedAt: new Date().toISOString(),
    r2Base: R2_BASE,
    months: months
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2));

  console.log('Wrote ' + OUT_FILE);
  months.forEach(function(m) {
    console.log('  ' + m.label + ' (' + m.folder + '): ' + m.count + ' images → R2/' + m.r2Key + '/');
  });
}

run();
