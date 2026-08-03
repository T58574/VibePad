import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Activity,
  Layers,
  Share2,
  FolderOpen,
  PanelLeft,
  Folder,
  Trash2,
} from 'lucide-react';
import { Editor } from './components/Editor';
import { MarkdownViewer } from './components/MarkdownViewer';
import { DiffViewer } from './components/DiffViewer';
import { AntigravityPrompt } from './components/AntigravityPrompt';
import { CommandPalette } from './components/CommandPalette';
import { QuickContextBar } from './components/QuickContextBar';
import { LogFilterBar } from './components/LogFilterBar';
import { SaaSProductivityModal } from './components/SaaSProductivityModal';
import { SaaSSnippetVaultModal } from './components/SaaSSnippetVaultModal';
import { SaaSSessionExportModal } from './components/SaaSSessionExportModal';
import { FileItem, IPCBridge } from './utils/ipcBridge';
import { convertLineEnding } from './utils/encodings';
import { SaaSFeatures } from './utils/saasFeatures';

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
        content: `[${new Date().toISOString()}] [INFO] VibePad SaaS Ultra-Lightweight Editor initialized.
[INFO] CodeMirror 6 engine running @ ~30MB RAM.
[SUCCESS] Antigravity AI pipe ready (Ctrl+K).
[TIP] Press Ctrl+P for Command Palette, Ctrl+Shift+S for Analytics, or Ctrl+Shift+V for Snippet Vault.`,
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

  // Sidebar & Save As Modal State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSaveAsOpen, setIsSaveAsOpen] = useState(false);
  const [saveAsInput, setSaveAsInput] = useState('');

  // SaaS Modals State
  const [isProductivityModalOpen, setIsProductivityModalOpen] = useState(false);
  const [isSnippetVaultOpen, setIsSnippetVaultOpen] = useState(false);
  const [isSessionExportOpen, setIsSessionExportOpen] = useState(false);

  // Log Tail & Filter State
  const [filterQuery, setFilterQuery] = useState('');
  const [isTailing, setIsTailing] = useState(false);

  // Shell & Toast Feedback
  const [shellOutput, setShellOutput] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        const lineEnding = text.includes('\r\n') ? 'CRLF' : 'LF';
        const filePath = (file as any).path || file.name;
        const newTab: FileItem = {
          id: `tab-${Date.now()}-${i}`,
          name: file.name,
          path: filePath,
          content: text,
          encoding: 'UTF-8',
          lineEnding,
          isDirty: false,
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTabId(newTab.id);
        showToast('info', `Открыт файл: ${file.name}`);
      } catch (err: any) {
        showToast('error', `Не удалось открыть ${file.name}: ${err.message}`);
      }
    }
    if (e.target) e.target.value = '';
  };

  const handleDropFiles = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        const lineEnding = text.includes('\r\n') ? 'CRLF' : 'LF';
        const filePath = (file as any).path || file.name;
        const newTab: FileItem = {
          id: `tab-${Date.now()}-${i}`,
          name: file.name,
          path: filePath,
          content: text,
          encoding: 'UTF-8',
          lineEnding,
          isDirty: false,
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTabId(newTab.id);
        showToast('info', `Загружен файл: ${file.name}`);
      } catch (err: any) {
        showToast('error', `Ошибка загрузки файла ${file.name}: ${err.message}`);
      }
    }
  };

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Hot-Exit Safe Session Preservation (Debounced to prevent keystroke UI blocking)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const lightweightTabs = tabs.map((t) => ({
          ...t,
          content: t.content.length > 500000 ? t.content.slice(0, 500000) : t.content,
        }));
        localStorage.setItem('vibepad_session', JSON.stringify(lightweightTabs));
      } catch (e) {
        console.warn('QuotaExceeded: Could not persist full session state to localStorage:', e);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [tabs]);

  // Initial CLI Argument Processing
  useEffect(() => {
    let isMounted = true;
    const loadInitialFile = async () => {
      for (let attempt = 0; attempt < 8; attempt++) {
        try {
          const filePath = await IPCBridge.getInitialFile();
          if (filePath && isMounted) {
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
            let targetTabId = newTab.id;
            setTabs((prev) => {
              const cleanPrev = prev.filter((t) => t.name !== 'welcome.log');
              const existing = cleanPrev.find((t) => t.path === filePath);
              if (existing) {
                targetTabId = existing.id;
                return cleanPrev;
              }
              return [newTab, ...cleanPrev];
            });
            setActiveTabId(targetTabId);
            showToast('info', `Открыт файл: ${fileName}`);
            break;
          }
        } catch (err: any) {
          console.warn('[App] Initial file load retry:', err);
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    };
    loadInitialFile();
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const activeFileIndex = tabs.findIndex((t) => t.id === activeTabId);
  const activeFile = tabs[activeFileIndex >= 0 ? activeFileIndex : 0] || tabs[0];

  const handleUpdateContent = useCallback(
    (newContent: string) => {
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== activeTabId) return t;
          if (t.content === newContent && t.isDirty) return t;
          return { ...t, content: newContent, isDirty: true };
        })
      );
    },
    [activeTabId]
  );

  const handleSaveAsConfirm = async (targetPath: string) => {
    if (!activeFile || !targetPath || !targetPath.trim()) return;
    const cleanPath = targetPath.trim();
    const fileName = cleanPath.split(/[/\\]/).pop() || cleanPath;

    setIsSaving(true);
    try {
      const success = await IPCBridge.writeFile(cleanPath, activeFile.content);
      if (success) {
        setTabs((prev) =>
          prev.map((t) =>
            t.id === activeTabId
              ? { ...t, name: fileName, path: cleanPath, isDirty: false }
              : t
          )
        );
        setIsSaveAsOpen(false);
        showToast('success', `Файл сохранен как: ${fileName}`);
      } else {
        showToast('error', `Ошибка сохранения файла по пути: ${cleanPath}`);
      }
    } catch (e: any) {
      showToast('error', `Исключение при сохранении: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFile = async () => {
    if (!activeFile) return;
    if (activeFile.path.startsWith('Untitled-')) {
      setSaveAsInput(activeFile.name);
      setIsSaveAsOpen(true);
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

  const handleAddTab = useCallback((name?: string, content?: string) => {
    const tabNum = tabs.length + 1;
    const tabName = name || `Untitled-${tabNum}.txt`;
    const tabContent = content !== undefined ? content : '';
    const newTab: FileItem = {
      id: `tab-${Date.now()}-${tabNum}`,
      name: tabName,
      path: tabName,
      content: tabContent,
      encoding: 'UTF-8',
      lineEnding: 'LF',
      isDirty: true,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [tabs.length]);

  const handleCloseTab = useCallback((id: string, e?: React.MouseEvent | Event) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (tabs.length === 1) return;

    const targetTab = tabs.find((t) => t.id === id);
    if (targetTab?.isDirty) {
      const confirmClose = window.confirm(
        `Файл "${targetTab.name}" имеет несохраненные изменения. Закрыть без сохранения?`
      );
      if (!confirmClose) return;
    }

    const nextTabs = tabs.filter((t) => t.id !== id);
    setTabs(nextTabs);

    if (activeTabId === id) {
      const nextActive = nextTabs[nextTabs.length - 1];
      if (nextActive) setActiveTabId(nextActive.id);
    }
  }, [tabs, activeTabId]);

  const handleRunShell = async () => {
    if (!activeFile) return;
    showToast('info', `Запуск команды для ${activeFile.name}...`);
    const res = await IPCBridge.runShell(activeFile.name);
    setShellOutput(res);
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsProductivityModalOpen((prev) => !prev);
      } else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setIsSnippetVaultOpen((prev) => !prev);
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleAddTab();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        handleCloseTab(activeTabId, e);
      } else if (isCmdOrCtrl && e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
        if (currentIndex >= 0) {
          const nextIndex = e.shiftKey
            ? (currentIndex - 1 + tabs.length) % tabs.length
            : (currentIndex + 1) % tabs.length;
          setActiveTabId(tabs[nextIndex].id);
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsMarkdownMode((prev) => !prev);
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsAiOpen((prev) => !prev);
      } else if (e.shiftKey && e.key === 'F11') {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveFile();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpenFileClick();
      } else if (e.altKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleRunShell();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, activeFile, tabs, handleOpenFileClick, handleAddTab, handleCloseTab]);

  // Log filter application memoized to prevent expensive recalculation
  const displayedContent = useMemo(() => {
    if (!filterQuery || !activeFile) return activeFile?.content || '';
    const lower = filterQuery.toLowerCase();
    return activeFile.content
      .split('\n')
      .filter((line) => line.toLowerCase().includes(lower))
      .join('\n');
  }, [filterQuery, activeFile?.content]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={handleDropFiles}
      className="h-screen w-screen flex flex-col bg-vibe-bg text-vibe-text overflow-hidden select-none font-sans"
    >
      {/* Top Header / Tab Bar */}
      {!isZenMode && (
        <header className="flex items-center justify-between bg-[#141720] border-b border-vibe-border px-2 py-1 select-none">
          {/* Sidebar Toggle & Tabs Navigation */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[65%]">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-1.5 rounded transition ${
                isSidebarOpen
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                  : 'text-vibe-muted hover:text-slate-200 hover:bg-[#181b24]'
              }`}
              title="Переключить боковую панель файлов (Ctrl+B)"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-vibe-border mx-0.5" />
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
              onClick={handleOpenFileClick}
              className="p-1 hover:bg-vibe-surface text-vibe-muted hover:text-indigo-400 rounded transition"
              title="Открыть файл с диска (Ctrl+O)"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAddTab()}
              className="p-1 hover:bg-vibe-surface text-vibe-muted hover:text-slate-200 rounded transition"
              title="Создать новый файл (Ctrl+N)"
            >
              <Plus className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              multiple
              className="hidden"
            />
          </div>

          {/* Top Control Buttons & SaaS Modals Triggers */}
          <div className="flex items-center gap-1.5 px-2">
            <button
              onClick={() => setIsProductivityModalOpen(true)}
              className="p-1.5 bg-[#181b24] border border-vibe-border hover:bg-slate-700 text-vibe-muted hover:text-slate-200 rounded transition flex items-center gap-1 text-xs"
              title="Vibe Productivity Dashboard (Ctrl+Shift+S)"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            <button
              onClick={() => setIsSnippetVaultOpen(true)}
              className="p-1.5 bg-[#181b24] border border-vibe-border hover:bg-slate-700 text-vibe-muted hover:text-slate-200 rounded transition flex items-center gap-1 text-xs"
              title="SaaS Snippet Vault & Templates (Ctrl+Shift+V)"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            <button
              onClick={() => setIsSessionExportOpen(true)}
              className="p-1.5 bg-[#181b24] border border-vibe-border hover:bg-slate-700 text-vibe-muted hover:text-slate-200 rounded transition flex items-center gap-1 text-xs"
              title="Session Sync & Gist Export"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            </button>

            <div className="w-[1px] h-4 bg-vibe-border mx-0.5" />

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

      {/* Main Workspace Layout (Sidebar + Editor) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Left Sidebar Explorer */}
        {isSidebarOpen && !isZenMode && (
          <aside className="w-64 bg-[#141720] border-r border-vibe-border flex flex-col z-20 shrink-0 text-xs">
            <div className="p-3 border-b border-vibe-border flex items-center justify-between font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-vibe-muted">
                <Folder className="w-3.5 h-3.5 text-indigo-400" /> Workspace Explorer
              </span>
              <button
                onClick={() => handleAddTab()}
                className="p-1 hover:bg-[#1f2330] rounded text-vibe-muted hover:text-slate-200"
                title="Новый файл (Ctrl+N)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="text-[10px] uppercase font-bold text-vibe-muted px-2 py-1">Открытые вкладки</div>
              {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-300 font-medium border border-indigo-500/30'
                        : 'text-slate-400 hover:bg-[#1c202c] hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{tab.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {tab.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                      <X
                        className="w-3 h-3 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition"
                        onClick={(e) => handleCloseTab(tab.id, e)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
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
      </div>

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
          onOpenFile={handleOpenFileClick}
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
          onOpenProductivity={() => setIsProductivityModalOpen(true)}
          onOpenSnippetVault={() => setIsSnippetVaultOpen(true)}
          onOpenSessionExport={() => setIsSessionExportOpen(true)}
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

      {isProductivityModalOpen && (
        <SaaSProductivityModal
          tabs={tabs}
          activeFile={activeFile}
          onClose={() => setIsProductivityModalOpen(false)}
        />
      )}

      {isSnippetVaultOpen && (
        <SaaSSnippetVaultModal
          onInsertToCurrent={(content) => {
            handleUpdateContent(content);
            showToast('success', 'Шаблон успешно вставлен в файл');
          }}
          onOpenInNewTab={(name, content) => {
            handleAddTab(name, content);
            showToast('success', `Создана новая вкладка: ${name}`);
          }}
          onLoadPresetWorkspace={(presetType) => {
            const presetTabs = SaaSFeatures.generateWorkspacePreset(presetType);
            setTabs((prev) => [...prev, ...presetTabs]);
            if (presetTabs.length > 0) setActiveTabId(presetTabs[0].id);
            showToast('success', `Загружено пресет-окружение (${presetTabs.length} вкладок): ${presetType}`);
          }}
          onClose={() => setIsSnippetVaultOpen(false)}
        />
      )}

      {isSaveAsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#141720] border border-vibe-border rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-vibe-border pb-3">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Save className="w-4 h-4 text-indigo-400" /> Сохранить файл как...
              </h3>
              <button
                onClick={() => setIsSaveAsOpen(false)}
                className="text-vibe-muted hover:text-slate-200 p-1 rounded hover:bg-[#1f2330]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-vibe-muted">
              Укажите абсолютный или относительный путь для сохранения файла на диске:
            </p>
            <input
              type="text"
              value={saveAsInput}
              onChange={(e) => setSaveAsInput(e.target.value)}
              placeholder="C:\Users\user\Documents\file.txt"
              className="w-full bg-[#0a0c10] border border-vibe-border rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveAsConfirm(saveAsInput);
                if (e.key === 'Escape') setIsSaveAsOpen(false);
              }}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSaveAsOpen(false)}
                className="px-3 py-1.5 rounded-md text-xs bg-[#1a1d28] hover:bg-[#252938] text-slate-300 transition"
              >
                Отмена
              </button>
              <button
                onClick={() => handleSaveAsConfirm(saveAsInput)}
                className="px-4 py-1.5 rounded-md text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30 transition"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {isSessionExportOpen && (
        <SaaSSessionExportModal
          tabs={tabs}
          activeFile={activeFile}
          onImportSession={(newTabs) => {
            setTabs(newTabs);
            if (newTabs.length > 0) setActiveTabId(newTabs[0].id);
            showToast('success', `Восстановлено ${newTabs.length} вкладок сессии`);
          }}
          onClose={() => setIsSessionExportOpen(false)}
        />
      )}
    </div>
  );
}
