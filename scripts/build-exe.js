import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const buildDir = path.resolve(rootDir, 'build');
const releaseDir = path.resolve(rootDir, 'release');

console.log('⚡ Building Ultra-Fast Electrobun (Bun + WebView2) Desktop Executable...');

try {
  // 0. Kill any background launcher or bun processes to release file locks
  try {
    execSync('taskkill /f /im launcher.exe /im bun.exe 2>nul', { stdio: 'ignore' });
  } catch (e) {}

  // 1. Clean previous build artifacts
  if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true });
  if (fs.existsSync(releaseDir)) fs.rmSync(releaseDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
  fs.mkdirSync(releaseDir, { recursive: true });

  // Generate native Windows .ico if missing or invalid
  const icoSource = path.resolve(rootDir, 'public/vibe-icon.ico');
  if (!fs.existsSync(icoSource) || fs.statSync(icoSource).size < 1000) {
    console.log('🎨 Generating high-res native Windows application icon...');
    execSync('node scripts/make-valid-ico.js', { cwd: rootDir, stdio: 'inherit' });
  }

  // 2. Build Vite web bundle
  console.log('📦 Step 1: Building Vite web bundle...');
  execSync('npx vite build', { cwd: rootDir, stdio: 'inherit' });

  // 3. Build native Electrobun application
  console.log('🚀 Step 2: Packaging Electrobun native desktop binary...');
  execSync('npx electrobun build', { cwd: rootDir, stdio: 'inherit' });

  // 4. Find generated Electrobun app bundle in build/
  const electrobunAppDir = path.resolve(buildDir, 'dev-win-x64/VibePad-dev');
  if (fs.existsSync(electrobunAppDir)) {
    // Patch Resources/main.js to forward process.argv CLI arguments to Worker
    const mainJsPath = path.resolve(electrobunAppDir, 'Resources/main.js');
    if (fs.existsSync(mainJsPath)) {
      let mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
      if (!mainJsContent.includes('ELECTROBUN_CLI_ARGS')) {
        mainJsContent = mainJsContent.replace(
          /new Worker\(appEntrypointPath,\s*\{\}\);/g,
          'process.env.ELECTROBUN_CLI_ARGS = JSON.stringify(process.argv);\n  new Worker(appEntrypointPath, {});'
        );
        fs.writeFileSync(mainJsPath, mainJsContent, 'utf8');
        console.log('🔧 Patched Electrobun main.js to forward process.argv CLI arguments to Worker process.');
      }
    }
    const mainviewDir = path.resolve(electrobunAppDir, 'Resources/app/views/mainview');
    const viteAssetsDir = path.resolve(distDir, 'assets');
    const mainviewAssetsDir = path.resolve(mainviewDir, 'assets');

    // Ensure all Vite assets (JS/CSS chunks) are present inside Electrobun views mainview
    if (fs.existsSync(viteAssetsDir)) {
      fs.mkdirSync(mainviewAssetsDir, { recursive: true });
      fs.cpSync(viteAssetsDir, mainviewAssetsDir, { recursive: true });
    }

    const targetReleaseAppDir = path.resolve(releaseDir, 'VibePad-win-x64');
    
    // Copy full app directory structure into release and dist
    fs.cpSync(electrobunAppDir, targetReleaseAppDir, { recursive: true });
    fs.cpSync(electrobunAppDir, distDir, { recursive: true });

    // Copy icon to dist and release
    const icoSource = path.resolve(rootDir, 'public/vibe-icon.ico');
    if (fs.existsSync(icoSource)) {
      fs.copyFileSync(icoSource, path.resolve(distDir, 'vibe-icon.ico'));
      fs.copyFileSync(icoSource, path.resolve(targetReleaseAppDir, 'vibe-icon.ico'));
    }

    const launcherExe = path.resolve(distDir, 'bin/launcher.exe');
    const rootExe = path.resolve(rootDir, 'VibePad.exe');
    const distExe = path.resolve(distDir, 'VibePad.exe');

    // Create CMD & VBS launchers in root & dist for double-click launch from Explorer
    const rootCmd = `@echo off\r\nstart "" "%~dp0dist\\bin\\launcher.exe" %*\r\n`;
    fs.writeFileSync(path.resolve(rootDir, 'VibePad.cmd'), rootCmd, 'utf8');
    fs.writeFileSync(path.resolve(distDir, 'VibePad.cmd'), rootCmd, 'utf8');

    if (fs.existsSync(launcherExe)) {
      // Also sync dist/VibePad.exe as launcher copy for direct shortcut access
      fs.copyFileSync(launcherExe, distExe);
      fs.copyFileSync(launcherExe, rootExe);
      console.log(`\n🎉 SUCCESS! Native 64-bit Electrobun VibePad bundle generated!\nStandalone app bundles ready at:\n- ${targetReleaseAppDir}\n- ${distDir}\n- ${launcherExe}\n`);
    } else {
      console.warn('⚠️ launcher.exe missing in Electrobun bin directory');
    }
  } else {
    console.error('❌ Electrobun build output directory missing:', electrobunAppDir);
  }
} catch (error) {
  console.error('❌ Build script failed:', error);
  process.exit(1);
}
