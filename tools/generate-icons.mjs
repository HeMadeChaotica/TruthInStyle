import fs from 'node:fs';
import path from 'node:path';

const source = path.resolve('src/assets/appicon.jpeg');
const outDir = path.resolve('public/icons');
const sizes = [180, 192, 512, 1024];

if (!fs.existsSync(source)) {
  console.log('Missing src/assets/appicon.jpeg. Place source file, then run icon export tool.');
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });
for (const size of sizes) {
  const target = path.join(outDir, `appicon-${size}.jpeg`);
  fs.copyFileSync(source, target);
}

console.log(`Wired icon export placeholders for sizes: ${sizes.join(', ')}`);
