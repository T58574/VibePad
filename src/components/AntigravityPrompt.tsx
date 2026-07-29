import React, { useState } from 'react';
import { Sparkles, Send, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { IPCBridge } from '../utils/ipcBridge';

interface AntigravityPromptProps {
  selection: string;
  onApplyDiff: (newCode: string) => void;
  onClose: () => void;
}

export const AntigravityPrompt: React.FC<AntigravityPromptProps> = ({
  selection,
  onApplyDiff,
  onClose,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const res = await IPCBridge.pipeAntigravity(prompt, selection);
      setResponse(res);
    } catch (err: any) {
      console.error('[AntigravityPrompt Error]', err);
      setError(err.message || 'Сбой обращения к AI ассистенту');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-[480px] glass-panel rounded-xl shadow-2xl border border-indigo-500/30 p-4 z-50 flex flex-col gap-3 animate-in fade-in zoom-in-95 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400 font-medium text-xs">
          <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : 'animate-pulse'}`} />
          <span>Antigravity AI Assistant</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Оптимизировать код, очистить логи, развернуть JSON..."
          className="flex-1 bg-[#141720] border border-vibe-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          autoFocus
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-500/40 p-2.5 rounded-lg text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {response && (
        <div className="flex flex-col gap-2 mt-1 bg-[#0f1117] p-3 rounded-lg border border-vibe-border">
          <pre className="text-xs font-mono text-slate-300 max-h-48 overflow-auto whitespace-pre-wrap leading-relaxed">
            {response}
          </pre>
          <div className="flex justify-end gap-2 mt-1">
            <button
              onClick={() => onApplyDiff(response)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1 rounded-md flex items-center gap-1 transition font-medium"
            >
              <Check className="w-3.5 h-3.5" /> Применить ответ AI
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
