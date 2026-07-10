import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  "app/routes/store_backend.tsx",
  "app/routes/store_backend.posts.tsx",
  "app/routes/store_backend.media.tsx",
  "app/routes/store_backend.login.tsx",
  "app/routes/store_backend.history.tsx",
  "app/routes/store_backend.dashboard.tsx",
  "app/routes/store_backend.users.tsx",
  "app/routes/store_backend.products.tsx",
  "app/routes/store_backend.analytics.tsx"
];

const targetHex = /#472f8f/gi;
const replacementHex = "#1E5DA7";

const targetRgb = /71,\s*47,\s*143/g;
const replacementRgb = "30, 93, 167";

filesToUpdate.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    
    content = content.replace(targetHex, replacementHex);
    content = content.replace(targetRgb, replacementRgb);
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Updated colors in ${file}`);
    } else {
      console.log(`No color matches found in ${file}`);
    }
  } else {
    console.warn(`File not found: ${file}`);
  }
});
