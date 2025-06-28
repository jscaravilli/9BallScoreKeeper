import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function buildStatic() {
  console.log('🎱 Building 9-Ball Pool Scorekeeper for static deployment...');
  
  try {
    // Clean dist directory
    await fs.rm('dist', { recursive: true, force: true });
    console.log('✓ Cleaned dist directory');
    
    // Build frontend only
    await execAsync('vite build');
    console.log('✓ Built frontend');
    
    // Check build output
    const stats = await fs.stat('dist/public/index.html');
    console.log('✓ Static build complete');
    console.log(`📁 Frontend size: ${(stats.size / 1024).toFixed(1)}KB`);
    
    // Create deployment info
    const deployInfo = {
      buildDate: new Date().toISOString(),
      deployment: 'static',
      features: [
        'Client-side match storage using localStorage',
        'Full APA 9-ball scoring system',
        'Match completion and undo functionality',
        'Mobile-responsive design'
      ]
    };
    
    await fs.writeFile('dist/public/deployment-info.json', JSON.stringify(deployInfo, null, 2));
    console.log('✓ Created deployment info');
    
    console.log('\n🚀 Static deployment ready!');
    console.log('📂 Files location: dist/public/');
    console.log('🌐 Deploy the contents of dist/public/ to any static hosting service');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildStatic();