const fs = require('fs');
const glob = require('glob');

const files = glob.sync('public/games/*.html');
for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    if (text.includes('options": { "A":') || text.includes('options": { "A"')) {
        console.log(f, '-> TYPE 1 (A,B,C,D object)');
    } else if (text.includes('"opts":') || text.includes('opts":[')) {
        console.log(f, '-> TYPE 2 (opts array)');
    } else {
        console.log(f, '-> UNKNOWN');
    }
}
