const fs = require('fs');
const file = 'data/products.csv';

const lines = fs.readFileSync(file, 'utf8').split('\n');

// Lines 0 = header, 1-19 = original products, 20-58 = chanel watches (0-indexed)
// The 39 watch rows start at index 20 (line 21)
let fixed = 0;
for (let i = 20; i < lines.length; i++) {
  if (lines[i].includes(',handbags,chanel,')) {
    lines[i] = lines[i].replace(',handbags,chanel,', ',jewelry,chanel,');
    fixed++;
  }
}

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log(`Fixed ${fixed} rows — category changed from handbags to jewelry.`);
