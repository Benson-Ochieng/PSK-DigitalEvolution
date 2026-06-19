import fs from 'fs';

try {
  fs.copyFileSync('production.sql', 'petfood_seed.sql');
  console.log('Successfully synced production.sql into petfood_seed.sql');
} catch (e) {
  console.error('Failed to sync seed file:', e.message);
}
