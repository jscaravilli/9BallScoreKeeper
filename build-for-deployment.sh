#!/bin/bash

echo "Building application for deployment..."

# Run the standard build process
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed. Please check for errors."
    exit 1
fi

echo "Restructuring build output for deployment..."

# Check if dist/public exists
if [ ! -d "dist/public" ]; then
    echo "Error: dist/public directory not found. Build may have failed."
    exit 1
fi

# Copy all files from dist/public to dist
cp -r dist/public/* dist/

# Remove the public directory to match deployment expectations
rm -rf dist/public

echo "Deployment build completed successfully!"
echo "Files are now available directly in the dist directory."
echo ""
echo "Next steps:"
echo "1. Use 'Autoscale' deployment type (recommended for full-stack apps)"
echo "2. Or deploy using static deployment - files are now in the correct structure"