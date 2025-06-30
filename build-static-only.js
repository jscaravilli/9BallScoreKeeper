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
    
    // Build frontend (Vite outputs to dist/public due to config)
    console.log('Building frontend...');
    await execAsync('vite build');
    console.log('✓ Built frontend to dist/public');
    
    // Move files from dist/public to dist root for static deployment
    try {
      await fs.access('dist/public');
      await execAsync('mv dist/public/* dist/ && rmdir dist/public');
      console.log('✓ Moved files from dist/public to dist root');
    } catch (error) {
      // Fallback: try copying if move fails
      await execAsync('cp -r dist/public/* dist/ && rm -rf dist/public');
      console.log('✓ Copied files from dist/public to dist root');
    }
    
    // Copy PWA files to dist directory
    const pwaFiles = ['manifest.json', 'sw.js', 'icon-192.png', 'icon-512.png'];
    for (const file of pwaFiles) {
      try {
        await fs.copyFile(file, `dist/${file}`);
        console.log(`✓ Copied ${file} to dist`);
      } catch (error) {
        console.log(`⚠ Could not copy ${file}: ${error.message}`);
      }
    }
    
    // Inject deployment timestamp for cache busting
    const indexPath = 'dist/index.html';
    let indexContent = await fs.readFile(indexPath, 'utf-8');
    const deploymentTime = Date.now();
    
    // Add cache-busting meta tag and deployment timestamp
    indexContent = indexContent.replace(
      '<head>',
      `<head>
    <meta name="deployment-time" content="${deploymentTime}">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">`
    );
    
    // Inject deployment timestamp as global variable
    indexContent = indexContent.replace(
      '<script type="module" src="/src/main.tsx"></script>',
      `<script>window.DEPLOYMENT_TIME = ${deploymentTime};</script>
    <script type="module" src="/src/main.tsx?v=${deploymentTime}"></script>`
    );
    
    await fs.writeFile(indexPath, indexContent);
    console.log(`✓ Injected deployment timestamp: ${deploymentTime}`);
    
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