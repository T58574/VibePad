import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const neuOutDir = path.resolve(distDir, 'VibePad');

console.log('⚡ Building Ultra-Lightweight Neutralinojs Desktop Executable...');

try {
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

  // 1. Build Vite web bundle
  console.log('📦 Step 1: Building Vite web bundle into dist/...');
  execSync('npx vite build', { cwd: rootDir, stdio: 'inherit' });

  // Copy neutralino.js to dist/
  const clientLibPath = path.join(rootDir, 'node_modules', '@neutralinojs', 'lib', 'dist', 'neutralino.js');
  if (fs.existsSync(clientLibPath)) {
    fs.copyFileSync(clientLibPath, path.join(distDir, 'neutralino.js'));
  }

  // 2. Build Neutralino native desktop app
  console.log('🚀 Step 2: Packaging Neutralino native desktop binary...');
  try {
    execSync('npx @neutralinojs/neu build', { cwd: rootDir, stdio: 'inherit' });
  } catch (neuErr) {
    console.warn('⚠️ neu build info:', neuErr.message);
  }

  // 3. Extract generated binaries and resources from dist/VibePad/
  const neuWinExe = path.join(neuOutDir, 'VibePad-win_x64.exe');
  const neuResources = path.join(neuOutDir, 'resources.neu');

  if (fs.existsSync(neuWinExe) && fs.existsSync(neuResources)) {
    // Copy executable and resources.neu to rootDir
    fs.copyFileSync(neuWinExe, path.join(rootDir, 'VibePad.exe'));
    fs.copyFileSync(neuResources, path.join(rootDir, 'resources.neu'));

    // Copy executable and resources.neu to dist/
    fs.copyFileSync(neuWinExe, path.join(distDir, 'VibePad.exe'));
    fs.copyFileSync(neuResources, path.join(distDir, 'resources.neu'));

    if (fs.existsSync(path.join(neuOutDir, 'WebView2Loader.dll'))) {
      fs.copyFileSync(path.join(neuOutDir, 'WebView2Loader.dll'), path.join(rootDir, 'WebView2Loader.dll'));
      fs.copyFileSync(path.join(neuOutDir, 'WebView2Loader.dll'), path.join(distDir, 'WebView2Loader.dll'));
    }

    console.log(`\n🎉 SUCCESS! Native VibePad Desktop Exe successfully generated!\nStandalone app ready at:\n- ${path.join(rootDir, 'VibePad.exe')}\n- ${path.join(distDir, 'VibePad.exe')}\n`);
  } else {
    console.warn('⚠️ Generated Neutralino resources or binaries missing in dist/VibePad/');
  }
} catch (error) {
  console.error('❌ Build script failed:', error);
  process.exit(1);
}
