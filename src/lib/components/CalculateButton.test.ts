import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { appState } from '$lib/state.svelte';
import { createDefaultWeekConfig } from '$lib/utils';
import CalculateButton from './CalculateButton.svelte';

describe('CalculateButton', () => {
  beforeEach(() => {
    appState.parsedData = {
      status: 'ok',
      diets: [{
        name: 'DIETA 1', intro: '', meals: [{
          type: 'COMIDA', options: [{
            name: 'Arroz', description: null, ingredient_lines: [{
              items: [{ name: 'Arroz', quantity: 80, unit: 'g', note: null }],
              is_alternatives: false, is_combination: false,
            }],
          }],
        }],
      }],
    };
    appState.weekConfig = createDefaultWeekConfig();
    appState.shoppingList = [];
    appState.loading = false;
    appState.error = null;
  });

  afterEach(cleanup);

  it('calculates locally without a PDF path or Tauri runtime', async () => {
    appState.pdfPath = null;
    render(CalculateButton);
    await fireEvent.click(screen.getByRole('button', { name: 'Crear lista de compra' }));

    expect(appState.shoppingList).toContainEqual({ name: 'arroz', quantity: 320, unit: 'g', count: 4 });
    expect(appState.error).toBeNull();
  });
});
