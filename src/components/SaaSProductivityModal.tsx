import React from 'react';
import { X, Activity, Cpu, FileText, Zap, BarChart3, Clock, CheckCircle, Code, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { FileItem } from '../utils/ipcBridge';
import { SaaSFeatures } from '../utils/saasFeatures';
import { DevTools } from '../utils/devTools';

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

          {/* Active File Code Complexity & Maintainability */}
          {activeFile && (
            (() => {
              const complexity = DevTools.calculateCodeComplexity(activeFile.content);
              return (
                <div className="bg-[#0f1117] p-4 rounded-xl border border-vibe-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-vibe-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-indigo-400" /> Анализ сложности кода ({activeFile.name})
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                      complexity.maintainabilityIndex > 70
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : complexity.maintainabilityIndex > 40
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      Maintainability: {complexity.maintainabilityIndex}/100
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-[#141720] p-2 rounded border border-vibe-border/30">
                      <span className="text-[10px] text-vibe-muted block">Строк кода / Комментариев</span>
                      <span className="font-mono text-slate-200">{complexity.codeLines} / {complexity.commentLines}</span>
                    </div>
                    <div className="bg-[#141720] p-2 rounded border border-vibe-border/30">
                      <span className="text-[10px] text-vibe-muted block">Цикломатическая сложность</span>
                      <span className="font-mono text-indigo-400 font-semibold">{complexity.complexityScore}</span>
                    </div>
                    <div className="bg-[#141720] p-2 rounded border border-vibe-border/30">
                      <span className="text-[10px] text-vibe-muted block">Макс. Вложенность</span>
                      <span className="font-mono text-cyan-400 font-semibold">{complexity.maxDepth}</span>
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          {/* SAST Security Audit Guard */}
          {activeFile && (
            (() => {
              const security = SaaSFeatures.analyzeCodeSecurity(activeFile.content, activeFile.name);
              return (
                <div className="bg-[#0f1117] p-4 rounded-xl border border-vibe-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-vibe-muted uppercase tracking-wider flex items-center gap-1.5">
                      {security.score === 100 ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      SAST Сканер Безопасности ({activeFile.name})
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                      security.score === 100
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : security.score >= 70
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      Security Score: {security.score}/100
                    </span>
                  </div>

                  {security.totalVulnerabilities === 0 ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                      Утечек секретов и критических уязвимостей в файле не обнаружено.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Найдено уязвимостей: {security.totalVulnerabilities} (Критических: {security.criticalCount}, Высоких: {security.highCount})
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                        {security.vulnerabilities.map((v) => (
                          <div key={v.id} className="p-2 bg-[#141720] border border-vibe-border/40 rounded text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-rose-300">
                                [{v.severity}] {v.category} — Строка {v.line}
                              </span>
                              <span className="text-[10px] font-mono text-vibe-muted">{v.ruleId}</span>
                            </div>
                            <p className="text-slate-300 text-[11px]">{v.description}</p>
                            <p className="text-[10px] text-indigo-300 font-mono bg-[#0f1117] p-1 rounded">
                              💡 {v.recommendation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}

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
