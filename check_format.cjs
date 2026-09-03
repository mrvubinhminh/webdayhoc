const fs = require('fs');
const path = require('path');

const dir = 'public/games';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
    const f = path.join(dir, file);
    const text = fs.readFileSync(f, 'utf8');
    if (text.includes('options": { "A":') || text.includes('options": { "A"')) {
        console.log(f, '-> TYPE 1 (A,B,C,D object)');
    } else if (text.includes('"opts":') || text.includes('opts":[')) {
        console.log(f, '-> TYPE 2 (opts array)');
    } else {
        console.log(f, '-> UNKNOWN');
    }
}
