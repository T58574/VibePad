import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(projectRoot, 'dist');

const supportedExts = [
  '.txt', '.log', '.json', '.yaml', '.yml', '.md', '.env', '.sql',
  '.py', '.js', '.ts', '.tsx', '.xml', '.ini', '.conf', '.sh', '.bat',
  '.cmd', '.css', '.html', '.hpp', '.cpp', '.c', '.h', '.java', '.go', '.rs'
];

console.log('🧹 Полная очистка реестра Windows от привязок VibePad...');

const deleteCommands = [
  `reg delete "HKCU\\Software\\Classes\\VibePad.Document" /f`,
  `reg delete "HKCU\\Software\\Classes\\Applications\\VibePad.exe" /f`,
  `reg delete "HKCU\\Software\\Classes\\Applications\\launcher.exe" /f`,
  `reg delete "HKCU\\Software\\Classes\\Applications\\VibePad.cmd" /f`,
  `reg delete "HKCU\\Software\\Classes\\Applications\\vibepad.cmd" /f`,
  `reg delete "HKCU\\Software\\Classes\\*\\shell\\VibePad" /f`,
  `reg delete "HKCU\\Software\\Classes\\Directory\\shell\\VibePad" /f`,
  `reg delete "HKCU\\Software\\Classes\\Directory\\Background\\shell\\VibePad" /f`,
  `reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\vibepad.exe" /f`,
];

for (const ext of supportedExts) {
  deleteCommands.push(`reg delete "HKCU\\Software\\Classes\\SystemFileAssociations\\${ext}\\shell\\VibePad" /f`);
  deleteCommands.push(`reg delete "HKCU\\Software\\Classes\\${ext}\\OpenWithProgids" /v "VibePad.Document" /f`);
  deleteCommands.push(`reg delete "HKCU\\Software\\Classes\\${ext}\\OpenWithList\\VibePad.exe" /f`);
  deleteCommands.push(`reg delete "HKCU\\Software\\Classes\\${ext}\\OpenWithList\\VibePad.cmd" /f`);
}

let deletedCount = 0;
for (const cmd of deleteCommands) {
  try {
    execSync(cmd, { stdio: 'ignore' });
    deletedCount++;
  } catch (e) {}
}

console.log(`✅ Записи реестра VibePad удалены (${deletedCount} ключей).`);

// Trigger Explorer shell refresh
try {
  const refreshScript = `
    $code = '[DllImport("shell32.dll")] public static extern void SHChangeNotify(int wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);'
    $type = Add-Type -MemberDefinition $code -Name Win32 -Namespace Shell32 -PassThru
    $type::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
  `;
  const refreshPsPath = path.resolve(projectRoot, 'refresh-shell.ps1');
  fs.writeFileSync(refreshPsPath, refreshScript, 'utf8');
  execSync(`powershell -ExecutionPolicy Bypass -File "${refreshPsPath}"`, { stdio: 'ignore' });
  if (fs.existsSync(refreshPsPath)) fs.unlinkSync(refreshPsPath);
  console.log('🔄 Кэш ассоциаций Windows Explorer обновлен.');
} catch (e) {}
