export function detectLineEnding(text: string): 'CRLF' | 'LF' {
  if (!text) return 'LF';
  return text.includes('\r\n') ? 'CRLF' : 'LF';
}

export function convertLineEnding(text: string, target: 'CRLF' | 'LF'): string {
  if (!text) return '';
  if (target === 'CRLF') {
    return text.replace(/\r?\n/g, '\r\n');
  }
  return text.replace(/\r\n/g, '\n');
}

/**
 * Robust encoding detection heuristic for UTF-8, UTF-16, and Windows-1251
 */
export function detectEncoding(buffer: Uint8Array): string {
  if (!buffer || buffer.length === 0) return 'UTF-8';

  // Check Byte Order Mark (BOM)
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return 'UTF-8 (BOM)';
  }
  if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return 'UTF-16LE';
  }
  if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return 'UTF-16BE';
  }

  // Validate UTF-8 multi-byte sequences
  let isValidUtf8 = true;
  let i = 0;
  const len = Math.min(buffer.length, 4096);

  while (i < len) {
    const byte = buffer[i];
    if (byte <= 0x7F) {
      i++;
    } else if ((byte & 0xE0) === 0xC0) {
      if (i + 1 >= len || (buffer[i + 1] & 0xC0) !== 0x80) { isValidUtf8 = false; break; }
      i += 2;
    } else if ((byte & 0xF0) === 0xE0) {
      if (i + 2 >= len || (buffer[i + 1] & 0xC0) !== 0x80 || (buffer[i + 2] & 0xC0) !== 0x80) { isValidUtf8 = false; break; }
      i += 3;
    } else if ((byte & 0xF8) === 0xF0) {
      if (i + 3 >= len || (buffer[i + 1] & 0xC0) !== 0x80 || (buffer[i + 2] & 0xC0) !== 0x80 || (buffer[i + 3] & 0xC0) !== 0x80) { isValidUtf8 = false; break; }
      i += 4;
    } else {
      isValidUtf8 = false;
      break;
    }
  }

  return isValidUtf8 ? 'UTF-8' : 'Windows-1251';
}
