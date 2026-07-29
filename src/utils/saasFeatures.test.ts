import { describe, it, expect } from 'vitest';
import { SaaSFeatures } from './saasFeatures';
import { FileItem } from './ipcBridge';

describe('SaaSFeatures Utility Suite', () => {
  const mockTabs: FileItem[] = [
    {
      id: 'tab-1',
      name: 'config.json',
      path: 'config.json',
      content: '{\n  "app": "VibePad",\n  "port": 3456\n}',
      encoding: 'UTF-8',
      lineEnding: 'LF',
    },
    {
      id: 'tab-2',
      name: 'README.md',
      path: 'README.md',
      content: '# VibePad Editor\nUltra lightweight text editor',
      encoding: 'UTF-8',
      lineEnding: 'LF',
    },
  ];

  describe('exportWorkspaceSession & importWorkspaceSession', () => {
    it('should export tabs to a valid JSON session and import them back intact', () => {
      const exportedJson = SaaSFeatures.exportWorkspaceSession(mockTabs);
      expect(exportedJson).toContain('"version": "1.0.0"');

      const importedTabs = SaaSFeatures.importWorkspaceSession(exportedJson);
      expect(importedTabs).toHaveLength(2);
      expect(importedTabs[0].name).toBe('config.json');
      expect(importedTabs[1].content).toContain('Ultra lightweight text editor');
    });

    it('should throw error when importing invalid session format', () => {
      expect(() => SaaSFeatures.importWorkspaceSession('invalid json')).toThrow(/Невалидный JSON/);
      expect(() => SaaSFeatures.importWorkspaceSession('{"foo": "bar"}')).toThrow(/Неверная структура/);
    });
  });

  describe('generateGistPayload', () => {
    it('should format a valid GitHub Gist API JSON payload', () => {
      const gistJson = SaaSFeatures.generateGistPayload(mockTabs[0], 'Test Gist Share');
      const parsed = JSON.parse(gistJson);
      expect(parsed.description).toBe('Test Gist Share');
      expect(parsed.files['config.json'].content).toContain('VibePad');
    });
  });

  describe('calculateProductivityStats', () => {
    it('should accurately calculate total lines, characters, words, and language breakdown', () => {
      const stats = SaaSFeatures.calculateProductivityStats(mockTabs);
      expect(stats.totalTabs).toBe(2);
      expect(stats.totalLines).toBe(6); // 4 + 2
      expect(stats.languageBreakdown.json).toBe(50);
      expect(stats.languageBreakdown.md).toBe(50);
      expect(stats.vibeScore).toBeGreaterThan(0);
    });
  });

  describe('getBuiltInSnippets', () => {
    it('should return curated SaaS templates with Docker, Config, Postgres, and OpenAPI', () => {
      const snippets = SaaSFeatures.getBuiltInSnippets();
      expect(snippets.length).toBeGreaterThanOrEqual(4);
      expect(snippets.some((s) => s.category === 'Docker')).toBe(true);
      expect(snippets.some((s) => s.category === 'Database')).toBe(true);
    });
  });
});
