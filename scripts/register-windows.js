import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const exePath = path.resolve(distDir, 'VibePad.exe');
const escapedExePath = exePath.replace(/\\/g, '\\\\');

console.log('⚡ Registering VibePad into Windows Explorer Context Menu...');

// 1. Generate standalone .reg file for manual import fallback
const regFileContent = `Windows Registry Editor Version 5.00

; Add "Open with VibePad" for ALL files in HKCU (No Admin Required)
[HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\VibePad]
@="Open with VibePad"
"Icon"="${escapedExePath}"

[HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\VibePad\\command]
@="\\"${escapedExePath}\\" \\"%1\\""

; Register Application entry for "Open With..." dialog
[HKEY_CURRENT_USER\\Software\\Classes\\Applications\\VibePad.exe\\shell\\open\\command]
@="\\"${escapedExePath}\\" \\"%1\\""

; Register App Path for CMD launch
[HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\vibepad.exe]
@="${escapedExePath}"
`;

const regFilePath = path.resolve(distDir, 'register-vibepad.reg');

try {
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(regFilePath, regFileContent, 'utf8');
  console.log(`📄 Generated Registry file at: ${regFilePath}`);
} catch (e) {
  console.warn('⚠️ Could not create .reg file:', e.message);
}

// 2. Execute reg add commands
const regCommands = [
  `reg add "HKCU\\Software\\Classes\\*\\shell\\VibePad" /ve /d "Open with VibePad" /f`,
  `reg add "HKCU\\Software\\Classes\\*\\shell\\VibePad" /v "Icon" /d "${escapedExePath}" /f`,
  `reg add "HKCU\\Software\\Classes\\*\\shell\\VibePad\\command" /ve /d "\\"${escapedExePath}\\" \\"%1\\"" /f`,
  `reg add "HKCU\\Software\\Classes\\Applications\\VibePad.exe\\shell\\open\\command" /ve /d "\\"${escapedExePath}\\" \\"%1\\"" /f`,
  `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\vibepad.exe" /ve /d "${escapedExePath}" /f`
];

let successCount = 0;
for (const cmd of regCommands) {
  try {
    execSync(cmd, { stdio: 'ignore' });
    successCount++;
  } catch (error) {
    console.warn(`⚠️ Warning executing command [${cmd}]:`, error.message);
  }
}

if (successCount === regCommands.length) {
  console.log('✅ Success! "Open with VibePad" registered in Windows Explorer & PATH.');
} else {
  console.log(`ℹ️ Applied ${successCount}/${regCommands.length} registry entries. If restricted, double-click: ${regFilePath}`);
}
