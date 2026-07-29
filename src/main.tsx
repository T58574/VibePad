import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { init } from '@neutralinojs/lib';

// Initialize Neutralinojs Native Desktop Engine safely
try {
  init();
} catch (e) {
  console.log('Neutralino init fallback (running in browser mode):', e);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
