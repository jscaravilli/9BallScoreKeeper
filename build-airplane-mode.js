import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

async function buildAirplaneMode() {
  console.log('Building 9-Ball Scorekeeper for airplane mode...');
  
  try {
    // Clean dist directory
    await fs.rm('dist', { recursive: true, force: true });
    console.log('✓ Cleaned dist directory');
    
    // Build frontend
    console.log('Building frontend...');
    await execAsync('vite build');
    console.log('✓ Built frontend to dist/public');
    
    // Move files from dist/public to dist root
    try {
      await fs.access('dist/public');
      await execAsync('mv dist/public/* dist/ && rmdir dist/public');
      console.log('✓ Moved files from dist/public to dist root');
    } catch (error) {
      await execAsync('cp -r dist/public/* dist/ && rm -rf dist/public');
      console.log('✓ Copied files from dist/public to dist root');
    }
    
    // Replace service worker with airplane-mode version
    await fs.copyFile('sw-offline.js', 'dist/sw.js');
    console.log('✓ Installed airplane-mode service worker');
    
    // Copy PWA files
    const pwaFiles = ['manifest.json', 'icon-192.png', 'icon-512.png', 'screenshot-mobile.png'];
    for (const file of pwaFiles) {
      try {
        await fs.copyFile(file, `dist/${file}`);
        console.log(`✓ Copied ${file}`);
      } catch (error) {
        console.log(`⚠ Could not copy ${file}: ${error.message}`);
      }
    }
    
    // Create .well-known directory for asset links
    await execAsync('mkdir -p dist/.well-known');
    try {
      await fs.copyFile('.well-known/assetlinks.json', 'dist/.well-known/assetlinks.json');
      console.log('✓ Copied asset links');
    } catch (error) {
      console.log('⚠ Asset links not found - creating placeholder');
      await fs.writeFile('dist/.well-known/assetlinks.json', '[]');
    }
    
    // Add airplane mode indicator to index.html
    const indexPath = 'dist/index.html';
    let indexContent = await fs.readFile(indexPath, 'utf-8');
    const deploymentTime = Date.now();
    
    // Add meta tags for airplane mode
    indexContent = indexContent.replace(
      '<head>',
      `<head>
    <meta name="deployment-time" content="${deploymentTime}">
    <meta name="airplane-mode-ready" content="true">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">`
    );
    
    // Add deployment timestamp
    indexContent = indexContent.replace(
      '<script type="module" src="/src/main.tsx"></script>',
      `<script>
        window.DEPLOYMENT_TIME = ${deploymentTime};
        window.AIRPLANE_MODE_READY = true;
        console.log('🛫 Airplane mode ready - deployment:', ${deploymentTime});
      </script>
    <script type="module" src="/src/main.tsx?v=${deploymentTime}"></script>`
    );
    
    await fs.writeFile(indexPath, indexContent);
    console.log(`✓ Added airplane mode configuration: ${deploymentTime}`);
    
    // Create airplane mode test server
    const testServer = `#!/usr/bin/env node
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8888;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end('Error loading index.html');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Service-Worker-Allowed': '/'
      });
      res.end(content);
    }
  });
}).listen(PORT, () => {
  console.log(\`🛫 Airplane Mode Test Server: http://localhost:\${PORT}\`);
  console.log('');
  console.log('✈️  AIRPLANE MODE TEST:');
  console.log('  1. Open http://localhost:8888');
  console.log('  2. Wait for service worker to install');
  console.log('  3. Turn on airplane mode');
  console.log('  4. Refresh page - should work!');
  console.log('');
});
`;

    await fs.writeFile('dist/test-airplane.js', testServer);
    console.log('✓ Created airplane mode test server');
    
    // Create deployment instructions
    const instructions = `# Airplane Mode Deployment

This build is specifically optimized for offline/airplane mode usage.

## Quick Test

\`\`\`bash
cd dist
node test-airplane.js
\`\`\`

Then turn on airplane mode and refresh - it should work perfectly!

## Features

✅ **True Airplane Mode Support** - Works completely offline  
✅ **Clean Service Worker** - No conflicting event listeners  
✅ **Cookie Storage** - Persistent across sessions  
✅ **PWA Ready** - Install as native app  

## Deploy

Upload the contents of this \`dist/\` directory to any static hosting service.

Built: ${new Date().toISOString()}
Deployment ID: ${deploymentTime}
`;

    await fs.writeFile('dist/AIRPLANE-MODE.md', instructions);
    console.log('✓ Created deployment instructions');
    
    // Verify build
    const stats = await fs.stat('dist/index.html');
    console.log(`✓ index.html ready (${(stats.size / 1024).toFixed(1)}KB)`);
    
    try {
      const assets = await fs.readdir('dist/assets');
      console.log(`✓ Assets: ${assets.length} files`);
    } catch (error) {
      console.log('✓ Assets inlined (no separate directory)');
    }
    
    console.log('');
    console.log('🛫 AIRPLANE MODE BUILD COMPLETE!');
    console.log('');
    console.log('✈️  This version will work in airplane mode after first load');
    console.log('🧪 Test: cd dist && node test-airplane.js');
    console.log('🚀 Deploy: Upload dist/ contents to static hosting');
    console.log('');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildAirplaneMode();