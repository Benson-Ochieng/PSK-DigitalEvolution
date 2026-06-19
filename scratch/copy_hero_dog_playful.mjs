import fs from 'fs';
import path from 'path';

const src = 'C:\\Users\\hashe\\.gemini\\antigravity-ide\\brain\\cbde767a-cd7a-4d4c-a2f0-8a13cbeffde1\\hero_dog_playful_1779654423122.png';
const destDir = path.join('public', 'images');
fs.mkdirSync(destDir, { recursive: true });

const dest = path.join(destDir, 'hero_dog.png');

try {
  fs.copyFileSync(src, dest);
  console.log(`Successfully copied playful hero dog image to ${dest}`);
} catch (e) {
  console.error(`Failed to copy: ${e.message}`);
}
