import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(projectRoot, 'dist');

// Locate native .ico icon
let iconPath = path.resolve(distDir, 'vibe-icon.ico');
if (!fs.existsSync(iconPath)) {
  iconPath = path.resolve(projectRoot, 'public/vibe-icon.ico');
}

// Check potential executable candidates with working Electrobun bundle context
const candidates = [
  path.resolve(distDir, 'bin/launcher.exe'),
  path.resolve(projectRoot, 'release/VibePad-win-x64/bin/launcher.exe'),
  path.resolve(projectRoot, 'build/dev-win-x64/VibePad-dev/bin/launcher.exe'),
  path.resolve(distDir, 'VibePad.exe'),
  path.resolve(projectRoot, 'VibePad.exe'),
];

let exePath = candidates.find((p) => fs.existsSync(p));
if (!exePath) {
  exePath = path.resolve(distDir, 'bin/launcher.exe');
}

const escapedExePath = exePath.replace(/\\/g, '\\\\');
const escapedIconPath = iconPath.replace(/\\/g, '\\\\');
const menuTitle = 'Открыть в VibePad';
const folderMenuTitle = 'Открыть папку в VibePad';

console.log(`⚡ Регистрация VibePad (${exePath}) и иконки (${iconPath}) в реестре Windows...`);

const supportedExts = [
  '.txt', '.log', '.json', '.yaml', '.yml', '.md', '.env', '.sql',
  '.py', '.js', '.ts', '.tsx', '.xml', '.ini', '.conf', '.sh', '.bat',
  '.cmd', '.css', '.html', '.hpp', '.cpp', '.c', '.h', '.java', '.go', '.rs'
];

// Build REG file content
let regFileContent = `Windows Registry Editor Version 5.00

; --- ProgID Registration (VibePad.Document) ---
[HKEY_CURRENT_USER\\Software\\Classes\\VibePad.Document]
@="VibePad Document"
"Icon"="${escapedIconPath}"

[HKEY_CURRENT_USER\\Software\\Classes\\VibePad.Document\\DefaultIcon]
@="${escapedIconPath},0"

[HKEY_CURRENT_USER\\Software\\Classes\\VibePad.Document\\shell\\open\\command]
@="\\"${escapedExePath}\\" \\"%1\\""

; --- Application Capability & Open With Registration ---
[HKEY_CURRENT_USER\\Software\\Classes\\Applications\\VibePad.exe]
"FriendlyAppName"="VibePad"
"Icon"="${escapedIconPath}"

[HKEY_CURRENT_USER\\Software\\Classes\\Applications\\VibePad.exe\\DefaultIcon]
@="${escapedIconPath},0"

[HKEY_CURRENT_USER\\Software\\Classes\\Applications\\VibePad.exe\\shell\\open\\command]
@="\\"${escapedExePath}\\" \\"%1\\""

[HKEY_CURRENT_USER\\Software\\Classes\\Applications\\VibePad.exe\\SupportedTypes]
`;

for (const ext of supportedExts) {
  regFileContent += `"${ext}"=""\n`;
}

regFileContent += `
; --- Global Context Menu (All Files) ---
[HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\VibePad]
@="${menuTitle}"
"Icon"="${escapedIconPath}"

[HKEY_CURRENT_USER\\Software\\Classes\\*\\shell\\VibePad\\command]
@="\\"${escapedExePath}\\" \\"%1\\""

; --- Directory & Folder Background Context Menu ---
[HKEY_CURRENT_USER\\Software\\Classes\\Directory\\shell\\VibePad]
@="${folderMenuTitle}"
"Icon"="${escapedIconPath}"

[HKEY_CURRENT_USER\\Software\\Classes\\Directory\\shell\\VibePad\\command]
@="\\"${escapedExePath}\\" \\"%1\\""

[HKEY_CURRENT_USER\\Software\\Classes\\Directory\\Background\\shell\\VibePad]
@="${folderMenuTitle}"
"Icon"="${escapedIconPath}"

[HKEY_CURRENT_USER\\Software\\Classes\\Directory\\Background\\shell\\VibePad\\command]
@="\\"${escapedExePath}\\" \\"%V\\""

; --- System File Associations ---
`;

