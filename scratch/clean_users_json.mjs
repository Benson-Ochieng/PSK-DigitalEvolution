import fs from 'fs';
import path from 'path';

const usersFile = path.join(process.cwd(), 'content', 'users.json');
if (!fs.existsSync(usersFile)) {
  console.error('users.json does not exist');
  process.exit(1);
}

console.log('Cleaning users.json cache of unique constraints conflicts...');

const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
const cleanUsers = [];
const seenEmails = new Set(['admin@petstore.co.ke', 'manager@petstore.co.ke']);
const seenUsernames = new Set(['admin', 'manager']);

let renamedCount = 0;
let skippedCount = 0;

for (const u of users) {
  let email = u.email ? u.email.toLowerCase().trim() : '';
  let username = u.username ? u.username.toLowerCase().trim() : '';

  // Skip invalid users
  if (!email && !username) {
    skippedCount++;
    continue;
  }

  // Resolve duplicate emails
  if (email && seenEmails.has(email)) {
    skippedCount++;
    continue;
  }

  // Resolve duplicate usernames
  if (username && seenUsernames.has(username)) {
    // If username is "admin" or "manager", rename/suffix it
    const original = u.username;
    if (username === 'admin' || username === 'manager') {
      u.username = `${original}-wc`;
    } else {
      u.username = `${original}-${Math.floor(Math.random() * 1000)}`;
    }
    username = u.username.toLowerCase().trim();
    renamedCount++;
  }

  if (email) seenEmails.add(email);
  if (username) seenUsernames.add(username);

  cleanUsers.push(u);
}

fs.writeFileSync(usersFile, JSON.stringify(cleanUsers, null, 2), 'utf-8');
console.log(`✅ Cleaned users cache! Total users: ${cleanUsers.length}, Renamed: ${renamedCount}, Skipped: ${skippedCount}`);
