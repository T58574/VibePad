import React from 'react';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/tokyo-night-dark.css';

interface MarkdownViewerProps {
  content: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>';
      } catch (__) {}
    }
    return '<pre class="hljs"><code>' + escapeHtml(str) + '</code></pre>';
  }
});

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  const renderedHtml = md.render(content);

  return (
    <div className="h-full w-full overflow-auto p-8 bg-[#0f1117] text-slate-200">
      <div 
        className="max-w-4xl mx-auto prose prose-invert prose-pre:bg-[#181b24] prose-pre:border prose-pre:border-vibe-border prose-code:text-indigo-400"
        dangerouslySetInnerHTML={{ __html: renderedHtml }} 
      />
    </div>
  );
};
