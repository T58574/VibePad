import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const jpegPath = path.resolve(rootDir, 'App_icon_VibePad.jpeg');
const icoPath = path.resolve(rootDir, 'public/vibe-icon.ico');

const psScript = `
Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile('${jpegPath.replace(/\\/g, '\\\\')}')
$iconHandle = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)
$stream = [System.IO.File]::Create('${icoPath.replace(/\\/g, '\\\\')}')
$icon.Save($stream)
$stream.Close()
`;

try {
  const psPath = path.resolve(rootDir, 'scripts/convert-ico.ps1');
  fs.writeFileSync(psPath, psScript, 'utf8');
  execSync(`powershell -ExecutionPolicy Bypass -File "${psPath}"`, { stdio: 'inherit' });
  if (fs.existsSync(icoPath)) {
    console.log(`✅ Native Windows Icon generated successfully at: ${icoPath}`);
  }
} catch (e) {
  console.error('Error generating ICO:', e.message);
}
