import React from 'react';
import { DevTools } from '../utils/devTools';

interface QuickContextBarProps {
  selection: string;
  coords: { x: number; y: number } | null;
  onReplaceSelection: (newText: string) => void;
  onOpenAi: () => void;
}

export const QuickContextBar: React.FC<QuickContextBarProps> = ({
  selection,
  coords,
  onReplaceSelection,
  onOpenAi,
}) => {
  if (!coords || !selection || !selection.trim()) return null;

  const trimmed = selection.trim();

  // Unix Timestamp Heuristic
  let timestampDate: string | null = null;
  if (/^\d{10}$/.test(trimmed)) {
    try {
      timestampDate = new Date(parseInt(trimmed, 10) * 1000).toLocaleString();
    } catch {}
  }

  const isJsonLike = (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));
  const isSqlLike = /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)\b/i.test(trimmed);

  const handleDecodeBase64 = () => {
    try {
      const decoded = DevTools.base64Decode(selection);
      onReplaceSelection(decoded);
    } catch (err: any) {
      console.warn('QuickContextBar Base64 decode failed:', err.message);
    }
  };

  const handleEncodeBase64 = () => {
    try {
      const encoded = DevTools.base64Encode(selection);
      onReplaceSelection(encoded);
    } catch (err: any) {
      console.warn('QuickContextBar Base64 encode failed:', err.message);
    }
  };

  const handleJsonToTs = () => {
    try {
      const tsCode = DevTools.generateTsInterfaceFromJson(trimmed);
      onReplaceSelection(tsCode);
    } catch (err: any) {
      console.warn('QuickContextBar JSON->TS failed:', err.message);
    }
  };

  const handleFormatSql = () => {
    try {
      const sqlCode = DevTools.formatSql(trimmed);
      onReplaceSelection(sqlCode);
    } catch (err: any) {
      console.warn('QuickContextBar SQL format failed:', err.message);
    }
  };

  return (
    <div
      style={{ left: `${Math.max(10, coords.x - 50)}px`, top: `${coords.y + 10}px` }}
      className="fixed glass-panel rounded-lg shadow-xl px-2 py-1 z-40 flex items-center gap-2 text-xs border border-indigo-500/30 animate-in fade-in zoom-in-95 font-sans"
    >
      {timestampDate && (
        <span className="text-emerald-400 font-mono border-r border-vibe-border pr-2 text-[11px]">
          🕒 {timestampDate}
        </span>
      )}

      {isJsonLike && (
        <button
          onClick={handleJsonToTs}
          className="hover:bg-indigo-600/30 px-1.5 py-0.5 rounded text-indigo-300 transition text-[11px] font-mono"
          title="Сгенерировать TS Interface из JSON"
        >
          JSON➔TS
        </button>
      )}

      {isSqlLike && (
        <button
          onClick={handleFormatSql}
          className="hover:bg-indigo-600/30 px-1.5 py-0.5 rounded text-indigo-300 transition text-[11px] font-mono"
          title="Форматировать SQL запрос"
        >
          SQL Format
        </button>
      )}

      <button
        onClick={handleEncodeBase64}
        className="hover:bg-indigo-600/30 px-1.5 py-0.5 rounded text-indigo-300 transition text-[11px] font-mono"
        title="Закодировать выделение в UTF-8 Base64"
      >
        b64Enc
      </button>
      <button
        onClick={handleDecodeBase64}
        className="hover:bg-indigo-600/30 px-1.5 py-0.5 rounded text-indigo-300 transition text-[11px] font-mono"
        title="Декодировать UTF-8 Base64"
      >
        b64Dec
      </button>

      <button
        onClick={onOpenAi}
        className="bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded text-[11px] font-medium transition"
      >
        Ask AI (Ctrl+K)
      </button>
    </div>
  );
};
