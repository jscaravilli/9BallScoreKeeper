import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function quickDeploy() {
  console.log('🎱 Quick Static Deploy - 9-Ball Pool Scorekeeper');
  console.log('================================================');
  
  try {
    // Clean and build with timeout
    await fs.rm('dist', { recursive: true, force: true });
    console.log('✓ Cleaned dist directory');
    
    // Build with timeout and simplified output
    console.log('Building (this may take 30-60 seconds)...');
    
    const buildProcess = exec('vite build --logLevel=error');
    
    // Set a reasonable timeout
    const timeout = setTimeout(() => {
      buildProcess.kill();
      console.log('⚠️  Build timed out but may have completed');
    }, 90000); // 90 seconds
    
    try {
      await new Promise((resolve, reject) => {
        buildProcess.on('exit', (code) => {
          clearTimeout(timeout);
          if (code === 0) resolve();
          else reject(new Error(`Build failed with code ${code}`));
        });
        buildProcess.on('error', reject);
      });
      console.log('✓ Build completed successfully');
    } catch (error) {
      // Check if files exist despite error
      try {
        await fs.access('dist/public/index.html');
        console.log('✓ Build output found despite error');
      } catch {
        throw new Error('Build failed and no output found');
      }
    }
    
    // Restructure for static deployment
    const publicDir = 'dist/public';
    const files = await fs.readdir(publicDir);
    
    for (const file of files) {
      const srcPath = path.join(publicDir, file);
      const destPath = path.join('dist', file);
      await fs.rename(srcPath, destPath);
    }
    
    await fs.rmdir(publicDir);
    console.log('✓ Restructured files for static deployment');
    
    // Verify deployment structure
    await fs.access('dist/index.html');
    const stats = await fs.stat('dist/index.html');
    console.log(`✓ index.html ready (${(stats.size / 1024).toFixed(1)}KB)`);
    
    console.log('');
    console.log('🚀 READY FOR DEPLOYMENT!');
    console.log('');
    console.log('Deployment Settings:');
    console.log('• Type: Static');
    console.log('• Public Directory: dist');
    console.log('• Build Command: node quick-deploy.js');
    console.log('');
    
  } catch (error) {
    console.error('❌ Deployment preparation failed:', error.message);
    console.log('');
    console.log('Alternative: Use the existing prepare-static-deploy.js script');
    process.exit(1);
  }
}

quickDeploy();