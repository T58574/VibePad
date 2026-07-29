import { describe, it, expect } from 'vitest';
import { detectLineEnding, convertLineEnding, detectEncoding } from './encodings';

describe('Encodings & Line Endings Utility Suite', () => {
  describe('detectLineEnding', () => {
    it('should detect CRLF if Windows carriage return exists', () => {
      expect(detectLineEnding('Line 1\r\nLine 2')).toBe('CRLF');
    });

    it('should detect LF for standard Unix line feeds', () => {
      expect(detectLineEnding('Line 1\nLine 2')).toBe('LF');
    });
  });

  describe('convertLineEnding', () => {
    it('should convert LF to CRLF correctly', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const converted = convertLineEnding(text, 'CRLF');
      expect(converted).toBe('Line 1\r\nLine 2\r\nLine 3');
    });

    it('should convert CRLF to LF correctly', () => {
      const text = 'Line 1\r\nLine 2\r\nLine 3';
      const converted = convertLineEnding(text, 'LF');
      expect(converted).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('detectEncoding', () => {
    it('should detect UTF-8 (BOM) Byte Order Mark header', () => {
      const buffer = new Uint8Array([0xEF, 0xBB, 0xBF, 0x48, 0x65, 0x6C, 0x6C, 0x6F]);
      expect(detectEncoding(buffer)).toBe('UTF-8 (BOM)');
    });

    it('should detect UTF-16LE Byte Order Mark header', () => {
      const buffer = new Uint8Array([0xFF, 0xFE, 0x48, 0x00]);
      expect(detectEncoding(buffer)).toBe('UTF-16LE');
    });

    it('should detect UTF-16BE Byte Order Mark header', () => {
      const buffer = new Uint8Array([0xFE, 0xFF, 0x00, 0x48]);
      expect(detectEncoding(buffer)).toBe('UTF-16BE');
    });

    it('should detect standard UTF-8 for valid ASCII / UTF-8 sequences', () => {
      const encoder = new TextEncoder();
      const buffer = encoder.encode('Привет мир VibePad!');
      expect(detectEncoding(buffer)).toBe('UTF-8');
    });

    it('should fallback to Windows-1251 for non-UTF8 binary byte sequences', () => {
      // Single byte > 0x7F without valid UTF-8 follow bytes
      const buffer = new Uint8Array([0xC0, 0x00, 0xFF]);
      expect(detectEncoding(buffer)).toBe('Windows-1251');
    });
  });
});