for (const ext of supportedExts) {
  regFileContent += `
[HKEY_CURRENT_USER\\Software\\Classes\\SystemFileAssociations\\${ext}\\shell\\VibePad]
@="${menuTitle}"
"Icon"="${escapedIconPath}"

[HKEY_CURRENT_USER\\Software\\Classes\\SystemFileAssociations\\${ext}\\shell\\VibePad\\command]
@="\\"${escapedExePath}\\" \\"%1\\""
`;
}

regFileContent += `
; --- CMD App Path ---
[HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\vibepad.exe]
@="${escapedExePath}"
`;

const regFilePath = path.resolve(distDir, 'register-vibepad.reg');
try {
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(regFilePath, regFileContent, 'utf8');
  console.log(`📄 Создан комплексный REG-файл: ${regFilePath}`);
} catch (e) {
  console.warn('⚠️ Ошибка создания .reg файла:', e.message);
}

// Execute reg add/delete commands
const regCommands = [
  // Clean up obsolete VibePad.cmd entries from registry
  `reg delete "HKCU\\Software\\Classes\\Applications\\VibePad.cmd" /f`,
  `reg delete "HKCU\\Software\\Classes\\Applications\\vibepad.cmd" /f`,

  // ProgID & Application (VibePad.Document & VibePad.exe)
  `reg add "HKCU\\Software\\Classes\\VibePad.Document" /ve /d "VibePad Document" /f`,
  `reg add "HKCU\\Software\\Classes\\VibePad.Document" /v "Icon" /d "${escapedIconPath}" /f`,
  `reg add "HKCU\\Software\\Classes\\VibePad.Document\\DefaultIcon" /ve /d "${escapedIconPath},0" /f`,
  `reg add "HKCU\\Software\\Classes\\VibePad.Document\\shell\\open\\command" /ve /d "\\"${escapedExePath}\\" \\"%1\\"" /f`,

  // Application entries for VibePad.exe AND launcher.exe (Forces Windows Open With to display "VibePad" with icon)
  `reg add "HKCU\\Software\\Classes\\Applications\\VibePad.exe" /v "FriendlyAppName" /d "VibePad" /f`,
  `reg add "HKCU\\Software\\Classes\\Applications\\VibePad.exe" /v "Icon" /d "${escapedIconPath}" /f`,
  `reg add "HKCU\\Software\\Classes\\Applications\\VibePad.exe\\DefaultIcon" /ve /d "${escapedIconPath},0" /f`,
  `reg add "HKCU\\Software\\Classes\\Applications\\VibePad.exe\\shell\\open\\command" /ve /d "\\"${escapedExePath}\\" \\"%1\\"" /f`,

  `reg add "HKCU\\Software\\Classes\\Applications\\launcher.exe" /v "FriendlyAppName" /d "VibePad" /f`,
  `reg add "HKCU\\Software\\Classes\\Applications\\launcher.exe" /v "Icon" /d "${escapedIconPath}" /f`,
  `reg add "HKCU\\Software\\Classes\\Applications\\launcher.exe\\DefaultIcon" /ve /d "${escapedIconPath},0" /f`,

  // Global file context menu
  `reg add "HKCU\\Software\\Classes\\*\\shell\\VibePad" /ve /d "${menuTitle}" /f`,
  `reg add "HKCU\\Software\\Classes\\*\\shell\\VibePad" /v "Icon" /d "${escapedIconPath}" /f`,
  `reg add "HKCU\\Software\\Classes\\*\\shell\\VibePad\\command" /ve /d "\\"${escapedExePath}\\" \\"%1\\"" /f`,

  // Directory context menu
  `reg add "HKCU\\Software\\Classes\\Directory\\shell\\VibePad" /ve /d "${folderMenuTitle}" /f`,
  `reg add "HKCU\\Software\\Classes\\Directory\\shell\\VibePad" /v "Icon" /d "${escapedIconPath}" /f`,
  `reg add "HKCU\\Software\\Classes\\Directory\\shell\\VibePad\\command" /ve /d "\\"${escapedExePath}\\" \\"%1\\"" /f`,
  `reg add "HKCU\\Software\\Classes\\Directory\\Background\\shell\\VibePad" /ve /d "${folderMenuTitle}" /f`,
  `reg add "HKCU\\Software\\Classes\\Directory\\Background\\shell\\VibePad" /v "Icon" /d "${escapedIconPath}" /f`,
  `reg add "HKCU\\Software\\Classes\\Directory\\Background\\shell\\VibePad\\command" /ve /d "\\"${escapedExePath}\\" \\"%V\\"" /f`,

  // App Paths
  `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\vibepad.exe" /ve /d "${escapedExePath}" /f`,
];

