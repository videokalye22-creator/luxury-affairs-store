const fs = require('fs');
const text = fs.readFileSync('data/chanel - 1.csv', 'utf8');
const lines = text.split('\n');
const header = lines[0].split(',');

const imgIdx = header.indexOf('Image Src');
const titleIdx = header.indexOf('Title');
const posIdx = header.indexOf('Image Position');
const typeIdx = header.indexOf('Type');

console.log('Columns found:');
console.log('  Image Src index:', imgIdx);
console.log('  Title index:', titleIdx);
console.log('  Image Position index:', posIdx);
console.log('  Type index:', typeIdx);
console.log('  Total columns:', header.length);

let count = 0;
let sample = [];
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(',');
  const title = cols[titleIdx] ? cols[titleIdx].trim() : '';
  if (title && title.length > 0) {
    count++;
    if (sample.length < 5) {
      sample.push({
        title: title,
        type: cols[typeIdx],
        imgSrc: cols[imgIdx]
      });
    }
  }
}

console.log('\nUnique products:', count);
console.log('\nSample products:');
sample.forEach((p, i) => console.log(i+1, JSON.stringify(p)));
