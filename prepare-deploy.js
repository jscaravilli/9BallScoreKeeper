#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function copyRecursive(src, dest) {
  const stats = await fs.promises.stat(src);
  
  if (stats.isDirectory()) {
    await fs.promises.mkdir(dest, { recursive: true });
    const entries = await fs.promises.readdir(src);
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      await copyRecursive(srcPath, destPath);
    }
  } else {
    await fs.promises.copyFile(src, dest);
  }
}

async function prepareDeployment() {
  const distPath = path.join(__dirname, 'dist');
  const publicPath = path.join(distPath, 'public');
  
  console.log('Preparing deployment structure...');
  
  // Check if dist/public exists
  if (!fs.existsSync(publicPath)) {
    console.log('Build output not found at dist/public.');
    console.log('Current directory structure:');
    try {
      const distExists = fs.existsSync(distPath);
      console.log(`- dist directory exists: ${distExists}`);
      if (distExists) {
        const distContents = await fs.promises.readdir(distPath);
        console.log(`- dist contents: ${distContents.join(', ')}`);
      }
    } catch (e) {
      console.log('Could not read directory structure');
    }
    console.error('Please run "npm run build" first to generate the build output.');
    process.exit(1);
  }
  
  // Copy all files from dist/public to dist
  const files = await fs.promises.readdir(publicPath);
  
  for (const file of files) {
    const srcPath = path.join(publicPath, file);
    const destPath = path.join(distPath, file);
    
    console.log(`Copying ${file}...`);
    await copyRecursive(srcPath, destPath);
  }
  
  // Remove the public directory
  await fs.promises.rm(publicPath, { recursive: true, force: true });
  
  console.log('Deployment structure prepared successfully!');
  console.log('Files are now available directly in the dist directory for static deployment.');
}

prepareDeployment().catch(console.error);