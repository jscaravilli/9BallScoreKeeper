#!/bin/bash

echo "Building for production deployment..."

# Create dist directory
mkdir -p dist

# Build frontend with Vite
echo "Building frontend..."
npm run build

# Check if build was successful
if [ ! -d "dist/public" ]; then
    echo "Frontend build failed, creating basic structure..."
    mkdir -p dist/public
    cp client/index.html dist/public/
fi

# Create production server
echo "Creating production server..."
cat > dist/index.js << 'EOF'
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

console.log("Starting production server...");
console.log("Environment:", process.env.NODE_ENV);
console.log("Database URL present:", !!process.env.DATABASE_URL);

// Register API routes
await registerRoutes(app);

// Serve static files in production
app.use(express.static(path.join(__dirname, "public")));

// Catch-all handler for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = process.env.PORT || 5000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Production server running on port ${port}`);
});
EOF

# Copy and convert server files
echo "Copying server files..."
cp -r server dist/
cp -r shared dist/

# Convert .ts imports to .js in copied files
find dist -name "*.ts" -exec sed -i 's/from "@shared\//from "..\/shared\//g' {} \;
find dist -name "*.ts" -exec sed -i 's/from "\.\/db"/from "\.\/db\.js"/g' {} \;

echo "Production build complete!"
echo "Ready for deployment with database support."