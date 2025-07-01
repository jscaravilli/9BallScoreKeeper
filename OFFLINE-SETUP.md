# Offline-First Setup Guide

This branch contains an enhanced version that works perfectly in airplane mode.

## Build Offline Version

```bash
node build-offline-first.js
```

## Test Offline Functionality

```bash
cd dist
node test-offline.js
```

Then:
1. Open http://localhost:8888 in browser
2. Wait for service worker to install (check browser dev tools Console)
3. Turn on airplane mode
4. Refresh the page - should work perfectly offline!

## Key Enhancements

✅ **Enhanced Service Worker** - Aggressive caching for airplane mode  
✅ **Cookie Storage** - Persistent game data across sessions  
✅ **Offline-First Strategy** - Cache first, network fallback  
✅ **Test Server Included** - Validate offline functionality locally  

## Deploy for Production

Upload the contents of the `dist/` directory to any static hosting service:
- Netlify
- Vercel  
- GitHub Pages
- Any web server

No backend required - completely self-contained.

## How It Works

1. **First Visit**: Service worker caches entire app
2. **Subsequent Visits**: App loads from cache instantly
3. **Airplane Mode**: Continues working from cached resources
4. **Game Data**: Persists in browser cookies across sessions

Perfect for pool halls with unreliable internet!