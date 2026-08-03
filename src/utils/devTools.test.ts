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

  describe('jsonToYaml & yamlToJson', () => {
    it('should convert JSON string into valid YAML', () => {
      const json = JSON.stringify({ title: 'VibePad', port: 3000, features: ['speed', 'editor'] });
      const yaml = DevTools.jsonToYaml(json);
      expect(yaml).toContain('title: VibePad');
      expect(yaml).toContain('port: 3000');
      expect(yaml).toContain('- speed');
      expect(yaml).toContain('- editor');
    });

    it('should convert simple key-value YAML into JSON string', () => {
      const yaml = 'name: VibePad\nversion: 1.0\nactive: true';
      const json = DevTools.yamlToJson(yaml);
      const parsed = JSON.parse(json);
      expect(parsed.name).toBe('VibePad');
      expect(parsed.version).toBe(1.0);
      expect(parsed.active).toBe(true);
    });
  });

  describe('generateJwtPayload', () => {
    it('should generate valid 3-part signed JWT string', () => {
      const payload = { sub: 'user-777', name: 'Dev' };
      const jwt = DevTools.generateJwtPayload(payload);
      const parts = jwt.split('.');
      expect(parts.length).toBe(3);
      expect(DevTools.decodeJwt(jwt)).toContain('user-777');
    });
  });

  describe('extractRegexMatches', () => {
    it('should extract all pattern matches with line numbers', () => {
      const text = 'ERROR line 1\nINFO line 2\nERROR line 3';
      const matches = DevTools.extractRegexMatches(text, 'ERROR');
      expect(matches.length).toBe(2);
      expect(matches[0].line).toBe(1);
      expect(matches[1].line).toBe(3);
    });
  });

  describe('hashSha256', () => {
    it('should compute SHA-256 hex string for given input', async () => {
      const hash = await DevTools.hashSha256('VibePad-Fast-Editor');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThanOrEqual(16);
    });
  });

  describe('calculateCodeComplexity', () => {
    it('should calculate cyclomatic complexity and maintainability index', () => {
      const code = `
        // Main function
        function test(x) {
          if (x > 10) {
            return true;
          } else {
            return false;
          }
        }
      `;
      const stats = DevTools.calculateCodeComplexity(code);
      expect(stats.totalLines).toBeGreaterThan(0);
      expect(stats.codeLines).toBeGreaterThan(0);
      expect(stats.commentLines).toBe(1);
      expect(stats.complexityScore).toBe(3); // base 1 + if + else
      expect(stats.maintainabilityIndex).toBeGreaterThan(50);
    });
  });

  describe('humanizeCron', () => {
    it('should convert standard 5-field cron expression into human-readable Russian string', () => {
      expect(DevTools.humanizeCron('*/15 * * * *')).toContain('Каждые 15 мин');
      expect(DevTools.humanizeCron('0 9 * * 1-5')).toContain('В 00 мин, в 09:00, дни: Пн-Пт');
    });

    it('should throw error for invalid cron field count', () => {
      expect(() => DevTools.humanizeCron('invalid cron')).toThrow(/Некорректное число полей cron/);
    });
  });

  describe('formatEnvFile', () => {
    it('should sort keys alphabetically and format .env content cleanly', () => {
      const rawEnv = `
# DB Config
PORT=3000
DATABASE_URL="postgres://localhost:5432/db"
APP_NAME=VibePad
`;
      const res = DevTools.formatEnvFile(rawEnv);
      expect(res.keysCount).toBe(3);
      expect(res.parsedJson.APP_NAME).toBe('VibePad');
      expect(res.formatted).toContain('APP_NAME=VibePad\nDATABASE_URL="postgres://localhost:5432/db"\n# DB Config\nPORT=3000');
    });
  });

  describe('formatMarkdownTable', () => {
    it('should align Markdown table columns with proper spacing', () => {
      const messyTable = '| Name | Role |\n| --- | --- |\n| VibePad | Ultra Lightweight Editor |\n| CodeMirror | Engine |';
      const formatted = DevTools.formatMarkdownTable(messyTable);
      expect(formatted).toContain('| VibePad    | Ultra Lightweight Editor |');
      expect(formatted).toContain('| CodeMirror | Engine                   |');
    });
  });

  describe('analyzeFilePerformance', () => {
    it('should calculate size, line counts, and recommend Standard mode for small files', () => {
      const res = DevTools.analyzeFilePerformance('const x = 1;\nconsole.log(x);', 'test.js');
      expect(res.totalLines).toBe(2);
      expect(res.isLargeFile).toBe(false);
      expect(res.isBinary).toBe(false);
      expect(res.recommendedMode).toBe('Standard');
    });

    it('should detect binary bytes and suggest Binary Warning', () => {
      const res = DevTools.analyzeFilePerformance('some text\0binary content', 'image.png');
      expect(res.isBinary).toBe(true);
      expect(res.recommendedMode).toBe('Binary Warning');
    });
  });

  describe('diffText', () => {
    it('should compute line diff correctly for added, removed, and unchanged lines', () => {
      const textA = 'line 1\nline 2\nline 3';
      const textB = 'line 1\nline 2 modified\nline 3\nline 4';

      const diff = DevTools.diffText(textA, textB);
      expect(diff.lines.length).toBeGreaterThan(0);
      expect(diff.addedCount).toBeGreaterThan(0);
      expect(diff.unchangedCount).toBe(2);
    });
  });

  describe('flattenJson & unflattenJson', () => {
    it('should flatten nested JSON into dot notation and restore it cleanly', () => {
      const nested = JSON.stringify({ app: { server: { port: 8080, host: 'localhost' } } });
      const flattened = DevTools.flattenJson(nested);
      expect(flattened).toContain('"app.server.port": 8080');

      const restored = DevTools.unflattenJson(flattened);
      const parsed = JSON.parse(restored);
      expect(parsed.app.server.port).toBe(8080);
      expect(parsed.app.server.host).toBe('localhost');
    });
  });

  describe('generateUuid', () => {
    it('should return valid v4 UUID pattern string', () => {
      const uuid = DevTools.generateUuid();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('convertColor', () => {
    it('should convert #HEX to RGB and HSL', () => {
      const rgb = DevTools.convertColor('#ff0000', 'rgb');
      expect(rgb).toBe('rgb(255, 0, 0)');

      const hsl = DevTools.convertColor('rgb(255, 0, 0)', 'hsl');
      expect(hsl).toBe('hsl(0, 100%, 50%)');

      const hex = DevTools.convertColor('rgb(0, 255, 0)', 'hex');
      expect(hex).toBe('#00ff00');
    });

    it('should throw error on invalid color input', () => {
      expect(() => DevTools.convertColor('invalid', 'hex')).toThrow();
    });
  });

  describe('convertTimestamp', () => {
    it('should parse Unix timestamp seconds and milliseconds', () => {
      const resSec = DevTools.convertTimestamp(1700000000);
      expect(resSec.iso).toContain('2023-11-14');

      const resMs = DevTools.convertTimestamp(1700000000000);
      expect(resMs.unixSec).toBe(1700000000);
    });

    it('should throw on invalid timestamp', () => {
      expect(() => DevTools.convertTimestamp('invalid-date')).toThrow();
    });
  });
});


