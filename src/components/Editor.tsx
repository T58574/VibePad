import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine, drawSelection, crosshairCursor, rectangularSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches, selectNextOccurrence } from '@codemirror/search';
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
  const onChangeRef = useRef(onChange);
  const onSelectionChangeRef = useRef(onSelectionChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  // Helper to construct CodeMirror EditorState
  const createNewState = (docContent: string, name: string, isLarge: boolean) => {
    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      drawSelection(),
      rectangularSelection(),
      crosshairCursor(),
      history(),
      highlightSelectionMatches(),
      EditorView.lineWrapping,
      keymap.of([
        { key: 'Mod-d', run: selectNextOccurrence, preventDefault: true },
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          isInternalChangeRef.current = true;
          onChangeRef.current(update.state.doc.toString());
        }
        if (update.selectionSet && onSelectionChangeRef.current) {
          const selection = update.state.sliceDoc(
            update.state.selection.main.from,
            update.state.selection.main.to
          );
          if (selection.trim().length > 0) {
            const coords = update.view.coordsAtPos(update.state.selection.main.to);
            onSelectionChangeRef.current(selection, coords ? { x: coords.left, y: coords.bottom } : null);
          } else {
            onSelectionChangeRef.current('', null);
          }
        }
      }),
    ];

    if (!isLarge) {
      const lowerName = name.toLowerCase();
      if (lowerName.endsWith('.json')) extensions.push(json());
      else if (lowerName.endsWith('.md')) extensions.push(markdown());
      else if (lowerName.endsWith('.yaml') || lowerName.endsWith('.yml')) extensions.push(yaml());
      else if (lowerName.endsWith('.py')) extensions.push(python());
      else if (/\.(js|jsx|ts|tsx)$/.test(lowerName)) extensions.push(javascript({ jsx: true, typescript: true }));
      else if (lowerName.endsWith('.sql')) extensions.push(sql());
    }

    return EditorState.create({
      doc: docContent,
      extensions,
    });
  };

  // Mount EditorView once
  useEffect(() => {
    if (!containerRef.current) return;

    const state = createNewState(content, fileName, isLargeFile);
    const view = new EditorView({
      state,
      parent: containerRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Mounts once per container instance

  // Synchronize state when switching files / large file mode
  const prevFileNameRef = useRef(fileName);
  const prevIsLargeRef = useRef(isLargeFile);

  useEffect(() => {
    if (!viewRef.current) return;

    const fileChanged = prevFileNameRef.current !== fileName;
    const largeModeChanged = prevIsLargeRef.current !== isLargeFile;

    if (fileChanged || largeModeChanged) {
      prevFileNameRef.current = fileName;
      prevIsLargeRef.current = isLargeFile;
      const newState = createNewState(content, fileName, isLargeFile);
      viewRef.current.setState(newState);
      return;
    }

    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    const currentDoc = viewRef.current.state.doc.toString();
    if (currentDoc !== content) {
      isInternalChangeRef.current = true;
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: content },
      });
    }
  }, [content, fileName, isLargeFile]);

  return <div ref={containerRef} className="h-full w-full overflow-hidden text-sm font-mono" />;
};
