import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCode,
  FileText,
  Plus,
  X,
  Eye,
  Command,
  Sparkles,
  Columns,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';
import { Editor } from './components/Editor';
import { MarkdownViewer } from './components/MarkdownViewer';
import { DiffViewer } from './components/DiffViewer';
import { AntigravityPrompt } from './components/AntigravityPrompt';
import { CommandPalette } from './components/CommandPalette';
import { QuickContextBar } from './components/QuickContextBar';
import { LogFilterBar } from './components/LogFilterBar';
import { FileItem, IPCBridge } from './utils/ipcBridge';
import { convertLineEnding } from './utils/encodings';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function App() {
  // Session State & Tabs with Unique IDs
  const [tabs, setTabs] = useState<FileItem[]>(() => {
    try {
      const saved = localStorage.getItem('vibepad_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t, idx) => ({
            id: t.id || `tab-${Date.now()}-${idx}`,
            name: t.name || 'Untitled.txt',
            path: t.path || 'Untitled.txt',
            content: t.content || '',
            encoding: t.encoding || 'UTF-8',
            lineEnding: t.lineEnding || 'LF',
            isDirty: t.isDirty || false,
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to restore session from localStorage:', e);
    }
    return [
      {
        id: `tab-${Date.now()}-welcome`,
        name: 'welcome.log',
        path: 'welcome.log',
        content: `[${new Date().toISOString()}] [INFO] VibePad Ultra-Lightweight Editor initialized.
[INFO] CodeMirror 6 engine running @ ~30MB RAM.
[SUCCESS] Antigravity AI pipe ready (Ctrl+K).
[TIP] Press Ctrl+P for Command Palette or Ctrl+E for Markdown toggle.`,
        encoding: 'UTF-8',
        lineEnding: 'LF',
        isDirty: false,
      },
    ];
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id || 'default');
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [selection, setSelection] = useState('');
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);

  // Log Tail & Filter State
  const [filterQuery, setFilterQuery] = useState('');
  const [isTailing, setIsTailing] = useState(false);

  // Shell & Toast Feedback
  const [shellOutput, setShellOutput] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Hot-Exit Safe Session Preservation (QuotaExceeded Protection)
  useEffect(() => {
    try {
      // Strips large contents if total session size exceeds safe threshold
      const lightweightTabs = tabs.map((t) => ({
        ...t,
        content: t.content.length > 500000 ? t.content.slice(0, 500000) : t.content,
      }));
      localStorage.setItem('vibepad_session', JSON.stringify(lightweightTabs));
    } catch (e) {
      console.warn('QuotaExceeded: Could not persist full session state to localStorage:', e);
    }
  }, [tabs]);

  // Initial CLI Argument Processing
  useEffect(() => {
    let isMounted = true;
    IPCBridge.getInitialFile().then(async (filePath) => {
      if (!filePath || !isMounted) return;
      try {
        const fileData = await IPCBridge.readFile(filePath);
        const fileName = filePath.split(/[/\\]/).pop() || filePath;
        const newTab: FileItem = {
          id: `tab-${Date.now()}-cli`,
          name: fileName,
          path: filePath,
          content: fileData.content,
          encoding: fileData.encoding,
          lineEnding: fileData.lineEnding,
          isDirty: false,
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTabId(newTab.id);
        showToast('info', `Открыт файл: ${fileName}`);
      } catch (err: any) {
        showToast('error', `Ошибка загрузки начального файла: ${err.message}`);
      }
    });
    return () => { isMounted = false; };
  }, [showToast]);

  const activeFileIndex = tabs.findIndex((t) => t.id === activeTabId);
  const activeFile = tabs[activeFileIndex >= 0 ? activeFileIndex : 0] || tabs[0];

  const handleUpdateContent = useCallback((newContent: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, content: newContent, isDirty: true } : t))
    );
  }, [activeTabId]);

  const handleSaveFile = async () => {
    if (!activeFile) return;
    if (activeFile.path.startsWith('Untitled-')) {
      showToast('info', 'Для нового файла требуется указать имя файла');
      return;
    }

    setIsSaving(true);
    try {
      const success = await IPCBridge.writeFile(activeFile.path, activeFile.content);
      if (success) {
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTabId ? { ...t, isDirty: false } : t))
        );
        showToast('success', `Файл сохранен: ${activeFile.name}`);
      } else {
        showToast('error', `Ошибка сохранения файла: ${activeFile.name}`);
      }
    } catch (e: any) {
      showToast('error', `Исключение при сохранении: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTab = () => {
    const tabNum = tabs.length + 1;
    const newTab: FileItem = {
      id: `tab-${Date.now()}-${tabNum}`,
      name: `Untitled-${tabNum}.txt`,
      path: `Untitled-${tabNum}.txt`,
      content: '',
      encoding: 'UTF-8',
      lineEnding: 'LF',
      isDirty: true,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;

    const targetTab = tabs.find((t) => t.id === id);
    if (targetTab?.isDirty) {
      const confirmClose = window.confirm(`Файл "${targetTab.name}" имеет несохраненные изменения. Закрыть без сохранения?`);
      if (!confirmClose) return;
    }

    const nextTabs = tabs.filter((t) => t.id !== id);
    setTabs(nextTabs);

    if (activeTabId === id) {
      setActiveTabId(nextTabs[nextTabs.length - 1].id);
    }
  };

  const handleRunShell = async () => {
    if (!activeFile) return;
    showToast('info', `Запуск команды для ${activeFile.name}...`);
    const res = await IPCBridge.runShell(activeFile.name);
    setShellOutput(res);
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsMarkdownMode((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsAiOpen((prev) => !prev);
      } else if (e.shiftKey && e.key === 'F11') {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveFile();
      } else if (e.altKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleRunShell();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, activeFile]);

  // Log filter application
  const displayedContent = filterQuery && activeFile
    ? activeFile.content
        .split('\n')
        .filter((line) => line.toLowerCase().includes(filterQuery.toLowerCase()))
        .join('\n')
    : activeFile?.content || '';

  return (
    <div className="h-screen w-screen flex flex-col bg-vibe-bg text-vibe-text overflow-hidden select-none font-sans">
      {/* Top Header / Tab Bar */}
      {!isZenMode && (
        <header className="flex items-center justify-between bg-[#141720] border-b border-vibe-border px-2 py-1 select-none">
          {/* Tabs Navigation */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[70%]">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs cursor-pointer border-t-2 transition ${
                    isActive
                      ? 'bg-[#0f1117] border-indigo-500 text-slate-100 font-medium'
                      : 'border-transparent text-vibe-muted hover:text-slate-300 hover:bg-[#181b24]'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate max-w-[130px]">{tab.name}</span>
                  {tab.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
                  <X
                    className="w-3 h-3 text-vibe-muted hover:text-rose-400 rounded transition shrink-0 ml-1"
                    onClick={(e) => handleCloseTab(tab.id, e)}
                  />
                </div>
              );
            })}
            <button
              onClick={handleAddTab}
              className="p-1 hover:bg-vibe-surface text-vibe-muted hover:text-slate-200 rounded transition"
              title="Создать новый скратчпад"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Top Control Buttons */}
          <div className="flex items-center gap-2 px-2">
            <button
              onClick={handleSaveFile}
              disabled={isSaving}
              className="p-1.5 bg-[#181b24] border border-vibe-border hover:bg-slate-700 text-vibe-muted hover:text-slate-200 rounded transition flex items-center gap-1 text-xs"
              title="Сохранить файл (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            <button
              onClick={() => setIsMarkdownMode(!isMarkdownMode)}
              className={`p-1.5 rounded text-xs flex items-center gap-1 border transition ${
                isMarkdownMode
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-[#181b24] border-vibe-border text-vibe-muted hover:text-slate-200'
              }`}
              title="Переключить просмотр Markdown (Ctrl+E)"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isMarkdownMode ? 'Код' : 'Превью'}</span>
            </button>

            <button
              onClick={() => setIsDiffMode(!isDiffMode)}
              className={`p-1.5 rounded text-xs flex items-center gap-1 border transition ${
                isDiffMode
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-[#181b24] border-vibe-border text-vibe-muted hover:text-slate-200'
              }`}
              title="Сравнение файлов Diff"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsAiOpen(!isAiOpen)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1 font-medium transition shadow-lg shadow-indigo-600/20"
              title="Antigravity AI Assistant (Ctrl+K)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI</span>
            </button>

            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="p-1.5 bg-[#181b24] border border-vibe-border hover:bg-slate-700 text-vibe-muted hover:text-slate-200 rounded transition"
              title="Палитра команд (Ctrl+P)"
            >
              <Command className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>
      )}

      {/* Log Filter Bar */}
      {activeFile?.name.endsWith('.log') && !isZenMode && (
        <LogFilterBar
          filterQuery={filterQuery}
          onFilterChange={setFilterQuery}
          isTailing={isTailing}
          onToggleTail={() => setIsTailing(!isTailing)}
        />
      )}

      {/* Main Workspace */}
      <main className="flex-1 relative overflow-hidden bg-[#0f1117]">
        {isDiffMode ? (
          <DiffViewer
            oldText={activeFile?.content || ''}
            newText={selection || 'Текст для сравнения не выбран'}
            onClose={() => setIsDiffMode(false)}
          />
        ) : isMarkdownMode ? (
          <MarkdownViewer content={activeFile?.content || ''} />
        ) : (
          <Editor
            content={displayedContent}
            onChange={handleUpdateContent}
            onSelectionChange={(sel, coords) => {
              setSelection(sel);
              setSelectionCoords(coords);
            }}
            fileName={activeFile?.name || 'Untitled.txt'}
          />
        )}

        {/* Quick Context Bar for Text Selections */}
        <QuickContextBar
          selection={selection}
          coords={selectionCoords}
          onReplaceSelection={(newText) => handleUpdateContent(newText)}
          onOpenAi={() => setIsAiOpen(true)}
        />
      </main>

      {/* Console Output Drawer */}
      {shellOutput && (
        <div className="h-36 bg-[#141720] border-t border-vibe-border p-3 font-mono text-xs text-slate-300 flex flex-col z-30">
          <div className="flex justify-between items-center pb-2 border-b border-vibe-border text-vibe-muted">
            <span className="flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Output Console
            </span>
            <button onClick={() => setShellOutput(null)} className="hover:text-slate-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <pre className="flex-1 overflow-auto pt-2 text-emerald-400 whitespace-pre-wrap">{shellOutput}</pre>
        </div>
      )}

      {/* Toast Notifications Stack */}
      <div className="fixed bottom-10 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-3 py-2 rounded-lg text-xs shadow-xl border flex items-center gap-2 animate-in slide-in-from-bottom-2 transition ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Status Bar */}
      {!isZenMode && (
        <footer className="flex items-center justify-between px-3 py-1 bg-[#141720] border-t border-vibe-border text-[11px] text-vibe-muted select-none">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-300">
              <FileText className="w-3 h-3 text-indigo-400" />
              {activeFile?.name}
            </span>
            <span>{activeFile?.content.length || 0} символов</span>
            <span>{activeFile?.content.split('\n').length || 0} строк</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (!activeFile) return;
                const nextEnding = activeFile.lineEnding === 'CRLF' ? 'LF' : 'CRLF';
                handleUpdateContent(convertLineEnding(activeFile.content, nextEnding));
              }}
              className="hover:text-slate-200 transition font-mono"
            >
              {activeFile?.lineEnding || 'LF'}
            </button>
            <span className="font-mono">{activeFile?.encoding || 'UTF-8'}</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Готов
            </span>
          </div>
        </footer>
      )}

      {/* Floating Modals */}
      {isCommandPaletteOpen && (
        <CommandPalette
          onClose={() => setIsCommandPaletteOpen(false)}
          onTransformContent={(fn) => {
            try {
              if (activeFile) handleUpdateContent(fn(activeFile.content));
            } catch (err: any) {
              showToast('error', err.message);
            }
          }}
          onToggleMarkdown={() => setIsMarkdownMode(!isMarkdownMode)}
          onToggleDiff={() => setIsDiffMode(!isDiffMode)}
          onRegisterWindows={async () => {
            showToast('info', 'Регистрация VibePad в контекстном меню Windows...');
            const res = await IPCBridge.runShell('node scripts/register-windows.js');
            showToast('success', res);
          }}
        />
      )}

      {isAiOpen && (
        <AntigravityPrompt
          selection={selection}
          onApplyDiff={(newCode) => {
            handleUpdateContent(newCode);
            setIsAiOpen(false);
            showToast('success', 'Изменения от AI применены');
          }}
          onClose={() => setIsAiOpen(false)}
        />
      )}
    </div>
  );
}
