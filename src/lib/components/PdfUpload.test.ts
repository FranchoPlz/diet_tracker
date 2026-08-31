import { cleanup, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appState } from '$lib/state.svelte';
import PdfUpload from './PdfUpload.svelte';

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  onDragDropEvent: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }));
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({ onDragDropEvent: mocks.onDragDropEvent }),
}));

describe('PdfUpload', () => {
  beforeEach(() => {
    Object.defineProperty(window, '__TAURI_INTERNALS__', {
      configurable: true,
      value: {},
    });
    appState.error = null;
    appState.loading = false;
    appState.parsedData = null;
    appState.pdfPath = null;
    mocks.invoke.mockReset();
    mocks.onDragDropEvent.mockReset();
  });

  afterEach(() => {
    cleanup();
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  });

  it('parses the PDF path received from a native Tauri drop event', async () => {
    let listener: (event: { payload: { type: string; paths: string[] } }) => void = () => {};
    mocks.onDragDropEvent.mockImplementation(async (callback) => {
      listener = callback;
      return vi.fn();
    });
    mocks.invoke.mockResolvedValue(JSON.stringify({ status: 'ok', diets: [] }));

    render(PdfUpload);
    await waitFor(() => expect(mocks.onDragDropEvent).toHaveBeenCalledOnce());
    listener({ payload: { type: 'drop', paths: ['/plans/SEPTIEMBRE.pdf'] } });

    await waitFor(() => {
      expect(mocks.invoke).toHaveBeenCalledWith('parse_pdf', {
        path: '/plans/SEPTIEMBRE.pdf',
      });
      expect(appState.pdfPath).toBe('/plans/SEPTIEMBRE.pdf');
    });
  });
});
