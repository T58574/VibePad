import { describe, it, expect, beforeEach } from 'vitest';
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
      expect(stats.totalLines).toBe(6);
      expect(stats.languageBreakdown.json).toBe(50);
      expect(stats.languageBreakdown.md).toBe(50);
      expect(stats.vibeScore).toBeGreaterThan(0);
    });
  });

  describe('getBuiltInSnippets & Custom Snippets', () => {
    it('should return curated SaaS templates with Docker, Config, Postgres, and OpenAPI', () => {
      const snippets = SaaSFeatures.getBuiltInSnippets();
      expect(snippets.length).toBeGreaterThanOrEqual(5);
      expect(snippets.some((s) => s.category === 'Docker')).toBe(true);
      expect(snippets.some((s) => s.category === 'Database')).toBe(true);
    });

    it('should allow saving, fetching, and deleting custom snippets', () => {
      const custom = SaaSFeatures.saveCustomSnippet({
        title: 'Custom Fastify Server',
        category: 'Config',
        filename: 'server.ts',
        description: 'Fastify API template',
        content: 'import Fastify from "fastify";',
      });

      expect(custom.id).toContain('custom-');
      expect(custom.isCustom).toBe(true);

      const all = SaaSFeatures.getAllSnippets();
      expect(all.some((s) => s.id === custom.id)).toBe(true);

      SaaSFeatures.deleteCustomSnippet(custom.id);
      const remaining = SaaSFeatures.getCustomSnippets();
      expect(remaining.some((s) => s.id === custom.id)).toBe(false);
    });

    it('should throw error when saving snippet with missing title or content', () => {
      expect(() => SaaSFeatures.saveCustomSnippet({ title: '', category: 'Config', filename: 't.txt', description: '', content: 'x' })).toThrow(/Заголовок шаблона обязателен/);
      expect(() => SaaSFeatures.saveCustomSnippet({ title: 'T', category: 'Config', filename: 't.txt', description: '', content: '' })).toThrow(/Содержимое шаблона обязательно/);
    });
  });

  describe('generateWorkspacePreset', () => {
    it('should generate multi-tab workspace preset files for FullstackNode', () => {
      const tabs = SaaSFeatures.generateWorkspacePreset('FullstackNode');
      expect(tabs.length).toBe(4);
      expect(tabs.map((t) => t.name)).toContain('App.tsx');
      expect(tabs.map((t) => t.name)).toContain('schema.sql');
      expect(tabs.map((t) => t.name)).toContain('docker-compose.yml');
      expect(tabs.map((t) => t.name)).toContain('.env.production');
    });

    it('should generate workspace preset files for PythonFastAPI and DevOps', () => {
      const pythonTabs = SaaSFeatures.generateWorkspacePreset('PythonFastAPI');
      expect(pythonTabs.length).toBe(3);
      expect(pythonTabs.map((t) => t.name)).toContain('main.py');

      const devOpsTabs = SaaSFeatures.generateWorkspacePreset('DevOps');
      expect(devOpsTabs.length).toBe(3);
      expect(devOpsTabs.map((t) => t.name)).toContain('k8s-deployment.yaml');
    });
  });

  describe('diffWorkspaceSessions', () => {
    it('should correctly identify added, removed, and modified files between session states', () => {
      const oldTabs: FileItem[] = [
        { id: '1', name: 'app.js', path: 'app.js', content: 'console.log(1)', encoding: 'UTF-8', lineEnding: 'LF' },
        { id: '2', name: 'config.json', path: 'config.json', content: '{"port": 80}', encoding: 'UTF-8', lineEnding: 'LF' },
      ];

      const newTabs: FileItem[] = [
        { id: '1', name: 'app.js', path: 'app.js', content: 'console.log(2)', encoding: 'UTF-8', lineEnding: 'LF' }, // modified
        { id: '3', name: 'README.md', path: 'README.md', content: '# Docs', encoding: 'UTF-8', lineEnding: 'LF' }, // added
      ];

      const diff = SaaSFeatures.diffWorkspaceSessions(oldTabs, newTabs);
      expect(diff.added).toEqual(['README.md']);
      expect(diff.removed).toEqual(['config.json']);
      expect(diff.modified).toEqual(['app.js']);
    });
  });

  describe('analyzeCodeSecurity', () => {
    it('should return perfect 100 score for clean code', () => {
      const report = SaaSFeatures.analyzeCodeSecurity('const x = 10;\nconsole.log(x);', 'clean.ts');
      expect(report.score).toBe(100);
      expect(report.totalVulnerabilities).toBe(0);
    });

    it('should detect AWS Access Keys, eval calls, and SQL injection risks', () => {
      const vulnerableCode = `
        const awsKey = "AKIA1234567890ABCDEF";
        eval("console.log('danger')");
        const query = "SELECT * FROM users WHERE name = " + userInput;
      `;
      const report = SaaSFeatures.analyzeCodeSecurity(vulnerableCode, 'vulnerable.js');
      expect(report.totalVulnerabilities).toBe(3);
      expect(report.criticalCount).toBe(1);
      expect(report.highCount).toBe(2);
      expect(report.score).toBeLessThan(50);
      expect(report.vulnerabilities.some(v => v.ruleId === 'SEC-001')).toBe(true);
      expect(report.vulnerabilities.some(v => v.ruleId === 'SEC-005')).toBe(true);
      expect(report.vulnerabilities.some(v => v.ruleId === 'SEC-007')).toBe(true);
    });
  });

  describe('generateReadmeSnippet', () => {
    it('should generate structured README.md content from active workspace tabs', () => {
      const readme = SaaSFeatures.generateReadmeSnippet(mockTabs);
      expect(readme).toContain('# 🚀 VibePad Workspace Project');
      expect(readme).toContain('config.json');
      expect(readme).toContain('README.md');
    });
  });
});

