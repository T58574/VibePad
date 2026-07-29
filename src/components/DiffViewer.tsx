import React from 'react';
import * as diff from 'diff';

interface DiffViewerProps {
  oldText: string;
  newText: string;
  onClose: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ oldText, newText, onClose }) => {
  const differences = diff.diffLines(oldText, newText);

  return (
    <div className="h-full w-full flex flex-col bg-[#0f1117]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#181b24] border-b border-vibe-border">
        <span className="text-sm font-semibold text-vibe-text">Split-View File Diff</span>
        <button 
          onClick={onClose}
          className="text-xs px-2 py-1 bg-vibe-border hover:bg-slate-700 rounded text-slate-300 transition"
        >
          Close Diff (Esc)
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
        {differences.map((part, index) => {
          const color = part.added
            ? 'bg-emerald-950/60 text-emerald-300 border-l-2 border-emerald-500'
            : part.removed
            ? 'bg-rose-950/60 text-rose-300 border-l-2 border-rose-500 line-through'
            : 'text-slate-400';
          return (
            <pre key={index} className={`px-3 py-0.5 my-0.5 rounded ${color}`}>
              {part.value}
            </pre>
          );
        })}
      </div>
    </div>
  );
};
