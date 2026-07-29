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
      // Pad missing columns if row has fewer elements
      while (cols.length < maxCols) cols.push('');
      return cols.slice(0, maxCols).join(' | ');
    });

    return `| ${headers.join(' | ')} |\n| ${separator} |\n` + rows.map(r => `| ${r} |`).join('\n');
  }
}
