import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appState } from '$lib/state.svelte';
import PdfUpload from './PdfUpload.svelte';

const mocks = vi.hoisted(() => ({
  parsePdf: vi.fn(),
  createWorkspaceFromDocument: vi.fn(),
}));

vi.mock('$lib/pdf', () => ({ parsePdf: mocks.parsePdf }));
vi.mock('$lib/workspace-controller', () => ({ createWorkspaceFromDocument: mocks.createWorkspaceFromDocument }));

describe('PdfUpload', () => {
  beforeEach(() => {
    appState.error = null;
    appState.loading = false;
    appState.parsedData = null;
    mocks.parsePdf.mockReset();
    mocks.createWorkspaceFromDocument.mockReset();
    mocks.createWorkspaceFromDocument.mockImplementation(async (result, sourceName) => {
      appState.parsedData = result;
      appState.activePlanName = sourceName.replace(/\.pdf$/i, '');
      appState.configured = false;
    });
  });

  afterEach(cleanup);

  it('parses a selected PDF in the browser', async () => {
    mocks.parsePdf.mockResolvedValue({ diets: [] });
    const { container } = render(PdfUpload);
    const file = new File(['%PDF-test'], 'ABRIL.pdf', { type: 'application/pdf' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => {
      expect(mocks.parsePdf).toHaveBeenCalledWith(file);
      expect(mocks.createWorkspaceFromDocument).toHaveBeenCalledWith({ diets: [] }, 'ABRIL.pdf');
    });
    expect(appState.activePlanName).toBe('ABRIL');
  });

  it('parses a PDF dropped onto the web upload zone', async () => {
    mocks.parsePdf.mockResolvedValue({ diets: [] });
    const file = new File(['%PDF-test'], 'SEPTIEMBRE.pdf', { type: 'application/pdf' });
    render(PdfUpload);

    await fireEvent.drop(screen.getByRole('region', { name: 'Subir PDF' }), {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(mocks.parsePdf).toHaveBeenCalledWith(file);
      expect(mocks.createWorkspaceFromDocument).toHaveBeenCalledWith({ diets: [] }, 'SEPTIEMBRE.pdf');
    });
  });

  it('keeps the current plan when replacement parsing fails', async () => {
    appState.parsedData = { diets: [{ name: 'DIETA 1', intro: '', meals: [] }] };
    appState.activePlanName = 'Plan actual';
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mocks.parsePdf.mockRejectedValue(new Error('PDF dañado'));
    const { container } = render(PdfUpload);
    const file = new File(['%PDF-broken'], 'NUEVO.pdf', { type: 'application/pdf' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => expect(appState.error).toBe('PDF dañado'));
    expect(appState.activePlanName).toBe('Plan actual');
    expect(appState.parsedData.diets[0].name).toBe('DIETA 1');
    expect(mocks.createWorkspaceFromDocument).not.toHaveBeenCalled();
  });
});
