import { dev } from '$app/environment';
import { base } from '$app/paths';

if (!('__TAURI_INTERNALS__' in window) && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${base}/service-worker.js`, {
      type: dev ? 'module' : 'classic',
    });
  });
}
