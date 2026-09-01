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

  it('shows effective global choices without editable controls', async () => {
    render(DietOverview, { onEditException: vi.fn() });

    const disclosures = document.querySelectorAll('summary');
    await fireEvent.click(disclosures[0]);
    await fireEvent.click(disclosures[1]);

    expect(screen.getByText('tofu 120 g')).toBeTruthy();
    expect(screen.queryByText('Alternativa elegida:')).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.getByText('Con excepción')).toBeTruthy();
  });

  it('keeps the global summary independent from day exceptions', async () => {
    appState.parsedData!.diets[0].meals[0].options.push({
      name: 'Pasta', description: null, ingredient_lines: [],
    });
    appState.weekConfig.dayExceptions[0] = { mealOptionIndexes: { COMIDA: 1 } };

    render(DietOverview, { onEditException: vi.fn() });

    const disclosures = document.querySelectorAll('summary');
    await fireEvent.click(disclosures[0]);
    await fireEvent.click(disclosures[1]);

    expect(screen.getByText('Arroz')).toBeTruthy();
    expect(screen.queryByText('Pasta')).toBeNull();
  });

  it('emits reconfiguration and day exception actions', async () => {
    const onEditException = vi.fn();
    render(DietOverview, { onEditException });

    const disclosures = document.querySelectorAll('summary');
    await fireEvent.click(disclosures[2]);
    await fireEvent.click(screen.getByRole('button', { name: 'Editar excepción del día 2' }));

    expect(onEditException).toHaveBeenCalledWith(1);
  });

  it('keeps exceptions collapsed until opened', async () => {
    render(DietOverview, { onEditException: vi.fn() });

    const exceptions = [...document.querySelectorAll('details')].at(-1)!;
    expect(exceptions.open).toBe(false);
    await fireEvent.click(exceptions.querySelector('summary')!);
    expect(exceptions.open).toBe(true);
  });
});
