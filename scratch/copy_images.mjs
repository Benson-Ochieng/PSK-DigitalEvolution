import fs from 'fs';
import path from 'path';

const src1 = 'C:\\Users\\hashe\\.gemini\\antigravity-ide\\brain\\cbde767a-cd7a-4d4c-a2f0-8a13cbeffde1\\robeliz_omena_10kg_1779652658876.png';
const src2 = 'C:\\Users\\hashe\\.gemini\\antigravity-ide\\brain\\cbde767a-cd7a-4d4c-a2f0-8a13cbeffde1\\omena_perfect_mix_5kg_1779652675585.png';

const destDir = path.join('public', 'images', 'products');
fs.mkdirSync(destDir, { recursive: true });

const dest1 = path.join(destDir, 'product_27.png');
const dest2 = path.join(destDir, 'product_28.png');

try {
  fs.copyFileSync(src1, dest1);
  console.log(`Copied ${src1} to ${dest1}`);
} catch (e) {
  console.error(`Failed to copy 1: ${e.message}`);
}

try {
  fs.copyFileSync(src2, dest2);
  console.log(`Copied ${src2} to ${dest2}`);
} catch (e) {
  console.error(`Failed to copy 2: ${e.message}`);
}
