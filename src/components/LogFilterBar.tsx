import React from 'react';
import { Filter, RefreshCw } from 'lucide-react';

interface LogFilterBarProps {
  filterQuery: string;
  onFilterChange: (query: string) => void;
  isTailing: boolean;
  onToggleTail: () => void;
}

export const LogFilterBar: React.FC<LogFilterBarProps> = ({
  filterQuery,
  onFilterChange,
  isTailing,
  onToggleTail,
}) => {
  return (
    <div className="flex items-center gap-3 px-4 py-1.5 bg-[#141720] border-b border-vibe-border text-xs">
      <div className="flex items-center gap-1.5 text-vibe-muted">
        <Filter className="w-3.5 h-3.5" />
        <span>Log Filter:</span>
      </div>
      <input
        type="text"
        value={filterQuery}
        onChange={(e) => onFilterChange(e.target.value)}
        placeholder="Filter lines by [ERROR], [WARN], keyword..."
        className="flex-1 bg-[#0f1117] border border-vibe-border rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
      />

      <button
        onClick={onToggleTail}
        className={`flex items-center gap-1 px-2.5 py-1 rounded transition text-xs font-medium ${
          isTailing
            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-vibe-border text-vibe-muted hover:text-slate-200'
        }`}
      >
        <RefreshCw className={`w-3 h-3 ${isTailing ? 'animate-spin' : ''}`} />
        <span>{isTailing ? 'Live Tail Active' : 'Enable Log Tail'}</span>
      </button>
    </div>
  );
};
