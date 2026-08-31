import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appState } from '$lib/state.svelte';
import PdfUpload from './PdfUpload.svelte';

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  onDragDropEvent: vi.fn(),
  parsePdf: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }));
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({ onDragDropEvent: mocks.onDragDropEvent }),
}));
vi.mock('$lib/pdf', () => ({ parsePdf: mocks.parsePdf }));

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
    mocks.parsePdf.mockReset();
  });

  afterEach(() => {
    cleanup();
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  });

  it('parses the PDF path received from a native Tauri drop event', async () => {
    let listener: (event: { payload: { type: string; paths: string[] } }) => void = () => {};
    let finishParsing: (value: string) => void = () => {};
    mocks.onDragDropEvent.mockImplementation(async (callback) => {
      listener = callback;
      return vi.fn();
    });
    mocks.invoke.mockImplementation(() => new Promise((resolve) => {
      finishParsing = resolve;
    }));

    render(PdfUpload);
    await waitFor(() => expect(mocks.onDragDropEvent).toHaveBeenCalledOnce());
    listener({ payload: { type: 'drop', paths: ['/plans/SEPTIEMBRE.pdf'] } });

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toContain('Leyendo y organizando tu dieta');
    });
    finishParsing(JSON.stringify({ status: 'ok', diets: [] }));

    await waitFor(() => {
      expect(mocks.invoke).toHaveBeenCalledWith('parse_pdf', {
        path: '/plans/SEPTIEMBRE.pdf',
      });
      expect(appState.pdfPath).toBe('/plans/SEPTIEMBRE.pdf');
      expect(screen.getByRole('region', { name: 'PDF cargado' }).textContent).toContain('SEPTIEMBRE.pdf');
    });
  });

  it('parses a selected PDF in the browser without Tauri', async () => {
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    mocks.parsePdf.mockResolvedValue({ status: 'ok', diets: [] });
    const { container } = render(PdfUpload);
    const file = new File(['%PDF-test'], 'ABRIL.pdf', { type: 'application/pdf' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => {
      expect(mocks.parsePdf).toHaveBeenCalledWith(file);
      expect(appState.pdfPath).toBe('ABRIL.pdf');
    });
    expect(appState.activePlanName).toBe('ABRIL');
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
});
