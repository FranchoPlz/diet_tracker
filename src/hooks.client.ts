import { dev } from '$app/environment';
import { base } from '$app/paths';
import { initializeWorkspace } from '$lib/workspace-controller';

void initializeWorkspace();

if (!('__TAURI_INTERNALS__' in window) && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${base}/service-worker.js`, {
      type: dev ? 'module' : 'classic',
    });
  });
}
