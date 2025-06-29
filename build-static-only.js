import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

async function buildStaticOnly() {
  console.log('Building static 9-Ball Pool Scorekeeper...');
  
  try {
    // Clean dist directory
    await fs.rm('dist', { recursive: true, force: true });
    console.log('✓ Cleaned dist directory');
    
    // Build frontend (Vite outputs to client/dist)
    console.log('Building frontend...');
    await execAsync('vite build');
    console.log('✓ Built frontend');
    
    // Copy from client/dist to root dist for static deployment
    await fs.mkdir('dist', { recursive: true });
    await execAsync('cp -r client/dist/* dist/');
    console.log('✓ Copied to dist directory');
    
    // Verify index.html is ready
    const stats = await fs.stat('dist/index.html');
    console.log(`✓ index.html ready (${(stats.size / 1024).toFixed(1)}KB)`);
    
    // Count assets
    try {
      const assets = await fs.readdir('dist/assets');
      console.log(`✓ Assets: ${assets.length} files`);
    } catch (error) {
      console.log('✓ No separate assets directory (files may be inlined)');
    }
    
    console.log('');
    console.log('🚀 STATIC BUILD COMPLETE!');
    console.log('');
    console.log('Deployment Settings:');
    console.log('• Type: Static');
    console.log('• Public Directory: dist');
    console.log('• Build Command: node build-static-only.js');
    console.log('');
    console.log('Your app is ready for static deployment.');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildStaticOnly();