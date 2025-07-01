#!/usr/bin/env node

/**
 * Offline-First Static Build Script
 * Creates a completely self-contained static build that works without any server
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DIST_DIR = 'dist-offline';

console.log('🔄 Building offline-first static version...');

// Clean previous build
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// Build the client application
console.log('📦 Building client application...');
try {
  execSync('cd client && npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Copy built files to offline distribution directory
const clientDistPath = path.join('client', 'dist');
if (!fs.existsSync(clientDistPath)) {
  console.error('❌ Client build not found at:', clientDistPath);
  process.exit(1);
}

console.log('📁 Copying built files...');
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

// Verify index.html exists
const indexPath = path.join(DIST_DIR, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html not found in build output');
  process.exit(1);
}

// Enhance service worker for true offline functionality
const swPath = path.join(DIST_DIR, 'sw.js');
if (fs.existsSync(swPath)) {
  console.log('🔄 Enhancing service worker for offline-first operation...');
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Add offline-first cache strategy
  const offlineEnhancement = `

// OFFLINE-FIRST ENHANCEMENT
// Cache everything aggressively for true offline operation
const OFFLINE_CACHE = 'offline-v1';

// Install event - cache all resources immediately
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing for offline-first operation');
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
      ]);
    })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache first, network as fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if available
      if (response) {
        return response;
      }
      
      // Try network, cache the response
      return fetch(event.request).then((response) => {
        // Only cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(OFFLINE_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Network failed, try to serve index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        throw new Error('Network failed and no cache available');
      });
    })
  );
});
`;
  
  swContent += offlineEnhancement;
  fs.writeFileSync(swPath, swContent);
}

// Create a simple HTTP server for local testing
const serverScript = `#!/usr/bin/env node

/**
 * Simple local server for testing offline functionality
 * Run: node serve-offline.js
 * Then test airplane mode functionality
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8080;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  
  // Security: prevent directory traversal
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
            res.end('Server Error');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf8');
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
        'Cache-Control': 'public, max-age=31536000' // 1 year cache for static assets
      });
      res.end(content, 'utf8');
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(\`🚀 Offline-first app running at http://localhost:\${PORT}\`);
  console.log('📱 To test offline functionality:');
  console.log('  1. Load the app in browser');
  console.log('  2. Turn on airplane mode');
  console.log('  3. Refresh page - should still work!');
});
`;

fs.writeFileSync(path.join(DIST_DIR, 'serve-offline.js'), serverScript);

// Create package.json for the offline build
const offlinePackageJson = {
  "name": "9ball-scorekeeper-offline",
  "version": "1.0.7",
  "type": "module",
  "description": "Offline-first 9 Ball Scorekeeper",
  "scripts": {
    "start": "node serve-offline.js"
  }
};

fs.writeFileSync(path.join(DIST_DIR, 'package.json'), JSON.stringify(offlinePackageJson, null, 2));

// Create README for offline deployment
const offlineReadme = `# 9 Ball Scorekeeper - Offline Version

This is a completely self-contained, offline-first version of the 9 Ball Scorekeeper app.

## Quick Start

1. \`cd ${DIST_DIR}\`
2. \`node serve-offline.js\`
3. Open http://localhost:8080
4. Use the app normally, then test airplane mode!

## Offline Testing

1. Load the app in your browser
2. Turn on airplane mode or disconnect internet
3. Refresh the page - it should still work perfectly
4. All game data persists in browser cookies

## Deployment

Copy the contents of this folder to any web server or hosting service.
The app requires no backend - it's purely client-side with cookie storage.

## Features

- ✅ Complete offline functionality
- ✅ Cookie-based data persistence
- ✅ Progressive Web App (PWA) capabilities
- ✅ Works on any device with a web browser
- ✅ No internet connection required after initial load
`;

fs.writeFileSync(path.join(DIST_DIR, 'README.md'), offlineReadme);

console.log('✅ Offline-first build complete!');
console.log('📁 Files created in:', DIST_DIR);
console.log('🚀 To test offline functionality:');
console.log(`   cd ${DIST_DIR}`);
console.log('   node serve-offline.js');
console.log('   Then test airplane mode!');