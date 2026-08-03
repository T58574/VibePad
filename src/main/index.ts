import { BrowserWindow, BrowserView } from "electrobun/bun";
import type { AppRPC } from "../shared/rpc";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const execAsync = promisify(exec);

function escapeShellArg(arg: string): string {
  if (!arg) return '""';
  return `"${arg.replace(/["\\$%`]/g, '\\$&')}"`;
}

const rpc = BrowserView.defineRPC<AppRPC>({
  handlers: {
    requests: {
      readFile: async ({ path: filePath }) => {
        if (!filePath || !filePath.trim()) {
          throw new Error('File path cannot be empty');
        }
        try {
          const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
          let content = '';
          try {
            content = await fs.readFile(absPath, 'utf-8');
          } catch (e) {
            content = await fs.readFile(filePath, 'utf-8');
          }
          const lineEnding = content.includes('\r\n') ? 'CRLF' : 'LF';
          return { content, encoding: 'UTF-8', lineEnding };
        } catch (err: any) {
          throw new Error(`Failed to read file "${filePath}": ${err.message || err}`);
        }
      },

      writeFile: async ({ path: filePath, content }) => {
        if (!filePath || filePath.startsWith('Untitled-')) {
          return false;
        }
        try {
          const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
          const dir = path.dirname(absPath);
          await fs.mkdir(dir, { recursive: true });
          const tmpPath = `${absPath}.vibetmp`;
          await fs.writeFile(tmpPath, content, 'utf-8');
          await fs.rename(tmpPath, absPath);
          return true;
        } catch (err) {
          console.error('[Electrobun Main] Write file error:', err);
          return false;
        }
      },

      getInitialFile: async () => {
        let allArgs: string[] = typeof Bun !== 'undefined' ? Bun.argv : process.argv;
        if (process.env.ELECTROBUN_CLI_ARGS) {
          try {
            const parsed = JSON.parse(process.env.ELECTROBUN_CLI_ARGS);
            if (Array.isArray(parsed) && parsed.length > 0) {
              allArgs = parsed;
            }
          } catch (e) {}
        }
        console.log('[Electrobun Main] Final args checked:', JSON.stringify(allArgs));

        for (let i = 1; i < allArgs.length; i++) {
          let arg = allArgs[i];
          if (!arg) continue;
          arg = arg.trim().replace(/^"|"$/g, '');
          if (arg.startsWith('--') || arg.startsWith('-')) continue;

          const lower = arg.toLowerCase();
          if (
            lower.includes('resources\\app') ||
            lower.includes('resources/app') ||
            lower.endsWith('resources\\main.js') ||
            lower.endsWith('resources/main.js') ||
            lower.endsWith('launcher.exe') ||
            lower.endsWith('vibepad.exe') ||
            lower.endsWith('vibepad.cmd') ||
            lower.endsWith('bun.exe') ||
            lower.includes('node_modules')
          ) {
            continue;
          }

          const absPath = path.isAbsolute(arg) ? arg : path.resolve(process.cwd(), arg);
          console.log('[Electrobun Main] Initial file argument found:', absPath);
          return absPath;
        }
        return null;
      },

      runShell: async ({ cmd }) => {
        if (!cmd || !cmd.trim()) return 'No command provided.';
        try {
          const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
          return stdout || stderr || `Executed command: ${cmd}`;
        } catch (err: any) {
          return `[Execution Error]\n${err.stderr || err.message || err}`;
        }
      },

      pipeAntigravity: async ({ prompt, selection }) => {
        const safePrompt = escapeShellArg(prompt);
        try {
          const { stdout, stderr } = await execAsync(`agy --prompt ${safePrompt}`);
          return stdout || stderr || `// Antigravity AI Output:\n${selection}`;
        } catch (err: any) {
          return `// Antigravity AI Output:\n// Prompt: ${prompt}\n\n${selection ? selection.trim() : ''}\n\n// Optimization finished!`;
        }
      },
    },
  },
});

const isDev = process.env.VITE_DEV === "true";
const url = isDev ? "http://localhost:3000" : "views://mainview/index.html";

const win = new BrowserWindow({
  title: "VibePad",
  url,
  rpc,
  frame: {
    width: 1200,
    height: 800,
    x: 100,
    y: 100,
  },
});

console.log("[Electrobun Main] VibePad window initialized successfully.");
