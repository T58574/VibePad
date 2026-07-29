import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
let PORT = parseInt(process.env.PORT || '3456', 10);
const MAX_BODY_BYTES = 50 * 1024 * 1024; // 50MB Body Guard Limit

// Parse file argument from CLI
const openFilePath = process.argv[2] || '';

/**
 * Validate and resolve target file path to prevent Directory Traversal
 */
function sanitizePath(targetPath) {
  if (!targetPath || typeof targetPath !== 'string') return null;
  try {
    const resolved = path.resolve(targetPath);
    return resolved;
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Endpoint: Read File from Disk (Async Non-blocking I/O)
  if (reqUrl.pathname === '/api/read-file') {
    const rawPath = reqUrl.searchParams.get('path');
    const targetPath = sanitizePath(rawPath);

    if (!targetPath || !fs.existsSync(targetPath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Файл не найден на диске' }));
      return;
    }

    try {
      const stats = await fs.promises.stat(targetPath);
      if (stats.isDirectory()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Указанный путь является директорией, а не файлом' }));
        return;
      }

      const content = await fs.promises.readFile(targetPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ content, path: targetPath, size: stats.size }));
    } catch (err) {
      console.error('[Server Error] Read File Exception:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Сбой чтения файла: ${err.message}` }));
    }
    return;
  }

  // API Endpoint: Atomic Write File to Disk with Stream Size Guard
  if (reqUrl.pathname === '/api/write-file' && req.method === 'POST') {
    let body = '';
    let receivedBytes = 0;
    let limitExceeded = false;

    req.on('data', chunk => {
      receivedBytes += chunk.length;
      if (receivedBytes > MAX_BODY_BYTES) {
        limitExceeded = true;
        req.destroy(); // Cancel stream on payload limit overflow
      } else {
        body += chunk;
      }
    });

    req.on('end', async () => {
      if (limitExceeded) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Превышен максимальный лимит размера файла (50 MB)' }));
        return;
      }

      try {
        const { path: rawPath, content } = JSON.parse(body);
        const targetPath = sanitizePath(rawPath);

        if (!targetPath) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Невалидный путь сохранения файла' }));
          return;
        }

        // Atomic File Write: Write to .vibetmp first, then rename
        const tempPath = `${targetPath}.vibetmp`;
        await fs.promises.writeFile(tempPath, content, 'utf8');
        await fs.promises.rename(tempPath, targetPath);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, path: targetPath }));
      } catch (err) {
        console.error('[Server Error] Write File Exception:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Сбой записи файла: ${err.message}` }));
      }
    });

    req.on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Ошибка передачи данных: ${err.message}` }));
    });
    return;
  }

  // API Endpoint: Get Initial File Argument
  if (reqUrl.pathname === '/api/initial-file') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ path: openFilePath }));
    return;
  }

  // Static File Server for VibePad UI (Directory Traversal Protection)
  let requestedPath = reqUrl.pathname === '/' ? '/index.html' : reqUrl.pathname;
  let filePath = path.join(distDir, requestedPath);

  // Security Check: Enforce root distDir containment
  if (!filePath.startsWith(distDir)) {
    filePath = path.join(distDir, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  try {
    const data = await fs.promises.readFile(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  } catch (err) {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Robust Server Listener with Port Retry Strategy
function startServer(portToTry) {
  server.listen(portToTry, () => {
    PORT = portToTry;
    console.log(`⚡ VibePad Bridge Server active on http://localhost:${PORT}`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`⚠️ Port ${PORT} is occupied. Retrying on port ${PORT + 1}...`);
    startServer(PORT + 1);
  } else {
    console.error('❌ Server startup failure:', err);
  }
});

startServer(PORT);
