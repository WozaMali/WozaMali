const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Copy the main logo to different icon sizes
const sourceLogo = path.join(__dirname, '..', 'public', 'WozaMali-uploads', 'Woza Avatar.png');
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('Generating PWA icons...');

// For now, just copy the source logo to all required sizes
// In a real implementation, you'd want to resize the image properly
iconSizes.forEach(size => {
  const destPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  
  if (fs.existsSync(sourceLogo)) {
    fs.copyFileSync(sourceLogo, destPath);
    console.log(`✓ Created icon-${size}x${size}.png`);
  } else {
    console.log(`✗ Source logo not found at ${sourceLogo}`);
  }
});

// Create shortcut icons (you can replace these with actual icons later)
const shortcuts = ['wallet-shortcut.png', 'collection-shortcut.png', 'rewards-shortcut.png'];
shortcuts.forEach(shortcut => {
  const destPath = path.join(iconsDir, shortcut);
  if (fs.existsSync(sourceLogo)) {
    fs.copyFileSync(sourceLogo, destPath);
    console.log(`✓ Created ${shortcut}`);
  }
});

console.log('PWA icon generation complete!');
console.log('\nNext steps:');
console.log('1. Visit http://localhost:3000/generate-icons.html to create properly sized icons');
console.log('2. Download the generated icons and replace the files in public/icons/');
console.log('3. Test the PWA installation on mobile devices');
