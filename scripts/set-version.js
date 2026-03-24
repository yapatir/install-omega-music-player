// scripts/set-version.js
// Reads version from package.json and writes REACT_APP_VERSION to .env.local
// Runs automatically before npm start and npm run build

const fs   = require('fs');
const path = require('path');

const pkg     = require('../package.json');
const envPath = path.join(__dirname, '../.env.local');

// Read existing .env.local if any
let existing = '';
if (fs.existsSync(envPath)) {
  existing = fs.readFileSync(envPath, 'utf-8');
}

// Remove old REACT_APP_VERSION line if present
const filtered = existing
  .split('\n')
  .filter(line => !line.startsWith('REACT_APP_VERSION='))
  .join('\n')
  .trim();

// Write updated file
const updated = filtered
  ? `${filtered}\nREACT_APP_VERSION=${pkg.version}\n`
  : `REACT_APP_VERSION=${pkg.version}\n`;

fs.writeFileSync(envPath, updated);
console.log(`[Omega] Version set to ${pkg.version}`);