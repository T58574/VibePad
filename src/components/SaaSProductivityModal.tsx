import React from 'react';
import { X, Activity, Cpu, FileText, Zap, BarChart3, Clock, CheckCircle } from 'lucide-react';
import { FileItem } from '../utils/ipcBridge';
import { SaaSFeatures } from '../utils/saasFeatures';

interface SaaSProductivityModalProps {
  tabs: FileItem[];
  activeFile: FileItem | null;
  onClose: () => void;
}

export const SaaSProductivityModal: React.FC<SaaSProductivityModalProps> = ({
  tabs,
  activeFile,
  onClose,
}) => {
  const stats = SaaSFeatures.calculateProductivityStats(tabs);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#141720] border border-vibe-border/60 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-vibe-border/60 bg-[#191d29]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                VibePad Analytics & Productivity Dashboard
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  SaaS Edition
                </span>
              </h2>
              <p className="text-xs text-vibe-muted">Статистика рабочей сессии и метрики производительности</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-vibe-muted hover:text-slate-100 hover:bg-vibe-surface rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Top Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#0f1117] p-3.5 rounded-lg border border-vibe-border/40 flex flex-col">
              <span className="text-xs text-vibe-muted flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> Файлы / Вкладки
              </span>
              <span className="text-xl font-bold text-slate-100 font-mono">{stats.totalTabs}</span>
            </div>

            <div className="bg-[#0f1117] p-3.5 rounded-lg border border-vibe-border/40 flex flex-col">
              <span className="text-xs text-vibe-muted flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400" /> Всего строк
              </span>
              <span className="text-xl font-bold text-slate-100 font-mono">{stats.totalLines.toLocaleString()}</span>
            </div>

            <div className="bg-[#0f1117] p-3.5 rounded-lg border border-vibe-border/40 flex flex-col">
              <span className="text-xs text-vibe-muted flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Время чтения
              </span>
              <span className="text-xl font-bold text-slate-100 font-mono">~{stats.estimatedReadTimeMinutes} мин</span>
            </div>

            <div className="bg-[#0f1117] p-3.5 rounded-lg border border-vibe-border/40 flex flex-col">
              <span className="text-xs text-vibe-muted flex items-center gap-1.5 mb-1">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" /> RAM Footprint
              </span>
              <span className="text-xl font-bold text-emerald-400 font-mono">~32 MB</span>
            </div>
          </div>

          {/* Vibe Performance Rating Gauge */}
          <div className="bg-[#0f1117] p-4 rounded-xl border border-vibe-border/40 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-300 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" /> Vibe Index Score
              </div>
              <p className="text-xs text-vibe-muted">
                Оптимизация виртуализированного скроллинга CodeMirror 6
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-36 bg-[#191d29] h-3 rounded-full overflow-hidden p-0.5 border border-vibe-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${stats.vibeScore}%` }}
                />
              </div>
              <span className="text-sm font-bold text-slate-100 font-mono">{stats.vibeScore}%</span>
            </div>
          </div>

          {/* Languages & Formats Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-vibe-muted uppercase tracking-wider">
              Распределение языков и форматов
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(stats.languageBreakdown).map(([ext, pct]) => (
                <div key={ext} className="bg-[#0f1117] p-2.5 rounded-lg border border-vibe-border/30 flex items-center justify-between text-xs">
                  <span className="font-mono text-indigo-300 uppercase font-medium">{ext}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-vibe-muted font-mono">{pct}%</span>
                    <div className="w-16 bg-[#191d29] h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active File Metadata */}
          {activeFile && (
            <div className="bg-[#191d29]/60 p-3.5 rounded-lg border border-vibe-border/50 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-vibe-muted">Активный файл:</span>
                <p className="text-slate-200 font-medium font-mono">{activeFile.name}</p>
              </div>
              <div className="flex items-center gap-4 font-mono text-vibe-muted">
                <span>{activeFile.encoding}</span>
                <span>{activeFile.lineEnding}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Ready
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-vibe-border/60 bg-[#191d29] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
