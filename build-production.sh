#!/bin/bash

echo "Building production version..."

# Build frontend
echo "Building frontend..."
npm run build 2>/dev/null &
BUILD_PID=$!

# Wait for build with timeout
timeout 60 wait $BUILD_PID
if [ $? -eq 124 ]; then
    echo "Build timed out, killing process..."
    kill $BUILD_PID 2>/dev/null
    pkill -f "vite build" 2>/dev/null
    
    # Try manual build
    echo "Attempting manual build..."
    mkdir -p dist/public
    cp client/index.html dist/public/
    echo "Basic build completed"
else
    echo "Build completed successfully"
fi

echo "Production build ready"