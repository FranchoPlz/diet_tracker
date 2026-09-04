import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appState } from '$lib/state.svelte';
import { createDefaultWeekConfig } from '$lib/utils';
import DietPdfExportButton from './DietPdfExportButton.svelte';

vi.mock('$lib/pdf-export', () => ({ createPlanPdfBlob: () => new Blob(['pdf'], { type: 'application/pdf' }) }));

describe('DietPdfExportButton', () => {
  beforeEach(() => {
    appState.activePlanName = 'Plan abril';
    appState.weekConfig = createDefaultWeekConfig();
    appState.parsedData = { status: 'ok', diets: [{ name: 'DIETA 1', intro: '', meals: [] }] };
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:pdf') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('downloads the selected diet as a PDF file', async () => {
    const click = vi.fn();
    let download = '';
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName) as HTMLElement;
      if (tagName === 'a') {
        element.click = () => {
          download = (element as HTMLAnchorElement).download;
          click();
        };
      }
      return element as ReturnType<typeof document.createElement>;
    });

    render(DietPdfExportButton);
    await fireEvent.click(screen.getByRole('button', { name: 'Exportar dieta a PDF' }));

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob)));
    expect(click).toHaveBeenCalledOnce();
    expect(download).toMatch(/^plan-abril-dieta-\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:pdf');
  });
});
