import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRITICAL: VibePad Uncaught React Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetSession = () => {
    try {
      localStorage.removeItem('vibepad_session');
    } catch (e) {
      console.error('Failed to clear session storage:', e);
    }
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-[#0f1117] text-slate-200 p-6 select-none">
          <div className="max-w-md w-full bg-[#181b24] border border-rose-500/40 rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95">
            <div className="p-3 bg-rose-500/10 rounded-full border border-rose-500/30 text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-slate-100">Упс! В VibePad произошел сбой</h2>
              <p className="text-xs text-vibe-muted">
                Произошла необработанная ошибка компонента. Твои локальные данные в безопасности.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full bg-[#0f1117] border border-vibe-border rounded-lg p-3 text-left">
                <p className="text-[11px] font-mono text-rose-300 break-all">
                  {this.state.error.name}: {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 w-full mt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 font-medium transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Перезагрузить</span>
              </button>

              <button
                onClick={this.handleResetSession}
                className="bg-vibe-border hover:bg-rose-950/40 hover:text-rose-300 text-vibe-muted text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition border border-transparent hover:border-rose-500/30"
                title="Сбросить кеш сессии и открыть редактор начисто"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Сбросить сессию</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
