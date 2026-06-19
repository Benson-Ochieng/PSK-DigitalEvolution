import fs from 'fs';
import path from 'path';

const logPath = 'C:\\Users\\hashe\\.gemini\\antigravity-ide\\brain\\cbde767a-cd7a-4d4c-a2f0-8a13cbeffde1\\.system_generated\\logs\\transcript.jsonl';

if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n');
  console.log(`Total lines: ${lines.length}`);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('generate_image') || line.includes('hero_dog_black') || line.includes('hero_dog_playful') || line.includes('standing')) {
      console.log(`Line ${i}: ${line.substring(0, 500)}...`);
    }
  }
} else {
  console.log('Log file not found');
}
