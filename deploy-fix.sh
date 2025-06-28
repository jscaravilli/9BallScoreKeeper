#!/bin/bash

echo "🚀 Fixing deployment structure..."

# Build the application
echo "Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Check if dist/public exists
if [ ! -d "dist/public" ]; then
    echo "❌ dist/public not found after build"
    exit 1
fi

echo "Restructuring for deployment..."

# Move all files from dist/public to dist
mv dist/public/* dist/ 2>/dev/null || true

# Remove empty public directory
rmdir dist/public 2>/dev/null || true

echo "✅ Deployment structure fixed!"
echo ""
echo "Files are now ready for static deployment in the dist/ directory"
echo "You can now deploy your application"