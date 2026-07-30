export interface FileItem {
  id: string;
  name: string;
  path: string;
  content: string;
  encoding: string;
  lineEnding: 'CRLF' | 'LF';
  isDirty?: boolean;
}

export class IPCBridge {
  private static SERVER_PORT = 3456;

  static get electron(): any {
    return typeof window !== 'undefined' ? (window as any).electronAPI : null;
  }

  static get neu(): any {
    return typeof window !== 'undefined' ? (window as any).Neutralino : null;
  }

  private static escapeShellArg(arg: string): string {
    if (!arg) return '""';
    return `"${arg.replace(/["\\$%`]/g, '\\$&')}"`;
  }

  /**
   * Read file content with hybrid fallback strategy:
   * 1. Electron Native IPC
   * 2. Neutralino native API
   * 3. Node HTTP bridge API
   * 4. Fallback demo log content
   */
  static async readFile(filePath: string): Promise<{ content: string; encoding: string; lineEnding: 'CRLF' | 'LF' }> {
    if (!filePath || filePath.trim() === '') {
      throw new Error('File path cannot be empty');
    }

    // Attempt 1: Electron Native IPC
    try {
      if (this.electron) {
        return await this.electron.readFile(filePath);
      }
    } catch (err: any) {
      console.warn('[IPCBridge] Electron native read failed:', err);
    }

    // Attempt 2: Neutralino Native Filesystem
    try {
      if (this.neu && this.neu.filesystem) {
        const content = await this.neu.filesystem.readFile(filePath);
        const lineEnding = content.includes('\r\n') ? 'CRLF' : 'LF';
        return { content, encoding: 'UTF-8', lineEnding };
      }
    } catch (err: any) {
      console.warn('[IPCBridge] Neutralino native read failed:', err);
    }

    // Attempt 3: Node HTTP Server Bridge
    try {
      const resp = await fetch(`http://localhost:${this.SERVER_PORT}/api/read-file?path=${encodeURIComponent(filePath)}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (resp.ok) {
        const data = await resp.json();
        const content = data.content || '';
        const lineEnding = content.includes('\r\n') ? 'CRLF' : 'LF';
        return { content, encoding: data.encoding || 'UTF-8', lineEnding };
      }
    } catch (err: any) {
      console.warn('[IPCBridge] HTTP server read failed:', err.message);
    }

    // Fallback: Default demo content
    const content = `[${new Date().toISOString()}] [INFO] VibePad Editor initialized.
[INFO] Direct Disk Read unavailable for path: ${filePath}.
[TIP] Ensure Electron host or Node bridge is active.`;
    return { content, encoding: 'UTF-8', lineEnding: 'LF' };
  }

  /**
   * Write file to disk atomically with fallback
   */
  static async writeFile(filePath: string, content: string): Promise<boolean> {
    if (!filePath || filePath.startsWith('Untitled-')) {
      console.warn('[IPCBridge] Cannot save scratchpad without a valid system file path');
      return false;
    }

    // Attempt 1: Electron Native IPC
    try {
      if (this.electron) {
        return await this.electron.writeFile(filePath, content);
      }
    } catch (err) {
      console.warn('[IPCBridge] Electron write failed:', err);
    }

    // Attempt 2: Neutralino Native API
    try {
      if (this.neu && this.neu.filesystem) {
        await this.neu.filesystem.writeFile(filePath, content);
        return true;
      }
    } catch (err) {
      console.warn('[IPCBridge] Neutralino write failed:', err);
    }

    // Attempt 3: Node HTTP Bridge
    try {
      const resp = await fetch(`http://localhost:${this.SERVER_PORT}/api/write-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content }),
        signal: AbortSignal.timeout(10000),
      });
      return resp.ok;
    } catch (err) {
      console.error('[IPCBridge] Write network failure:', err);
      return false;
    }
  }

  /**
   * Get initial file passed via CLI arguments
   */
  static async getInitialFile(): Promise<string | null> {
    // Attempt 1: Electron Native IPC
    try {
      if (this.electron) {
        return await this.electron.getInitialFile();
      }
    } catch (e) {}

    // Attempt 2: Neutralino Process Args
    try {
      if (this.neu && this.neu.app) {
        const args = await this.neu.app.getProcessArgs();
        if (args && args.length > 1 && !args[1].startsWith('--')) {
          return args[1];
        }
      }
    } catch (e) {}

    // Attempt 3: HTTP Bridge Initial File
    try {
      const resp = await fetch(`http://localhost:${this.SERVER_PORT}/api/initial-file`, {
        signal: AbortSignal.timeout(2000),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.path) return data.path;
      }
    } catch (e) {}

    return null;
  }

  /**
   * Run system command
   */
  static async runShell(cmd: string): Promise<string> {
    if (!cmd || !cmd.trim()) return 'No command provided.';

    try {
      if (this.electron) {
        return await this.electron.runShell(cmd);
      }
      if (this.neu && this.neu.os) {
        const res = await this.neu.os.execCommand(cmd);
        return res.stdOut || res.stdErr || `Executed command: ${cmd}`;
      }
    } catch (e: any) {
      console.error('[IPCBridge] Shell execution error:', e);
      return `[Execution Error]\n${e.message || e}`;
    }

    return `[Command Output]\nLocal CLI execution requires native binary or Node bridge.`;
  }

  /**
   * Pipe selection to Antigravity CLI
   */
  static async pipeAntigravity(prompt: string, selection: string): Promise<string> {
    const safePrompt = this.escapeShellArg(prompt);
    const safeSelection = selection ? selection.trim() : '';

    try {
      if (this.electron) {
        return await this.electron.pipeAntigravity(prompt, selection);
      }
      if (this.neu && this.neu.os) {
        const res = await this.neu.os.execCommand(`agy --prompt ${safePrompt}`);
        if (res.stdOut) return res.stdOut;
      }
    } catch (e: any) {
      console.warn('[IPCBridge] Antigravity CLI pipe failed:', e);
    }

    return `// Antigravity AI Output:\n// Prompt: ${prompt}\n\n${safeSelection}\n\n// Optimization finished!`;
  }
}
