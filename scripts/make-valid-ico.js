import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const jpegPath = path.resolve(rootDir, 'App_icon_VibePad.jpeg');
const tempPngPath = path.resolve(rootDir, 'public/vibe-icon.png');
const icoPath = path.resolve(rootDir, 'public/vibe-icon.ico');

const psScript = `
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('${jpegPath.replace(/\\/g, '\\\\')}')
$bmp = New-Object System.Drawing.Bitmap 256, 256
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, 256, 256)
$bmp.Save('${tempPngPath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$img.Dispose()
`;

try {
  const psPath = path.resolve(rootDir, 'scripts/convert-png.ps1');
  fs.writeFileSync(psPath, psScript, 'utf8');
  execSync(`powershell -ExecutionPolicy Bypass -File "${psPath}"`, { stdio: 'inherit' });

  if (fs.existsSync(tempPngPath)) {
    const pngBuffer = fs.readFileSync(tempPngPath);
    const pngSize = pngBuffer.length;

    // Build ICO header + directory entry containing PNG payload
    const icoHeader = Buffer.alloc(6 + 16);
    // Header
    icoHeader.writeUInt16LE(0, 0); // Reserved
    icoHeader.writeUInt16LE(1, 2); // ICO type
    icoHeader.writeUInt16LE(1, 4); // 1 image

    // Directory entry (256x256)
    icoHeader.writeUInt8(0, 6);    // Width 0 = 256px
    icoHeader.writeUInt8(0, 7);    // Height 0 = 256px
    icoHeader.writeUInt8(0, 8);    // Color count
    icoHeader.writeUInt8(0, 9);    // Reserved
    icoHeader.writeUInt16LE(1, 10); // Color planes
    icoHeader.writeUInt16LE(32, 12); // Bits per pixel
    icoHeader.writeUInt32LE(pngSize, 14); // Bytes in resource
    icoHeader.writeUInt32LE(22, 18); // Offset of PNG payload (6 + 16 = 22)

    const finalIcoBuffer = Buffer.concat([icoHeader, pngBuffer]);
    fs.writeFileSync(icoPath, finalIcoBuffer);
    console.log(`✅ Valid High-Res ICO generated at ${icoPath} (${finalIcoBuffer.length} bytes)`);
  }
} catch (e) {
  console.error('Error generating ICO:', e.message);
}
