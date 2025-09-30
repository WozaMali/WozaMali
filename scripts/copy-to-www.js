const fs = require('fs');
const path = require('path');

const projectRoot = __dirname ? path.resolve(__dirname, '..') : process.cwd();
const outDir = path.join(projectRoot, 'out');
const wwwDir = path.join(projectRoot, 'www');

function rimraf(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  for (const entry of fs.readdirSync(targetPath)) {
    const full = path.join(targetPath, entry);
    const stat = fs.lstatSync(full);
    if (stat.isDirectory()) {
      rimraf(full);
    } else {
      fs.unlinkSync(full);
    }
  }
  fs.rmdirSync(targetPath);
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.lstatSync(s);
    if (stat.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

if (!fs.existsSync(outDir)) {
  console.error('Missing out/ directory. Run `npm run build` first.');
  process.exit(1);
}

if (fs.existsSync(wwwDir)) {
  rimraf(wwwDir);
}

copyDir(outDir, wwwDir);
console.log('Copied out/ to www/');


