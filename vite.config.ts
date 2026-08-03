import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // Ensure relative paths for file:// protocol and local serving
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@codemirror') || id.includes('@lezer')) {
              return 'codemirror-vendor';
            }
            if (id.includes('katex') || id.includes('highlight.js') || id.includes('markdown-it')) {
              return 'markdown-vendor';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('lucide-react')) {
              return 'react-vendor';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
