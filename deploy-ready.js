#!/usr/bin/env node

// Simple deployment script for the 9-ball pool scorer
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Creating deployment-ready version...');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Create a production server file that works with Replit's deployment
const productionServer = `import express from "express";
import { registerRoutes } from "./routes.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup API routes
await registerRoutes(app);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(\`Server running on port \${port}\`);
});`;

fs.writeFileSync('dist/index.js', productionServer);

// Copy the current working client and server files
const filesToCopy = [
  'server/routes.ts',
  'server/storage.ts', 
  'shared/schema.ts'
];

filesToCopy.forEach(file => {
  const destDir = path.dirname(path.join('dist', file));
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  if (fs.existsSync(file)) {
    // Convert .ts to .js for production
    const content = fs.readFileSync(file, 'utf8');
    const jsFile = file.replace('.ts', '.js');
    const destFile = path.join('dist', jsFile);
    
    // Simple TS to JS conversion for imports
    const jsContent = content
      .replace(/from ["']@shared\//g, 'from "../shared/')
      .replace(/from ["']@\//g, 'from "./')
      .replace(/\.ts["']/g, '.js"')
      .replace(/: Request/g, '')
      .replace(/: Response/g, '')
      .replace(/: NextFunction/g, '')
      .replace(/: Express/g, '')
      .replace(/: Server/g, '');
    
    fs.writeFileSync(destFile, jsContent);
  }
});

console.log('✅ Deployment files created in dist/ directory');
console.log('');
console.log('To deploy your app:');
console.log('1. Click the Deploy button in Replit');
console.log('2. Choose "Autoscale" deployment');
console.log('3. Your app will work at the generated .replit.app URL');
console.log('');
console.log('The deployment will use in-memory storage that persists during each session.');