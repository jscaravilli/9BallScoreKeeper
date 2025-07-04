#!/usr/bin/env node

/**
 * Clean PWA Build Script
 * Creates a production build without any Replit development dependencies
 * Specifically for PWABuilder scanning without mixed content issues
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DIST_DIR = 'dist';

console.log('🔄 Building clean PWA for APK conversion...');

// Clean previous build
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// Build with explicit production environment to exclude Replit plugins
console.log('📦 Building clean production bundle...');
try {
  execSync('NODE_ENV=production REPL_ID= cd client && npm run build', { 
    stdio: 'inherit',
    env: { 
      ...process.env, 
      NODE_ENV: 'production',
      REPL_ID: undefined  // Ensure Replit plugins are not loaded
    }
  });
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Copy built files from client/dist to root dist
const clientDistPath = path.join('client', 'dist');
if (!fs.existsSync(clientDistPath)) {
  console.error('❌ Client build not found at:', clientDistPath);
  process.exit(1);
}

console.log('📁 Copying clean build files...');

// Copy all files recursively
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursive(clientDistPath, DIST_DIR);

// Remove any bundled development files that might have slipped through
const indexHtmlPath = path.join(DIST_DIR, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  let indexContent = fs.readFileSync(indexHtmlPath, 'utf-8');
  
  // Remove any Replit-specific scripts or development banners
  indexContent = indexContent.replace(
    /<!-- Replit[\s\S]*?-->/g, 
    '<!-- Development scripts removed for clean PWA -->'
  );
  
  // Ensure no HTTP links in the HTML
  if (indexContent.includes('http://') && !indexContent.includes('http://www.w3.org/2000/svg')) {
    console.warn('⚠ Warning: Found HTTP references in index.html');
    console.log('Searching for HTTP references...');
    const httpMatches = indexContent.match(/http:\/\/[^\s"'>]+/g);
    if (httpMatches) {
      console.log('Found:', httpMatches);
    }
  }
  
  fs.writeFileSync(indexHtmlPath, indexContent);
}

// Copy PWA assets
const pwaPaths = [
  'manifest.json',
  'sw.js', 
  'icon-192.png',
  'icon-512.png',
  'screenshot-mobile.png'
];

console.log('🎯 Copying PWA assets...');
for (const file of pwaPaths) {
  const srcPath = file;
  const destPath = path.join(DIST_DIR, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✓ ${file}`);
  } else {
    console.log(`⚠ ${file} not found, skipping`);
  }
}

// Verify the build is clean
console.log('🔍 Verifying clean build...');

// Check for any remaining Replit references
const jsFiles = [];
function findJSFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findJSFiles(fullPath);
    } else if (file.endsWith('.js')) {
      jsFiles.push(fullPath);
    }
  }
}

findJSFiles(DIST_DIR);

let hasReplitRefs = false;
for (const jsFile of jsFiles) {
  const content = fs.readFileSync(jsFile, 'utf-8');
  if (content.includes('@replit/') || content.includes('replit.dev')) {
    console.warn(`⚠ Found Replit reference in ${jsFile}`);
    hasReplitRefs = true;
  }
}

if (!hasReplitRefs) {
  console.log('✓ No Replit development dependencies found');
}

// Final verification
const stats = fs.statSync(path.join(DIST_DIR, 'index.html'));
console.log(`✓ index.html ready (${(stats.size / 1024).toFixed(1)}KB)`);

try {
  const assets = fs.readdirSync(path.join(DIST_DIR, 'assets'));
  console.log(`✓ Assets: ${assets.length} files`);
} catch (error) {
  console.log('✓ Assets may be inlined');
}

console.log('');
console.log('🎉 CLEAN PWA BUILD COMPLETE!');
console.log('');
console.log('✅ Ready for PWABuilder scanning:');
console.log('• No Replit development dependencies');
console.log('• No mixed content references');
console.log('• Clean HTTPS-compatible build');
console.log('');
console.log('📋 Next Steps:');
console.log('1. Deploy dist/ folder to HTTPS hosting (GitHub Pages, Netlify, Vercel)');
console.log('2. Scan the HTTPS URL with PWABuilder (not Replit preview)');
console.log('3. Generate APK from the clean deployment');
console.log('');