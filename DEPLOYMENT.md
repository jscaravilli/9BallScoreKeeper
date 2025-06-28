# Deployment Fix for 9-Ball Pool Score Tracker

## Issue
The deployment fails because it expects `index.html` directly in the `dist` directory, but the build process creates `dist/public/index.html`.

## Solution: File Restructuring (Your Choice)

I've created multiple automated solutions for you:

### Method 1: Simple Shell Script (Recommended)
```bash
./deploy-fix.sh
```

This script:
- Builds your application
- Moves all files from `dist/public` to `dist`
- Removes the empty `public` directory
- Prepares everything for static deployment

### Method 2: Node.js Script with Build Integration
```bash
node fix-deployment.js
```

This script:
- Automatically runs the build process
- Restructures the files
- Provides detailed progress feedback

### Method 3: Manual Commands
If you prefer manual control:
```bash
npm run build
mv dist/public/* dist/
rmdir dist/public
```

### Option 3: Change Deployment Type
Since this is a full-stack application with both frontend and backend:

1. Change the deployment type from "Static" to "Autoscale"
2. This will properly handle the Express server and static file serving
3. Use the existing build and start commands

## Recommended Approach
Use **Option 3** (Autoscale deployment) as this is a full-stack application that requires a server to handle API routes. The static deployment option is not suitable for applications with backend functionality.

## Current Architecture
- Frontend: React app built with Vite
- Backend: Express.js server
- Build output: `dist/public` (frontend) + `dist/index.js` (server)
- Production: Server serves static files and handles API routes