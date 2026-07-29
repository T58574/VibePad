import { describe, it, expect } from 'vitest';
import { DevTools } from './devTools';

describe('DevTools Utility Suite', () => {
  describe('base64Encode & base64Decode', () => {
    it('should correctly encode and decode standard UTF-8 text', () => {
      const original = 'Hello VibePad World!';
      const encoded = DevTools.base64Encode(original);
      const decoded = DevTools.base64Decode(encoded);
      expect(decoded).toBe(original);
    });

    it('should handle Cyrillic and Unicode characters safely without crash', () => {
      const unicodeText = 'Привет VibePad! 🚀 Сверхбыстрый редактор 100% UTF-8';
      const encoded = DevTools.base64Encode(unicodeText);
      const decoded = DevTools.base64Decode(encoded);
      expect(decoded).toBe(unicodeText);
    });

    it('should throw clear error on invalid Base64 decoding string', () => {
      expect(() => DevTools.base64Decode('!!!InvalidBase64@@@')).toThrow();
    });
  });

  describe('prettifyJson & minifyJson', () => {
    it('should format valid JSON with indentations', () => {
      const raw = '{"name":"VibePad","version":1,"active":true}';
      const pretty = DevTools.prettifyJson(raw);
      expect(pretty).toContain('\n  "name": "VibePad"');
    });

    it('should minify pretty JSON into a single line', () => {
      const pretty = `{\n  "a": 1,\n  "b": 2\n}`;
      const minified = DevTools.minifyJson(pretty);
      expect(minified).toBe('{"a":1,"b":2}');
    });

    it('should throw helpful error message on invalid JSON', () => {
      expect(() => DevTools.prettifyJson('{ bad json: ')).toThrow(/Ошибка форматирования JSON/);
    });
  });

  describe('cleanLogs', () => {
    it('should strip ANSI color escape codes, ISO timestamps, and log levels', () => {
      const log = '\x1B[31m[2026-07-29 17:00:00] [ERROR] Database connection lost\x1B[0m';
      const cleaned = DevTools.cleanLogs(log);
      expect(cleaned).toBe('Database connection lost');
    });
  });

  describe('decodeJwt', () => {
    it('should parse valid JWT token payload', () => {
      // Mock JWT header.payload.signature
      const header = DevTools.base64Encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = DevTools.base64Encode(JSON.stringify({ sub: '12345', role: 'admin' }));
      const mockJwt = `${header}.${payload}.signature`;

      const decoded = DevTools.decodeJwt(mockJwt);
      expect(decoded).toContain('"role": "admin"');
      expect(decoded).toContain('"sub": "12345"');
    });

    it('should throw error for invalid JWT string layout', () => {
      expect(() => DevTools.decodeJwt('invalid.token')).toThrow(/Некорректная структура JWT/);
    });
  });

  describe('csvToMarkdownTable', () => {
    it('should convert standard CSV data into Markdown table format', () => {
      const csv = 'Name,Role,RAM\nVibePad,Editor,30MB\nVSCode,IDE,500MB';
      const markdown = DevTools.csvToMarkdownTable(csv);
      expect(markdown).toContain('| Name | Role | RAM |');
      expect(markdown).toContain('| --- | --- | --- |');
      expect(markdown).toContain('| VibePad | Editor | 30MB |');
    });
  });
});
