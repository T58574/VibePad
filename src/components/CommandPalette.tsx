import React, { useState, useEffect } from 'react';
import { Search, Code, FileText, ShieldCheck, Activity, Layers, Share2, Terminal, Globe, KeyRound, Table } from 'lucide-react';
import { DevTools } from '../utils/devTools';

interface CommandPaletteProps {
  onClose: () => void;
  onTransformContent: (transformer: (content: string) => string) => void;
  onToggleMarkdown: () => void;
  onToggleDiff: () => void;
  onRegisterWindows: () => void;
  onOpenProductivity: () => void;
  onOpenSnippetVault: () => void;
  onOpenSessionExport: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  onClose,
  onTransformContent,
  onToggleMarkdown,
  onToggleDiff,
  onRegisterWindows,
  onOpenProductivity,
  onOpenSnippetVault,
  onOpenSessionExport,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = [
    { id: 'saas-analytics', name: 'Open Vibe Productivity Dashboard (Ctrl+Shift+S)', icon: Activity, action: onOpenProductivity },
    { id: 'saas-snippets', name: 'Open SaaS Snippet Vault & Templates (Ctrl+Shift+V)', icon: Layers, action: onOpenSnippetVault },
    { id: 'saas-session', name: 'Cloud Sync & Session Export/Import', icon: Share2, action: onOpenSessionExport },
    { id: 'json-ts', name: 'Generate TypeScript Interfaces from JSON', icon: Code, action: () => onTransformContent((c) => DevTools.generateTsInterfaceFromJson(c)) },
    { id: 'json-prettify', name: 'Format JSON (Prettify)', icon: Code, action: () => onTransformContent(DevTools.prettifyJson) },
    { id: 'json-minify', name: 'Minify JSON', icon: Code, action: () => onTransformContent(DevTools.minifyJson) },
    { id: 'sql-format', name: 'Format SQL Query', icon: Terminal, action: () => onTransformContent(DevTools.formatSql) },
    { id: 'sql-minify', name: 'Minify SQL Query', icon: Terminal, action: () => onTransformContent(DevTools.minifySql) },
    { id: 'curl-fetch', name: 'Convert cURL Command to fetch()', icon: Globe, action: () => onTransformContent(DevTools.curlToFetch) },
    { id: 'jwt-decode', name: 'Decode JWT Token Payload', icon: KeyRound, action: () => onTransformContent(DevTools.decodeJwt) },
    { id: 'csv-markdown', name: 'Convert CSV to Markdown Table', icon: Table, action: () => onTransformContent(DevTools.csvToMarkdownTable) },
    { id: 'clean-logs', name: 'Clean Logs (Strip ANSI & Timestamps)', icon: FileText, action: () => onTransformContent(DevTools.cleanLogs) },
    { id: 'url-encode', name: 'URL Encode String', icon: Globe, action: () => onTransformContent(DevTools.urlEncode) },
    { id: 'url-decode', name: 'URL Decode String', icon: Globe, action: () => onTransformContent(DevTools.urlDecode) },
    { id: 'html-escape', name: 'Escape HTML Special Characters', icon: Code, action: () => onTransformContent(DevTools.escapeHtml) },
    { id: 'html-unescape', name: 'Unescape HTML Entities', icon: Code, action: () => onTransformContent(DevTools.unescapeHtml) },
    { id: 'toggle-markdown', name: 'Toggle Markdown Preview (Ctrl+E)', icon: FileText, action: onToggleMarkdown },
    { id: 'toggle-diff', name: 'Toggle Split-View Diff (Ctrl+Shift+D)', icon: Code, action: onToggleDiff },
    { id: 'register-win', name: 'Integrate into Windows Explorer Context Menu', icon: ShieldCheck, action: onRegisterWindows },
  ];

  const filteredActions = actions.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredActions.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % Math.max(1, filteredActions.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredActions, selectedIndex, onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 animate-in fade-in">
      <div className="w-[550px] bg-[#181b24] border border-vibe-border rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans">
        <div className="flex items-center px-4 py-3 border-b border-vibe-border gap-2">
          <Search className="w-4 h-4 text-vibe-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск команды или действия..."
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-vibe-muted focus:outline-none"
            autoFocus
          />
          <kbd className="text-[10px] bg-vibe-bg text-vibe-muted px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="p-4 text-center text-xs text-vibe-muted">Команды не найдены</div>
          ) : (
            filteredActions.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg text-left transition ${
                    isSelected
                      ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 font-medium'
                      : 'text-slate-300 hover:bg-[#1f2330]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-vibe-muted'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
