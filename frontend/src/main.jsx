import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA Service Worker: register in production, unregister in development
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered successfully:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  } else {
    // Unregister any active service worker during local development to avoid stale caching
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
  }
}
