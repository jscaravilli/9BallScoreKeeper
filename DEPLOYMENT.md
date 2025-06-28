# Deployment Fix for 9-Ball Pool Score Tracker

## Issue
The deployment fails because it expects `index.html` directly in the `dist` directory, but the build process creates `dist/public/index.html`.

## Solution Options

### Option 1: Manual File Structure Fix (Recommended)
After running `npm run build`, manually restructure the files:

1. Run the build command:
   ```bash
   npm run build
   ```

2. Move files from `dist/public` to `dist`:
   ```bash
   # Copy all files from dist/public to dist
   cp -r dist/public/* dist/
   # Remove the public directory
   rm -rf dist/public
   ```

3. Deploy using the standard deployment process

### Option 2: Use the Deployment Script
I've created a `prepare-deploy.js` script that automates the file restructuring:

1. Run the build:
   ```bash
   npm run build
   ```

2. Run the deployment preparation script:
   ```bash
   node prepare-deploy.js
   ```

3. Deploy the application

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