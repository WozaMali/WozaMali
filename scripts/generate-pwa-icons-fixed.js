const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Source logo path
const sourceLogo = path.join(__dirname, '..', 'public', 'WozaMali-uploads', 'Woza Avatar.png');

// Icon sizes to generate
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('🎨 Generating PWA icons with proper positioning...');

// Check if source logo exists
if (!fs.existsSync(sourceLogo)) {
  console.error('❌ Source logo not found:', sourceLogo);
  process.exit(1);
}

// For now, we'll copy the source logo to all required sizes
// In a production environment, you'd want to use a proper image processing library
// like sharp or jimp to resize and position the icons properly

iconSizes.forEach(size => {
  const targetPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  
  try {
    // Copy the source logo to the target size
    fs.copyFileSync(sourceLogo, targetPath);
    console.log(`✅ Generated icon-${size}x${size}.png`);
  } catch (error) {
    console.error(`❌ Failed to generate icon-${size}x${size}.png:`, error.message);
  }
});

// Generate maskable icons (same as regular icons for now)
// In production, these should be designed specifically for maskable purposes
const maskableSizes = [192, 512];
maskableSizes.forEach(size => {
  const sourcePath = path.join(iconsDir, `icon-${size}x${size}.png`);
  const targetPath = path.join(iconsDir, `icon-${size}x${size}-maskable.png`);
  
  try {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ Generated maskable icon-${size}x${size}.png`);
  } catch (error) {
    console.error(`❌ Failed to generate maskable icon-${size}x${size}.png:`, error.message);
  }
});

console.log('🎉 PWA icon generation complete!');
console.log('');
console.log('📝 Note: For production, consider using a proper image processing library');
console.log('   like Sharp or Jimp to create properly sized and positioned icons.');
console.log('   The current implementation copies the source image to all sizes.');
