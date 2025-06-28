import fs from 'fs';
import path from 'path';

console.log('Creating production-ready deployment...');

// Update package.json to ensure proper production startup
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts.start = "NODE_ENV=production tsx server/index.ts";
packageJson.main = "server/index.ts";
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

// Create a production environment check
const productionCheck = `
// Production environment validation
if (process.env.NODE_ENV === 'production') {
  console.log('Production mode detected');
  console.log('Database URL available:', !!process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.warn('Warning: No DATABASE_URL in production - using memory storage');
  }
}
`;

// Add production check to server startup
const serverIndex = fs.readFileSync('server/index.ts', 'utf8');
const updatedServerIndex = productionCheck + '\n' + serverIndex;
fs.writeFileSync('server/index.ts', updatedServerIndex);

console.log('✅ Production deployment configured');
console.log('');
console.log('Deploy instructions:');
console.log('1. Click Deploy in Replit');
console.log('2. Choose Autoscale deployment');
console.log('3. App will use database storage in production');
console.log('4. Environment variables will be automatically available');