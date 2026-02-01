import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = './public/app-icon.svg';
const outputDir = './ios/App/App/Assets.xcassets/AppIcon.appiconset';

// iOS app icon sizes
const sizes = [
  { size: 20, scale: 1, name: 'AppIcon-20x20@1x.png' },
  { size: 20, scale: 2, name: 'AppIcon-20x20@2x.png' },
  { size: 20, scale: 3, name: 'AppIcon-20x20@3x.png' },
  { size: 29, scale: 1, name: 'AppIcon-29x29@1x.png' },
  { size: 29, scale: 2, name: 'AppIcon-29x29@2x.png' },
  { size: 29, scale: 3, name: 'AppIcon-29x29@3x.png' },
  { size: 40, scale: 1, name: 'AppIcon-40x40@1x.png' },
  { size: 40, scale: 2, name: 'AppIcon-40x40@2x.png' },
  { size: 40, scale: 3, name: 'AppIcon-40x40@3x.png' },
  { size: 60, scale: 2, name: 'AppIcon-60x60@2x.png' },
  { size: 60, scale: 3, name: 'AppIcon-60x60@3x.png' },
  { size: 76, scale: 1, name: 'AppIcon-76x76@1x.png' },
  { size: 76, scale: 2, name: 'AppIcon-76x76@2x.png' },
  { size: 83.5, scale: 2, name: 'AppIcon-83.5x83.5@2x.png' },
  { size: 1024, scale: 1, name: 'AppIcon-1024x1024@1x.png' },
];

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);

  for (const { size, scale, name } of sizes) {
    const pixelSize = Math.round(size * scale);
    const outputPath = path.join(outputDir, name);

    await sharp(svgBuffer)
      .resize(pixelSize, pixelSize)
      .png()
      .toFile(outputPath);

    console.log(`Generated: ${name} (${pixelSize}x${pixelSize})`);
  }

  // Generate Contents.json
  const contents = {
    images: sizes.map(({ size, scale, name }) => ({
      filename: name,
      idiom: size === 1024 ? 'ios-marketing' : 'universal',
      platform: 'ios',
      size: `${size}x${size}`,
      scale: `${scale}x`,
    })),
    info: {
      author: 'xcode',
      version: 1,
    },
  };

  fs.writeFileSync(
    path.join(outputDir, 'Contents.json'),
    JSON.stringify(contents, null, 2)
  );
  console.log('Generated: Contents.json');
}

generateIcons().catch(console.error);
