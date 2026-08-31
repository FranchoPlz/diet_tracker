import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appState } from '$lib/state.svelte';
import { createDefaultWeekConfig } from '$lib/utils';
import DietOverview from './DietOverview.svelte';

describe('DietOverview', () => {
  beforeEach(() => {
    appState.weekConfig = createDefaultWeekConfig();
    appState.parsedData = {
      status: 'ok',
      diets: [
        {
          name: 'DIETA 1', intro: '', meals: [{
            type: 'COMIDA', options: [{
              name: 'Arroz', description: null, ingredient_lines: [{
                items: [
                  { name: 'pollo', quantity: 100, unit: 'g', note: null },
                  { name: 'tofu', quantity: 120, unit: 'g', note: null },
                ],
                is_alternatives: true, is_combination: false,
              }],
            }],
          }],
        },
        { name: 'DIETA 2', intro: '', meals: [] },
      ],
    };
    appState.weekConfig.dietDefaults['DIETA 1'].alternativeChoices['0-0-0'] = 1;
    appState.weekConfig.dayExceptions[0] = { mealOptionIndexes: { COMIDA: 0 } };
  });

  afterEach(cleanup);

  it('shows effective global choices without editable controls', () => {
    render(DietOverview, { onReconfigure: vi.fn(), onEditException: vi.fn() });

    expect(screen.getByText('tofu 120 g')).toBeTruthy();
    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.getByText('Con excepción')).toBeTruthy();
  });

  it('keeps the global summary independent from day exceptions', () => {
    appState.parsedData!.diets[0].meals[0].options.push({
      name: 'Pasta', description: null, ingredient_lines: [],
    });
    appState.weekConfig.dayExceptions[0] = { mealOptionIndexes: { COMIDA: 1 } };

    render(DietOverview, { onReconfigure: vi.fn(), onEditException: vi.fn() });

    expect(screen.getByText('Arroz')).toBeTruthy();
    expect(screen.queryByText('Pasta')).toBeNull();
  });

  it('emits reconfiguration and day exception actions', async () => {
    const onReconfigure = vi.fn();
    const onEditException = vi.fn();
    render(DietOverview, { onReconfigure, onEditException });

    await fireEvent.click(screen.getByRole('button', { name: 'Reconfigurar dietas' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Editar excepción del día 2' }));

    expect(onReconfigure).toHaveBeenCalledOnce();
    expect(onEditException).toHaveBeenCalledWith(1);
  });
});
