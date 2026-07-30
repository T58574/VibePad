import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const releaseDir = path.resolve(rootDir, 'release');

console.log('⚡ Building Ultra-Fast Electron Desktop Executable...');

try {
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

  // 1. Build Vite web bundle
  console.log('📦 Step 1: Building Vite web bundle into dist/...');
  execSync('npx vite build', { cwd: rootDir, stdio: 'inherit' });

  // 2. Package standalone Electron binary using electron-builder
  console.log('🚀 Step 2: Packaging Electron native desktop binary...');
  execSync('npx electron-builder --win portable', { cwd: rootDir, stdio: 'inherit' });

  // 3. Find generated .exe in release/ and copy to root VibePad.exe
  const files = fs.readdirSync(releaseDir);
  const exeFile = files.find(f => f.endsWith('.exe'));

  if (exeFile) {
    const srcExe = path.join(releaseDir, exeFile);
    const destExe = path.join(rootDir, 'VibePad.exe');
    fs.copyFileSync(srcExe, destExe);
    console.log(`\n🎉 SUCCESS! Native VibePad Desktop Exe successfully generated!\nStandalone app ready at:\n- ${destExe}\n`);
  } else {
    console.warn('⚠️ Generated executable missing in release/');
  }
} catch (error) {
  console.error('❌ Build script failed:', error);
  process.exit(1);
}
