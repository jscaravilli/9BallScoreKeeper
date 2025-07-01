import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

async function buildOfflineFirst() {
  console.log('Building offline-first 9-Ball Pool Scorekeeper...');
  
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
    const pwaFiles = ['manifest.json', 'sw.js', 'icon-192.png', 'icon-512.png', 'screenshot-mobile.png', 'pwabuilder.json', 'pwabuilder-sw.js'];
    
    // Copy .well-known directory for asset links
    await execAsync('mkdir -p dist/.well-known');
    await fs.copyFile('.well-known/assetlinks.json', 'dist/.well-known/assetlinks.json');
    for (const file of pwaFiles) {
      try {
        await fs.copyFile(file, `dist/${file}`);
        console.log(`✓ Copied ${file} to dist`);
      } catch (error) {
        console.log(`⚠ Could not copy ${file}: ${error.message}`);
      }
    }
    
    // ENHANCE SERVICE WORKER FOR OFFLINE-FIRST OPERATION
    const swPath = 'dist/sw.js';
    try {
      let swContent = await fs.readFile(swPath, 'utf-8');
      
      // Add aggressive offline-first caching strategy
      const offlineEnhancement = `

// OFFLINE-FIRST ENHANCEMENT FOR AIRPLANE MODE
const OFFLINE_CACHE = 'offline-v2';
const CACHE_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Override install to cache everything immediately
self.addEventListener('install', (event) => {
  console.log('SW: Installing offline-first cache for airplane mode');
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => {
      return cache.addAll(CACHE_RESOURCES).then(() => {
        console.log('SW: Offline cache ready - airplane mode supported');
        return self.skipWaiting();
      });
    })
  );
});

// Activate - clean old caches and take control
self.addEventListener('activate', (event) => {
  console.log('SW: Activating offline-first mode');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== OFFLINE_CACHE) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('SW: Taking control of all clients');
      return self.clients.claim();
    })
  );
});

// CRITICAL: Override fetch for offline-first behavior
self.addEventListener('fetch', (event) => {
  // Always try cache first for offline support
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('SW: Serving from cache:', event.request.url);
        return cachedResponse;
      }
      
      // Try network, but cache the response for future offline use
      return fetch(event.request).then((response) => {
        // Only cache successful responses
        if (response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(OFFLINE_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
            console.log('SW: Cached for offline:', event.request.url);
          });
        }
        return response;
      }).catch((error) => {
        console.log('SW: Network failed, serving cached fallback for:', event.request.url);
        // Network failed (airplane mode) - serve index.html for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html').then((cachedIndex) => {
            if (cachedIndex) {
              console.log('SW: Serving cached index.html for navigation in airplane mode');
              return cachedIndex;
            }
            return new Response('Offline - Please load the app at least once with internet connection', { 
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
        }
        console.log('SW: Resource not available offline:', event.request.url);
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
`;
      
      swContent += offlineEnhancement;
      await fs.writeFile(swPath, swContent);
      console.log('✓ Enhanced service worker for offline-first operation');
    } catch (error) {
      console.log('⚠ Could not enhance service worker:', error.message);
    }
    
    // Inject deployment timestamp for cache busting
    const indexPath = 'dist/index.html';
    let indexContent = await fs.readFile(indexPath, 'utf-8');
    const deploymentTime = Date.now();
    
    // Add stronger cache-busting and offline indicators
    indexContent = indexContent.replace(
      '<head>',
      `<head>
    <meta name="deployment-time" content="${deploymentTime}">
    <meta name="offline-first" content="true">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">`
    );
    
    // Inject deployment timestamp as global variable
    indexContent = indexContent.replace(
      '<script type="module" src="/src/main.tsx"></script>',
      `<script>
        window.DEPLOYMENT_TIME = ${deploymentTime};
        window.OFFLINE_FIRST = true;
      </script>
    <script type="module" src="/src/main.tsx?v=${deploymentTime}"></script>`
    );
    
    await fs.writeFile(indexPath, indexContent);
    console.log(`✓ Injected offline-first configuration: ${deploymentTime}`);
    
    // Create local test server for offline testing
    const testServer = `#!/usr/bin/env node

/**
 * Local test server for offline functionality validation
 * Usage: cd dist && node test-offline.js
 */

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
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  
  // Security check
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Serve index.html for client-side routing
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
        'Cache-Control': 'public, max-age=0' // Allow caching but revalidate
      });
      res.end(content);
    }
  });
}).listen(PORT, () => {
  console.log(\`🌐 Offline test server: http://localhost:\${PORT}\`);
  console.log('');
  console.log('🧪 OFFLINE TESTING STEPS:');
  console.log('  1. Load the app in your browser');
  console.log('  2. Wait for service worker to install (check browser dev tools)');
  console.log('  3. Turn on airplane mode');
  console.log('  4. Refresh the page');
  console.log('  5. App should work perfectly offline!');
  console.log('');
  console.log('💡 Cookie storage persists game data across sessions');
});
`;

    await fs.writeFile('dist/test-offline.js', testServer);
    console.log('✓ Created offline test server');
    
    // Create README for offline deployment
    const offlineReadme = `# 9 Ball Scorekeeper - Offline-First Edition

This version is specifically built for complete offline functionality, including airplane mode.

## Quick Offline Test

\`\`\`bash
cd dist
node test-offline.js
\`\`\`

Then:
1. Load http://localhost:8888 in browser
2. Turn on airplane mode
3. Refresh page - should work perfectly!

## Features

✅ **Complete offline functionality** - works in airplane mode  
✅ **Cookie-based persistence** - survives browser restarts  
✅ **Progressive Web App** - install like native app  
✅ **Enhanced service worker** - aggressive caching strategy  
✅ **Multi-device support** - each device independent  

## Deployment

Upload the contents of this directory to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- Any web server

No backend required - purely client-side with cookie storage.

## Service Worker

The enhanced service worker provides:
- Immediate caching on first visit
- Offline-first fetch strategy  
- Airplane mode compatibility
- Automatic cache management

Built: ${new Date().toISOString()}
`;

    await fs.writeFile('dist/README.md', offlineReadme);
    console.log('✓ Created offline deployment README');
    
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
    console.log('🚀 OFFLINE-FIRST BUILD COMPLETE!');
    console.log('');
    console.log('🛫 Airplane Mode Ready:');
    console.log('• Enhanced service worker for offline-first operation');
    console.log('• Cookie-based storage persists across sessions');
    console.log('• Works completely without internet after first load');
    console.log('');
    console.log('🧪 Test offline: cd dist && node test-offline.js');
    console.log('🌐 Deploy: Upload dist/ contents to any static host');
    console.log('');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildOfflineFirst();