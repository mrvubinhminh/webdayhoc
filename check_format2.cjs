const fs = require('fs');
const files = [
    'public/games/chiem-linh-lanh-tho.html',
    'public/games/duong-dua-tri-thuc.html',
    'public/games/hanh-tinh-xanh.html',
    'public/games/hanh-trinh-giai-cuu.html',
    'public/games/mat-ma-da-vinci.html',
    'public/games/xay-dung-de-che.html'
];
for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    const match = text.match(/template\s*=\s*\[(.*?)\]/s) || text.match(/defaultBank\s*=\s*\[(.*?)\]/s) || text.match(/const\s+sample\s*=\s*\[(.*?)\]/s);
    if (match) {
        console.log(`\n--- ${f} ---`);
        console.log(match[0].substring(0, 200));
    }
}
