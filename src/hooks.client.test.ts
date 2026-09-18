import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  initializeWorkspace: vi.fn().mockResolvedValue(null),
  register: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('$app/environment', () => ({ dev: false }));
vi.mock('$app/paths', () => ({ base: '' }));
vi.mock('$lib/workspace-controller', () => ({ initializeWorkspace: mocks.initializeWorkspace }));

const readyStateDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'readyState');

describe('client initialization', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    if (readyStateDescriptor) Object.defineProperty(Document.prototype, 'readyState', readyStateDescriptor);
  });

  it('registers the service worker when the client hook loads after window.load', async () => {
    Object.defineProperty(Document.prototype, 'readyState', { configurable: true, get: () => 'complete' });
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { register: mocks.register } });

    await import('./hooks.client');

    expect(mocks.register).toHaveBeenCalledWith('/service-worker.js', { type: 'classic' });
  });
});
