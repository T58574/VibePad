export class DevTools {
  /**
   * Safe UTF-8 Base64 Encoder (Supports Unicode / Cyrillic)
   */
  static base64Encode(input: string): string {
    if (typeof input !== 'string') return '';
    try {
      const bytes = new TextEncoder().encode(input);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch (e) {
      console.error('Base64 Encoding Error:', e);
      throw new Error('Не удалось закодировать данные в Base64');
    }
  }

  /**
   * Safe UTF-8 Base64 Decoder (Supports Unicode / Cyrillic)
   */
  static base64Decode(input: string): string {
    if (typeof input !== 'string') return '';
    try {
      const cleanInput = input.trim().replace(/\s/g, '');
      const binary = atob(cleanInput);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (e) {
      console.error('Base64 Decoding Error:', e);
      throw new Error('Невалидная строка Base64 или неподдерживаемая кодировка');
    }
  }

  /**
   * Prettify JSON with error detail positioning
   */
  static prettifyJson(input: string): string {
    if (!input || !input.trim()) return '';
    try {
      const parsed = JSON.parse(input);
      return JSON.stringify(parsed, null, 2);
    } catch (err: any) {
      throw new Error(`Ошибка форматирования JSON: ${err.message || 'Невалидный JSON'}`);
    }
  }

  /**
   * Minify JSON with error handling
   */
  static minifyJson(input: string): string {
    if (!input || !input.trim()) return '';
    try {
      const parsed = JSON.parse(input);
      return JSON.stringify(parsed);
    } catch (err: any) {
      throw new Error(`Ошибка сжатия JSON: ${err.message || 'Невалидный JSON'}`);
    }
  }

  /**
   * Clean logs: strip ANSI codes, timestamps, and thread tags
   */
  static cleanLogs(input: string): string {
    if (!input) return '';
    return input
      .replace(/\x1B\[[0-9;]*[mK]/g, '') // ANSI codes
      .replace(/^\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}(?:\.\d{3})?\]\s*/gm, '') // ISO Timestamps
      .replace(/^\[(?:INFO|WARN|ERROR|DEBUG|TRACE|SUCCESS)\]\s*/gm, ''); // Log level tags
  }

  /**
   * Decode JWT token payload safely
   */
  static decodeJwt(token: string): string {
    if (!token || typeof token !== 'string') throw new Error('Строка токена пуста');
    try {
      const parts = token.trim().split('.');
      if (parts.length !== 3) throw new Error('Некорректная структура JWT (должно быть 3 части через точку)');
      const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = this.base64Decode(base64Payload);
      const parsed = JSON.parse(payloadJson);
      return JSON.stringify(parsed, null, 2);
    } catch (err: any) {
      throw new Error(`Ошибка декодирования JWT: ${err.message}`);
    }
  }

  /**
   * Robust CSV to Markdown table converter supporting escaped quotes
   */
  static csvToMarkdownTable(csv: string): string {
    if (!csv || !csv.trim()) return '';

    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const lines = csv.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (!lines.length) return '';

    const headers = parseCsvLine(lines[0]);
    const maxCols = headers.length;

    const separator = headers.map(() => '---').join(' | ');
    const rows = lines.slice(1).map(line => {
      const cols = parseCsvLine(line);
      while (cols.length < maxCols) cols.push('');
      return cols.slice(0, maxCols).join(' | ');
    });

    return `| ${headers.join(' | ')} |\n| ${separator} |\n` + rows.map(r => `| ${r} |`).join('\n');
  }

  /**
   * Convert JSON payload into TypeScript interfaces
   */
  static generateTsInterfaceFromJson(jsonStr: string, rootName: string = 'RootObject'): string {
    if (!jsonStr || !jsonStr.trim()) throw new Error('JSON строка пуста');

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (err: any) {
      throw new Error(`Ошибка парсинга JSON: ${err.message}`);
    }

    const interfaces: string[] = [];
    const createdTypes = new Set<string>();

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    const getType = (value: any, keyName: string): string => {
      if (value === null) return 'any';
      if (Array.isArray(value)) {
        if (value.length === 0) return 'any[]';
        const itemType = getType(value[0], keyName + 'Item');
        return `${itemType}[]`;
      }
      if (typeof value === 'object') {
        const typeName = capitalize(keyName);
        buildInterface(value, typeName);
        return typeName;
      }
      return typeof value;
    };

    const buildInterface = (obj: Record<string, any>, interfaceName: string) => {
      if (createdTypes.has(interfaceName) || !obj || typeof obj !== 'object') return;
      createdTypes.add(interfaceName);

      const fields: string[] = [];
      for (const [key, val] of Object.entries(obj)) {
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
        const propType = getType(val, key);
        fields.push(`  ${safeKey}: ${propType};`);
      }

      interfaces.push(`export interface ${interfaceName} {\n${fields.join('\n')}\n}`);
    };

    buildInterface(parsed, capitalize(rootName));
    return interfaces.reverse().join('\n\n');
  }

  /**
   * Format SQL query with capitalized keywords and clause line breaks
   */
  static formatSql(sql: string): string {
    if (!sql || !sql.trim()) return '';
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
      'JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT INTO',
      'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
      'UNION ALL', 'UNION', 'AS', 'IN', 'IS NULL', 'IS NOT NULL', 'ASC', 'DESC', 'CASE', 'WHEN', 'THEN', 'END'
    ];

    let formatted = sql.replace(/\s+/g, ' ').trim();

    keywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw.replace(/ /g, '\\s+')}\\b`, 'gi');
      formatted = formatted.replace(regex, kw);
    });

    const mainClauses = [
      'FROM', 'WHERE', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'JOIN',
      'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'VALUES', 'SET'
    ];

    mainClauses.forEach((clause) => {
      const regex = new RegExp(`\\s+(${clause})\\b`, 'g');
      formatted = formatted.replace(regex, `\n$1`);
    });

    return formatted;
  }

  /**
   * Minify SQL query into single line
   */
  static minifySql(sql: string): string {
    if (!sql) return '';
    return sql.replace(/\s+/g, ' ').trim();
  }

  /**
   * Convert cURL command to TypeScript/JavaScript fetch call
   */
  static curlToFetch(curlStr: string): string {
    if (!curlStr || !curlStr.trim()) throw new Error('Строка cURL пуста');

    const cleanCmd = curlStr.replace(/\\\r?\n/g, ' ').trim();

    // Find URL: first token starting with http:// or https://
    const urlMatch = cleanCmd.match(/(https?:\/\/[^\s"']+)/i);
    const url = urlMatch ? urlMatch[1] : 'https://api.example.com/endpoint';

    let method = 'GET';
    const methodMatch = cleanCmd.match(/(?:-X|--request)\s+([A-Z]+)/i);
    if (methodMatch) {
      method = methodMatch[1].toUpperCase();
    } else if (/-d\s+|--data\s+|--data-raw\s+/i.test(cleanCmd)) {
      method = 'POST';
    }

    const headers: Record<string, string> = {};
    const headerMatches = cleanCmd.matchAll(/(?:-H|--header)\s+["']([^"']+)["']/g);
    for (const m of headerMatches) {
      const idx = m[1].indexOf(':');
      if (idx !== -1) {
        const hKey = m[1].slice(0, idx).trim();
        const hVal = m[1].slice(idx + 1).trim();
        if (hKey) headers[hKey] = hVal;
      }
    }

    let bodyData: any = null;
    const dataMatch = cleanCmd.match(/(?:-d|--data|--data-raw)\s+(?:'([^']+)'|"([^"]+)"|(\S+))/);
    if (dataMatch) {
      const rawBody = dataMatch[1] || dataMatch[2] || dataMatch[3];
      if (rawBody) {
        try {
          bodyData = JSON.parse(rawBody);
        } catch {
          bodyData = rawBody;
        }
      }
    }

    const options: any = { method };
    if (Object.keys(headers).length > 0) options.headers = headers;
    if (bodyData !== null) options.body = bodyData;

    return `const response = await fetch("${url}", ${JSON.stringify(options, null, 2)});\nconst data = await response.json();`;
  }

  /**
   * URL Encode string
   */
  static urlEncode(input: string): string {
    if (typeof input !== 'string') return '';
    return encodeURIComponent(input);
  }

  /**
   * URL Decode string
   */
  static urlDecode(input: string): string {
    if (typeof input !== 'string') return '';
    try {
      return decodeURIComponent(input);
    } catch (err: any) {
      throw new Error(`Ошибка URL-декодирования: ${err.message}`);
    }
  }

  /**
   * Escape HTML special characters
   */
  static escapeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Unescape HTML entities
   */
  static unescapeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    return input
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }
}
