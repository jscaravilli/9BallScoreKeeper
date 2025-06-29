#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function deploy() {
  console.log('🎱 9-Ball Pool Scorekeeper - Static Deployment');
  console.log('===============================================');
  console.log('');
  
  try {
    // Clean dist directory
    await fs.rm('dist', { recursive: true, force: true });
    console.log('✓ Cleaned dist directory');
    
    // Build frontend with Vite (outputs to dist/public)
    console.log('Building frontend...');
    await execAsync('vite build');
    console.log('✓ Built frontend to dist/public');
    
    // Verify build output exists
    const publicDir = 'dist/public';
    try {
      await fs.access(publicDir);
      await fs.access(path.join(publicDir, 'index.html'));
    } catch (error) {
      throw new Error('Build failed: Required files not found in dist/public');
    }
    
    // Move files from dist/public to dist for static deployment
    const distDir = 'dist';
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
    
    // Verify final structure
    const stats = await fs.stat('dist/index.html');
    console.log('✓ index.html found in dist directory');
    console.log(`📁 Index file size: ${(stats.size / 1024).toFixed(1)}KB`);
    
    // Count assets
    try {
      const assets = await fs.readdir('dist/assets');
      console.log(`📦 Assets: ${assets.length} files`);
    } catch (error) {
      console.log('📦 Assets: none (CSS/JS may be inlined)');
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
    
    console.log('');
    console.log('🚀 DEPLOYMENT READY!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Set deployment type to "Static"');
    console.log('2. Set public directory to "dist"');
    console.log('3. Click deploy');
    console.log('');
    console.log('Your app will run entirely in the browser using localStorage for data persistence.');
    
  } catch (error) {
    console.error('❌ Deployment preparation failed:', error.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('• Ensure all dependencies are installed');
    console.log('• Check that the build process completes successfully');
    console.log('• Verify Vite configuration is correct');
    process.exit(1);
  }
}

deploy();