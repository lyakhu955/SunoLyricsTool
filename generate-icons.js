// Simple Node.js script to generate SVG icons as PNG placeholders
// Run: node generate-icons.js

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate SVG-based icons (works in all browsers)
sizes.forEach(size => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#ec4899"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#bg)"/>
  <text x="50%" y="45%" text-anchor="middle" dominant-baseline="central" font-size="${size * 0.45}" fill="white" font-family="Arial">♪</text>
  <text x="50%" y="80%" text-anchor="middle" dominant-baseline="central" font-size="${size * 0.14}" fill="white" font-family="Arial" font-weight="bold">AI</text>
</svg>`;

  fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg);
  console.log(`Generated icon-${size}.svg`);
});

console.log('\\nAll icons generated in /icons/ folder');
console.log('Note: For production, convert SVGs to PNG using an image tool.');
