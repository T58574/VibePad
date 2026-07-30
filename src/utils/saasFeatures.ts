import { FileItem } from './ipcBridge';

export interface SaaSWorkspaceSession {
  version: string;
  exportedAt: string;
  totalTabs: number;
  tabs: Array<{
    name: string;
    path: string;
    content: string;
    encoding: string;
    lineEnding: 'CRLF' | 'LF';
  }>;
}

export interface SaaSProductivityStats {
  totalTabs: number;
  totalCharacters: number;
  totalLines: number;
  totalWords: number;
  estimatedReadTimeMinutes: number;
  languageBreakdown: Record<string, number>;
  vibeScore: number;
}

export interface SaaSSnippet {
  id: string;
  title: string;
  category: 'Docker' | 'Config' | 'Database' | 'API' | 'Frontend';
  filename: string;
  description: string;
  content: string;
  isCustom?: boolean;
}

export class SaaSFeatures {
  private static CUSTOM_SNIPPETS_KEY = 'vibepad_custom_snippets';
  private static inMemoryCustomSnippets: SaaSSnippet[] = [];

  /**
   * Export all active tabs into a portable SaaS Session JSON format
   */
  static exportWorkspaceSession(tabs: FileItem[]): string {
    const sessionData: SaaSWorkspaceSession = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      totalTabs: tabs.length,
      tabs: tabs.map((t) => ({
        name: t.name,
        path: t.path,
        content: t.content,
        encoding: t.encoding,
        lineEnding: t.lineEnding,
      })),
    };
    return JSON.stringify(sessionData, null, 2);
  }

  /**
   * Import and validate workspace session from JSON
   */
  static importWorkspaceSession(jsonStr: string): FileItem[] {
    if (!jsonStr || !jsonStr.trim()) {
      throw new Error('Строка сессии пуста');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (err) {
      throw new Error('Невалидный JSON формат сессии');
    }

    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.tabs)) {
      throw new Error('Неверная структура файлов в сессии VibePad');
    }

    return parsed.tabs.map((t: any, index: number) => {
      const name = typeof t.name === 'string' && t.name ? t.name : `imported-${index + 1}.txt`;
      return {
        id: `tab-imported-${Date.now()}-${index}`,
        name,
        path: typeof t.path === 'string' && t.path ? t.path : name,
        content: typeof t.content === 'string' ? t.content : '',
        encoding: typeof t.encoding === 'string' ? t.encoding : 'UTF-8',
        lineEnding: t.lineEnding === 'CRLF' ? 'CRLF' : 'LF',
        isDirty: true,
      };
    });
  }

  /**
   * Generate GitHub Gist payload for sharing file snippet
   */
  static generateGistPayload(file: FileItem, description?: string): string {
    if (!file) throw new Error('Файл для экспорта не выбран');
    const gist = {
      description: description || `VibePad Snippet: ${file.name}`,
      public: false,
      files: {
        [file.name || 'snippet.txt']: {
          content: file.content,
        },
      },
    };
    return JSON.stringify(gist, null, 2);
  }

  /**
   * Calculate Vibe Productivity Metrics & Analytics
   */
  static calculateProductivityStats(tabs: FileItem[]): SaaSProductivityStats {
    let totalCharacters = 0;
    let totalLines = 0;
    let totalWords = 0;
    const extensionCounts: Record<string, number> = {};

    tabs.forEach((tab) => {
      const content = tab.content || '';
      totalCharacters += content.length;
      
      const lines = content.split('\n');
      totalLines += lines.length;

      const words = content.trim().split(/\s+/).filter(Boolean);
      totalWords += words.length;

      const ext = tab.name.includes('.') ? tab.name.split('.').pop()?.toLowerCase() || 'txt' : 'txt';
      extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
    });

    const totalFiles = tabs.length || 1;
    const languageBreakdown: Record<string, number> = {};
    Object.entries(extensionCounts).forEach(([ext, count]) => {
      languageBreakdown[ext] = Math.round((count / totalFiles) * 100);
    });

    const estimatedReadTimeMinutes = Math.ceil(totalWords / 200);
    const vibeScore = Math.min(100, Math.max(10, Math.round(100 - totalCharacters / 50000)));

    return {
      totalTabs: tabs.length,
      totalCharacters,
      totalLines,
      totalWords,
      estimatedReadTimeMinutes,
      languageBreakdown,
      vibeScore,
    };
  }

  /**
   * Get built-in curated SaaS Snippet Vault
   */
  static getBuiltInSnippets(): SaaSSnippet[] {
    return [
      {
        id: 'docker-compose-prod',
        title: 'Docker Compose (Production Stack)',
        category: 'Docker',
        filename: 'docker-compose.yml',
        description: 'Production-grade PostgreSQL, Redis & Nginx reverse proxy',
        content: `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://postgres:secret@db:5432/vibepad
      REDIS_URL: redis://cache:6379
    depends_on:
      - db
      - cache
    restart: always

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: vibepad
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: always

  cache:
    image: redis:7-alpine
    restart: always

volumes:
  pgdata:
`,
      },
      {
        id: 'nginx-proxy',
        title: 'Nginx High-Performance Config',
        category: 'Config',
        filename: 'nginx.conf',
        description: 'Optimized Web Server + Gzip + WebSocket proxy headers',
        content: `server {
    listen 80;
    server_name vibepad.internal;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    location / {
        proxy_pass http://127.0.0.1:3456;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`,
      },
      {
        id: 'postgres-schema',
        title: 'PostgreSQL Schema Template',
        category: 'Database',
        filename: 'schema.sql',
        description: 'UUID primary keys, indexing & automatic updated_at trigger',
        content: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
`,
      },
      {
        id: 'openapi-spec',
        title: 'OpenAPI 3.0 REST Spec',
        category: 'API',
        filename: 'openapi.yaml',
        description: 'REST API Documentation Schema with JWT Auth',
        content: `openapi: 3.0.3
info:
  title: VibePad SaaS API
  version: 1.0.0
paths:
  /api/v1/health:
    get:
      summary: Health check endpoint
      responses:
        '200':
          description: OK
  /api/v1/documents:
    get:
      summary: List user documents
      security:
        - BearerAuth: []
      responses:
        '200':
          description: List of documents
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
`,
      },
      {
        id: 'env-prod-template',
        title: '.env Production Template',
        category: 'Config',
        filename: '.env.production',
        description: 'Secure SaaS environment variables template',
        content: `NODE_ENV=production
PORT=3456
API_SECRET_KEY=super-secret-crypto-key-change-me
DATABASE_URL=postgres://user:password@localhost:5432/vibepad_db
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
MAX_FILE_SIZE_MB=50
LOG_LEVEL=info
`,
      },
      {
        id: 'vite-tailwind-ts',
        title: 'Vite React Tailwind Preset',
        category: 'Frontend',
        filename: 'App.tsx',
        description: 'Clean modern React + Tailwind CSS starter component',
        content: `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold tracking-tight text-indigo-400">VibePad Application</h1>
      <p className="mt-2 text-slate-400 text-sm">Ultra-lightweight React & Tailwind workspace</p>
    </div>
  );
}
`,
      },
    ];
  }

  /**
   * Retrieve user-defined custom snippets from localStorage or memory
   */
  static getCustomSnippets(): SaaSSnippet[] {
    try {
      if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.getItem === 'function') {
        const saved = localStorage.getItem(this.CUSTOM_SNIPPETS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch {}
    return this.inMemoryCustomSnippets;
  }

  /**
   * Save a user-defined custom snippet to localStorage and memory
   */
  static saveCustomSnippet(snippet: Omit<SaaSSnippet, 'id'> & { id?: string }): SaaSSnippet {
    if (!snippet.title || !snippet.title.trim()) throw new Error('Заголовок шаблона обязателен');
    if (!snippet.content || !snippet.content.trim()) throw new Error('Содержимое шаблона обязательно');

    const newSnippet: SaaSSnippet = {
      id: snippet.id || `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: snippet.title.trim(),
      category: snippet.category || 'Config',
      filename: snippet.filename?.trim() || 'template.txt',
      description: snippet.description?.trim() || 'Пользовательский шаблон',
      content: snippet.content,
      isCustom: true,
    };

    const existing = this.getCustomSnippets();
    const updated = [newSnippet, ...existing.filter((s) => s.id !== newSnippet.id)];
    this.inMemoryCustomSnippets = updated;

    try {
      if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
        localStorage.setItem(this.CUSTOM_SNIPPETS_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Failed to persist custom snippet:', e);
    }

    return newSnippet;
  }

  /**
   * Delete a custom snippet from localStorage and memory
   */
  static deleteCustomSnippet(id: string): void {
    const existing = this.getCustomSnippets();
    const updated = existing.filter((s) => s.id !== id);
    this.inMemoryCustomSnippets = updated;
    try {
      if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.setItem === 'function') {
        localStorage.setItem(this.CUSTOM_SNIPPETS_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Failed to delete custom snippet:', e);
    }
  }

  /**
   * Get all snippets (built-in + custom)
   */
  static getAllSnippets(): SaaSSnippet[] {
    return [...this.getCustomSnippets(), ...this.getBuiltInSnippets()];
  }
}
