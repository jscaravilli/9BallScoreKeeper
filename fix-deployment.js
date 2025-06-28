#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔧 Fixing deployment structure...');

// Step 1: Run the build
console.log('📦 Building application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 2: Check if dist/public exists
const distPath = path.join(__dirname, 'dist');
const publicPath = path.join(distPath, 'public');

if (!fs.existsSync(publicPath)) {
  console.error('❌ No dist/public directory found after build');
  process.exit(1);
}

// Step 3: Move files from dist/public to dist
console.log('📁 Restructuring files for deployment...');

const publicFiles = fs.readdirSync(publicPath);

for (const file of publicFiles) {
  const srcPath = path.join(publicPath, file);
  const destPath = path.join(distPath, file);
  
  // Remove existing file/directory in dist if it exists
  if (fs.existsSync(destPath)) {
    fs.rmSync(destPath, { recursive: true, force: true });
  }
  
  // Move the file/directory
  fs.renameSync(srcPath, destPath);
  console.log(`  ✓ Moved ${file}`);
}

// Step 4: Remove empty public directory
fs.rmdirSync(publicPath);

console.log('✅ Deployment structure fixed!');
console.log('📋 Files are now in dist/ for static deployment');
console.log('');
console.log('🚀 Next steps:');
console.log('   1. Deploy using static deployment');
console.log('   2. Or use autoscale deployment for full-stack support');