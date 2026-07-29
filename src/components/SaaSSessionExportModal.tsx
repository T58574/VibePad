import React, { useState } from 'react';
import { X, Download, Upload, Share2, Copy, Check, FileJson } from 'lucide-react';
import { FileItem } from '../utils/ipcBridge';
import { SaaSFeatures } from '../utils/saasFeatures';

interface SaaSSessionExportModalProps {
  tabs: FileItem[];
  activeFile: FileItem | null;
  onImportSession: (newTabs: FileItem[]) => void;
  onClose: () => void;
}

export const SaaSSessionExportModal: React.FC<SaaSSessionExportModalProps> = ({
  tabs,
  activeFile,
  onImportSession,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'gist'>('export');
  const [importInput, setImportInput] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const exportedSessionJson = SaaSFeatures.exportWorkspaceSession(tabs);
  const gistJson = activeFile ? SaaSFeatures.generateGistPayload(activeFile) : '';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([exportedSessionJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibepad-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteImport = () => {
    setImportError(null);
    try {
      const importedTabs = SaaSFeatures.importWorkspaceSession(importInput);
      onImportSession(importedTabs);
      onClose();
    } catch (err: any) {
      setImportError(err.message || 'Ошибка импорта сессии');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#141720] border border-vibe-border/60 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col font-sans max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-vibe-border/60 bg-[#191d29]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                Session Cloud Sync & Workspace Transfer
              </h2>
              <p className="text-xs text-vibe-muted">Экспорт, импорт сессий и публикация в Gist</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-vibe-muted hover:text-slate-100 hover:bg-vibe-surface rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-vibe-border/40 bg-[#0f1117] px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-vibe-muted hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Экспорт сессии
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-vibe-muted hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Импорт сессии
          </button>

          <button
            onClick={() => setActiveTab('gist')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'gist'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-vibe-muted hover:text-slate-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" /> GitHub Gist Payload
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'export' && (
            <div className="space-y-3">
              <p className="text-xs text-vibe-muted">
                Сохраните текущее состояние всех {tabs.length} вкладок в файл JSON для переноса на другое устройство:
              </p>
              <textarea
                readOnly
                value={exportedSessionJson}
                className="w-full h-52 bg-[#0f1117] border border-vibe-border/40 rounded-lg p-3 font-mono text-xs text-slate-300 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleCopy(exportedSessionJson)}
                  className="px-3 py-1.5 bg-[#191d29] border border-vibe-border/60 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Скопировано' : 'Скопировать JSON'}</span>
                </button>

                <button
                  onClick={handleDownloadJson}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Скачать .json файл</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-3">
              <p className="text-xs text-vibe-muted">
                Вставьте ранее экспортированный JSON код сессии VibePad:
              </p>
              <textarea
                placeholder="Вставьте JSON сессии сюда..."
                value={importInput}
                onChange={(e) => setImportInput(e.target.value)}
                className="w-full h-52 bg-[#0f1117] border border-vibe-border/40 rounded-lg p-3 font-mono text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              />
              {importError && (
                <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-lg text-xs text-rose-300">
                  {importError}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={handleExecuteImport}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Восстановить вкладки</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'gist' && (
            <div className="space-y-3">
              <p className="text-xs text-vibe-muted">
                Готовый JSON Payload активного файла ({activeFile?.name || 'Untitled'}) для отправки на GitHub Gist API:
              </p>
              <textarea
                readOnly
                value={gistJson}
                className="w-full h-52 bg-[#0f1117] border border-vibe-border/40 rounded-lg p-3 font-mono text-xs text-slate-300 focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => handleCopy(gistJson)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Скопировано в буфер' : 'Скопировать Payload'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
