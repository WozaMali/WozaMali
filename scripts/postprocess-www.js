const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const www = path.join(root, 'www');

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

let rewrote = 0;
for (const file of walk(www)) {
  if (!file.endsWith('.html')) continue;
  let content = fs.readFileSync(file, 'utf8');
  let changed = content;
  // Force all _next asset URLs to go through /assets/public/_next/ for WebViewAssetLoader
  // Update href/src attributes
  changed = changed.replace(/(href=["'])\.\/_next\//g, '$1/assets/public/_next/');
  changed = changed.replace(/(src=["'])\.\/_next\//g, '$1/assets/public/_next/');
  changed = changed.replace(/(href=["'])_next\//g, '$1/assets/public/_next/');
  changed = changed.replace(/(src=["'])_next\//g, '$1/assets/public/_next/');
  changed = changed.replace(/(href=["'])\/_next\//g, '$1/assets/public/_next/');
  changed = changed.replace(/(src=["'])\/_next\//g, '$1/assets/public/_next/');
  // Normalize any stray occurrences inside inline scripts
  changed = changed.replace(/\.\/_next\//g, '/assets/public/_next/');
  changed = changed.replace(/\/%20_next\//g, '/assets/public/_next/');
  changed = changed.replace(/\/?Index\/_next\//g, '/assets/public/_next/');
  // Fix CSS preload tags that incorrectly use as="script"
  changed = changed.replace(/(<link[^>]*href="[^"]+\.css"[^>]*rel="preload"[^>]*)(?:as="script")/gi, '$1as="style"');
  changed = changed.replace(/(<link[^>]*rel="preload"[^>]*href="[^"]+\.css"[^>]*)(?:as="script")/gi, '$1as="style"');
  // Remove any <script src="...css"></script>
  changed = changed.replace(/<script[^>]*src="[^"]+\.css"[^>]*><\/script>/gi, '');
  // Remove TypeScript-only casts that may appear in inlined scripts
  changed = changed.replace(/\(window as any\)/g, 'window');
  if (changed !== content) {
    fs.writeFileSync(file, changed, 'utf8');
    rewrote++;
  }
}
console.log(`Postprocess complete. Updated ${rewrote} HTML files.`);
