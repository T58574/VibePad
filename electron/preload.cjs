const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  getInitialFile: () => ipcRenderer.invoke('get-initial-file'),
  runShell: (cmd) => ipcRenderer.invoke('run-shell', cmd),
  pipeAntigravity: (prompt, selection) => ipcRenderer.invoke('pipe-antigravity', prompt, selection),
});
