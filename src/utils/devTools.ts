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

  /**
   * Simple JSON to YAML converter
   */
  static jsonToYaml(jsonStr: string): string {
    if (!jsonStr || !jsonStr.trim()) return '';
    let obj: any;
    try {
      obj = JSON.parse(jsonStr);
    } catch (e: any) {
      throw new Error(`Ошибка парсинга JSON: ${e.message}`);
    }

    const stringifyYaml = (val: any, depth = 0): string => {
      const indent = '  '.repeat(depth);
      if (val === null || val === undefined) return 'null';
      if (typeof val === 'boolean' || typeof val === 'number') return String(val);
      if (typeof val === 'string') {
        if (val.includes('\n') || val.includes(':') || val.includes('#')) {
          return `"${val.replace(/"/g, '\\"')}"`;
        }
        return val;
      }
      if (Array.isArray(val)) {
        if (val.length === 0) return '[]';
        return val
          .map((item) => {
            if (typeof item === 'object' && item !== null) {
              const inner = stringifyYaml(item, depth + 1).trimStart();
              return `${indent}- ${inner}`;
            }
            return `${indent}- ${stringifyYaml(item, 0)}`;
          })
          .join('\n');
      }
      if (typeof val === 'object') {
        const keys = Object.keys(val);
        if (keys.length === 0) return '{}';
        return keys
          .map((k) => {
            const v = val[k];
            if (typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length > 0) {
              return `${indent}${k}:\n${stringifyYaml(v, depth + 1)}`;
            }
            if (Array.isArray(v) && v.length > 0) {
              return `${indent}${k}:\n${stringifyYaml(v, depth + 1)}`;
            }
            return `${indent}${k}: ${stringifyYaml(v, 0)}`;
          })
          .join('\n');
      }
      return String(val);
    };

    return stringifyYaml(obj);
  }

  /**
   * Simple YAML to JSON converter (Key-Value & list parser)
   */
  static yamlToJson(yamlStr: string): string {
    if (!yamlStr || !yamlStr.trim()) return '{}';

    const parseLineValue = (rawVal: string): any => {
      const v = rawVal.trim();
      if (v === 'null' || v === '~') return null;
      if (v === 'true') return true;
      if (v === 'false') return false;
      if (!isNaN(Number(v)) && v !== '') return Number(v);
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        return v.slice(1, -1);
      }
      return v;
    };

    const lines = yamlStr.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'));
    const result: Record<string, any> = {};

    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const key = line.slice(0, colonIdx).trim().replace(/^["']|["']$/g, '');
        const valStr = line.slice(colonIdx + 1).trim();
        if (key) {
          result[key] = valStr ? parseLineValue(valStr) : null;
        }
      }
    }

    return JSON.stringify(result, null, 2);
  }

  /**
   * Generate mock signed JWT token string from payload object or string
   */
  static generateJwtPayload(payload: Record<string, any> | string, customHeader?: Record<string, any>): string {
    const header = customHeader || { alg: 'HS256', typ: 'JWT' };
    const payloadObj = typeof payload === 'string' ? JSON.parse(payload) : payload;

    const encodeBase64Url = (obj: any): string => {
      const str = JSON.stringify(obj);
      return this.base64Encode(str)
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    };

    const encodedHeader = encodeBase64Url(header);
    const encodedPayload = encodeBase64Url(payloadObj);
    const mockSignature = encodeBase64Url({ signature: 'vibepad-mock-signature-' + Date.now() });

    return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
  }

  /**
   * Extract Regex pattern matches with detailed locations and line numbers
   */
  static extractRegexMatches(
    input: string,
    patternStr: string,
    flags: string = 'g'
  ): Array<{ match: string; index: number; line: number }> {
    if (!input || !patternStr) return [];

    let regex: RegExp;
    try {
      const cleanFlags = flags.includes('g') ? flags : flags + 'g';
      regex = new RegExp(patternStr, cleanFlags);
    } catch (e: any) {
      throw new Error(`Невалидный Regex: ${e.message}`);
    }

    const results: Array<{ match: string; index: number; line: number }> = [];
    const lines = input.split('\n');

    let match: RegExpExecArray | null;
    let maxSafety = 1000;

    while ((match = regex.exec(input)) !== null && maxSafety-- > 0) {
      const matchIndex = match.index;
      let charCount = 0;
      let lineNum = 1;

      for (let i = 0; i < lines.length; i++) {
        charCount += lines[i].length + 1;
        if (matchIndex < charCount) {
          lineNum = i + 1;
          break;
        }
      }

      results.push({
        match: match[0],
        index: matchIndex,
        line: lineNum,
      });

      if (match[0].length === 0) regex.lastIndex++;
    }

    return results;
  }

  /**
   * Calculate SHA-256 hash string (using Web Crypto API or Node fallback)
   */
  static async hashSha256(input: string): Promise<string> {
    if (typeof input !== 'string') return '';
    
    // Web Crypto API
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback: simple numeric checksum hex string if Web Crypto is unavailable
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  /**
   * Calculate Code Complexity & Maintainability Score
   */
  static calculateCodeComplexity(code: string): {
    totalLines: number;
    codeLines: number;
    commentLines: number;
    maxDepth: number;
    complexityScore: number;
    maintainabilityIndex: number;
  } {
    if (!code) {
      return { totalLines: 0, codeLines: 0, commentLines: 0, maxDepth: 0, complexityScore: 0, maintainabilityIndex: 100 };
    }

    const lines = code.split('\n');
    let codeLines = 0;
    let commentLines = 0;
    let maxDepth = 0;
    let currentDepth = 0;
    let decisionPoints = 1; // Base complexity

    const decisionRegex = /\b(if|else|switch|case|for|while|catch|&&|\|\||\?)\b/;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#')) {
        commentLines++;
        return;
      }

      codeLines++;

      // Depth tracking
      for (const char of trimmed) {
        if (char === '{' || char === '(') {
          currentDepth++;
          if (currentDepth > maxDepth) maxDepth = currentDepth;
        } else if (char === '}' || char === ')') {
          if (currentDepth > 0) currentDepth--;
        }
      }

      // Decision points (cyclomatic complexity)
      if (decisionRegex.test(trimmed)) {
        decisionPoints++;
      }
    });

    const totalLines = lines.length;
    const commentRatio = codeLines > 0 ? commentLines / codeLines : 0;
    
    // Maintainability Index (0 to 100 scale)
    const rawIndex = 171 - 5.2 * Math.log(decisionPoints) - 0.23 * (codeLines || 1) + 50 * Math.sin(Math.sqrt(commentRatio));
    const maintainabilityIndex = Math.min(100, Math.max(0, Math.round(rawIndex)));

    return {
      totalLines,
      codeLines,
      commentLines,
      maxDepth,
      complexityScore: decisionPoints,
      maintainabilityIndex,
    };
  }

  /**
   * Humanize Cron Expression (5-field standard)
   */
  static humanizeCron(cronExpr: string): string {
    if (!cronExpr || typeof cronExpr !== 'string') throw new Error('Строка cron пуста');
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length !== 5) {
      throw new Error('Некорректное число полей cron (требуется ровно 5 полей: мин час день мес день_недели)');
    }

    const [min, hour, dom, month, dow] = parts;

    let text = '';

    // Minute
    if (min === '*') text += 'Каждую минуту';
    else if (min.startsWith('*/')) text += `Каждые ${min.slice(2)} мин`;
    else text += `В ${min.padStart(2, '0')} мин`;

    // Hour
    if (hour === '*') {
      if (!min.startsWith('*/') && min !== '*') text += ' каждого часа';
    } else if (hour.startsWith('*/')) {
      text += `, каждые ${hour.slice(2)} ч`;
    } else {
      text += `, в ${hour.padStart(2, '0')}:00`;
    }

    // Day of month
    if (dom !== '*') {
      if (dom.startsWith('*/')) text += `, каждые ${dom.slice(2)} дн. месяца`;
      else text += `, ${dom}-го числа месяца`;
    }

    // Month
    if (month !== '*') {
      const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
      const mIdx = parseInt(month, 10) - 1;
      if (months[mIdx]) text += ` (${months[mIdx]})`;
      else text += ` (месяц ${month})`;
    }

    // Day of week
    if (dow !== '*') {
      const daysMap: Record<string, string> = {
        '0': 'Вс', '1': 'Пн', '2': 'Вт', '3': 'Ср', '4': 'Чт', '5': 'Пт', '6': 'Сб', '7': 'Вс',
        '1-5': 'Пн-Пт', '0-6': 'Вс-Сб', '6-0': 'Сб-Вс'
      };
      const dayStr = daysMap[dow] || `дни недели [${dow}]`;
      text += `, дни: ${dayStr}`;
    }

    return text;
  }

  /**
   * Format & Sort Environment Variable (.env) file
   */
  static formatEnvFile(envContent: string): { formatted: string; keysCount: number; parsedJson: Record<string, string> } {
    if (!envContent || typeof envContent !== 'string') {
      return { formatted: '', keysCount: 0, parsedJson: {} };
    }

    const lines = envContent.split(/\r?\n/);
    const envPairs: Array<{ key: string; val: string; comment?: string }> = [];
    const parsedJson: Record<string, string> = {};

    let currentComment = '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith('#')) {
        currentComment = currentComment ? `${currentComment}\n${line}` : line;
        continue;
      }

      const eqIdx = line.indexOf('=');
      if (eqIdx !== -1) {
        const key = line.slice(0, eqIdx).trim();
        const val = line.slice(eqIdx + 1).trim();
        if (key) {
          envPairs.push({ key, val, comment: currentComment || undefined });
          parsedJson[key] = val.replace(/^["']|["']$/g, '');
          currentComment = '';
        }
      }
    }

    // Sort alphabetically by key name
    envPairs.sort((a, b) => a.key.localeCompare(b.key));

    const formattedLines: string[] = [];
    for (const pair of envPairs) {
      if (pair.comment) formattedLines.push(pair.comment);
      formattedLines.push(`${pair.key}=${pair.val}`);
    }

    return {
      formatted: formattedLines.join('\n'),
      keysCount: envPairs.length,
      parsedJson
    };
  }

  /**
   * Align Markdown Table columns nicely with space padding
   */
  static formatMarkdownTable(tableMd: string): string {
    if (!tableMd || !tableMd.trim()) return '';

    const lines = tableMd.trim().split(/\r?\n/).filter(l => l.trim().includes('|'));
    if (lines.length < 2) return tableMd;

    const rows = lines.map(line =>
      line
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map(cell => cell.trim())
    );

    const numCols = Math.max(...rows.map(r => r.length));
    const colWidths = new Array(numCols).fill(3);

    rows.forEach((row, rowIdx) => {
      if (rowIdx === 1 && row.every(cell => cell.startsWith('-'))) return;

      row.forEach((cell, colIdx) => {
        if (cell.length > colWidths[colIdx]) {
          colWidths[colIdx] = cell.length;
        }
      });
    });

    const formatRow = (cells: string[]) => {
      const padded = cells.map((cell, idx) => {
        const width = colWidths[idx] || 3;
        return cell.padEnd(width, ' ');
      });
      return `| ${padded.join(' | ')} |`;
    };

    const formattedRows: string[] = [];

    // Header
    formattedRows.push(formatRow(rows[0]));

    // Delimiter line
    const delimiterCells = colWidths.map(w => '-'.repeat(w));
    formattedRows.push(`| ${delimiterCells.join(' | ')} |`);

    // Data rows
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      while (row.length < numCols) row.push('');
      formattedRows.push(formatRow(row.slice(0, numCols)));
    }

    return formattedRows.join('\n');
  }

  /**
   * Analyze file performance metrics for large file guard
   */
  static analyzeFilePerformance(content: string, fileName: string): {
    sizeBytes: number;
    totalLines: number;
    maxLineLength: number;
    isLargeFile: boolean;
    isBinary: boolean;
    recommendedMode: 'Standard' | 'Safe Performance Mode' | 'Binary Warning';
  } {
    const sizeBytes = new TextEncoder().encode(content || '').length;
    const lines = (content || '').split('\n');
    const totalLines = lines.length;
    let maxLineLength = 0;

    for (let i = 0; i < Math.min(lines.length, 5000); i++) {
      if (lines[i].length > maxLineLength) maxLineLength = lines[i].length;
    }

    const isBinary = (content || '').slice(0, 1000).includes('\0');
    const isLargeFile = sizeBytes > 10 * 1024 * 1024 || totalLines > 50000;

    let recommendedMode: 'Standard' | 'Safe Performance Mode' | 'Binary Warning' = 'Standard';
    if (isBinary) recommendedMode = 'Binary Warning';
    else if (isLargeFile) recommendedMode = 'Safe Performance Mode';

    return {
      sizeBytes,
      totalLines,
      maxLineLength,
      isLargeFile,
      isBinary,
      recommendedMode
    };
  }

  /**
   * Line-by-line diff comparison between two text strings
   */
  static diffText(textA: string, textB: string): {
    lines: Array<{ type: 'added' | 'removed' | 'unchanged'; text: string; lineA?: number; lineB?: number }>;
    addedCount: number;
    removedCount: number;
    unchangedCount: number;
  } {
    const linesA = (textA || '').split(/\r?\n/);
    const linesB = (textB || '').split(/\r?\n/);

    const result: Array<{ type: 'added' | 'removed' | 'unchanged'; text: string; lineA?: number; lineB?: number }> = [];
    let addedCount = 0;
    let removedCount = 0;
    let unchangedCount = 0;

    let i = 0;
    let j = 0;
    let lineNoA = 1;
    let lineNoB = 1;

    while (i < linesA.length || j < linesB.length) {
      if (i < linesA.length && j < linesB.length && linesA[i] === linesB[j]) {
        result.push({ type: 'unchanged', text: linesA[i], lineA: lineNoA++, lineB: lineNoB++ });
        unchangedCount++;
        i++;
        j++;
      } else if (j < linesB.length && (!linesA.includes(linesB[j], i) || linesB.includes(linesA[i], j + 1))) {
        result.push({ type: 'added', text: linesB[j], lineB: lineNoB++ });
        addedCount++;
        j++;
      } else if (i < linesA.length) {
        result.push({ type: 'removed', text: linesA[i], lineA: lineNoA++ });
        removedCount++;
        i++;
      }
    }

    return { lines: result, addedCount, removedCount, unchangedCount };
  }

  /**
   * Flatten nested JSON object into dot-notation keys
   */
  static flattenJson(jsonStr: string): string {
    if (!jsonStr || !jsonStr.trim()) return '{}';
    let obj: any;
    try {
      obj = JSON.parse(jsonStr);
    } catch (e: any) {
      throw new Error(`Ошибка парсинга JSON: ${e.message}`);
    }

    const flatObj: Record<string, any> = {};
    const recurse = (current: any, prop: string) => {
      if (Object(current) !== current || Array.isArray(current) || current === null) {
        flatObj[prop] = current;
      } else {
        let isEmpty = true;
        for (const p in current) {
          isEmpty = false;
          recurse(current[p], prop ? `${prop}.${p}` : p);
        }
        if (isEmpty && prop) {
          flatObj[prop] = {};
        }
      }
    };

    recurse(obj, '');
    return JSON.stringify(flatObj, null, 2);
  }

  /**
   * Unflatten dot-notation JSON object back to nested structure
   */
  static unflattenJson(flatJsonStr: string): string {
    if (!flatJsonStr || !flatJsonStr.trim()) return '{}';
    let flatObj: any;
    try {
      flatObj = JSON.parse(flatJsonStr);
    } catch (e: any) {
      throw new Error(`Ошибка парсинга JSON: ${e.message}`);
    }

    if (typeof flatObj !== 'object' || flatObj === null || Array.isArray(flatObj)) {
      return flatJsonStr;
    }

    const result: Record<string, any> = {};
    for (const key of Object.keys(flatObj)) {
      const keys = key.split('.');
      let current = result;
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (i === keys.length - 1) {
          current[k] = flatObj[key];
        } else {
          if (!current[k] || typeof current[k] !== 'object') {
            current[k] = {};
          }
          current = current[k];
        }
      }
    }

    return JSON.stringify(result, null, 2);
  }

  /**
   * RFC 4122 v4 UUID Generator
   */
  static generateUuid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
  }

  /**
   * Convert Color (HEX, RGB, HSL)
   */
  static convertColor(colorStr: string, targetFormat: 'hex' | 'rgb' | 'hsl'): string {
    if (!colorStr || !colorStr.trim()) throw new Error('Цветовая строка пуста');
    const str = colorStr.trim().toLowerCase();

    let r = 0, g = 0, b = 0;

    // Hex
    if (str.startsWith('#')) {
      const hex = str.slice(1);
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
      } else {
        throw new Error('Невалидный HEX формат (требуется #RGB или #RRGGBB)');
      }
    } else if (str.startsWith('rgb')) {
      const match = str.match(/\d+/g);
      if (!match || match.length < 3) throw new Error('Невалидный RGB формат (например rgb(255, 0, 0))');
      r = Math.min(255, parseInt(match[0], 10));
      g = Math.min(255, parseInt(match[1], 10));
      b = Math.min(255, parseInt(match[2], 10));
    } else {
      throw new Error('Неподдерживаемый исходный формат цвета (поддерживается #HEX или rgb())');
    }

    if (targetFormat === 'hex') {
      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    if (targetFormat === 'rgb') {
      return `rgb(${r}, ${g}, ${b})`;
    }

    // HSL
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
        case gNorm: h = (bNorm - rNorm) / d + 2; break;
        case bNorm: h = (rNorm - gNorm) / d + 4; break;
      }
      h /= 6;
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  /**
   * Convert Timestamp between Unix (sec/ms) and ISO Date
   */
  static convertTimestamp(input: string | number): { iso: string; unixSec: number; unixMs: number; readable: string } {
    if (input === undefined || input === null || input === '') {
      throw new Error('Ввод времени пуст');
    }

    let date: Date;

    if (typeof input === 'number' || !isNaN(Number(input))) {
      const num = Number(input);
      // Seconds vs MS heuristic
      date = num > 1e11 ? new Date(num) : new Date(num * 1000);
    } else {
      date = new Date(input);
    }

    if (isNaN(date.getTime())) {
      throw new Error('Невалидный штамп времени или дата');
    }

    return {
      iso: date.toISOString(),
      unixSec: Math.floor(date.getTime() / 1000),
      unixMs: date.getTime(),
      readable: date.toLocaleString('ru-RU', { dateStyle: 'full', timeStyle: 'medium' })
    };
  }
}


