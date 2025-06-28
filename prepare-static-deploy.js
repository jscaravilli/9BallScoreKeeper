import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function prepareStaticDeploy() {
  console.log('🎱 Preparing 9-Ball Pool Scorekeeper for static deployment...');
  
  try {
    // Clean dist directory
    await fs.rm('dist', { recursive: true, force: true });
    console.log('✓ Cleaned dist directory');
    
    // Build frontend with Vite (outputs to dist/public)
    console.log('Building frontend...');
    await execAsync('vite build');
    console.log('✓ Built frontend to dist/public');
    
    // Move files from dist/public to dist for static deployment
    const publicDir = 'dist/public';
    const distDir = 'dist';
    
    // Read all files in dist/public
    const files = await fs.readdir(publicDir);
    
    // Move each file/directory from dist/public to dist
    for (const file of files) {
      const srcPath = path.join(publicDir, file);
      const destPath = path.join(distDir, file);
      await fs.rename(srcPath, destPath);
    }
    
    // Remove empty dist/public directory
    await fs.rmdir(publicDir);
    console.log('✓ Moved files from dist/public to dist');
    
    // Verify index.html exists in the correct location
    try {
      const stats = await fs.stat('dist/index.html');
      console.log('✓ index.html found in dist directory');
      console.log(`📁 Index file size: ${(stats.size / 1024).toFixed(1)}KB`);
    } catch (error) {
      throw new Error('index.html not found in dist directory after move');
    }
    
    // Create deployment info
    const deployInfo = {
      buildDate: new Date().toISOString(),
      deployment: 'static',
      buildType: 'restructured-for-static-deploy',
      features: [
        'Client-side match storage using localStorage',
        'Full APA 9-ball scoring system',
        'Match completion and undo functionality',
        'Mobile-responsive design'
      ],
      deployment_notes: 'Files moved from dist/public to dist for static deployment compatibility'
    };
    
    await fs.writeFile('dist/deployment-info.json', JSON.stringify(deployInfo, null, 2));
    console.log('✓ Created deployment info');
    
    console.log('\n🚀 Static deployment ready!');
    console.log('📂 Files location: dist/ (root level)');
    console.log('🌐 index.html is now in the correct location for static deployment');
    console.log('✅ Ready to deploy as Static deployment type');
    
  } catch (error) {
    console.error('❌ Deployment preparation failed:', error);
    process.exit(1);
  }
}

prepareStaticDeploy();