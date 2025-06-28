#!/usr/bin/env node

// Simple deployment preparation script
const fs = require('fs');
const path = require('path');

console.log('Preparing app for deployment...');

// Create a basic production build structure
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

if (!fs.existsSync('dist/public')) {
  fs.mkdirSync('dist/public', { recursive: true });
}

// Copy essential files for production
const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>9-Ball Pool Scorer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

fs.writeFileSync('dist/public/index.html', indexHtml);

console.log('Deployment preparation complete!');
console.log('\nTo deploy your app:');
console.log('1. Click the Deploy button in Replit');
console.log('2. Choose "Autoscale" deployment type');
console.log('3. Your app will be available at a .replit.app URL');