import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { appState } from '$lib/state.svelte';
import DietAccordion from './DietAccordion.svelte';

describe('DietAccordion', () => {
  beforeEach(() => {
    document.documentElement.classList.add('dark');
    appState.parsedData = {
      status: 'ok',
      diets: [{
        name: 'DIETA 1', intro: 'Intro', meals: [{ type: 'COMIDA', options: [{ name: 'Opción 1', description: null, ingredient_lines: [{ items: [{ name: 'Arroz', quantity: 100, unit: 'g', note: null }], is_alternatives: false, is_combination: false }] }] }],
      }],
    };
  });

  afterEach(cleanup);

  it('renders original options with token-based contrast in dark mode', async () => {
    render(DietAccordion);
    await fireEvent.click(screen.getByRole('button', { name: /DIETA 1/ }));
    await fireEvent.click(screen.getByRole('button', { name: /COMIDA/ }));

    expect(screen.getByText('Opción 1')).toBeTruthy();
    expect(screen.getByText('Arroz')).toBeTruthy();
    expect(document.querySelector('.app-surface')).toBeTruthy();
  });
});
