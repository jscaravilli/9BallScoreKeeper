#!/bin/bash

echo "🎱 9-Ball Pool Scorekeeper - Static Deployment Preparation"
echo "=========================================================="
echo ""
echo "This script prepares your app for static deployment by:"
echo "1. Building the frontend with Vite"
echo "2. Moving files from dist/public to dist root"
echo "3. Verifying index.html is in the correct location"
echo ""

# Run the Node.js deployment preparation script
node prepare-static-deploy.js

echo ""
echo "📋 Deployment Instructions:"
echo "1. Set deployment type to 'Static'"
echo "2. Set public directory to 'dist'"
echo "3. Click deploy"
echo ""
echo "Your app will run entirely in the browser using localStorage for data."