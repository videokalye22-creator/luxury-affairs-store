const fs = require('fs');
const file = 'data/products.csv';
const lines = fs.readFileSync(file, 'utf8').split('\n');
const idx = lines.findIndex(l => l.includes('PREMIERE ROCK PINK GOLD'));
if (idx !== -1 && lines[idx].includes(',handbags,chanel,')) {
  lines[idx] = lines[idx].replace(',handbags,chanel,', ',jewelry,chanel,');
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  console.log('Fixed at line', idx, '— moved to jewelry,chanel');
} else {
  console.log('Nothing to fix or already correct.');
}
