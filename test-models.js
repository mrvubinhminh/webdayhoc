const fs = require('fs');
const glob = require('glob');
const paths = glob.sync('public/models/**/*.html');
const parsed = paths.map(p => {
  const match = p.match(/public\/models\/(\d+)\/(.+)\.html$/);
  return match ? { grade: match[1], id: match[2], title: match[2].replace(/-/g, ' ').toUpperCase(), path: `/models/view/${match[1]}/${match[2]}` } : null;
});
console.log(parsed);
