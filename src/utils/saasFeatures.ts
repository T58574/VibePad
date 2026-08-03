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

export interface SecurityVulnerability {
  id: string;
  ruleId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'Secret Leak' | 'Command Injection' | 'XSS Risk' | 'SQL Injection' | 'Insecure Config';
  line: number;
  description: string;
  snippet: string;
  recommendation: string;
}

export interface SecurityAuditReport {
  score: number;
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  vulnerabilities: SecurityVulnerability[];
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
      {
        id: 'k8s-deployment',
        title: 'Kubernetes Deployment & Service',
        category: 'Docker',
        filename: 'k8s-deployment.yaml',
        description: 'Production K8s deployment manifest with ingress & health probes',
        content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: vibepad-app
  labels:
    app: vibepad
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vibepad
  template:
    metadata:
      labels:
        app: vibepad
    spec:
      containers:
      - name: vibepad
        image: vibepad/app:latest
        ports:
        - containerPort: 3456
        resources:
          limits:
            cpu: "500m"
            memory: "256Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: vibepad-service
spec:
  type: ClusterIP
  selector:
    app: vibepad
  ports:
  - port: 80
    targetPort: 3456
`,
      },
      {
        id: 'fastapi-async',
        title: 'FastAPI Async Microservice',
        category: 'API',
        filename: 'main.py',
        description: 'Async Python FastAPI microservice with CORS & Pydantic models',
        content: `from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="VibePad High-Performance Microservice", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class DocumentPayload(BaseModel):
    title: str
    content: str
    tags: Optional[List[str]] = []

@app.get("/health")
async def health_check():
    return {"status": "online", "vibe": "100%"}

@app.post("/api/v1/process")
async def process_doc(payload: DocumentPayload):
    return {
        "title": payload.title,
        "char_count": len(payload.content),
        "status": "processed"
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

  /**
   * Generate curated workspace preset environment tabs
   */
  static generateWorkspacePreset(presetType: 'FullstackNode' | 'PythonFastAPI' | 'DevOps'): FileItem[] {
    const timestamp = Date.now();
    const snippets = this.getBuiltInSnippets();

    if (presetType === 'FullstackNode') {
      const docker = snippets.find(s => s.id === 'docker-compose-prod')?.content || '';
      const postgres = snippets.find(s => s.id === 'postgres-schema')?.content || '';
      const env = snippets.find(s => s.id === 'env-prod-template')?.content || '';
      const react = snippets.find(s => s.id === 'vite-tailwind-ts')?.content || '';

      return [
        { id: `preset-${timestamp}-1`, name: 'App.tsx', path: 'src/App.tsx', content: react, encoding: 'UTF-8', lineEnding: 'LF', isDirty: true },
        { id: `preset-${timestamp}-2`, name: 'schema.sql', path: 'db/schema.sql', content: postgres, encoding: 'UTF-8', lineEnding: 'LF', isDirty: true },
        { id: `preset-${timestamp}-3`, name: 'docker-compose.yml', path: 'docker-compose.yml', content: docker, encoding: 'UTF-8', lineEnding: 'LF', isDirty: true },
        { id: `preset-${timestamp}-4`, name: '.env.production', path: '.env.production', content: env, encoding: 'UTF-8', lineEnding: 'LF', isDirty: true }
      ];
    } else if (presetType === 'PythonFastAPI') {
      const fastapi = snippets.find(s => s.id === 'fastapi-async')?.content || '';
      const openapi = snippets.find(s => s.id === 'openapi-spec')?.content || '';
      const docker = snippets.find(s => s.id === 'docker-compose-prod')?.content || '';

      return [
        { id: `preset-${timestamp}-1`, name: 'main.py', path: 'main.py', content: fastapi, encoding: 'UTF-8', lineEnding: 'LF', isDirty: true },
        { id: `preset-${timestamp}-2`, name: 'openapi.yaml', path: 'openapi.yaml', content: openapi, encoding: 'UTF-8', lineEnding: 'LF', isDirty: true },
        { id: `preset-${timestamp}-3`, name: 'docker-compose.yml', path: 'docker-compose.yml', content: docker, encoding: 'UTF-8', lineEnding: 'LF', isDirty: true }
      ];
    } else {
      const k8s = snippets.find(s => s.id === 'k8s-deployment')?.content || '';
      const nginx = snippets.find(s => s.id === 'nginx-proxy')?.content || '';
      const env = snippets.find(s => s.id === 'env-prod-template')?.content || '';

      return [
        { id: `preset-${timestamp}-1`, name: 'k8s-deployment.yaml', path: 'k8s/deployment.yaml', content: k8s, encoding: 'UTF-8', lineEnding: 'LF', isDirty: true },
        { id: `preset-${timestamp}-2`, name: 'nginx.conf', path: 'nginx/nginx.conf', content: nginx, encoding: 'UTF-8', lineEnding: 'LF', isDirty: true },
        { id: `preset-${timestamp}-3`, name: '.env.production', path: '.env.production', content: env, encoding: 'UTF-8', lineEnding: 'LF', isDirty: true }
      ];
    }
  }

  /**
   * Compare two workspace sessions and produce session diff summary
   */
  static diffWorkspaceSessions(oldTabs: FileItem[], newTabs: FileItem[]): {
    added: string[];
    removed: string[];
    modified: string[];
  } {
    const oldMap = new Map<string, string>();
    oldTabs.forEach(t => oldMap.set(t.name, t.content));

    const newMap = new Map<string, string>();
    newTabs.forEach(t => newMap.set(t.name, t.content));

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];

    newMap.forEach((content, name) => {
      if (!oldMap.has(name)) {
        added.push(name);
      } else if (oldMap.get(name) !== content) {
        modified.push(name);
      }
    });

    oldMap.forEach((_, name) => {
      if (!newMap.has(name)) {
        removed.push(name);
      }
    });

    return { added, removed, modified };
  }

  /**
   * Static Application Security Testing (SAST) Code & Secret Scanner
   */
  static analyzeCodeSecurity(content: string, filename: string = 'file.txt'): SecurityAuditReport {
    if (!content || !content.trim()) {
      return {
        score: 100,
        totalVulnerabilities: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        vulnerabilities: [],
      };
    }

    const lines = content.split(/\r?\n/);
    const vulnerabilities: SecurityVulnerability[] = [];

    const rules: Array<{
      ruleId: string;
      category: SecurityVulnerability['category'];
      severity: SecurityVulnerability['severity'];
      regex: RegExp;
      description: string;
      recommendation: string;
    }> = [
      {
        ruleId: 'SEC-001',
        category: 'Secret Leak',
        severity: 'CRITICAL',
        regex: /AKIA[0-9A-Z]{16}/,
        description: 'Обнаружен открытый AWS Access Key ID',
        recommendation: 'Удалите секретный ключ и вынесите его в переменные окружения (.env или AWS Secrets Manager).',
      },
      {
        ruleId: 'SEC-002',
        category: 'Secret Leak',
        severity: 'CRITICAL',
        regex: /ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{50,}/,
        description: 'Обнаружен персональный токен доступа GitHub (Personal Access Token)',
        recommendation: 'Отозовите токен в настройках GitHub и используйте секреты окружения.',
      },
      {
        ruleId: 'SEC-003',
        category: 'Secret Leak',
        severity: 'CRITICAL',
        regex: /-----BEGIN (?:RSA|OPENSSH|EC|DSA|PRIVATE) KEY-----/,
        description: 'Обнаружен приватный SSH/SSL ключ в исходном коде',
        recommendation: 'Никогда не храните файлы приватных ключей в репозитории.',
      },
      {
        ruleId: 'SEC-004',
        category: 'Secret Leak',
        severity: 'HIGH',
        regex: /sk_live_[0-9a-zA-Z]{24}|sk-[a-zA-Z0-9]{32,}/,
        description: 'Обнаружен секретный API-ключ (Stripe / OpenAI / Service Key)',
        recommendation: 'Вынесите секретные ключи в переменные окружения process.env.',
      },
      {
        ruleId: 'SEC-005',
        category: 'Command Injection',
        severity: 'HIGH',
        regex: /eval\s*\(|new\s+Function\s*\(|child_process\.exec\s*\(/,
        description: 'Использование опасных вызовов eval() / exec(), приводящих к RCE',
        recommendation: 'Избегайте выполнения динамического кода. Используйте безопасные функции child_process.execFile() с экранированием.',
      },
      {
        ruleId: 'SEC-006',
        category: 'XSS Risk',
        severity: 'MEDIUM',
        regex: /\.innerHTML\s*=|dangerouslySetInnerHTML/,
        description: 'Прямая вставка неотфильтрованного HTML (Риск XSS-атак)',
        recommendation: 'Используйте безопасный textContent или санитайзеры DOMPurify.',
      },
      {
        ruleId: 'SEC-007',
        category: 'SQL Injection',
        severity: 'HIGH',
        regex: /(?:SELECT|INSERT|UPDATE|DELETE).*\+\s*[a-zA-Z_$]/i,
        description: 'Конкатенация строк в SQL-запросе (Риск SQL-инъекции)',
        recommendation: 'Используйте параметризованные запросы или подготовленные выражения (Prepared Statements).',
      },
      {
        ruleId: 'SEC-008',
        category: 'Insecure Config',
        severity: 'MEDIUM',
        regex: /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]0['"]/,
        description: 'Отключение проверки SSL-сертификатов TLS',
        recommendation: 'Включите проверку SSL в продакшн-окружении для защиты от MITM-атак.',
      },
    ];

    lines.forEach((lineText, idx) => {
      rules.forEach((rule) => {
        if (rule.regex.test(lineText)) {
          vulnerabilities.push({
            id: `vuln-${Date.now()}-${vulnerabilities.length + 1}`,
            ruleId: rule.ruleId,
            category: rule.category,
            severity: rule.severity,
            line: idx + 1,
            description: rule.description,
            snippet: lineText.trim().slice(0, 100),
            recommendation: rule.recommendation,
          });
        }
      });
    });

    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    vulnerabilities.forEach((v) => {
      if (v.severity === 'CRITICAL') criticalCount++;
      else if (v.severity === 'HIGH') highCount++;
      else if (v.severity === 'MEDIUM') mediumCount++;
      else if (v.severity === 'LOW') lowCount++;
    });

    const penalty = criticalCount * 30 + highCount * 15 + mediumCount * 10 + lowCount * 5;
    const score = Math.max(0, 100 - penalty);

    return {
      score,
      totalVulnerabilities: vulnerabilities.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      vulnerabilities,
    };
  }

  /**
   * Auto-generate a Markdown README.md for current workspace tabs
   */
  static generateReadmeSnippet(tabs: FileItem[]): string {
    const fileList = tabs.map(t => `- **\`${t.name}\`** (${t.encoding}, ${t.lineEnding})`).join('\n');
    const stats = this.calculateProductivityStats(tabs);

    return `# 🚀 VibePad Workspace Project\n\n## 📋 Overview\nProject generated with **VibePad SaaS Edition**.\nTotal active tabs: **${stats.totalTabs}** | Lines of code: **${stats.totalLines.toLocaleString()}** | Vibe Score: **${stats.vibeScore}%**.\n\n## 📁 Workspace Files\n${fileList}\n\n## ⚡ Quick Start\n\`\`\`bash\n# Build & Test session\nnpm run test\n\`\`\`\n`;
  }
}

