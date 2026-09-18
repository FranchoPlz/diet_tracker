import { dev } from '$app/environment';
import { base } from '$app/paths';
import { initializeWorkspace } from '$lib/workspace-controller';

void initializeWorkspace();

if (!dev && !('__TAURI_INTERNALS__' in window) && 'serviceWorker' in navigator) {
  const register = () => {
    void navigator.serviceWorker.register(`${base}/service-worker.js`, { type: 'classic' });
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
