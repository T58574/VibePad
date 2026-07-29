import React, { useState } from 'react';
import { X, Layers, Code, Plus, Copy, Check, Search } from 'lucide-react';
import { SaaSFeatures, SaaSSnippet } from '../utils/saasFeatures';

interface SaaSSnippetVaultModalProps {
  onInsertToCurrent: (content: string) => void;
  onOpenInNewTab: (name: string, content: string) => void;
  onClose: () => void;
}

export const SaaSSnippetVaultModal: React.FC<SaaSSnippetVaultModalProps> = ({
  onInsertToCurrent,
  onOpenInNewTab,
  onClose,
}) => {
  const snippets = SaaSFeatures.getBuiltInSnippets();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', 'Docker', 'Config', 'Database', 'API'];

  const filteredSnippets = snippets.filter((s) => {
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    const matchesQuery =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.filename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleCopy = (snippet: SaaSSnippet) => {
    navigator.clipboard.writeText(snippet.content);
    setCopiedId(snippet.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#141720] border border-vibe-border/60 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col font-sans max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-vibe-border/60 bg-[#191d29]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                SaaS Snippet Vault & Templates
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  Production Ready
                </span>
              </h2>
              <p className="text-xs text-vibe-muted">Готовые шаблоны конфигураций, скриптов и архитектуры</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-vibe-muted hover:text-slate-100 hover:bg-vibe-surface rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="p-4 border-b border-vibe-border/40 bg-[#0f1117] flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-vibe-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Поиск шаблонов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#191d29] border border-vibe-border/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-vibe-muted focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-[#191d29] text-vibe-muted hover:text-slate-200 border border-vibe-border/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Snippets List */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {filteredSnippets.length === 0 ? (
            <div className="text-center py-10 text-vibe-muted text-xs">
              Шаблоны не найдены по вашему запросу.
            </div>
          ) : (
            filteredSnippets.map((snippet) => (
              <div
                key={snippet.id}
                className="bg-[#0f1117] border border-vibe-border/40 hover:border-indigo-500/50 rounded-xl p-4 transition group flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100">{snippet.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                        {snippet.filename}
                      </span>
                    </div>
                    <p className="text-xs text-vibe-muted">{snippet.description}</p>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-medium">
                    {snippet.category}
                  </span>
                </div>

                {/* Preview Code Snippet */}
                <pre className="bg-[#141720] border border-vibe-border/30 p-2.5 rounded-lg font-mono text-[11px] text-slate-300 overflow-x-auto max-h-28 text-left">
                  {snippet.content}
                </pre>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleCopy(snippet)}
                    className="px-2.5 py-1.5 bg-[#191d29] hover:bg-slate-700 text-vibe-muted hover:text-slate-100 rounded-lg text-xs flex items-center gap-1 transition"
                    title="Скопировать буфер"
                  >
                    {copiedId === snippet.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === snippet.id ? 'Скопировано' : 'Копировать'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onInsertToCurrent(snippet.content);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 bg-[#191d29] hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1 transition border border-vibe-border/50"
                  >
                    <Code className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Вставить в активный файл</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenInNewTab(snippet.filename, snippet.content);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs flex items-center gap-1 font-medium transition shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Открыть новой вкладкой</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
