import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IPCBridge } from './ipcBridge';

describe('IPCBridge Utility Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('escapeShellArg', () => {
    it('should correctly escape quotes and dangerous characters for CLI', () => {
      // Accessing private method for testing via any casting
      const escaped = (IPCBridge as any).escapeShellArg('my "test" $var `cmd` \\path');
      expect(escaped).toBe('"my \\"test\\" \\$var \\`cmd\\` \\\\path"');
    });

    it('should return empty quoted string for empty input', () => {
      expect((IPCBridge as any).escapeShellArg('')).toBe('""');
    });
  });

  describe('readFile Fallback Handling', () => {
    it('should throw error if file path is empty', async () => {
      await expect(IPCBridge.readFile('')).rejects.toThrow('File path cannot be empty');
    });

    it('should fallback to default demo content if both Neutralino and HTTP bridge fail', async () => {
      // Mock fetch failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      const result = await IPCBridge.readFile('test-nonexistent.log');
      expect(result.content).toContain('VibePad Editor initialized');
      expect(result.encoding).toBe('UTF-8');
    });
  });
});
