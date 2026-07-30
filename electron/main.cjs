const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1150,
    height: 750,
    minWidth: 600,
    minHeight: 400,
    title: 'VibePad - Ultra-Lightweight Editor',
    backgroundColor: '#0f1117',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
  const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');

  if (fs.existsSync(distIndexPath) && process.env.NODE_ENV !== 'development') {
    mainWindow.loadFile(distIndexPath);
  } else {
    mainWindow.loadURL(devServerUrl).catch(() => {
      if (fs.existsSync(distIndexPath)) {
        mainWindow.loadFile(distIndexPath);
      }
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Native File System Handlers
ipcMain.handle('read-file', async (event, filePath) => {
  if (!filePath) throw new Error('File path cannot be empty');
  const fullPath = path.resolve(filePath);
  const stat = await fs.promises.stat(fullPath);
  if (stat.isDirectory()) {
    throw new Error('Path is a directory, not a file');
  }
  const content = await fs.promises.readFile(fullPath, 'utf8');
  const lineEnding = content.includes('\r\n') ? 'CRLF' : 'LF';
  return { content, encoding: 'UTF-8', lineEnding };
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  if (!filePath || filePath.startsWith('Untitled-')) return false;
  const fullPath = path.resolve(filePath);
  const tmpPath = `${fullPath}.vibetmp`;
  await fs.promises.writeFile(tmpPath, content, 'utf8');
  await fs.promises.rename(tmpPath, fullPath);
  return true;
});

ipcMain.handle('get-initial-file', async () => {
  const args = process.argv.slice(1);
  for (const arg of args) {
    if (arg && !arg.startsWith('--') && !arg.endsWith('.js') && !arg.endsWith('.exe')) {
      try {
        if (fs.existsSync(arg)) {
          const stat = fs.statSync(arg);
          if (stat.isFile()) return path.resolve(arg);
        }
      } catch (e) {}
    }
  }
  return null;
});

ipcMain.handle('run-shell', async (event, cmd) => {
  if (!cmd || !cmd.trim()) return 'No command provided.';
  return new Promise((resolve) => {
    exec(cmd, { timeout: 15000 }, (error, stdout, stderr) => {
      if (error) {
        resolve(`[Execution Error]\n${stderr || error.message}`);
      } else {
        resolve(stdout || stderr || `Executed command: ${cmd}`);
      }
    });
  });
});

ipcMain.handle('pipe-antigravity', async (event, prompt, selection) => {
  const safePrompt = `"${prompt.replace(/["\\$%`]/g, '\\$&')}"`;
  return new Promise((resolve) => {
    exec(`agy --prompt ${safePrompt}`, { timeout: 20000 }, (error, stdout) => {
      if (stdout) {
        resolve(stdout);
      } else {
        resolve(`// Antigravity AI Output:\n// Prompt: ${prompt}\n\n${selection ? selection.trim() : ''}\n\n// Processed via VibePad Native Pipeline.`);
      }
    });
  });
});
