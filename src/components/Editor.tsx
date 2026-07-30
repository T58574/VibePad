import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { yaml } from '@codemirror/lang-yaml';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { sql } from '@codemirror/lang-sql';

interface EditorProps {
  content: string;
  onChange: (newContent: string) => void;
  onSelectionChange?: (selectedText: string, coords: { x: number; y: number } | null) => void;
  fileName: string;
  isLargeFile?: boolean;
}

export const Editor: React.FC<EditorProps> = ({
  content,
  onChange,
  onSelectionChange,
  fileName,
  isLargeFile = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isInternalChangeRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Base extensions
    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      highlightSelectionMatches(),
      EditorView.lineWrapping,
      keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          isInternalChangeRef.current = true;
          onChange(update.state.doc.toString());
        }
        if (update.selectionSet && onSelectionChange) {
          const selection = update.state.sliceDoc(
            update.state.selection.main.from,
            update.state.selection.main.to
          );
          if (selection.trim().length > 0) {
            const coords = update.view.coordsAtPos(update.state.selection.main.to);
            onSelectionChange(selection, coords ? { x: coords.left, y: coords.bottom } : null);
          } else {
            onSelectionChange('', null);
          }
        }
      }),
    ];

    // Disable heavy syntax extensions if file > 10MB/50MB safe mode
    if (!isLargeFile) {
      const lowerName = fileName.toLowerCase();
      if (lowerName.endsWith('.json')) extensions.push(json());
      else if (lowerName.endsWith('.md')) extensions.push(markdown());
      else if (lowerName.endsWith('.yaml') || lowerName.endsWith('.yml')) extensions.push(yaml());
      else if (lowerName.endsWith('.py')) extensions.push(python());
      else if (/\.(js|jsx|ts|tsx)$/.test(lowerName)) extensions.push(javascript({ jsx: true, typescript: true }));
      else if (lowerName.endsWith('.sql')) extensions.push(sql());
    }

    const state = EditorState.create({
      doc: content,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [fileName, isLargeFile]);

  // Synchronize content safely if changed externally
  useEffect(() => {
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    if (viewRef.current) {
      const currentDoc = viewRef.current.state.doc.toString();
      if (currentDoc !== content) {
        isInternalChangeRef.current = true;
        viewRef.current.dispatch({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: content },
        });
      }
    }
  }, [content]);

  return <div ref={containerRef} className="h-full w-full overflow-hidden text-sm font-mono" />;
};
