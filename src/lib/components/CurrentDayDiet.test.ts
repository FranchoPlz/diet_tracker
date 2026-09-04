import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appState } from '$lib/state.svelte';
import { createDefaultWeekConfig } from '$lib/utils';
import CurrentDayDiet from './CurrentDayDiet.svelte';

describe('CurrentDayDiet', () => {
  beforeEach(() => {
    appState.weekTracker.activeDayIndex = 0;
    appState.weekConfig = createDefaultWeekConfig();
    appState.parsedData = {
      status: 'ok',
      diets: [{
        name: 'DIETA 1',
        intro: '',
        meals: [{ type: 'COMIDA', options: [{ name: 'Arroz', description: null, ingredient_lines: [] }] }],
      }],
    };
  });

  afterEach(cleanup);

  it('collapses and expands the current diet', async () => {
    render(CurrentDayDiet, { onEdit: vi.fn() });
    const toggle = screen.getByRole('button', { name: /Hoy toca/ });

    expect(screen.getByText('Arroz')).toBeTruthy();
    await fireEvent.click(toggle);
    expect(screen.queryByText('Arroz')).toBeNull();
    await fireEvent.click(toggle);
    expect(screen.getByText('Arroz')).toBeTruthy();
  });
});
