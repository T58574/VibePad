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

  describe('generateTsInterfaceFromJson', () => {
    it('should generate valid TypeScript interfaces from JSON object', () => {
      const json = JSON.stringify({
        id: 101,
        title: 'VibePad',
        tags: ['editor', 'saas'],
        config: { theme: 'dark', fontSize: 14 }
      });
      const tsCode = DevTools.generateTsInterfaceFromJson(json, 'ConfigDoc');
      expect(tsCode).toContain('export interface ConfigDoc');
      expect(tsCode).toContain('id: number;');
      expect(tsCode).toContain('tags: string[];');
      expect(tsCode).toContain('export interface Config');
      expect(tsCode).toContain('theme: string;');
    });

    it('should throw error if JSON is empty or invalid', () => {
      expect(() => DevTools.generateTsInterfaceFromJson('')).toThrow(/JSON строка пуста/);
      expect(() => DevTools.generateTsInterfaceFromJson('invalid json')).toThrow(/Ошибка парсинга JSON/);
    });
  });

  describe('formatSql & minifySql', () => {
    it('should format raw SQL with uppercase keywords and line breaks', () => {
      const sql = 'select id, name from users where active = true order by name asc';
      const formatted = DevTools.formatSql(sql);
      expect(formatted).toContain('SELECT id, name');
      expect(formatted).toContain('\nFROM users');
      expect(formatted).toContain('\nWHERE active = true');
      expect(formatted).toContain('\nORDER BY name ASC');
    });

    it('should minify multi-line SQL into a single line', () => {
      const multiline = `SELECT *\nFROM users\nWHERE id = 1`;
      const minified = DevTools.minifySql(multiline);
      expect(minified).toBe('SELECT * FROM users WHERE id = 1');
    });
  });

  describe('curlToFetch', () => {
    it('should convert cURL POST command into fetch code snippet', () => {
      const curl = `curl -X POST "https://api.vibepad.io/v1/data" -H "Content-Type: application/json" -d '{"query":"vibe"}'`;
      const fetchSnippet = DevTools.curlToFetch(curl);
      expect(fetchSnippet).toContain('fetch("https://api.vibepad.io/v1/data"');
      expect(fetchSnippet).toContain('"method": "POST"');
      expect(fetchSnippet).toContain('"Content-Type": "application/json"');
    });
  });

  describe('urlEncode, urlDecode, escapeHtml & unescapeHtml', () => {
    it('should correctly URL encode and decode strings', () => {
      const raw = 'hello world & vibe=100%';
      const encoded = DevTools.urlEncode(raw);
      expect(encoded).toBe('hello%20world%20%26%20vibe%3D100%25');
      expect(DevTools.urlDecode(encoded)).toBe(raw);
    });

    it('should correctly escape and unescape HTML special characters', () => {
      const html = '<div class="test">Fish & Chips</div>';
      const escaped = DevTools.escapeHtml(html);
      expect(escaped).toBe('&lt;div class=&quot;test&quot;&gt;Fish &amp; Chips&lt;/div&gt;');
      expect(DevTools.unescapeHtml(escaped)).toBe(html);
    });
  });
});