// Add SupportedTypes, OpenWithProgids, DefaultIcon, and SystemFileAssociations for each extension
for (const ext of supportedExts) {
  regCommands.push(`reg add "HKCU\\Software\\Classes\\Applications\\VibePad.exe\\SupportedTypes" /v "${ext}" /d "" /f`);
  regCommands.push(`reg add "HKCU\\Software\\Classes\\Applications\\launcher.exe\\SupportedTypes" /v "${ext}" /d "" /f`);
  regCommands.push(`reg delete "HKCU\\Software\\Classes\\${ext}\\OpenWithList\\VibePad.cmd" /f`);
  regCommands.push(`reg add "HKCU\\Software\\Classes\\${ext}\\OpenWithProgids" /v "VibePad.Document" /d "" /f`);
  regCommands.push(`reg add "HKCU\\Software\\Classes\\${ext}\\OpenWithList\\VibePad.exe" /ve /d "" /f`);
  regCommands.push(`reg add "HKCU\\Software\\Classes\\${ext}\\DefaultIcon" /ve /d "${escapedIconPath},0" /f`);
  regCommands.push(`reg add "HKCU\\Software\\Classes\\SystemFileAssociations\\${ext}\\shell\\VibePad" /ve /d "${menuTitle}" /f`);
  regCommands.push(`reg add "HKCU\\Software\\Classes\\SystemFileAssociations\\${ext}\\shell\\VibePad" /v "Icon" /d "${escapedIconPath}" /f`);
  regCommands.push(`reg add "HKCU\\Software\\Classes\\SystemFileAssociations\\${ext}\\shell\\VibePad\\command" /ve /d "\\"${escapedExePath}\\" \\"%1\\"" /f`);
}

let successCount = 0;
for (const cmd of regCommands) {
  try {
    execSync(cmd, { stdio: 'ignore' });
    successCount++;
  } catch (error) {
    // console.warn(`Warning executing command [${cmd}]:`, error.message);
  }
}

console.log(`✅ Применено ${successCount}/${regCommands.length} записей реестра Windows.`);

// Refresh Explorer Shell Cache via SHCNE_ASSOCCHANGED
try {
  const refreshScript = `
    $code = '[DllImport("shell32.dll")] public static extern void SHChangeNotify(int wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);'
    $type = Add-Type -MemberDefinition $code -Name Win32 -Namespace Shell32 -PassThru
    $type::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
  `;
  const refreshPsPath = path.resolve(distDir, 'refresh-shell.ps1');
  fs.writeFileSync(refreshPsPath, refreshScript, 'utf8');
  execSync(`powershell -ExecutionPolicy Bypass -File "${refreshPsPath}"`, { stdio: 'ignore' });
  console.log('🔄 Кэш иконок и ассоциаций Windows Explorer мгновенно обновлен (SHCNE_ASSOCCHANGED).');
} catch (e) {
  console.warn('⚠️ Shell refresh warning:', e.message);
}
